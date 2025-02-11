import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import * as faceapi from 'face-api.js';
import { Canvas, Image } from 'canvas';
import axios from 'axios';
import path from 'path';

const canvas = require('canvas');
const modelPath = path.join(process.cwd(), 'models');
faceapi.env.monkeyPatch({ Image: canvas.Image, Canvas: canvas.Canvas });

async function loadModels() {
  console.log('Cargando modelos...');
  await faceapi.nets.ssdMobilenetv1.loadFromDisk(modelPath),
  await faceapi.nets.faceLandmark68Net.loadFromDisk(modelPath),
  await faceapi.nets.faceRecognitionNet.loadFromDisk(modelPath);
  console.log('Modelos cargados correctamente');
}

function compareFaceDescriptors(inputDescriptor: any, dbDescriptor: any) {
  console.log('Comparando descriptores de cara...');
  return faceapi.euclideanDistance(inputDescriptor, dbDescriptor) < 0.6; // Umbral ajustable
}

async function getImageBuffer(imageBase64: any) {
  console.log('Convirtiendo imagen a buffer...');
  const response = await axios.get(imageBase64, { responseType: 'arraybuffer' });
  const buffer = Buffer.from(response.data, 'binary');
  console.log('Imagen convertida a buffer');
  return buffer;
}

async function handleWorkSchedule(action: any, employeeId: any, now: any) {
  console.log(`Acción: ${action} para el empleado ${employeeId}`);
  if (action === 'entry') {
    const existingEntry = await sql`SELECT * FROM work_schedules WHERE employee_id = ${employeeId} AND check_out IS NULL`;
    console.log('Entrada existente:', existingEntry.rows);
    if (existingEntry.rows.length > 0) return { status: 400, message: '⚠️ Ya existe una entrada sin salida' };
    await sql`INSERT INTO work_schedules (employee_id, date, check_in, status) VALUES (${employeeId}, ${now.split(' ')[0]}, ${now}, 'En proceso')`;
    console.log(`Entrada registrada para empleado ${employeeId}`);
    return { status: 200, message: `✅ Entrada registrada para empleado ${employeeId}` };
  }

  if (action === 'exit') {
    const entryRecord = await sql`SELECT * FROM work_schedules WHERE employee_id = ${employeeId} AND check_out IS NULL`;
    console.log('Registro de entrada:', entryRecord.rows);
    if (entryRecord.rows.length === 0) return { status: 400, message: '⚠️ No hay entrada registrada o ya se ha registrado la salida' };
    await sql`UPDATE work_schedules SET check_out = ${now}, status = 'Completado' WHERE employee_id = ${employeeId} AND check_out IS NULL`;
    console.log(`Salida registrada para empleado ${employeeId}`);
    return { status: 200, message: `✅ Salida registrada para empleado ${employeeId}` };
  }

  return { status: 400, message: '⚠️ Acción no reconocida' };
}

export async function POST(req: NextRequest) {
  try {
    console.log('Iniciando proceso de carga de modelos...');
    await loadModels();

    const { imageBase64, action } = await req.json();
    console.log('Datos recibidos:', { imageBase64, action });

    if (!imageBase64 || !action) {
      console.log('Faltan datos requeridos');
      return NextResponse.json({ message: '⚠️ Faltan datos requeridos' }, { status: 400 });
    }

    const now = new Date().toLocaleString('en-US', { timeZone: 'America/Mexico_City', hour12: false, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }).replace(',', '');
    console.log('Fecha y hora actuales:', now);

    const imageBuffer = await getImageBuffer(imageBase64);
    const image = await canvas.loadImage(imageBuffer);
    console.log('Imagen cargada correctamente');

    const detections = await faceapi.detectSingleFace(image).withFaceLandmarks().withFaceDescriptor();
    console.log('Detección de cara:', detections);

    if (!detections || !detections.descriptor) {
      return NextResponse.json({ message: '❌ No se detectó una cara válida' }, { status: 400 });
    }

    const inputFaceDescriptor = detections.descriptor;
    const employees = await sql`SELECT id, face_descriptor FROM employees WHERE face_descriptor IS NOT NULL`;
    console.log('Empleados obtenidos:', employees.rows);

    let matchedEmployee = null;
    for (const employee of employees.rows) {
      const dbDescriptor = Object.values(employee.face_descriptor);
      console.log('Comparando descriptor con empleado:', employee.id);
      if (compareFaceDescriptors(inputFaceDescriptor, dbDescriptor as number[])) {
        console.log('Coincidencia encontrada:', employee.id);
        matchedEmployee = employee;
        break;
      }
    }

    if (!matchedEmployee) {
      console.log('No se encontró coincidencia facial');
      return NextResponse.json({ message: '❌ No se encontró coincidencia facial' }, { status: 400 });
    }

    const result = await handleWorkSchedule(action, matchedEmployee.id, now);
    console.log('Resultado del registro:', result.message);
    return NextResponse.json({ message: result.message }, { status: result.status });

  } catch (error: any) {
    console.error("Error en el proceso completo:", error);
    return NextResponse.json({ message: '❌ Error al registrar la entrada/salida', error: error.message }, { status: 500 });
  }
}
