import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import * as faceapi from 'face-api.js';
import { Canvas, Image } from 'canvas';
import axios from 'axios';
const path = require('path');
const canvas = require('canvas');

const modelPath = path.join(process.cwd(), 'models');
let modelsLoaded = false;
faceapi.env.monkeyPatch({ Image: canvas.Image, Canvas: canvas.Canvas });

async function loadModels() {
  if (modelsLoaded) return;
  await Promise.all([
    faceapi.nets.ssdMobilenetv1.loadFromDisk(modelPath),
    faceapi.nets.faceLandmark68Net.loadFromDisk(modelPath),
    faceapi.nets.faceRecognitionNet.loadFromDisk(modelPath),
  ]);
  modelsLoaded = true;
  console.log('✅ Modelos cargados correctamente');
}

export async function POST(req: any) {
  try {
    await loadModels();
    const { imageBase64, action } = await req.json();
    if (!imageBase64 || !action) return NextResponse.json({ message: '⚠️ Datos requeridos' }, { status: 400 });

    const now = new Date().toLocaleString('en-US', { timeZone: 'America/Mexico_City', hour12: false }).replace(',', '');
    const responseUrl = await axios.get(imageBase64, { responseType: 'arraybuffer' });
    const image = await canvas.loadImage(Buffer.from(responseUrl.data, 'binary'));
    const detections = await faceapi.detectAllFaces(image).withFaceLandmarks().withFaceDescriptors();
    if (!detections.length) return NextResponse.json({ message: '❌ No se detectó una cara válida' }, { status: 400 });
    
    const inputDescriptor = detections[0].descriptor;
    const employees = await sql`SELECT id, image_url FROM employees WHERE image_url IS NOT NULL`;
    if (!employees.rows.length) return NextResponse.json({ message: '⚠️ No hay empleados registrados' }, { status: 404 });

    const faceDescriptors = new Map();
    await Promise.all(
      employees.rows.map(async (employee) => {
        try {
          const response = await axios.get(employee.image_url, { responseType: 'arraybuffer' });
          const dbImage = await canvas.loadImage(Buffer.from(response.data, 'binary'));
          const dbDetections = await faceapi.detectAllFaces(dbImage).withFaceLandmarks().withFaceDescriptors();
          if (dbDetections.length) faceDescriptors.set(employee.id, dbDetections[0].descriptor);
        } catch {}
      })
    );

    for (const [id, dbDescriptor] of faceDescriptors) {
      if (faceapi.euclideanDistance(inputDescriptor, dbDescriptor) < 0.6) {
        if (action === 'entry') {
          const existingEntry = await sql`SELECT * FROM work_schedules WHERE employee_id = ${id} AND check_out IS NULL`;
          if (existingEntry.rows.length) return NextResponse.json({ message: '⚠️ Entrada ya registrada' }, { status: 400 });
          await sql`INSERT INTO work_schedules (employee_id, date, check_in, status) VALUES (${id}, ${now.split(' ')[0]}, ${now}, 'En proceso')`;
          return NextResponse.json({ message: `✅ Entrada registrada para empleado ${id}` });
        }
        if (action === 'exit') {
          const entryRecord = await sql`SELECT * FROM work_schedules WHERE employee_id = ${id} AND check_out IS NULL`;
          if (!entryRecord.rows.length) return NextResponse.json({ message: '⚠️ No hay entrada registrada' }, { status: 400 });
          await sql`UPDATE work_schedules SET check_out = ${now}, status = 'Completado' WHERE employee_id = ${id} AND check_out IS NULL`;
          return NextResponse.json({ message: `✅ Salida registrada para empleado ${id}` });
        }
      }
    }
    return NextResponse.json({ message: '❌ No se encontró coincidencia facial' }, { status: 400 });
  } catch (error) {
    console.error('🔥 Error:', error);
    return NextResponse.json({ message: '❌ Error en el procesamiento', error }, { status: 500 });
  }
}
