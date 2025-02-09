import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const invoiceId = formData.get("invoiceId");
    const customerEmail = formData.get("customerEmail");
    const pdfFile = formData.get("pdfBase64");

    if (!invoiceId || !customerEmail || !pdfFile) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }

    // Crear la carpeta temporal si no existe
    const tmpDir = path.join(process.cwd(), "tmp");
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir);
    }

    // Convertir el PDF recibido como Blob a un Buffer
    const pdfBuffer = Buffer.from(await pdfFile.arrayBuffer());  // Usar .arrayBuffer() para convertir a Buffer
    const pdfPath = path.join(tmpDir, `invoice_${invoiceId}.pdf`);

    // Escribir el archivo PDF en el sistema
    fs.writeFileSync(pdfPath, pdfBuffer);

    // Configurar el transporte de correo
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GOOGLE_ACCOUNT,
        pass: process.env.GOOGLE_APP_PASSWORD,
      },
    });

    // Configurar los detalles del correo
    const mailOptions = {
      from: process.env.GOOGLE_ACCOUNT,
      to: customerEmail,
      subject: `Factura ${invoiceId} - Pago Confirmado`,
      text: `Hola, adjuntamos la factura #${invoiceId}. Gracias por su pago.`,
      attachments: [
        {
          filename: `FacturaCDFI-${invoiceId}.pdf`,
          path: pdfPath,
          contentType: "application/pdf",
        },
      ],
    };

    // Enviar el correo
    await transporter.sendMail(mailOptions);
    
    // Eliminar el archivo temporal después de enviarlo
    fs.unlinkSync(pdfPath);

    return NextResponse.json({ message: "Correo enviado correctamente" });
  } catch (error) {
    console.error("❌ Error enviando el correo:", error);
    return NextResponse.json({ error: "Error enviando el correo" }, { status: 500 });
  }
}
