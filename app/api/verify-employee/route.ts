import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import * as faceapi from 'face-api.js';
import { Canvas, Image } from 'canvas';
import cloudinary from 'cloudinary'; // Asegúrate de instalar cloudinary
import axios from 'axios'; // Asegúrate de instalar axios
const path = require('path');
const canvas = require('canvas');

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  api_key: process.env.CLOUDINARY_API_KEY,
});

// Ruta de modelos
const modelPath = path.join(process.cwd(), 'models');
console.log('Cargando modelos desde:', modelPath);

// Inicializar face-api.js con canvas
faceapi.env.monkeyPatch({ Image: canvas.Image, Canvas: canvas.Canvas });

async function loadModels() {
  try {
    await faceapi.nets.ssdMobilenetv1.loadFromDisk(modelPath);
    await faceapi.nets.faceLandmark68Net.loadFromDisk(modelPath);
    await faceapi.nets.faceRecognitionNet.loadFromDisk(modelPath);
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

    const now = new Date();
    const options: Intl.DateTimeFormatOptions = { 
      timeZone: 'America/Mexico_City', // Ajusta aquí la zona horaria que prefieras
      hour12: false, // Para formato de 24 horas
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit',
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit'
    };
    const nowLocal = now.toLocaleString('en-US', options).replace(',', ''); // Obtener fecha en el formato adecuado
    console.log("✅ Hora local:", nowLocal);

    const response = await axios.get(imageBase64, { responseType: 'arraybuffer' });
    const imgBuffer = Buffer.from(response.data, 'binary');
    console.log("✅ Imagen convertida en buffer.");

    const image = await canvas.loadImage(imgBuffer);
    console.log("✅ Imagen cargada en canvas.");

    const detections = await faceapi
      .detectAllFaces(image)
      .withFaceLandmarks()
      .withFaceDescriptors();
    
    console.log("🔍 Detecciones encontradas:", detections.length);
    console.log("🧐 Datos de detección:", detections);

    if (!detections.length || !detections[0]?.descriptor) {
      return NextResponse.json({ message: '❌ No se detectó una cara válida en la imagen' }, { status: 400 });
    }

    const inputFaceDescriptor = detections[0].descriptor;

    const result = await sql`SELECT id, image_url FROM employees`;
    if (result.rows.length === 0) {
      return NextResponse.json({ message: '⚠️ No se encontraron empleados' }, { status: 404 });
    }

    for (const employee of result.rows) {
      if (!employee.image_url) continue;

      console.log(`🔍 Procesando foto de empleado ID: ${employee.id}`);

      // Descargar la imagen desde la URL de la base de datos
      const response = await axios.get(employee.image_url, { responseType: 'arraybuffer' });
      const dbImageBuffer = Buffer.from(response.data, 'binary');

      const dbImage = await canvas.loadImage(dbImageBuffer);
      const dbDetections = await faceapi
        .detectAllFaces(dbImage)
        .withFaceLandmarks()
        .withFaceDescriptors();

      if (!dbDetections.length || !dbDetections[0]?.descriptor) {
        console.log(`⚠️ No se pudo extraer el descriptor de la imagen del empleado ${employee.id}`);
        continue;
      }

      const dbFaceDescriptor = dbDetections[0].descriptor;
      const distance = faceapi.euclideanDistance(inputFaceDescriptor, dbFaceDescriptor);
      console.log(`📏 Distancia facial con ${employee.id}:`, distance);

      if (distance < 0.6) {
        console.log(`✅ Coincidencia facial encontrada con ${employee.id}`);

        if (action === 'entry') {
          const existingEntry = await sql`
            SELECT * FROM work_schedules WHERE employee_id = ${employee.id} AND check_out IS NULL;
          `;
          if (existingEntry.rows.length > 0) {
            return NextResponse.json({ message: '⚠️ Ya existe una entrada sin salida para este empleado' }, { status: 400 });
          }


          const nowDate = now.toLocaleString('en-US', { timeZone: 'America/Mexico_City', year: 'numeric', month: '2-digit', day: '2-digit' }).replace(',', '').replace('/', '-').replace('/', '-');

          await sql`
            INSERT INTO work_schedules (employee_id, date, check_in, status)
            VALUES (${employee.id}, ${nowDate}, ${nowLocal}, 'En proceso');
          `;
          return NextResponse.json({ message: `✅ Entrada registrada exitosamente para el empleado ${employee.id}` });
        }

        if (action === 'exit') {
          const entryRecord = await sql`
            SELECT * FROM work_schedules WHERE employee_id = ${employee.id} AND check_out IS NULL;
          `;
          if (entryRecord.rows.length === 0) {
            return NextResponse.json({ message: '⚠️ No hay una entrada registrada o ya se ha registrado la salida' }, { status: 400 });
          }

          await sql`
            UPDATE work_schedules
            SET check_out = ${nowLocal}, status = 'Completado'
            WHERE employee_id = ${employee.id} AND check_out IS NULL;
          `;
          return NextResponse.json({ message: `✅ Salida registrada exitosamente para el empleado ${employee.id}` });
        }
      }
    }

    return NextResponse.json({ message: '❌ No se encontró ninguna coincidencia facial' }, { status: 400 });
  } catch (error) {
    console.error('🔥 Error al registrar entrada/salida:', error);
    return NextResponse.json({ message: '❌ Error al registrar la entrada/salida', error }, { status: 500 });
  }
}
