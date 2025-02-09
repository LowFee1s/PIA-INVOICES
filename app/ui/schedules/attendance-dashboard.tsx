import { fetchEmployeeAttendance } from '@/app/lib/data';
import { useEffect, useState } from 'react';

export default function AttendanceDashboard({ employee_id }: { employee_id: string }) {
  const [attendanceRecords, setAttendanceRecords] = useState([]);

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        const records = await fetchEmployeeAttendance(employee_id);
        setAttendanceRecords(records);
      } catch (error) {
        console.error('Error al obtener la asistencia:', error);
      }
    };

    fetchAttendance();
  }, [employee_id]);

  return (
    <div className="mt-5">
      <h2>Asistencia del Empleado</h2>
      <table className="min-w-full">
        <thead>
          <tr>
            <th className="text-left">Fecha</th>
            <th className="text-left">Entrada</th>
            <th className="text-left">Salida</th>
            <th className="text-left">Estado</th>
          </tr>
        </thead>
        <tbody>
          {attendanceRecords.length > 0 ? (
            attendanceRecords.map((record) => (
              <tr key={record.id}>
                <td>{record.date}</td>
                <td>{record.check_in ? new Date(record.check_in).toLocaleString() : 'No registrada'}</td>
                <td>{record.check_out ? new Date(record.check_out).toLocaleString() : 'No registrada'}</td>
                <td>{record.status}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={4} className="text-center">No hay registros de asistencia</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
