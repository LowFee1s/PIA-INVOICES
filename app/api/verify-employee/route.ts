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
  if (modelsLoaded) return;
  try {
    await Promise.all([
      faceapi.nets.ssdMobilenetv1.loadFromDisk(modelPath),
      faceapi.nets.faceLandmark68Net.loadFromDisk(modelPath),
      faceapi.nets.faceRecognitionNet.loadFromDisk(modelPath),
    ]);
    modelsLoaded = true;
    console.log('✅ Modelos cargados correctamente');
  } catch (error) {
    console.error('❌ Error al cargar los modelos:', error);
    throw new Error('No se pudieron cargar los modelos.');
  }
}

export async function POST(req: NextRequest) {
  try {
    await loadModels();
    const { imageBase64, action } = await req.json();
    if (!imageBase64 || !action) {
      return NextResponse.json({ message: '⚠️ Faltan datos requeridos' }, { status: 400 });
    }

    const now = new Date().toLocaleString('en-US', {
      timeZone: 'America/Mexico_City',
      hour12: false,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).replace(',', '');

    const responseUrl = await axios.get(imageBase64, { responseType: 'arraybuffer' });
    const imgBuffer = Buffer.from(responseUrl.data, 'binary');
    const image = await canvas.loadImage(imgBuffer);
    const detections = await faceapi.detectAllFaces(image).withFaceLandmarks().withFaceDescriptors();

    if (!detections.length) {
      return NextResponse.json({ message: '❌ No se detectó una cara válida' }, { status: 400 });
    }

    const inputDescriptor = detections[0].descriptor;
    const result = await sql`SELECT id, image_url FROM employees WHERE image_url IS NOT NULL`;
    if (!result.rows.length) {
      return NextResponse.json({ message: '⚠️ No hay empleados registrados' }, { status: 404 });
    }

    const employeeImages = await Promise.all(
      result.rows.map(employee => axios.get(employee.image_url, { responseType: 'arraybuffer' }))
    );

    const employeeDescriptors = await Promise.all(
      employeeImages.map(async (response, index) => {
        const dbImage = await canvas.loadImage(Buffer.from(response.data, 'binary'));
        const dbDetections = await faceapi.detectAllFaces(dbImage).withFaceLandmarks().withFaceDescriptors();
        return { id: result.rows[index].id, descriptor: dbDetections[0]?.descriptor };
      })
    );

    const match = employeeDescriptors.find(emp => 
      emp.descriptor && faceapi.euclideanDistance(inputDescriptor, emp.descriptor) < 0.6
    );

    if (!match) {
      return NextResponse.json({ message: '❌ No se encontró coincidencia facial' }, { status: 400 });
    }

    const employeeId = match.id;

    if (action === 'entry') {
      const existingEntry = await sql`
        SELECT * FROM work_schedules WHERE employee_id = ${employeeId} AND check_out IS NULL;
      `;
      if (existingEntry.rows.length) {
        return NextResponse.json({ message: '⚠️ Entrada ya registrada sin salida' }, { status: 400 });
      }

      await sql`
        INSERT INTO work_schedules (employee_id, date, check_in, status)
        VALUES (${employeeId}, CURRENT_DATE, ${now}, 'En proceso');
      `;
      return NextResponse.json({ message: `✅ Entrada registrada para ${employeeId}` });
    }

    if (action === 'exit') {
      const entryRecord = await sql`
        SELECT * FROM work_schedules WHERE employee_id = ${employeeId} AND check_out IS NULL;
      `;
      if (!entryRecord.rows.length) {
        return NextResponse.json({ message: '⚠️ No hay entrada registrada o ya se registró salida' }, { status: 400 });
      }

      await sql`
        UPDATE work_schedules
        SET check_out = ${now}, status = 'Completado'
        WHERE employee_id = ${employeeId} AND check_out IS NULL;
      `;
      return NextResponse.json({ message: `✅ Salida registrada para ${employeeId}` });
    }

    return NextResponse.json({ message: '⚠️ Acción no válida' }, { status: 400 });
  } catch (error) {
    console.error('🔥 Error en el reconocimiento facial:', error);
    return NextResponse.json({ message: '❌ Error interno', error }, { status: 500 });
  }
}
