import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { sql } from "@vercel/postgres";
import jwt from "jsonwebtoken";
import dayjs from "dayjs";

const keyemail = process.env.API_SECRET_KEY;

export async function GET(req: Request) {
  try {
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "Acceso denegado. No autorizado" }, { status: 401 });
    }

    // Verificar que el token coincida con la clave secreta esperada
    try {
      if (!keyemail) {
        return NextResponse.json({ error: 'Acceso denegado. Clave secreta no definida.' }, { status: 500 });
      }
      jwt.verify(token, keyemail);
    } catch (error) {
        return NextResponse.json({ error: 'Acceso denegado. Token no válido.' }, { status: 403 });
    }

    const today = dayjs();
    const reminderDate = today.add(5, "days").format("YYYY-MM-DD");

    // Obtener facturas pendientes cuya fecha de pago está a 5 días o menos, con JOIN para obtener datos del cliente
    const pendingInvoices = await sql`
      SELECT 
        invoices.id AS invoice_id, 
        invoices.fecha_para_pagar, 
        invoices.amount,
        customers.email, 
        customers.name
      FROM invoices
      JOIN customers ON invoices.customer_id = customers.id
      WHERE invoices.status = 'Pendiente'
        AND DATE(invoices.fecha_para_pagar) <= ${reminderDate}
        AND DATE(invoices.fecha_para_pagar) >= ${today.format("YYYY-MM-DD")};`;

    // Si no hay facturas pendientes, salir
    if (pendingInvoices.rows.length === 0) {
      return NextResponse.json({ message: '⚠️ No hay facturas próximas a vencer.' }, { status: 200 });
    }

    // Configurar servicio de correo
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GOOGLE_ACCOUNT,
        pass: process.env.GOOGLE_APP_PASSWORD,
      },
    });

    // Enviar email a cada cliente con facturas próximas a vencer
    for (const invoice of pendingInvoices.rows) {
      const mailOptions = {
        from: process.env.GOOGLE_ACCOUNT,
        to: invoice.email,
        subject: `Recordatorio de Pago - Factura #${invoice.invoice_id}`,
        text: `Hola ${invoice.name}, esperamos que tengas un lindo dia, de parte de Mocarr-Steel\nEste es un recordatorio para informarle de que su factura #${invoice.invoice_id} está pendiente y vence el ${invoice.fecha_para_pagar}. \n\nEl pago total de la factura es: ${invoice.amount} $MXN. \n\nLe recomendamos realizar el pago lo antes posible.\n\nGracias y Buen dia.\n\nAtentamente el equipo de Mocarr-Steel`,
      };

      await transporter.sendMail(mailOptions);
    }

    return NextResponse.json({ message: "📩 Correos de recordatorio enviados exitosamente." });
  } catch (error) {
    console.error("❌ Error enviando recordatorios:", error);
    return NextResponse.json({ error: "Error enviando recordatorios" }, { status: 500 });
  }
}
