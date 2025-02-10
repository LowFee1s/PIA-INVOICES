"use client"
import jsPDFInvoiceTemplate, { OutputType } from "jspdf-invoice-template";
import jsPDF from "jspdf";
import { formatDateToLocal, formatCurrency, formatDatetoPayToLocal } from '@/app/lib/utils';
import { Invoice } from '@/app/lib/definitions';
import { useState } from "react";
import { themeType } from "@/app/lib/theme";
import { DocumentArrowUpIcon } from "@heroicons/react/24/outline";


// export default function InvoicePDFGenerator({ invoice, disabled, theme }: { invoice: Invoice, disabled: boolean, theme: themeType }) {

//   const generateInvoicePDF = () => {
//     // Agrupar productos con el mismo título y sumar las cantidades y subtotales
//     const groupedProducts = invoice.products.reduce((acc, product) => {
//       const existingProduct = acc.find(item => item.title === product.title);
      
//       if (existingProduct) {
//         // Si el producto ya existe, sumamos la cantidad y actualizamos el total
//         existingProduct.quantity += product.quantity;
//         existingProduct.total += product.price * product.quantity;
//       } else {
//         // Si el producto no existe, lo agregamos al array
//         acc.push({
//           ...product,
//           total: product.price * product.quantity, // Inicializamos el total
//         });
//       }
      
//       return acc;
//     }, []);
  
//     // Generar filas de la tabla de productos dinámicamente a partir de los productos agrupados
//     const productsTable = groupedProducts.map((product, index) => [
//       index + 1,
//       product.title || 'N/A',  // Título del producto
//       product.description || 'N/A',  // Descripción del producto
//       formatCurrency(product.price),  // Formatear precio
//       product.quantity,  // Cantidad
//       //product.unit || 'Unit',  // Unidad
//       formatCurrency(product.total),  // Total por producto
//     ]);
  
//     // Configurar propiedades del PDF
//     const props = {
//       outputType: OutputType.Save,
//       fileName: `invoice_${invoice.id}.pdf`,
//       returnJsPDFDocObject: true,
//       logo: {
//         src: "/Logo.png",  // Ruta del logo
//         type: 'PNG',
//         width: 100,
//         height: 15.02,
//         margin: { top: 2, left: 2 },
//       },
//       business: {
//         name: "Mocarr Steel CV",
//         address: "Albania 141, San Nicolas Garza, Nuevo Leon",
//         phone: "(+52) 81-33-91-90-68",
//         email: "pruebatesting141@gmail.com",
//         website: "",
//       },
//       contact: {
//         label: "Factura emitida para:",
//         name: invoice.name || 'Client Name',
//         address: "Albania, Tirane, Astir",
//         phone: "(+355) 069 22 22 222",
//         email: invoice.email || 'client@website.al',
//         otherInfo: "www.website.al",
//       },
//       invoice: {
//         label: "Factura #: ",
//         num: invoice.id_tmp,
//         invDate: `Fecha de pagar: ${formatDatetoPayToLocal(invoice.fecha_para_pagar) || "N/A"}`,
//         invGenDate: `Fecha de generación: ${formatDateToLocal(invoice.fecha_creado)}`,
//         header: [
//           { title: "#", style: { width: 10 } },
//           { title: "Nombre", style: { width: 30 } },
//           { title: "Descripcion", style: { width: 80 } },
//           { title: "Precio" },
//           { title: "Cantidad" },
//           //{ title: "Unidad" },
//           { title: "Total" },
//         ],
//         table: productsTable,
//         additionalRows: [
//           {
//             col1: 'Total:',
//             col2: formatCurrency(invoice.amount),
//             col3: 'MXN',
//             style: { fontSize: 14 },
//           },
//         ],
//         invDescLabel: "Notas de la factura",
//         invDesc: "Detalles adicionales de la factura.",
//       },
//       footer: {
//         text: "La factura se crea en una computadora y es válida sin la firma y el sello.",
//       },
//       pageEnable: true,
//       pageLabel: "Pagina ",
//     };
  
//     // Generar el PDF base con jsPDFInvoiceTemplate
//     const pdf = jsPDFInvoiceTemplate(props);
  
//     // Obtener el objeto jsPDF para personalización adicional
//     const doc = pdf.jsPDFDocObject;
  
//     // Definir la posición en la que colocar "Uso de la factura" y "Razón Social"
//     const yPosition = 170; // Ajuste de la posición Y para evitar que se superponga con la tabla
  
//     // Agregar "Uso de la factura" y "Razón Social" debajo de la barra
//     doc.setFontSize(12).text(`Uso de la factura: ${invoice.usocliente_cdfi || 'N/A'}`, 10, yPosition);
//     doc.setFontSize(12).text(`Razón Social: ${invoice.regimenfiscal_cdfi || 'N/A'}`, 10, yPosition + 20);
//     doc.setFontSize(12).text(`Metodo de pago: ${invoice.modo_pago || 'N/A'}`, 10, yPosition + 40);
  
//     // Guardar el PDF
//     doc.save(`invoiceCDFI_${invoice.id}.pdf`);
//   };
  
//   return (
//     <button disabled={disabled} className={`rounded-md border p-2 
//       ${disabled ? 'bg-gray-400 text-gray-100 cursor-not-allowed' : 
//       `${theme.border} ${theme.text} ${theme.hoverBg} ${theme.hoverText} ${theme.hoverBorder}`}`} onClick={generateInvoicePDF}>
//         <DocumentArrowUpIcon className="w-5" />     
//     </button>
//   );
// }


export default function InvoicePDFGenerator({ invoice, disabled, theme }: { invoice: Invoice, disabled: boolean, theme: themeType }) {
  // Estado para evitar descargas múltiples
  const [isGenerating, setIsGenerating] = useState(false);

  const generateInvoicePDF = () => {
    if (isGenerating) return; // Si ya está generando, evita que se vuelva a ejecutar
    setIsGenerating(true); // Marca como en proceso

    try {
      // Agrupar productos con el mismo título y sumar las cantidades y subtotales
      const groupedProducts = invoice.products.reduce((acc: { title: string; quantity: number; total: number; price: number; description?: string }[], product) => {
        const existingProduct = acc.find(item => item.title === product.title);
        if (existingProduct) {
          existingProduct.quantity += product.quantity;
          existingProduct.total += product.price * product.quantity;
        } else {
          acc.push({ ...product, total: product.price * product.quantity });
        }
        return acc;
      }, []);

      const productsTable = groupedProducts.map((product, index) => [
        index + 1,
        product.title || 'N/A',
        product.description || 'N/A',
        formatCurrency(product.price),
        product.quantity,
        formatCurrency(product.total),
      ]);

      const doc = new jsPDF();

      const props = {
        outputType: OutputType.Save,
        fileName: `invoice_${invoice.id}.pdf`,
        returnJsPDFDocObject: true,
        jsPDFDoc: doc,
        logo: {
          src: "/Logo.png",
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
          label: "Factura emitida para:",
          name: invoice.name || 'Client Name',
          address: "Albania, Tirane, Astir",
          phone: "(+355) 069 22 22 222",
          email: invoice.email || 'client@website.al',
          otherInfo: "www.website.al",
        },
        invoice: {
          label: "Factura #: ",
          num: invoice.id_tmp,
          invDate: `Fecha de pagar: ${formatDatetoPayToLocal(invoice.fecha_para_pagar) || "N/A"}`,
          invGenDate: `Fecha de generación: ${formatDateToLocal(invoice.fecha_creado)}`,
          header: [
            { title: "#", style: { width: 10 } },
            { title: "Nombre", style: { width: 30 } },
            { title: "Descripcion", style: { width: 80 } },
            { title: "Precio" },
            { title: "Cantidad" },
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
          invDescLabel: "Notas de la factura",
          invDesc: "Detalles adicionales de la factura.",
        },
        footer: {
          text: "La factura se crea en una computadora y es válida sin la firma y el sello.",
        },
        pageEnable: true,
        pageLabel: "Pagina ",
      };

      jsPDFInvoiceTemplate(props);
      
      // Posicionar textos adicionales
      const yPosition = 170;
      doc.setFontSize(12).text(`Uso de la factura: ${invoice.usocliente_cdfi || 'N/A'}`, 10, yPosition);
      doc.setFontSize(12).text(`Razón Social: ${invoice.regimenfiscal_cdfi || 'N/A'}`, 10, yPosition + 20);
      doc.setFontSize(12).text(`Metodo de pago: ${invoice.modo_pago || 'N/A'}`, 10, yPosition + 40);

      // Guardar PDF
      doc.save(`invoiceCDFI_${invoice.id}.pdf`);
    } catch (error) {
      console.error("Error al generar el PDF:", error);
    } finally {
      setIsGenerating(false); // Liberar el estado para permitir nuevas descargas
    }
  };

  return (
    <button 
      disabled={disabled || isGenerating} 
      className={`rounded-md border p-2 
        ${disabled || isGenerating ? 'bg-gray-400 text-gray-100 cursor-not-allowed' : 
        `${theme.border} ${theme.text} ${theme.hoverBg} ${theme.hoverText} ${theme.hoverBorder}`}`} 
      onClick={generateInvoicePDF}>
      <DocumentArrowUpIcon className="w-5" />     
    </button>
  );
}

