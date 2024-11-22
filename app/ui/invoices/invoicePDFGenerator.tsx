"use client"
import jsPDFInvoiceTemplate, { OutputType } from "jspdf-invoice-template";
import { formatDateToLocal, formatCurrency, formatDatetoPayToLocal } from '@/app/lib/utils';
import { Invoice } from '@/app/lib/definitions';
import { themeType } from "@/app/lib/theme";
import { DocumentArrowUpIcon } from "@heroicons/react/24/outline";

export default function InvoicePDFGenerator({ invoice, theme }: { invoice: Invoice, theme: themeType }) {

  const generateInvoicePDF = () => {
    // Generar filas de la tabla de productos dinámicamente
    const productsTable = invoice.products.map((product, index) => [
      index + 1,
      product.title || 'N/A',  // Título del producto
      product.description || 'N/A',  // Descripción del producto
      formatCurrency(product.price),  // Formatear precio
      product.quantity,  // Cantidad
      product.unit || 'Unit',  // Unidad
      formatCurrency(product.price * product.quantity),  // Total por producto
    ]);
  
    // Configurar propiedades del PDF
    const props = {
      outputType: OutputType.Save,
      fileName: `invoice_${invoice.id}.pdf`,
      returnJsPDFDocObject: true,
      logo: {
        src: "/Logo.png",  // Ruta del logo
        type: 'PNG',
        width: 100,
        height: 15.02,
        margin: { top: 2, left: 2 },
      },
      business: {
        name: "Mocarr Steel CV",
        address: "Albania 141, San Nicolas Garza, Nuevo Leon",
        phone: "(+52) 81-33-91-90-68",
        email: "pruebatesting141@gmail.com",
        website: "",
      },
      contact: {
        label: "Invoice issued for:",
        name: invoice.name || 'Client Name',
        address: "Albania, Tirane, Astir",
        phone: "(+355) 069 22 22 222",
        email: invoice.email || 'client@website.al',
        otherInfo: "www.website.al",
      },
      invoice: {
        label: "Invoice #: ",
        num: invoice.id_tmp,
        invDate: `Fecha de pagar: ${formatDatetoPayToLocal(invoice.fecha_para_pagar) || "N/A"}`,
        invGenDate: `Fecha de generación: ${formatDateToLocal(invoice.fecha_creado)}`,
        header: [
          { title: "#", style: { width: 10 } },
          { title: "Title", style: { width: 30 } },
          { title: "Description", style: { width: 80 } },
          { title: "Price" },
          { title: "Quantity" },
          { title: "Unit" },
          { title: "Total" },
        ],
        table: productsTable,
        additionalRows: [
          {
            col1: 'Total:',
            col2: formatCurrency(invoice.amount),
            col3: 'MXN',
            style: { fontSize: 14 },
          },
        ],
        invDescLabel: "Invoice Note",
        invDesc: "Detalles adicionales de la factura.",
      },
      footer: {
        text: "The invoice is created on a computer and is valid without the signature and stamp.",
      },
      pageEnable: true,
      pageLabel: "Page ",
    };
  
    // Generar el PDF base con jsPDFInvoiceTemplate
    const pdf = jsPDFInvoiceTemplate(props);
  
    // Obtener el objeto jsPDF para personalización adicional
    const doc = pdf.jsPDFDocObject;
  
    // Definir la posición en la que colocar "Uso de la factura" y "Razón Social"
    const yPosition = 130; // Ajuste de la posición Y para evitar que se superponga con la tabla
  
    // Agregar "Uso de la factura" y "Razón Social" debajo de la barra
    doc.setFontSize(12).text(`Uso de la factura: ${invoice.usocliente_cdfi || 'N/A'}`, 10, yPosition);
    doc.setFontSize(12).text(`Razón Social: ${invoice.regimenfiscal_cdfi || 'N/A'}`, 10, yPosition + 10);
  
    // Guardar el PDF
    doc.save(`invoice_${invoice.id}.pdf`);
  };
  
  
  
  

  return (
    <button className={`btn-generate-pdf rounded-md border p-2
        ${theme.border} ${theme.text} ${theme.hoverBg} ${theme.hoverText}
        ${theme.hoverBorder}`} onClick={generateInvoicePDF}>
        <DocumentArrowUpIcon className="w-5" />     
    </button>
  );
}
