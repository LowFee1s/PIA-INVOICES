'use client';

import { CustomerField, InvoiceForm, Product } from '@/app/lib/definitions';
import {
  ArchiveBoxIcon,
  CheckIcon,
  ClockIcon,
  CurrencyDollarIcon,
  HomeModernIcon,
  PlusIcon,
  TrashIcon,
  UserCircleIcon,
  WrenchIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { Button, Button14 } from '@/app/ui/button';
import { updateInvoice } from '@/app/lib/actions';
import { useFormState } from 'react-dom';
import { themeType } from '@/app/lib/theme';
import { useEffect, useState } from 'react';

export default function EditInvoiceForm({
  invoice,
  customers,
  employee,
  theme
}: {
  invoice: InvoiceForm;
  customers: CustomerField[];
  employee: string;
  theme: themeType;
}) {
  const updateInvoiceWithId = updateInvoice.bind(null, invoice.id);
  const initialState = { message: null, errors: {} };
  const [state, dispatch] = useFormState(updateInvoiceWithId, initialState);
  const [isPaid, setIsPaid] = useState(invoice.status == "Pagado" ? true : false);
  const [isPending, setIsPending] = useState(invoice.status == "Pendiente" ? true : false);
  const [fechamaxima, setFechaMaxima] = useState(invoice.fecha_para_pagar);
  const [usocliente, setUsocliente] = useState(invoice.usocliente_cdfi);
  const [modopago, setModoPago] = useState(invoice.modo_pago);
  const [regimenfiscal, setRegimenfiscal] = useState(invoice.regimenfiscal_cdfi);
  const [total, setTotal] = useState(invoice.amount || 0);

  const handleStatusChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsPaid(e.target.value === 'Pagado');
    setIsPending(false);
  };


  const handleStatusChange2 = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsPending(e.target.value === 'Pendiente');
    setIsPaid(false);
  };
  console.log(invoice);
  const formatDate = (dateString: string) => {
    const [day, month, year] = dateString.split('/');
    
    return `${year}-${month}-${day}`;
  };
  
  // Uso del formato adecuado
  //const fechaMaxima = invoice.fecha_para_pagar ? formatDate(invoice.fecha_para_pagar) : '';
  

  return (
    <form action={dispatch}>
      <div className={`rounded-md ${theme.container} p-4 md:p-6`}>
        {/* Customer Name */}
        <div className="mb-4">
          <label
            htmlFor="customer"
            className={`mb-2 block text-sm font-medium ${theme.text}`}
          >
            Choose customer
          </label>
          <div className="relative">
            <select
              id="customer"
              name="customerId"
              className={`peer block w-full cursor-pointer rounded-md border 
                py-2 pl-10 text-sm outline-2 placeholder:text-gray-500
                ${theme.border} ${theme.bg} ${theme.text}`}
              defaultValue={invoice.customer_id}
              disabled
              aria-describedby="customer-error"
            >
              <option value="" disabled>
                Select a customer
              </option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </select>
            <UserCircleIcon
              className={`pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] 
              -translate-y-1/2 text-gray-500 ${theme.inputIcon}`}
            />
          </div>
          <div id="customer-error" aria-live="polite" aria-atomic="true">
            {state.errors?.customerId &&
              state.errors.customerId.map((error: string) => (
                <p className="mt-2 text-sm text-red-500" key={error}>
                  {error}
                </p>
              ))}
          </div>
        </div>

          {/* Invoice Amount
          <div className="mb-4">
          <label
            htmlFor="amount"
            className={`mb-2 block text-sm font-medium ${theme.text}`}
          >
            Choose an amount
          </label>
          <div className="relative mt-2 rounded-md">
            <input
              id="amount"
              name="amount"
              type="number"
              step="0.01"
              placeholder="Enter USD amount"
              className={`peer block w-full rounded-md border 
                py-2 pl-10 text-sm outline-2 placeholder:text-gray-500
                ${theme.border} ${theme.bg} ${theme.text}`}
              aria-describedby="amount-error"
            />
            <CurrencyDollarIcon
              className={`pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] 
              -translate-y-1/2 text-gray-500 ${theme.inputIcon}`}
            />
          </div>
          <div id="amount-error" aria-live="polite" aria-atomic="true">
            {state.errors?.amount &&
              state.errors.amount.map((error: string) => (
                <p className="mt-2 text-sm text-red-500" key={error}>
                  {error}
                </p>
              ))}
          </div>
        </div> */}

         {/* Invoice Amount (read-only) */}
         <div className="mb-4">
          <label htmlFor="amount" className={`mb-2 block text-sm font-medium ${theme.text}`}>
            Invoice Amount
          </label>
          <div className="relative mt-2 rounded-md">
            <input
              id="amount"
              name="amount"
              type="text"
              disabled
              value={`$${total.toFixed(2)}`} // Show the amount in a read-only format
              readOnly
              className={`peer block w-full rounded-md border 
                py-2 pl-10 text-sm outline-2 placeholder:text-gray-500
                ${theme.border} ${theme.bg} ${theme.text}`}
            />
             <CurrencyDollarIcon
              className={`pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] 
              -translate-y-1/2 text-gray-500 ${theme.inputIcon}`}
            />
          </div>
        </div>
        

        

        <input type="hidden" id='employee' name='employee' value={employee}/>

        {/* Invoice Status */}
        <fieldset>
          <legend className={`mb-2 block text-sm font-medium ${theme.text}`}>
            Set the invoice status
          </legend>
          <div className={`rounded-md border px-[14px] py-3 ${theme.bg} ${theme.border}`}>
            <div className="flex gap-4">
              <div className="flex items-center">
                <input
                  id="pendiente"
                  name="status"
                  type="radio"
                  value="Pendiente"
                  checked={isPending}
                  className={`h-4 w-4 cursor-pointer text-gray-600 focus:ring-2 ${theme.container} ${theme.border}`}
                  aria-describedby="status-error"
                  onChange={handleStatusChange2}
                />
                <label
                  htmlFor="pendiente"
                  className={`ml-2 flex cursor-pointer items-center gap-1.5 rounded-full 
                  px-3 py-1.5 text-xs font-medium text-gray-600 ${theme.container} ${theme.border} ${theme.text}`}
                >
                  Pendiente <ClockIcon className="h-4 w-4" />
                </label>
              </div>
              <div className="flex items-center">
                <input
                  id="pagado"
                  name="status"
                  type="radio"
                  value="Pagado"
                  checked={isPaid}
                  className={`h-4 w-4 cursor-pointer text-gray-600 focus:ring-2 ${theme.container} ${theme.border}`}
                  aria-describedby="status-error"
                  onChange={handleStatusChange}
                />
                <label
                  htmlFor="pagado"
                  className="ml-2 flex cursor-pointer items-center gap-1.5 rounded-full bg-green-500 px-3 py-1.5 text-xs font-medium text-white"
                >
                  Pagado <CheckIcon className="h-4 w-4" />
                </label>
              </div>
            </div>
          </div>
          <div id="status-error" aria-live="polite" aria-atomic="true">
            {state.errors?.status &&
              state.errors.status.map((error: string) => (
                <p className="mt-2 text-sm text-red-500" key={error}>
                  {error}
                </p>
              ))}
          </div>
          
        </fieldset>

        {isPending &&
         (
          <div className="mt-4 space-y-4">
            {/* Fecha máxima a pagar */}
            <div>
              <label htmlFor="fecha_maxima" className={`mb-2 block text-sm font-medium ${theme.text}`}>
                Fecha máxima a pagar:
              </label>
              <input
                type="date"
                id="fecha_maxima"
                // Verificar y asegurar que la fecha está en el formato correcto (YYYY-MM-DD)
                defaultValue={fechamaxima}  
                name="fecha_maxima"
                className={`peer block w-full rounded-md border 
                  py-2 text-sm outline-2 placeholder:text-gray-500
                  ${theme.border} ${theme.bg} ${theme.text}`}
              />
            </div>
          </div>
        )}



        {/* Additional Fields for "Pagado" */}
          {isPaid && (
          <div className="mt-4 space-y-4">
            {/* Uso de Factura */}
            <div>
              <label htmlFor="uso_factura" className={`mb-2 block text-sm font-medium ${theme.text}`}>
                Uso de Factura
              </label>
              <select
                id="uso_factura"
                name="uso_factura"
                defaultValue={usocliente}
                className={`peer block w-full cursor-pointer rounded-md border 
                  py-2 text-sm outline-2 placeholder:text-gray-500
                  ${theme.border} ${theme.bg} ${theme.text}`}
              >
                <option value="Gastos Generales">Gastos Generales</option>
                <option value="Compra de Materia Prima">Compra de Materia Prima</option>
                <option value="Equipo de Transporte">Equipo de Transporte</option>
              </select>
            </div>

            {/* Régimen Fiscal */}
            <div>
              <label htmlFor="regimen_fiscal" className={`mb-2 block text-sm font-medium ${theme.text}`}>
                Régimen Fiscal
              </label>
              <select
                id="regimen_fiscal"
                name="regimen_fiscal"
                defaultValue={regimenfiscal}
                className={`peer block w-full cursor-pointer rounded-md border 
                  py-2 text-sm outline-2 placeholder:text-gray-500
                  ${theme.border} ${theme.bg} ${theme.text}`}
              >
                <option value="Persona Fisica">Persona Física</option>
                <option value="Persona Moral">Persona Moral</option>
              </select>
            </div>

            {/* Método de Pago */}
            <div>
              <label htmlFor="metodo_pago" className={`mb-2 block text-sm font-medium ${theme.text}`}>
                Método de Pago
              </label>
              <select
                id="metodo_pago"
                name="metodo_pago"
                defaultValue={modopago}
                className={`peer block w-full cursor-pointer rounded-md border 
                  py-2 text-sm outline-2 placeholder:text-gray-500
                  ${theme.border} ${theme.bg} ${theme.text}`}
              >
                <option value="Tarjeta de Debito">Tarjeta de Credito/Debito</option>
                <option value="Efectivo">Efectivo</option>
              </select>
            </div>
          </div>
        )}

      </div>

      <div className="mt-6 flex justify-end gap-4">
        <Link
          href="/dashboard/invoices"
          className={`flex h-10 items-center rounded-lg px-4 text-sm font-medium 
            ${theme.container} ${theme.border} ${theme.text}
            ${theme.hoverBg} ${theme.hoverText}`}
        >
          Cancel
        </Link>
        <Button type="submit">Update Invoice</Button>
      </div>
    </form>
  );
}



