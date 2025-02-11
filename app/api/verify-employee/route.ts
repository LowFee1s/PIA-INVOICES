import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { Worker } from 'worker_threads';
import * as faceapi from 'face-api.js';
import { Canvas, Image } from 'canvas';
const canvas = require('canvas');
import path from 'path';

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

    const response = await fetch(imageBase64);
    const buffer = await response.arrayBuffer();
    const image = await canvas.loadImage(Buffer.from(buffer));
    const detections = await faceapi.detectSingleFace(image).withFaceLandmarks().withFaceDescriptor();

    if (!detections || !detections.descriptor) {
      return NextResponse.json({ message: '❌ No se detectó una cara válida' }, { status: 400 });
    }

    const inputDescriptor = detections.descriptor;
    const employees = await sql`SELECT id, face_descriptor FROM employees WHERE face_descriptor IS NOT NULL`;
    
    return new Promise((resolve, reject) => {
      const worker = new Worker('./app/lib/compareDescriptorsWorker.js', {
        workerData: { inputDescriptor, employees: employees.rows }
      });

      worker.on('message', async (message) => {
        if (message.error) {
          resolve(NextResponse.json({ message: message.error }, { status: 400 }));
        } else {
          const matchedEmployee = message.matchedEmployee;
          const now = new Date().toISOString();

          if (action === 'entry') {
            await sql`INSERT INTO work_schedules (employee_id, date, check_in, status) VALUES (${matchedEmployee.id}, ${now}, ${now}, 'En proceso')`;
            resolve(NextResponse.json({ message: `✅ Entrada registrada para empleado ${matchedEmployee.id}` }));
          } else if (action === 'exit') {
            await sql`UPDATE work_schedules SET check_out = ${now}, status = 'Completado' WHERE employee_id = ${matchedEmployee.id} AND check_out IS NULL`;
            resolve(NextResponse.json({ message: `✅ Salida registrada para empleado ${matchedEmployee.id}` }));
          }
        }
      });

      worker.on('error', (err) => {
        console.error(err);
        resolve(NextResponse.json({ message: '❌ Error al procesar la solicitud', error: err }, { status: 500 }));
      });
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: '❌ Error al registrar la entrada/salida', error }, { status: 500 });
  }
}
