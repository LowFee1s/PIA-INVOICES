import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import * as faceapi from 'face-api.js';
import { Canvas, Image } from 'canvas';
import axios from 'axios';
const path = require('path');
const canvas = require('canvas');

const modelPath = path.join(process.cwd(), 'models');
faceapi.env.monkeyPatch({ Image: canvas.Image, Canvas: canvas.Canvas });

async function loadModels() {
  await faceapi.nets.ssdMobilenetv1.loadFromDisk(modelPath);
  await faceapi.nets.faceLandmark68Net.loadFromDisk(modelPath);
  await faceapi.nets.faceRecognitionNet.loadFromDisk(modelPath);
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
      second: '2-digit'
    }).replace(',', '');

    const response = await axios.get(imageBase64, { responseType: 'arraybuffer' });
    const image = await canvas.loadImage(Buffer.from(response.data, 'binary'));
    const detections = await faceapi.detectSingleFace(image).withFaceLandmarks().withFaceDescriptor();
    
    if (!detections || !detections.descriptor) {
      return NextResponse.json({ message: '❌ No se detectó una cara válida' }, { status: 400 });
    }

    const inputFaceDescriptor = detections.descriptor;
    const employees = await sql`SELECT id, face_descriptor FROM employees WHERE face_descriptor IS NOT NULL`;
    
    let matchedEmployee = null;
    for (const employee of employees.rows) {
      const dbDescriptor = employee.face_descriptor;
      const distance = faceapi.euclideanDistance(inputFaceDescriptor, dbDescriptor);
      if (distance < 0.6) {
        matchedEmployee = employee;
        break;
      }
    }

    if (!matchedEmployee) {
      return NextResponse.json({ message: '❌ No se encontró coincidencia facial' }, { status: 400 });
    }

    if (action === 'entry') {
      const existingEntry = await sql`SELECT * FROM work_schedules WHERE employee_id = ${matchedEmployee.id} AND check_out IS NULL`;
      if (existingEntry.rows.length > 0) {
        return NextResponse.json({ message: '⚠️ Ya existe una entrada sin salida' }, { status: 400 });
      }
      await sql`INSERT INTO work_schedules (employee_id, date, check_in, status) VALUES (${matchedEmployee.id}, ${now.split(' ')[0]}, ${now}, 'En proceso')`;
      return NextResponse.json({ message: `✅ Entrada registrada para empleado ${matchedEmployee.id}` });
    }

    if (action === 'exit') {
      const entryRecord = await sql`SELECT * FROM work_schedules WHERE employee_id = ${matchedEmployee.id} AND check_out IS NULL`;
      if (entryRecord.rows.length === 0) {
        return NextResponse.json({ message: '⚠️ No hay entrada registrada o ya se ha registrado la salida' }, { status: 400 });
      }
      await sql`UPDATE work_schedules SET check_out = ${now}, status = 'Completado' WHERE employee_id = ${matchedEmployee.id} AND check_out IS NULL`;
      return NextResponse.json({ message: `✅ Salida registrada para empleado ${matchedEmployee.id}` });
    }

    return NextResponse.json({ message: '⚠️ Acción no reconocida' }, { status: 400 });
  } catch (error) {
    console.log(error);
    
    return NextResponse.json({ message: '❌ Error al registrar la entrada/salida', error }, { status: 500 });
  }
}
