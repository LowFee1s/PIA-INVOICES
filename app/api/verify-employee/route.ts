import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import * as faceapi from 'face-api.js';
import { Canvas, Image } from 'canvas';
import cloudinary from 'cloudinary';
import axios from 'axios';
const path = require('path');
const canvas = require('canvas');

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  api_key: process.env.CLOUDINARY_API_KEY,
});

// Cargar modelos UNA SOLA VEZ al inicio del servidor
const modelPath = path.join(process.cwd(), 'models');
let modelsLoaded = false;

async function loadModels() {
  if (!modelsLoaded) {
    await Promise.all([
      faceapi.nets.ssdMobilenetv1.loadFromDisk(modelPath),
      faceapi.nets.faceLandmark68Net.loadFromDisk(modelPath),
      faceapi.nets.faceRecognitionNet.loadFromDisk(modelPath),
    ]);
    modelsLoaded = true;
    console.log('✅ Modelos cargados correctamente');
  }
}

export async function POST(req: NextRequest) {
  try {
    await loadModels();

    const { imageBase64, action } = await req.json();
    if (!imageBase64 || !action) {
      return NextResponse.json({ message: '⚠️ Faltan datos requeridos' }, { status: 400 });
    }

    const now = new Date();
    const nowLocal = now.toLocaleString('en-US', { 
      timeZone: 'America/Mexico_City', 
      hour12: false, 
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    }).replace(',', '');

    console.log("✅ Hora local:", nowLocal);

    // Descargar imagen del usuario en paralelo
    const [responseUrl, employees] = await Promise.all([
      axios.get(imageBase64, { responseType: 'arraybuffer' }),
      sql`SELECT id, image_url FROM employees WHERE image_url IS NOT NULL`
    ]);

    const imgBuffer = Buffer.from(responseUrl.data, 'binary');
    const image = await canvas.loadImage(imgBuffer);

    const detections = await faceapi
      .detectAllFaces(image)
      .withFaceLandmarks()
      .withFaceDescriptors();

    if (!detections.length || !detections[0]?.descriptor) {
      return NextResponse.json({ message: '❌ No se detectó una cara válida en la imagen' }, { status: 400 });
    }

    const inputFaceDescriptor = detections[0].descriptor;

    console.log(`🔍 Se detectaron ${employees.rows.length} empleados.`);

    // Descargar todas las imágenes de empleados en paralelo
    const employeeImages = await Promise.all(
      employees.rows.map(async (employee) => {
        try {
          const response = await axios.get(employee.image_url, { responseType: 'arraybuffer' });
          return { id: employee.id, buffer: Buffer.from(response.data, 'binary') };
        } catch (err) {
          console.log(`⚠️ No se pudo cargar la imagen del empleado ${employee.id}`);
          return null;
        }
      })
    );

    let matchedEmployee = null;
    let bestDistance = 1; // Iniciar con un valor alto

    for (const emp of employeeImages) {
      if (!emp) continue;

      const dbImage = await canvas.loadImage(emp.buffer);
      const dbDetections = await faceapi
        .detectAllFaces(dbImage)
        .withFaceLandmarks()
        .withFaceDescriptors();

      if (!dbDetections.length || !dbDetections[0]?.descriptor) continue;

      const dbFaceDescriptor = dbDetections[0].descriptor;
      const distance = faceapi.euclideanDistance(inputFaceDescriptor, dbFaceDescriptor);

      console.log(`📏 Distancia con empleado ${emp.id}: ${distance}`);

      if (distance < bestDistance) {
        bestDistance = distance;
        matchedEmployee = emp.id;
      }
    }

    if (!matchedEmployee || bestDistance > 0.6) {
      return NextResponse.json({ message: '❌ No se encontró coincidencia facial' }, { status: 400 });
    }

    console.log(`✅ Coincidencia encontrada con empleado ID: ${matchedEmployee}`);

    if (action === 'entry') {
      const existingEntry = await sql`
        SELECT * FROM work_schedules WHERE employee_id = ${matchedEmployee} AND check_out IS NULL;
      `;
      if (existingEntry.rows.length > 0) {
        return NextResponse.json({ message: '⚠️ Ya existe una entrada sin salida para este empleado' }, { status: 400 });
      }

      await sql`
        INSERT INTO work_schedules (employee_id, date, check_in, status)
        VALUES (${matchedEmployee}, ${now.toISOString().split('T')[0]}, ${nowLocal}, 'En proceso');
      `;
      return NextResponse.json({ message: `✅ Entrada registrada exitosamente para el empleado ${matchedEmployee}` });
    }

    if (action === 'exit') {
      const entryRecord = await sql`
        SELECT * FROM work_schedules WHERE employee_id = ${matchedEmployee} AND check_out IS NULL;
      `;
      if (entryRecord.rows.length === 0) {
        return NextResponse.json({ message: '⚠️ No hay una entrada registrada o ya se ha registrado la salida' }, { status: 400 });
      }

      await sql`
        UPDATE work_schedules
        SET check_out = ${nowLocal}, status = 'Completado'
        WHERE employee_id = ${matchedEmployee} AND check_out IS NULL;
      `;
      return NextResponse.json({ message: `✅ Salida registrada exitosamente para el empleado ${matchedEmployee}` });
    }

    return NextResponse.json({ message: '❌ Acción inválida' }, { status: 400 });

  } catch (error) {
    console.error('🔥 Error al registrar entrada/salida:', error);
    return NextResponse.json({ message: '❌ Error interno del servidor', error }, { status: 500 });
  }
}
