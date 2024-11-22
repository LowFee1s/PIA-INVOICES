"use client";

import React from "react";
import { Employee } from "@/app/lib/definitions";

export function EmployeeDetailsModal({
  employee,
  onClose,
}: {
  employee: Employee;
  onClose: () => void;
}) {
  if (!employee) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-1/3 rounded-lg bg-white p-6 shadow-lg">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-600 hover:text-gray-900"
        >
          ×
        </button>
        <h2 className="mb-4 text-lg font-bold">Employee Details</h2>
        <p>
          <strong>Name:</strong> {employee.name}
        </p>
        <p>
          <strong>Email:</strong> {employee.email}
        </p>
        <p>
          <strong>RFC:</strong> {employee.rfc}
        </p>
        <p>
          <strong>Address:</strong> {employee.direccion}
        </p>
        <p>
          <strong>Phone:</strong> {employee.telefono}
        </p>
        <p>
          <strong>Tipo de empleado:</strong> {employee.tipo_empleado}
        </p>
        <p>
          <strong>Total de facturas realizadas:</strong> {employee.total_invoices}
        </p>
        <p>
          <strong>Fecha de ingreso:</strong> {employee.fecha_creado.toLocaleString()}
        </p>
        <div className="mt-4">
          <button
            onClick={onClose}
            className="rounded-lg bg-blue-800 px-4 py-2 text-sm text-white hover:bg-blue-500"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
