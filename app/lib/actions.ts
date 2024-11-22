'use server';

import { z } from 'zod';
import { sql } from '@vercel/postgres';
import { redirect } from 'next/navigation';
import { signIn } from '@/auth';
import { AuthError } from 'next-auth';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import type { User } from '@/app/lib/definitions';
import { unstable_noStore } from 'next/cache';

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
  id: z.string(),
  customerId: z.string({
    invalid_type_error: 'Please select a customer.',
  }),
  amount: z.coerce
    .number()
    .gt(0, { message: 'Please enter an amount greater than $0.' }),
  status: z.enum(['pending', 'paid'], {
    invalid_type_error: 'Please select an invoice status.',
  }),
  date: z.string(),
});

const EmployeeSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  rfc: rfcSchema,
  telefono: telefonoSchema,
  direccion: direccionSchema,
  tipo_empleado: tipoempleadoSchema,
  password: passwordSchema,
  userEmail: emailSchema
})

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
const UpdateInvoice = InvoicesSchema.omit({ id: true, date: true });

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

export async function createInvoice(prevState: InvoiceState, formData: FormData) {
  // Validate form using Zod
  const validatedFields = CreateInvoice.safeParse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });
 
  // If form validation fails, return errors early. Otherwise, continue.
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Create Invoice.',
    };
  }
 
  // Prepare data for insertion into the database
  const { customerId, amount, status } = validatedFields.data;
  const amountInCents = amount * 100;
  const date = new Date().toISOString().split('T')[0];
 
  // Insert data into the database
  try {
    await sql`
      INSERT INTO invoices (customer_id, amount, status, date)
      VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
    `;
  } catch (error) {
    // If a database error occurs, return a more specific error.
    return {
      message: 'Database Error: Failed to Create Invoice.',
    };
  }

  redirect('/dashboard/invoices');
}

export async function updateInvoice(
  id: string,
  prevState: InvoiceState,
  formData: FormData,
) {
  const validatedFields = UpdateInvoice.safeParse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });
 
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Update Invoice.',
    };
  }
 
  const { customerId, amount, status } = validatedFields.data;
  const amountInCents = amount * 100;
 
  try {
    await sql`
      UPDATE invoices
      SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
      WHERE id = ${id}
    `;
  } catch (error) {
    return { message: 'Database Error: Failed to Update Invoice.' };
  }
 
  redirect('/dashboard/invoices');
}

export async function deleteInvoice(id: string) {
  try {
    await sql`DELETE FROM invoices WHERE id = ${id}`;
    return { message: 'Deleted Invoice.' };
  } catch (error) {
    return { message: 'Database Error: Failed to Delete Invoice.' };
  }
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
    tipo_empleado: formData.get('tipo_empleado'),
    userEmail: formData.get('userEmail')
  });
 
  // If form validation fails, return errors early. Otherwise, continue.
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Create Employee.',
    };
  }
 
  // Prepare data for insertion into the database
  const { name, email, rfc, telefono, direccion, tipo_empleado, password, userEmail } = validatedFields.data;

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
    await sql`
      INSERT INTO employees (name, email, rfc, direccion, telefono, tipo_empleado, password, isoauth, theme, fecha_creado)
      VALUES (${name}, ${email}, ${rfc}, ${direccion}, ${telefono}, ${tipo_empleado}, ${hashedPassword}, ${false}, ${'light'}, ${formattedDate})
    `;
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
  const validatedFields = EmployeeSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    rfc: formData.get('rfc'),
    telefono: formData.get('telefono'),
    direccion: formData.get('direccion'),
    tipo_empleado: formData.get('tipo_empleado'),
    userEmail: formData.get('userEmail')
  });
 
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Update Customer.',
    };
  }
 
  const { name, email, rfc, telefono, direccion, tipo_empleado, userEmail } = validatedFields.data;
 
  try {
    await sql`
      UPDATE employees
      SET name = ${name}, email = ${email}, rfc = ${rfc}, telefono = ${telefono}, direccion = ${direccion}, tipo_empleado = ${tipo_empleado}
      WHERE
        employees.email = ${email}
      AND
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
    await sql`INSERT INTO users (name, email, password, isoauth, creation_date, theme) VALUES
     (${name}, ${email}, ${hashedPassword}, ${false}, ${date}, ${'light'})`;
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
      UPDATE users
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
      UPDATE users
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
    const user = await sql<User>`SELECT * FROM users WHERE email=${email}`;
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
      UPDATE users
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