"use client";

import React from "react";
import { Invoice } from "@/app/lib/definitions";
import { formatCurrency } from "@/app/lib/utils";

export function InvoiceDetailsModal({
  invoice,
  onClose,
}: {
  invoice: Invoice;
  onClose: () => void;
}) {
  if (!invoice) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-1/3 rounded-lg bg-white p-6 shadow-lg">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-600 hover:text-gray-900"
        >
          ×
        </button>
        <h2 className="mb-4 text-lg font-bold">Invoice Details</h2>
        <p>
          <strong>Name:</strong> {invoice.name}
        </p>
        <p>
          <strong>Email:</strong> {invoice.email}
        </p>
        <p>
          <strong>Total de la factura:</strong> {formatCurrency(invoice.amount)}
        </p>
        <p>
          <strong>Estatus de la factura:</strong> {invoice.status}
        </p>
        <p>
          <strong>Empleado:</strong> {invoice.employee_id}
        </p>
        <p>
          <strong>Uso cliente del CDFI:</strong> {invoice.usocliente_cdfi}
        </p>
        <p>
          <strong>Regimen fiscal del CDFI:</strong> {invoice.regimenfiscal_cdfi}
        </p>
        <p>
          <strong>Fecha de emision:</strong> {invoice.fecha_creado.toLocaleString()}
        </p>
        <p>
          <strong>Fecha maxima para pagar:</strong> {invoice.fecha_pago.toLocaleString()}
        </p>
        <p>
          <strong>Fecha de pago:</strong> {invoice.fecha_pago.toLocaleString()}
        </p>
        <p>
          <strong>Metodo de pago:</strong> {invoice.modo_pago}
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
