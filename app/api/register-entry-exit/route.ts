import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function POST(req: NextRequest) {
  try {
    const { employeeId, imageBase64, action } = await req.json();

    // Validar la entrada de datos
    if (!employeeId || !imageBase64 || !action) {
      return NextResponse.json({ message: 'Faltan datos requeridos' }, { status: 400 });
    }

    const nowdate = new Date().toISOString();

    // Si la acción es 'entry', se registra la entrada
    if (action === 'entry') {
      const existingEntry = await sql`
        SELECT * FROM work_schedules WHERE employee_id = ${employeeId} AND check_out IS NULL;
      `;

      if (existingEntry.rows.length > 0) {
        return NextResponse.json({ message: 'Ya existe una entrada sin salida para este empleado' }, { status: 400 });
      }

      // Registrar la entrada si no existe un registro de salida pendiente
      await sql`
        INSERT INTO work_schedules (employee_id, check_in, status)
        VALUES (${employeeId}, ${nowdate}, 'Completado');
      `;

      return NextResponse.json({ message: 'Entrada registrada exitosamente' });
    }

    // Si la acción es 'exit', se actualiza el registro de salida
    if (action === 'exit') {
      const entryRecord = await sql`
        SELECT * FROM work_schedules WHERE employee_id = ${employeeId} AND check_out IS NULL;
      `;

      if (entryRecord.rows.length === 0) {
        return NextResponse.json({ message: 'No hay una entrada registrada para este empleado o ya se ha registrado la salida' }, { status: 400 });
      }

      // Actualizar el registro de salida
      await sql`
        UPDATE work_schedules
        SET check_out = ${nowdate}, status = 'Completado'
        WHERE employee_id = ${employeeId} AND check_out IS NULL;
      `;

      return NextResponse.json({ message: 'Salida registrada exitosamente' });
    }

    return NextResponse.json({ message: 'Acción no válida' }, { status: 400 });
  } catch (error) {
    console.error('Error al registrar entrada/salida:', error);
    return NextResponse.json({ message: 'Error al registrar la entrada/salida', error }, { status: 500 });
  }
}
