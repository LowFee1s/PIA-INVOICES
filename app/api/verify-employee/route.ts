import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { Worker } from 'worker_threads';

export async function POST(req: NextRequest) {
  try {
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

    // Obtener empleados de la base de datos
    const employees = await sql`SELECT id, face_descriptor FROM employees WHERE face_descriptor IS NOT NULL`;
    const employeeDescriptors = employees.rows;

    // Crear el Worker y pasar los datos
    return new Promise((resolve, reject) => {
      const worker = new Worker('./app/lib/compareDescriptorsWorker.js');
      worker.postMessage({ imageBase64, employeeDescriptors });

      worker.on('message', async (message) => {
        if (message.error) {
          resolve(NextResponse.json({ message: message.error }, { status: 400 }));
        } else {
          const matchedEmployee = message.matchedEmployee;
          
          // Manejo de acciones
          if (action === 'entry') {
            const existingEntry = await sql`SELECT * FROM work_schedules WHERE employee_id = ${matchedEmployee.id} AND check_out IS NULL`;
            if (existingEntry.rows.length > 0) {
              resolve(NextResponse.json({ message: '⚠️ Ya existe una entrada sin salida' }, { status: 400 }));
            }
            await sql`INSERT INTO work_schedules (employee_id, date, check_in, status) VALUES (${matchedEmployee.id}, ${now.split(' ')[0]}, ${now}, 'En proceso')`;
            resolve(NextResponse.json({ message: `✅ Entrada registrada para empleado ${matchedEmployee.id}` }));
          } else if (action === 'exit') {
            const entryRecord = await sql`SELECT * FROM work_schedules WHERE employee_id = ${matchedEmployee.id} AND check_out IS NULL`;
            if (entryRecord.rows.length === 0) {
              resolve(NextResponse.json({ message: '⚠️ No hay entrada registrada o ya se ha registrado la salida' }, { status: 400 }));
            }
            await sql`UPDATE work_schedules SET check_out = ${now}, status = 'Completado' WHERE employee_id = ${matchedEmployee.id} AND check_out IS NULL`;
            resolve(NextResponse.json({ message: `✅ Salida registrada para empleado ${matchedEmployee.id}` }));
          }
        }
      });

      worker.on('error', (err) => {
        console.log(err);
        resolve(NextResponse.json({ message: '❌ Error al procesar la solicitud', error: err }, { status: 500 }));
      });
    });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ message: '❌ Error al registrar la entrada/salida', error }, { status: 500 });
  }
}
