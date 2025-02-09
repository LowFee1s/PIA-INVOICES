// This file contains type definitions for your data.
// It describes the shape of the data, and what data type each property should accept.
// For simplicity of teaching, we're manually defining these types.
// However, these types are generated automatically if you're using an ORM such as Prisma.
// export type User = {
//   id: string;
//   name: string;
//   email: string;
//   password: string;
//   isoauth: boolean;
//   theme: 'system' | 'dark' | 'light';
// };

export type User = {
  id: string;
  name: string;
  email: string;
  rfc: string;
  fecha_creado: Date;
  total_invoices: number;
  direccion: string;
  telefono: string;
  password: string;
  isoauth: boolean;
  theme: 'system' | 'dark' | 'light';
  tipo_empleado: "Supervisor" | "Jefe de area" | "Asistente de Inventario" | "Gerente de la planta principal" | "Auxiliar";
}

export type Customer = {
  id: string;
  name: string;
  email: string;
  rfc: string;
  fecha_creado: Date;
  total_invoices: number;
  total_paid: number;
  total_pending: number;
  direccion: string;
  telefono: string;
  tipo_cliente: "Normal" | "Asociado";
};

export type CustomerEdit = {
  id: string;
  name: string;
  email: string;
  rfc: string;
  direccion: string;
  telefono: string;
  tipo_cliente: "Normal" | "Asociado";
};

export type Employee = {
  id: string;
  name: string;
  email: string;
  rfc: string;
  fecha_creado: Date;
  total_invoices: number;
  direccion: string;
  telefono: string;
  password: string;
  isoauth: boolean;
  theme: 'system' | 'dark' | 'light';
  tipo_empleado: "Supervisor" | "Jefe de area" | "Asistente de Inventario" | "Gerente de la planta principal" | "Auxiliar";
  image_url: string;
};

export type EmployeeEdit = {
  id: string;
  name: string;
  email: string;
  rfc: string;
  direccion: string;
  telefono: string;
  tipo_empleado: "Supervisor" | "Jefe de area" | "Asistente de Inventario" | "Gerente de la planta principal" | "Auxiliar";
}


export type Invoice = {
  id: string;
  id_tmp: number;
  customer_id: string;
  employee_id: string;
  name: string;
  email: string;
  modo_pago: 'Tarjeta de Credito/Debito' | 'Efectivo';
  usocliente_cdfi: string;
  regimenfiscal_cdfi: string;
  amount: number;
  fecha_creado: string;
  fecha_para_pagar: string;
  fecha_pago: string;
  products: {
    product_id: string;
    quantity: number;
    price: number;
    unit: string;
    title: string;
    name: string;
    description: string;
  }[];
  // In TypeScript, this is called a string union type.
  // It means that the "status" property can only be one of the two strings: 'pending' or 'paid'.
  status: 'Pendiente' | 'Pagado';
};

export type Revenue = {
  month: string;
  revenue: number;
};

export type LatestInvoice = {
  id: string;
  name: string;
  email: string;
  amount: string;
};

// The database returns a number for amount, but we later format it to a string with the formatCurrency function
export type LatestInvoiceRaw = Omit<LatestInvoice, 'amount'> & {
  amount: number;
  status: 'Pendiente' | 'Pagado';
};

export type InvoicesTable = {
  id: string;
  id_tmp: string;
  customer_id: string;
  employee_id: string;
  name: string;
  email: string;
  modo_pago: 'Tarjeta de Credito/Debito' | 'Efectivo';
  usocliente_cdfi: string;
  regimenfiscal_cdfi: string;
  amount: number;
  products: {
    product_id: string;
    quantity: number;
    price: number;
    unit: string;
    title: string;
    name: string;
    description: string; 
    total?: number;
  }[];
  fecha_creado: string;
  fecha_para_pagar: string;
  fecha_pago: string;
  status: 'Pendiente' | 'Pagado';
};




export type CustomersTableType = {
  id: string;
  name: string;
  email: string;
  total_invoices: number;
  total_pending: number;
  total_paid: number;
  rfc: string;
  fecha_creado: Date;
  direccion: string;
  telefono: string;
  tipo_cliente: "Normal" | "Asociado";
};

export type FormattedCustomersTable = {
  id: string;
  name: string;
  email: string;
  total_invoices: number;
  total_pending: string;
  total_paid: string;
};

export type CustomerField = {
  id: string;
  name: string;
  email: string;
};

export type Product = {
  id: string;         // productId in the database
  name: string;
  description: string;
  price: number;
};

export type EmployeesTableType = {
  id: string;
  name: string;
  email: string;
  rfc: string;
  fecha_creado: Date;
  total_invoices: number;
  isoauth: boolean;
  password: string;
  direccion: string;
  telefono: string;
  theme: 'system' | 'dark' | 'light';
  tipo_empleado: "Supervisor" | "Jefe de area" | "Asistente de Inventario" | "Gerente de la planta principal" | "Auxiliar";
  image_url: string;
};

export type FormattedEmployeesTable = {
  id: string;
  name: string;
  email: string;
  total_invoices: number;
};

export type EmployeeField = {
  id: string;
  name: string;
  tipo_empleado: "Supervisor" | "Jefe de area" | "Asistente de Inventario" | "Gerente de la planta principal" | "Auxiliar";
};

export type InvoiceForm = {
  id: string;
  customer_id: string;
  customer_email: string;
  employee_id: string;
  modo_pago: 'Tarjeta de Credito/Debito' | 'Efectivo';
  usocliente_cdfi: string;
  regimenfiscal_cdfi: string;
  fecha_pago: string;
  fecha_para_pagar: string;
  fecha_creado: string;
  amount: number;
  status: 'Pendiente' | 'Pagado';
};

export type CustomerForm = {
  id: string;
  name: string;
  email: string;
  rfc: string;
  direccion: string;
  telefono: string;
  tipo_cliente: "Normal" | "Asociado";
  fecha_creado: Date,
  total_invoices: number,
  total_paid: number,
  total_pending: number,
};

export type EmployeeForm = {
  id: string;
  name: string;
  email: string;
  rfc: string;
  direccion: string;
  telefono: string;
  tipo_empleado: "Supervisor" | "Jefe de area" | "Asistente de Inventario" | "Gerente de la planta principal" | "Auxiliar";
  image_url: string,
  fecha_creado: Date,
  total_invoices: number,
  password: string,
  isoauth: boolean,
  theme: 'system' | 'dark' | 'light';
};



