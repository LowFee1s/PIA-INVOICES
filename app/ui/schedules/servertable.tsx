import { fetchEmployeeAttendance } from '@/app/lib/data'; // Importa la función para obtener la asistencia
import { useState, useEffect } from 'react';

type EmployeeAttendance = {
  id: string;
  date: string;
  check_in: string | null;
  check_out: string | null;
  status: string;
};

export default function SchedulesServerTable({
  query,
  currentPage,
  theme,
}: {
  query: string;
  currentPage: number;
  theme: any;
}) {
  const [attendanceRecords, setAttendanceRecords] = useState<EmployeeAttendance[]>([]);

  useEffect(() => {
    // Aquí debes hacer la llamada a tu backend para obtener los registros de asistencia
    const fetchAttendance = async () => {
      try {
        const employee_id = 'id_del_empleado'; // Debes pasar el ID del empleado actual
        const records = await fetchEmployeeAttendance(employee_id);
        setAttendanceRecords(records);
      } catch (error) {
        console.error('Error al obtener la asistencia:', error);
      }
    };

    fetchAttendance();
  }, [currentPage, query]);

  return (
    <div className="w-full">
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
