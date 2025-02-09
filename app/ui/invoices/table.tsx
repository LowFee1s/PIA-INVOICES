"use client"
import { UpdateInvoice, DeleteInvoice, ViewDetailsInvoices } from '@/app/ui/invoices/buttons';
import InvoiceStatus from '@/app/ui/invoices/status';
import { formatDateToLocal, formatCurrency, formatDatetoPayToLocal } from '@/app/lib/utils';
import { themeType } from '@/app/lib/theme';
import { useState } from 'react';
import { Invoice } from '@/app/lib/definitions';
import jsPDFInvoiceTemplate, { OutputType } from "jspdf-invoice-template";
import { InvoiceDetailsModal } from './modal';
import dynamic from 'next/dynamic';

// Dynamically import the component that generates the PDF invoice
const InvoicePDFGenerator = dynamic(() => import('./invoicePDFGenerator'), {
  ssr: false,  // This ensures it's only rendered on the client side
});

const InvoicePDFEmail = dynamic(() => import('./invoicePDFEmail'), {
  ssr: false,  // This ensures it's only rendered on the client side
});


export default function InvoicesTable({
  invoices,
  theme  
}: {  
  invoices: Invoice[];
  theme: themeType;  
}) {

  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const openModal = (invoice: Invoice) => setSelectedInvoice(invoice);
  const closeModal = () => setSelectedInvoice(null);

  return (
    <div className="mt-6 flow-root">
      <div className="inline-block min-w-full align-middle">
        <div className={`rounded-lg ${theme.container} p-2 md:pt-0`}>
          <div className="md:hidden">
            {invoices?.map((invoice) => (
              <div
                key={invoice.id}
                className={`mb-2 w-full rounded-md p-4
                  ${theme.bg}
                `}
              >
                <div className="flex items-center justify-between border-b pb-4">
                  <div>
                    <div className="mb-2 flex items-center">
                      <p className={`${theme.title}`}>{invoice.name}</p>
                    </div>
                    <p className="text-sm text-gray-500">{invoice.email}</p>
                  </div>
                  <InvoiceStatus status={invoice.status} theme={theme}  />
                </div>
                <div className="flex w-full items-center justify-between pt-4">
                  <div>
                    <p className={`text-xl font-medium ${theme.title}`}>
                      {formatCurrency(invoice.amount)}
                    </p>
                    <p className={`${theme.title}`}>{formatDateToLocal(invoice.fecha_creado)}</p>
                  </div>
                  <div className="flex justify-end gap-2">
                    {/* <ViewDetailsInvoices
                      id={invoice.id}
                      onOpen={() => openModal(invoice)}
                      theme={theme}
                    /> */}
                    <InvoicePDFGenerator disabled={invoice.status == "Pendiente" ? true : false} invoice={invoice} theme={theme} />
                    <InvoicePDFEmail disabled={invoice.status == "Pendiente" ? true : false} invoice={invoice} theme={theme} />
                    <UpdateInvoice disabled={invoice.status == "Pagado" ? true : false} id={invoice.id} theme={theme} />
                    <DeleteInvoice disabled={invoice.status == "Pagado" ? true : false} id={invoice.id} theme={theme} />
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Table View */}
          <table className={`hidden min-w-full ${theme.text} md:table`}>
            <thead className="rounded-lg text-left text-sm font-normal">
              <tr>
                <th scope="col" className="px-4 py-5 font-medium sm:pl-6">
                  Id Factura
                </th>
                <th scope="col" className="px-4 py-5 font-medium sm:pl-6">
                  Customer
                </th>
                <th scope="col" className="px-3 py-5 font-medium">
                  Fecha de creacion
                </th>
                <th scope="col" className="px-3 py-5 font-medium">
                  Total de la factura
                </th>
                <th scope="col" className="px-3 py-5 font-medium">
                  Fecha para pagar
                </th>
                <th scope="col" className="px-3 py-5 font-medium">
                  Estatus
                </th>
              </tr>
            </thead>
            <tbody className={`${theme.bg}`}>
              {invoices?.map((invoice) => (
                <tr
                  key={invoice.id}
                  className={`w-full border-b py-3 text-sm last-of-type:border-none 
                    [&:first-child>td:first-child]:rounded-tl-lg [&:first-child>td:last-child]:rounded-tr-lg 
                    [&:last-child>td:first-child]:rounded-bl-lg [&:last-child>td:last-child]:rounded-br-lg
                    ${theme.border}
                  `}
                >
                  <td className="whitespace-nowrap py-3 pl-6 pr-3">
                    <div className="flex items-center gap-3">
                      <p>{invoice.id}</p>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">
                    {invoice.name}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">
                    {formatDateToLocal(invoice.fecha_creado)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">
                    {formatCurrency(invoice.amount)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">
                    {formatDatetoPayToLocal(invoice.fecha_para_pagar)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">
                    <InvoiceStatus status={invoice.status} theme={theme} />
                  </td>
                  <td className="whitespace-nowrap py-3 pl-6 pr-3">
                    <div className="flex justify-end gap-3">
                      {/* <ViewDetailsInvoices
                        id={invoice.id}
                        onOpen={() => openModal(invoice)}
                        theme={theme}
                      /> */}
                      <InvoicePDFGenerator disabled={invoice.status == "Pendiente" ? true : false} invoice={invoice} theme={theme} />
                      <InvoicePDFEmail disabled={invoice.status == "Pendiente" ? true : false} invoice={invoice} theme={theme} />
                      <UpdateInvoice disabled={invoice.status == "Pagado" ? true : false} id={invoice.id} theme={theme} />
                      <DeleteInvoice disabled={invoice.status == "Pagado" ? true : false} id={invoice.id} theme={theme} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Modal */}
      {selectedInvoice && (
        <InvoiceDetailsModal invoice={selectedInvoice} onClose={closeModal} />
      )}
    </div>
  );
}
