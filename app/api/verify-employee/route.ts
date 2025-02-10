import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import * as faceapi from 'face-api.js';
import { Canvas, Image } from 'canvas';
import axios from 'axios';
const path = require('path');
const canvas = require('canvas');

const modelPath = path.join(process.cwd(), 'models');
faceapi.env.monkeyPatch({ Image: canvas.Image, Canvas: canvas.Canvas });

let modelsLoaded = false;
async function loadModels() {
  if (!modelsLoaded) {
    await Promise.all([
      faceapi.nets.ssdMobilenetv1.loadFromDisk(modelPath),
      faceapi.nets.faceLandmark68Net.loadFromDisk(modelPath),
      faceapi.nets.faceRecognitionNet.loadFromDisk(modelPath)
    ]);
    modelsLoaded = true;
    console.log('✅ Modelos cargados correctamente');
  }
}

export async function POST(req: NextRequest) {
  try {
    await loadModels();
    const { imageBase64, action } = await req.json();
    if (!imageBase64 || !action) return NextResponse.json({ message: '⚠️ Faltan datos requeridos' }, { status: 400 });

    const nowLocal = new Date().toLocaleString('en-US', {
      timeZone: 'America/Mexico_City', hour12: false, year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    }).replace(',', '');

    console.log('🔄 Cargando imagen en buffer...');
    const imgBuffer = Buffer.from((await axios.get(imageBase64, { responseType: 'arraybuffer' })).data, 'binary');

    console.log('📸 Buffer de imagen cargado:', imgBuffer.length, 'bytes');

    console.log('🎨 Cargando imagen en canvas...');
    const image = await canvas.loadImage(imgBuffer);

    console.log('✅ Imagen cargada correctamente.');
    const detections = await faceapi.detectAllFaces(image).withFaceLandmarks().withFaceDescriptors();
    if (!detections.length) return NextResponse.json({ message: '❌ No se detectó una cara válida' }, { status: 400 });
    const inputFaceDescriptor = detections[0].descriptor;

    const employees = (await sql`SELECT id, image_url FROM employees WHERE image_url IS NOT NULL`).rows;
    if (employees.length === 0) return NextResponse.json({ message: '⚠️ No se encontraron empleados' }, { status: 404 });

    const employeeMatches = (await Promise.all(employees.map(async (employee) => {
      try {
        const dbImageBuffer = Buffer.from((await axios.get(employee.image_url, { responseType: 'arraybuffer' })).data, 'binary');
        const dbImage = await canvas.loadImage(dbImageBuffer);
        const dbDetections = await faceapi.detectAllFaces(dbImage).withFaceLandmarks().withFaceDescriptors();
        if (!dbDetections.length) return null;

        const distance = faceapi.euclideanDistance(inputFaceDescriptor, dbDetections[0].descriptor);
        return distance < 0.6 ? employee.id : null;
      } catch {
        return null;
      }
    }))).filter(Boolean);

    if (employeeMatches.length === 0) return NextResponse.json({ message: '❌ No se encontró coincidencia' }, { status: 400 });

    const employeeId = employeeMatches[0];
    if (action === 'entry') {
      const existingEntry = await sql`SELECT * FROM work_schedules WHERE employee_id = ${employeeId} AND check_out IS NULL;`;
      if (existingEntry.rows.length) return NextResponse.json({ message: '⚠️ Entrada ya registrada' }, { status: 400 });
      await sql`INSERT INTO work_schedules (employee_id, date, check_in, status) VALUES (${employeeId}, ${nowLocal.split(' ')[0]}, ${nowLocal}, 'En proceso');`;
      return NextResponse.json({ message: `✅ Entrada registrada para el empleado ${employeeId}` });
    }

    if (action === 'exit') {
      const entryRecord = await sql`SELECT * FROM work_schedules WHERE employee_id = ${employeeId} AND check_out IS NULL;`;
      if (!entryRecord.rows.length) return NextResponse.json({ message: '⚠️ No hay entrada registrada' }, { status: 400 });
      await sql`UPDATE work_schedules SET check_out = ${nowLocal}, status = 'Completado' WHERE employee_id = ${employeeId} AND check_out IS NULL;`;
      return NextResponse.json({ message: `✅ Salida registrada para el empleado ${employeeId}` });
    }
  } catch (error) {
    console.error('🔥 Error en el registro:', error);
    return NextResponse.json({ message: '❌ Error en el registro', error }, { status: 500 });
  }
}
