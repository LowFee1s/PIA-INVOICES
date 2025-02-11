'use server';

import { z } from 'zod';
import { sql } from '@vercel/postgres';
import { redirect } from 'next/navigation';
import { signIn } from '@/auth';
import { AuthError } from 'next-auth';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import * as faceapi from 'face-api.js';
const canvas = require('canvas');
import axios from 'axios';
import path from 'path';
import nodemailer from 'nodemailer';
import type { User } from '@/app/lib/definitions';
import { unstable_noStore } from 'next/cache';

const modelPath = path.join(process.cwd(), 'models');
faceapi.env.monkeyPatch({ Image: canvas.Image, Canvas: canvas.Canvas });

async function loadModels() {
  await faceapi.nets.ssdMobilenetv1.loadFromDisk(modelPath);
  await faceapi.nets.faceLandmark68Net.loadFromDisk(modelPath);
  await faceapi.nets.faceRecognitionNet.loadFromDisk(modelPath);
}

// A regular expression to check for valid email format
const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;

// A regular expression to check for at least one special character, one upper case 
// letter, one lower case letter and at least 8 characters
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[-_!@#$%^&*]).{8,}$/;

// A Zod schema for the name field
const nameSchema = z.string().min(3, "Name must have at least 3 characters");
const rfcSchema = z.string().min(8, "RFC must have at least 8 characters");
const telefonoSchema = z.string().min(8, "Telefono must have at least 8 characters");
const direccionSchema = z.string().min(10, "Direccion must have at least 10 characters");
const tipoempleadoSchema =  z.enum(["Supervisor", "Jefe de area", "Asistente de Inventario", "Gerente de la planta principal", "Auxiliar"], {
  invalid_type_error: 'Please select an type employee.',
});
const tipoclienteSchema =  z.enum(["Normal", "Asociado"], {
  invalid_type_error: 'Please select an type customer.',
});
// A Zod schema for the email field
const emailSchema = z.string().regex(emailRegex, "Invalid email format");

// A Zod schema for the password field
const passwordSchema = z.string().regex(passwordRegex, `
  The password does not meet the minimum security requirements.
`);

// A Zod schema for the object with name, email and password fields
const UserSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema
  // theme: z.coerce.number({
  //   invalid_type_error: 'Please select a theme',
  // })
});

const InvoicesSchema = z.object({
  id: z.string().optional(),
  customerId: z.string({
    invalid_type_error: 'Please select a customer.',
  }),
  amount: z.coerce
    .number()
    .gt(0, { message: 'Please enter an amount greater than $0.' }),
  status: z.enum(['Pendiente', 'Pagado'], {
    invalid_type_error: 'Please select an invoice status.',
  }),
  fechapagar: z.string().optional(),
  employee: z.string(),
  regimen_fiscal:  z.string().optional(),
  metodo_pago:  z.string().optional(),
  uso_factura:  z.string().optional(),
  products: z.array(
    z.object({
      id: z.string().nonempty('Product ID is required.'),
      name: z.string().nonempty('Product name is required.'),
      price: z.number().positive('Price must be greater than 0.'),
      quantity: z.number().min(1).default(1),
    })
  ),
});


const EmployeeSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  rfc: rfcSchema,
  telefono: telefonoSchema,
  direccion: direccionSchema,
  tipo_empleado: tipoempleadoSchema,
  password: passwordSchema,
  userEmail: emailSchema,
  photo: z.string().optional(),
})

const UpdateEmployee = EmployeeSchema.omit({ password: true, rfc: true });

const CustomerSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  rfc: rfcSchema,
  telefono: telefonoSchema,
  direccion: direccionSchema,
  tipo_cliente: tipoclienteSchema,
  userEmail: emailSchema
})

// Use Zod to update the expected types
const CreateInvoice = InvoicesSchema.omit({ id: true, date: true });
const UpdateInvoice = InvoicesSchema.omit({ id: true, customerId: true, products: true, amount: true, employee: true, date: true });

// This is temporary until @types/react-dom is updated
export type InvoiceState = {
  errors?: {
    customerId?: string[];
    amount?: string[];
    status?: string[];
  };
  message?: string | null;
};

export type UserState = {
  errors?: {
    name?: string[];
    email?: string[];
    password?: string[];
    confirmPassword?: string[];
    isoauth?: string[];
  }
  message?: string | null;
}

export type EmployeeState = {
  errors?: {
    name?: string[];
    email?: string[];
    rfc?: string[];
    telefono?: string[];
    direccion?: string[];
    password?: string[];
    confirmPassword?: string[];
    isoauth?: string[];
    tipo_empleado?: string[];
    photo?: string[];
  }
  message?: string | null;
}

export type CustomerState = {
  errors?: {
    name?: string[];
    email?: string[];
    rfc?: string[];
    telefono?: string[];
    direccion?: string[];
    tipo_cliente?: string[];
  }
  message?: string | null;
}

type ResetPasswordToken = {
  email: string;
}



// export async function createInvoice(prevState: InvoiceState, formData: FormData) {
//   const rawProducts = formData.get('products') as string | undefined;

//   // Parsear `products` si existe
//   let parsedProducts = [];
//   if (rawProducts) {
//     try {
//       parsedProducts = JSON.parse(rawProducts);
//     } catch (error) {
//       console.error("Error parsing products:", error);
//       return {
//         message: 'Invalid products format.',
//       };
//     }
//   }

//   // Obtener los valores del formulario
//   const customerId1 = formData.get('customerId');
//   const amount1 = parseFloat(formData.get('amount') as string);
//   const status1 = formData.get('status');
//   const employee1 = formData.get('employee');
//   const fechapagar1 = formData.get('fecha_maxima');
//   const regimen_fiscal1 = formData.get('regimen_fiscal');
//   const metodo_pago1 = formData.get('metodo_pago');
//   const uso_factura1 = formData.get('uso_factura');

//   // Definir los valores predeterminados para los campos vacíos o nulos
//   const regimen_fiscal12 = regimen_fiscal1 || 'Persona Moral'; // Valor por defecto
//   const metodo_pago12 = metodo_pago1 || 'Efectivo'; // Valor por defecto
//   const uso_factura12 = uso_factura1 || 'Gastos Generales'; // Valor por defecto

//   // Comprobación de los valores obtenidos
//   console.log('Form Data:', {
//     customerId1,
//     amount1,
//     status1,
//     employee1,
//     fechapagar1,
//     regimen_fiscal12,
//     metodo_pago12,
//     uso_factura12,
//     parsedProducts,
//   });

//   // Definir los mensajes de error antes de usarlos
//   const errorMessages = {
//     validation: {
//       customerId: 'Please select a valid customer.',
//       amount: 'Please select any products.',
//       status: 'Please select a valid status.',
//       products: 'Products list is invalid or empty.',
//       regimen_fiscal: 'Invalid fiscal regimen selected.',
//       metodo_pago: 'Invalid payment method selected.',
//       uso_factura: 'Invalid invoice usage selected.',
//     },
//     database: {
//       general: 'Something went wrong while saving the invoice. Please try again later.',
//       productInsert: 'Failed to save products. Please check the product details.',
//       invoiceInsert: 'Failed to save the invoice. Please try again.',
//     },
//   };

//   // Validación de los campos con Zod
//   const validatedFields = InvoicesSchema.safeParse({
//     customerId: customerId1 ?? '', // Asignar valor predeterminado si es null/undefined
//     amount: isNaN(amount1) ? 0 : amount1, // Validar si amount es NaN
//     status: status1 ?? '', // Asignar valor predeterminado si es null/undefined
//     employee: employee1 ?? '', // Asignar valor predeterminado si es null/undefined
//     fechapagar: fechapagar1 ?? '', // Asignar valor predeterminado si es null/undefined
//     regimen_fiscal12, // Usar el valor con el predeterminado
//     metodo_pago12, // Usar el valor con el predeterminado
//     uso_factura12, // Usar el valor con el predeterminado
//     products: parsedProducts,
//   });

//   // Si la validación falla, retornar los errores
//   if (!validatedFields.success) {
//     const fieldErrors = validatedFields.error.flatten().fieldErrors;
//     console.log('Validation Errors:', fieldErrors);

//     // Traducir los errores
//     const translatedErrors = Object.entries(fieldErrors).reduce((acc, [key, errors]) => {
//       acc[key] = errors?.map((error) => errorMessages.validation[key] || error) || [];
//       return acc;
//     }, {} as Record<string, string[]>);

//     return {
//       errors: translatedErrors,
//       message: 'Please correct the highlighted errors and try again.',
//     };
//   }

//   // Usar los datos validados
//   const { customerId, amount, status, products, employee, fechapagar, uso_factura, metodo_pago, regimen_fiscal } = validatedFields.data;
//   console.log('Validated Fields:', {
//     customerId,
//     amount,
//     status,
//     products,
//     employee,
//     fechapagar,
//     uso_factura,
//     metodo_pago,
//     regimen_fiscal,
//   });

//   const amountInCents = amount * 100; // Convertir a centavos
//   const date = new Date().toISOString().split('T')[0]; // Fecha actual en formato YYYY-MM-DD

//   let result;
//   try {
//     // Iniciar una transacción en la base de datos para insertar la factura y los productos
//     if (status === "Pendiente" && fechapagar) {
//       console.log("Inserting Pending Invoice:", { customerId, amountInCents, status, date, employee, fechapagar });
//       result = await sql`
//       INSERT INTO invoices (customer_id, amount, status, fecha_creado, employee_id, fecha_para_pagar)
//       VALUES (${customerId}, ${amountInCents}, ${status}, ${date}, ${employee}, ${fechapagar})
//       RETURNING id`;
//     }

//     if (status === "Pagado") {
//       console.log("Inserting Paid Invoice:", { customerId, amountInCents, status, date, employee, uso_factura, metodo_pago, regimen_fiscal });
//       result = await sql`
//       INSERT INTO invoices (customer_id, amount, status, fecha_creado, employee_id, usocliente_cdfi, modo_pago, regimenfiscal_cdfi)
//       VALUES (${customerId}, ${amountInCents}, ${status}, ${date}, ${employee}, ${uso_factura12}, ${metodo_pago12}, ${regimen_fiscal12})
//       RETURNING id`;
//     }

//     const invoiceId = result?.rows[0].id;  // Obtener el ID de la factura insertada
//     console.log('Invoice Inserted, ID:', invoiceId);

//     // Insertar los productos de la factura
//     for (const product of products) {
//       const { id, name, price, quantity = 1 } = product; // Desestructurar el producto y asignar cantidad por defecto
//       console.log(`Inserting product: ${id}, ${name}, Quantity: ${quantity}, Price: ${price}`);
//       await sql`
//         INSERT INTO invoice_items (invoice_id, product_id, quantity, price)
//         VALUES (${invoiceId}, ${id}, ${quantity}, ${price * 100})`; // Convertir precio a centavos
//     }

//   } catch (error) {
//     // Si ocurre un error con la base de datos
//     console.error('Database Error: ', error);
//     return {
//       message: 'Database Error: Failed to Create Invoice.',
//     };
//   }

//   // Redirigir después de insertar
//   redirect('/dashboard/invoices');
// }

export async function createInvoice(prevState: InvoiceState, formData: FormData) {
  const rawProducts = formData.get('products') as string | undefined;

  // Parsear `products` si existe
  let parsedProducts = [];
  if (rawProducts) {
    try {
      parsedProducts = JSON.parse(rawProducts);
    } catch (error) {
      console.error("Error parsing products:", error);
      return {
        message: 'Invalid products format.',
      };
    }
  }

  // Obtener los valores del formulario
  const customerId1 = formData.get('customerId');
  const amount1 = parseFloat(formData.get('amount') as string);
  const status1 = formData.get('status');
  const employee1 = formData.get('employee');
  const fechapagar1 = formData.get('fecha_maxima');
  const regimen_fiscal1 = formData.get('regimen_fiscal');
  const metodo_pago1 = formData.get('metodo_pago');
  const uso_factura1 = formData.get('uso_factura');

  // Definir los valores predeterminados para los campos vacíos o nulos
  const regimen_fiscal12 = regimen_fiscal1 || 'Persona Moral'; // Valor por defecto
  const metodo_pago12 = metodo_pago1 || 'Efectivo'; // Valor por defecto
  const uso_factura12 = uso_factura1 || 'Gastos Generales'; // Valor por defecto

  // Validación de los campos con Zod
  const validatedFields = InvoicesSchema.safeParse({
    customerId: customerId1, // Asignar valor predeterminado si es null/undefined
    amount: isNaN(amount1) ? 0 : amount1, // Validar si amount es NaN
    status: status1, // Asignar valor predeterminado si es null/undefined
    employee: employee1, // Asignar valor predeterminado si es null/undefined
    fechapagar: fechapagar1 ?? '', // Asignar valor predeterminado si es null/undefined
    regimen_fiscal12, // Usar el valor con el predeterminado
    metodo_pago12, // Usar el valor con el predeterminado
    uso_factura12, // Usar el valor con el predeterminado
    products: parsedProducts,
  });

  // Si la validación falla, retornar los errores
  if (!validatedFields.success) {
    const fieldErrors = validatedFields.error.flatten().fieldErrors;
    console.log('Validation Errors:', fieldErrors);
    return {
      errors: fieldErrors,
      message: 'Please correct the highlighted errors and try again.',
    };
  }

  // Agrupar productos por product_id y sumar cantidades
  const groupedProducts = parsedProducts.reduce((acc: any[], product: any) => {
    const existingProduct = acc.find(item => item.product_id === product.id);
    if (existingProduct) {
      existingProduct.quantity += product.quantity; // Sumar cantidades si el producto ya existe
      existingProduct.total += product.price * product.quantity; // Sumar el total
    } else {
      acc.push({
        product_id: product.id,
        title: product.name,
        description: product.description,
        price: product.price,
        quantity: product.quantity,
        total: product.price * product.quantity,
      });
    }
    return acc;
  }, []);

  // Insertar factura y productos agrupados
  let result;
  try {
    // Iniciar una transacción en la base de datos para insertar la factura
    if (status1 === "Pendiente" && fechapagar1) {

      result = await sql`
        INSERT INTO invoices (customer_id, amount, status, fecha_creado, employee_id, fecha_para_pagar)
        VALUES (${customerId1 as string}, ${amount1 * 100}, ${status1 as string}, ${new Date().toISOString()}, ${employee1 as string}, ${fechapagar1 as string | null})
        RETURNING id`;
    }

    if (status1 === "Pagado") {
      result = await sql`
      INSERT INTO invoices (customer_id, amount, status, fecha_creado, employee_id, usocliente_cdfi, modo_pago, regimenfiscal_cdfi)
      VALUES (${customerId1 as string}, ${amount1 * 100}, ${status1 as string}, ${new Date().toISOString()}, ${employee1 as string}, ${uso_factura12 as string}, ${metodo_pago12 as string}, ${regimen_fiscal12 as string})
      RETURNING id`;
    }

    const invoiceId = result?.rows[0].id; // Obtener el ID de la factura insertada
    console.log('Invoice Inserted, ID:', invoiceId);

    // Insertar los productos agrupados
    for (const product of groupedProducts) {
      console.log(`Inserting product: ${product.product_id}, Quantity: ${product.quantity}, Name:${product.title}, Description: ${product.description}, Price: ${product.price}`);
      await sql`
        INSERT INTO invoice_items (invoice_id, product_id, quantity, price, name, description)
        VALUES (${invoiceId}, ${product.product_id}, ${product.quantity}, ${product.price * 100}, ${product.title}, ${product.description})`; // Convertir precio a centavos
    }

  } catch (error) {
    console.error('Database Error: ', error);
    return {
      message: 'Database Error: Failed to Create Invoice.',
    };
  }

  // Redirigir después de insertar
  redirect('/dashboard/invoices');

}




// export async function updateInvoice(
//   id: string,
//   prevState: InvoiceState,
//   formData: FormData,
// ) {

//   // Obtener los valores del formulario
//   const status1 = formData.get('status');
//   const fechapagar1 = formData.get('fecha_maxima');
//   const regimen_fiscal1 = formData.get('regimen_fiscal');
//   const metodo_pago1 = formData.get('metodo_pago');
//   const uso_factura1 = formData.get('uso_factura');

//   // Definir los valores predeterminados para los campos vacíos o nulos
//   const regimen_fiscal12 = regimen_fiscal1 || 'Persona Moral'; // Valor por defecto
//   const metodo_pago12 = metodo_pago1 || 'Efectivo'; // Valor por defecto
//   const uso_factura12 = uso_factura1 || 'Gastos Generales'; // Valor por defecto

//   // Comprobación de los valores obtenidos
//   console.log('Form Data:', {
//     regimen_fiscal12,
//     fechapagar1,
//     status1,
//     metodo_pago12,
//     uso_factura12,
//   });

//   // Definir los mensajes de error antes de usarlos
//   const errorMessages = {
//     validation: {
//       status: 'Please select a valid status.',
//       regimen_fiscal: 'Invalid fiscal regimen selected.',
//       metodo_pago: 'Invalid payment method selected.',
//       uso_factura: 'Invalid invoice usage selected.',
//     },
//     database: {
//       general: 'Something went wrong while update the invoice. Please try again later.',
//       productInsert: 'Failed to update products. Please check the product details.',
//       invoiceInsert: 'Failed to update the invoice. Please try again.',
//     },
//   };

//   // Validación de los campos con Zod
//   const validatedFields = UpdateInvoice.safeParse({
//     regimen_fiscal12, // Usar el valor con el predeterminado
//     fechapagar: fechapagar1 ?? '', // Asignar valor predeterminado si es null/undefined
//     status: status1 ?? '', // Asignar valor predeterminado si es null/undefined
//     metodo_pago12, // Usar el valor con el predeterminado
//     uso_factura12, // Usar el valor con el predeterminado
//   });

//   // Si la validación falla, retornar los errores
//   if (!validatedFields.success) {
//     const fieldErrors = validatedFields.error.flatten().fieldErrors;
//     console.log('Validation Errors:', fieldErrors);

//     // Traducir los errores
//     const translatedErrors = Object.entries(fieldErrors).reduce((acc, [key, errors]) => {
//       acc[key as keyof typeof errorMessages.validation] = errors?.map((error) => errorMessages.validation[key as keyof typeof errorMessages.validation] || error) || [];
//       return acc;
//     }, {} as Record<string, string[]>);

//     return {
//       errors: translatedErrors,
//       message: 'Please correct the highlighted errors and try again.',
//     };
//   }

//   // Usar los datos validados
//   const { uso_factura, fechapagar, status, metodo_pago, regimen_fiscal } = validatedFields.data;
//   console.log('Validated Fields:', {
//     uso_factura,
//     fechapagar,
//     status,
//     metodo_pago,
//     regimen_fiscal,
//   });

//   const date = new Date().toISOString().split('T')[0]; // Fecha actual en formato YYYY-MM-DD

//   let result;
//   try {
//     // Iniciar una transacción en la base de datos para insertar la factura y los productos
//     if (status === "Pendiente" && fechapagar) {
//       console.log("Updating Pending Invoice:", { fechapagar, status });
//       result = await sql`
//       UPDATE invoices SET fecha_para_pagar = ${fechapagar}, status = ${status}   
//       WHERE id = ${id}
//       `;
//     }

//     if (status === "Pagado") {
//       console.log("Updating Paid Invoice:", { uso_factura, status, metodo_pago, regimen_fiscal });
//       result = await sql`
//       UPDATE invoices SET usocliente_cdfi = ${uso_factura12}, regimenfiscal_cdfi = ${regimen_fiscal12}, status = ${status}, modo_pago = ${metodo_pago12}         
//       WHERE id = ${id}
//       `;
//     }

//     console.log('Invoice Update, ID:', result);

//   } catch (error) {
//     // Si ocurre un error con la base de datos
//     console.error('Database Error: ', error);
//     return {
//       message: 'Database Error: Failed to Update Invoice.',
//     };
//   }

//   // Redirigir después de insertar
//   redirect('/dashboard/invoices');

// }

export async function updateInvoice(
  id: string,
  prevState: InvoiceState,
  formData: FormData,
) {
  // Obtener los valores del formulario
  const status1 = formData.get("status");
  const fechapagar1 = formData.get("fecha_maxima");
  const regimen_fiscal1 = formData.get("regimen_fiscal");
  const metodo_pago1 = formData.get("metodo_pago");
  const uso_factura1 = formData.get("uso_factura");

  // Asignar valores predeterminados
  const regimen_fiscal = (regimen_fiscal1 as string) ?? "Persona Moral";
  const metodo_pago = (metodo_pago1 as string) ?? "Efectivo";
  const uso_factura = (uso_factura1 as string) ?? "Gastos Generales";
  const status = (status1 as string) ?? "";
  const fechapagar = (fechapagar1 as string) ?? "";

  // Comprobación de los valores obtenidos
  console.log("Form Data:", {
    regimen_fiscal,
    fechapagar,
    status,
    metodo_pago,
    uso_factura,
  });

  // Validación con Zod
  const validatedFields = InvoicesSchema.safeParse({
    status,
    fechapagar,
    regimen_fiscal,
    metodo_pago,
    uso_factura,
  });

  if (!validatedFields.success) {
    const fieldErrors = validatedFields.error.flatten().fieldErrors;
    console.log("Validation Errors:", fieldErrors);
    return {
      errors: fieldErrors,
      message: "Please correct the highlighted errors and try again.",
    };
  }

  const date = new Date().toISOString().split("T")[0]; // Fecha actual YYYY-MM-DD

  let result;
  try {
    if (status === "Pendiente" && fechapagar) {
      console.log("Updating Pending Invoice:", { fechapagar, status });
      result = await sql`
        UPDATE invoices SET fecha_para_pagar = ${fechapagar}, status = ${status}   
        WHERE id = ${id}
      `;
    }

    if (status === "Pagado") {
      console.log("Updating Paid Invoice:", {
        uso_factura,
        status,
        metodo_pago,
        regimen_fiscal,
      });
      result = await sql`
        UPDATE invoices 
        SET usocliente_cdfi = ${uso_factura}, regimenfiscal_cdfi = ${regimen_fiscal}, 
            status = ${status}, modo_pago = ${metodo_pago}         
        WHERE id = ${id}
      `;
    }

    console.log("Invoice Updated, ID:", id);
  } catch (error) {
    console.error("Database Error:", error);
    return {
      message: "Database Error: Failed to Update Invoice.",
    };
  }

  redirect("/dashboard/invoices");
}

export async function deleteInvoice(id: string) {
  try {
    await sql`DELETE FROM invoice_items WHERE invoice_id = ${id}`;
    await sql`DELETE FROM invoices WHERE id = ${id}`;
    return { message: 'Deleted Invoice.' };
  } catch (error) {
    return { message: 'Database Error: Failed to Delete Invoice.' };
  }
}

export async function checkInEmployee(client: any, employee_id: string) {
  const date = new Date();

  try {
    const result = await client.sql`
      INSERT INTO work_schedules (employee_id, check_in, status)
      VALUES (${employee_id}, ${date}, 'En turno')
      ON CONFLICT (employee_id, date) DO UPDATE SET check_in = EXCLUDED.check_in, status = 'En turno';
    `;
    console.log(`Entrada registrada para el empleado ${employee_id}`);
    return result;
  } catch (error) {
    console.error('Error al registrar entrada:', error);
    throw error;
  }
}

export async function checkOutEmployee(client: any, employee_id: string) {
  const date = new Date();

  try {
    const result = await client.sql`
      UPDATE work_schedules
      SET check_out = ${date}, status = 'Finalizado'
      WHERE employee_id = ${employee_id} AND date = CURRENT_DATE AND check_in IS NOT NULL;
    `;
    console.log(`Salida registrada para el empleado ${employee_id}`);
    return result;
  } catch (error) {
    console.error('Error al registrar salida:', error);
    throw error;
  }
}

export async function saveEmployeeDescriptor(employeeId: any, imageUrl: any) {
  await loadModels();
  const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
  const image = await canvas.loadImage(Buffer.from(response.data, 'binary'));

  const detections = await faceapi
    .detectSingleFace(image)
    .withFaceLandmarks()
    .withFaceDescriptor();

  if (!detections || !detections.descriptor) {
    throw new Error('❌ No se pudo extraer el descriptor facial.');
  }

  // Guardar el descriptor en la base de datos como un array de floats
  await sql`
    UPDATE employees 
    SET face_descriptor = ${JSON.stringify(detections.descriptor)}
    WHERE id = ${employeeId};
  `;
  console.log(`✅ Descriptor facial guardado para el empleado ${employeeId}`);
}



export async function createEmployee(prevState: EmployeeState, formData: FormData) {
  // Validate form using Zod
  const validatedFields = EmployeeSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    rfc: formData.get('rfc'),
    telefono: formData.get('telefono'),
    direccion: formData.get('direccion'),
    password: formData.get('password'),
    userEmail: formData.get('userEmail'),
    tipo_empleado: formData.get('tipo_empleado'),
    photo: formData.get('photo'),
  });
 
  // If form validation fails, return errors early. Otherwise, continue.
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Create Employee.',
    };
  }
 
  // Prepare data for insertion into the database
  const { name, email, rfc, telefono, direccion, tipo_empleado, password, photo } = validatedFields.data;

  const confirmPassword = formData.get('confirm-password');
  if (password != confirmPassword) {
    return {
      message: 'Passwords are different.'
    };
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const account = await sql`SELECT COUNT (*) AS count FROM employees WHERE email=${email}`;

  if (Number(account.rows[0]?.count) > 0) {
    return {
      message: `This email address is already in use, please use another one!`
    }
  }

  const date = new Date();
  const formattedDate = date.toLocaleString('es-ES', {
    weekday: 'long',    // Día de la semana
    day: '2-digit',     // Día del mes con dos dígitos
    month: 'long',      // Mes completo
    year: 'numeric',    // Año en formato numérico
    hour: '2-digit',    // Hora con dos dígitos
    minute: '2-digit',  // Minutos con dos dígitos
    second: '2-digit',  // Segundos con dos dígitos
    hour12: false       // Formato 24 horas
  });

  // Insert data into the database
  try {
    const result = await sql`
      INSERT INTO employees (name, email, rfc, direccion, telefono, tipo_empleado, password, isoauth, theme, fecha_creado, image_url)
      VALUES (${name}, ${email}, ${rfc}, ${direccion}, ${telefono}, ${tipo_empleado}, ${hashedPassword}, ${false}, ${'light'}, ${formattedDate}, ${photo})
      RETURNING id
    `;

    const employeeId = result.rows[0].id;

    if (employeeId && photo) {
      await saveEmployeeDescriptor(employeeId, photo);
    }

  } catch (error) {
    // If a database error occurs, return a more specific error.
    return {
      message: `Database Error: Failed to Create Employee. ${error} `,
    };
  }
 
  redirect('/dashboard/employees');
}

export async function updateEmployee(
  id: string,
  prevState: EmployeeState,
  formData: FormData
) {
  const validatedFields = UpdateEmployee.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    telefono: formData.get('telefono'),
    direccion: formData.get('direccion'),
    tipo_empleado: formData.get('tipo_empleado'),
    userEmail: formData.get('userEmail'),
  });
 
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Update Employee.',
    };
  }
 
  const { name, email, telefono, direccion, tipo_empleado, userEmail} = validatedFields.data;
 
  try {
    await sql`
      UPDATE employees
      SET name = ${name}, email = ${email}, telefono = ${telefono}, direccion = ${direccion}, tipo_empleado = ${tipo_empleado}
      WHERE
        id = ${id}
    `;
  } catch (error) {
    return { message: `Database Error: Failed to Update Employee. ` };
  }
 
  redirect('/dashboard/employees');
}

export async function deleteEmployee(id: string) {
  try {
    await sql`DELETE FROM employees WHERE id = ${id}`;
    return { message: 'Deleted Employee.' };
  } catch (error) {
    return { message: 'Database Error: Failed to Delete Employee.' };
  }
}


export async function createCustomer(prevState: CustomerState, formData: FormData) {
  // Validate form using Zod
  const validatedFields = CustomerSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    rfc: formData.get('rfc'),
    telefono: formData.get('telefono'),
    direccion: formData.get('direccion'),
    tipo_cliente: formData.get('tipo_cliente'),
    userEmail: formData.get('userEmail')
  });
 
  // If form validation fails, return errors early. Otherwise, continue.
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Create Customer.',
    };
  }
 
  // Prepare data for insertion into the database
  const { name, email, rfc, telefono, direccion, tipo_cliente, userEmail } = validatedFields.data;
  
  const date = new Date();
  const formattedDate = date.toLocaleString('es-ES', {
    weekday: 'long',    // Día de la semana
    day: '2-digit',     // Día del mes con dos dígitos
    month: 'long',      // Mes completo
    year: 'numeric',    // Año en formato numérico
    hour: '2-digit',    // Hora con dos dígitos
    minute: '2-digit',  // Minutos con dos dígitos
    second: '2-digit',  // Segundos con dos dígitos
    hour12: false       // Formato 24 horas
  });

  // Insert data into the database
  try {
    await sql`
      INSERT INTO customers (name, email, rfc, direccion, telefono, tipo_cliente, fecha_creado)
      VALUES (${name}, ${email}, ${rfc}, ${direccion}, ${telefono}, ${tipo_cliente}, ${formattedDate})
    `;
  } catch (error) {
    // If a database error occurs, return a more specific error.
    return {
      message: `Database Error: Failed to Create Customer. `,
    };
  }
 
  redirect('/dashboard/customers');
}

export async function updateCustomer(
  id: string,
  prevState: CustomerState,
  formData: FormData
) {
  const validatedFields = CustomerSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    rfc: formData.get('rfc'),
    telefono: formData.get('telefono'),
    direccion: formData.get('direccion'),
    tipo_cliente: formData.get('tipo_cliente'),
    userEmail: formData.get('userEmail')
  });
 
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Update Customer.',
    };
  }
 
  const { name, email, rfc, telefono, direccion, tipo_cliente, userEmail } = validatedFields.data;
 
  try {
    await sql`
      UPDATE customers
      SET name = ${name}, email = ${email}, rfc = ${rfc}, telefono = ${telefono}, direccion = ${direccion}, tipo_cliente = ${tipo_cliente}
      WHERE
        customers.email = ${email}
      AND
        id = ${id}
    `;
  } catch (error) {
    return { message: `Database Error: Failed to Update Customer. ` };
  }
 
  redirect('/dashboard/customers');
}

export async function deleteCustomer(id: string) {
  try {
    await sql`DELETE FROM customers WHERE id = ${id}`;
    return { message: 'Deleted Customer.' };
  } catch (error) {
    return { message: 'Database Error: Failed to Delete Customer.' };
  }
}


export async function createUserWithCredentials(prevState: UserState, formData: FormData) {
  // Validate form using Zod
  const validatedFields = UserSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
  });
 
  // If form validation fails, return errors early. Otherwise, continue.
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing or wrong fields. Failed to create Account.',
    };
  }

  const { name, email, password } = validatedFields.data;
  const confirmPassword = formData.get('confirm-password');
  if (password != confirmPassword) {
    return {
      message: 'Passwords are different.'
    };
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const account = await sql`SELECT * FROM users WHERE email=${email}`;

  if (account.rowCount) {
    return {
      message: `This email address is already in use, please use another one!`
    }
  }

  const date = new Date().toISOString().split('T')[0];
  try {
      await sql`
      INSERT INTO employees (name, email, rfc, direccion, telefono, tipo_empleado, password, isoauth, theme, fecha_creado)
      VALUES (${name}, ${email}, ${'BRGFAI2U'}, ${'S4 LA DE LA ESQUINA'}, ${'8118225743'}, ${'Supervisor'}, ${hashedPassword}, ${false}, ${'light'}, ${'sábado, 23 de noviembre de 2024, 02:48:48'})
    `;
  } catch (error) {
    console.log(`
      Database Error: Failed to create account:
      ${error}
    `);
    return {
      message: `
        Database Error: Failed to create account.
        Please try again or contact the support team.
      `
    }
  }
  
  redirect('/login?account-created=true');
}

export async function authenticateWithCredentials(
  prevState: string | undefined,
  formData: FormData,
) {

  try {
    await signIn('credentials', formData);
  } catch (error) {
    if (error instanceof AuthError) {
      console.log(error.type);
      switch (error.type) {
        case 'CredentialsSignin':
          return 'Invalid credentials.';
        default:
          return 'Something went wrong.';
      }
    }
    throw error;
  }
}

export async function authenticateWithOAuth(provider: string) {
  await signIn(provider);
}

export async function updateUser(
  prevState: UserState, 
  formData: FormData
) {
  
  // Validate form using Zod
  const validatedFields = UserSchema.safeParse({
    name: formData.get('name'),
    password: formData.get('password'),
    // theme: formData.get('theme'),
    email: formData.get('userEmail')
  });
 
  // If form validation fails, return errors early. Otherwise, continue.
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Update User.',
    };
  }
 
  // Prepare data for insertion into the database
  // const { name, email, password, theme} = validatedFields.data; // If the theme is enabled
  const { name, email, password } = validatedFields.data;
  
  const confirmPassword = formData.get('confirm-password');
  if (password != confirmPassword) {
    return {
      message: 'Passwords are different'
    }
  }

  const hashedPassword = await bcrypt.hash(password, 10);

 
  // Insert data into the database
  try {
    await sql`
      UPDATE employees
      SET 
        name = ${name}, 
        password = ${hashedPassword},
        isoauth = false
      WHERE
        email = ${email}
    `;
  } catch (error) {
    // If a database error occurs, return a more specific error.

    return {
      message: 'Database Error: Failed to Update User.',
    };
  }
 
  redirect('/dashboard/user-profile?user-updated=true');
}

export async function updateTheme(
  formData: FormData
)  {
  unstable_noStore();
  let theme = formData.get('theme') as 'system' | 'dark' | 'light';
  const email = formData.get('user-email') as string;

  try {
    await sql`
      UPDATE employees
      SET
        theme = ${theme}
      WHERE
        email = ${email}
    `;
  } catch (error) {
    console.log(error);
  }

  redirect('/dashboard/settings');
}

export async function forgotPassword(
  prevState: string | undefined, 
  formData: FormData) 
{ 
  const email = formData.get('email');
  const resetToken = jwt.sign({
    email
  },
    process.env.AUTH_SECRET!, 
    {
      algorithm: 'HS256',
      expiresIn: '30min'
    }
  );

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GOOGLE_ACCOUNT!, // Your Gmail email address
      pass: process.env.GOOGLE_APP_PASSWORD!, // The app password you generated
    },
  });

  try {
    await transporter.sendMail({
      from: process.env.GOOGLE_ACCOUNT!, // Same as the 'user' above
      to: email as string, // Recipient email(s)
      subject: 'Your password reset link', // Subject of the email
      text: `Click the link to reset your password: ${process.env.BASE_URL}/reset-password/${resetToken}`, // Customize the email content
    });
  } catch(error) {
    console.log(error);
    return "Something went wrong.";
  }

  redirect(`/forgot/instructions/${email}`);
}

export async function resetPassword(
  token: string,
  prevState: string | undefined, 
  formData: FormData
) {
  // checking whether the token is still valid
  try {
    var decoded = jwt.verify(token, process.env.AUTH_SECRET!) as ResetPasswordToken;
  } catch(error) {
    console.log(error);
    return 'This token is invalid or has expired.';
  }

  // checking whether there is an user with this email
  const email = decoded.email;
  try {
    const user = await sql<User>`SELECT * FROM employees WHERE email=${email}`;
    if (!user.rows[0]) {
      return `There's no user with this email: ${email}`;
    }
  } catch(error) {
    console.log('Something went wrong.');
    return 'Something went wrong.';
  }

  // updating the password
  const ValidatePassword = passwordSchema.safeParse(formData.get('password'));
 
  // If form validation fails, return errors early. Otherwise, continue.
  if (!ValidatePassword.success) {
    return  'Passwords must have at least 8 characters,' + 
      'one special character, one upper case letter and one lower case letter.';
  }

  // Insert data into the database
  const password = ValidatePassword.data;
  const confirmPassword = formData.get('confirm-password');
  if (password != confirmPassword) {
    return 'Passwords are different.';
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  try {
    await sql`
      UPDATE employees
      SET 
        password = ${hashedPassword}
      WHERE
        email = ${email}
    `;
  } catch (error) {
    console.log(error);

    return 'Database Error: Failed to Update User.';
  }

  redirect('/login?password-updated=true');
}