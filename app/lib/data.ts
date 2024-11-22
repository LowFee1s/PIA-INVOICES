import { sql } from '@vercel/postgres';
import {
  CustomerField,
  CustomersTableType,
  InvoiceForm,
  InvoicesTable,
  LatestInvoiceRaw,
  User,
  Revenue,
  CustomerForm,
  EmployeeField,
  EmployeesTableType,
  EmployeeForm,
} from './definitions';
import { formatCurrency } from './utils';
import { unstable_noStore as noStore } from 'next/cache';
import { auth } from '@/auth';

const ITEMS_PER_PAGE = 7;

// (async ()=> {
//   // automatically deleting registries that has more than 1 week of existence
//   try {
//     await sql`DELETE FROM users WHERE creation_date < NOW() - INTERVAL '1 week';`;
//   } catch(error) {
//     console.log(error);
//   }
// })();

export async function fetchRevenue() {
  // Add noStore() here prevent the response from being cached.
  // This is equivalent to in fetch(..., {cache: 'no-store'}).
  noStore();

  try {
    // Artificially delay a response for demo purposes.
    // Don't do this in production :)

    // console.log('Fetching revenue data...');
    // await new Promise((resolve) => setTimeout(resolve, 3000));
    const session = await auth();
    const userEmail = session?.user?.email!;

    const data = await sql<Revenue>`
  SELECT SUM(i.amount) AS revenue,
   CASE EXTRACT(MONTH FROM i.fecha_creado)  -- Usa el nombre correcto de la columna
       WHEN 1 THEN 'Jan'
       WHEN 2 THEN 'Feb'
       WHEN 3 THEN 'Mar'
       WHEN 4 THEN 'Apr'
       WHEN 5 THEN 'May'
       WHEN 6 THEN 'Jun'
       WHEN 7 THEN 'Jul'
       WHEN 8 THEN 'Aug'
       WHEN 9 THEN 'Sep'
       WHEN 10 THEN 'Oct'
       WHEN 11 THEN 'Nov'
       WHEN 12 THEN 'Dec'
        END AS month
      FROM invoices AS i
      INNER JOIN customers AS c ON i.customer_id = c.id
      WHERE i.status = 'Pagado'
        AND EXTRACT(YEAR FROM i.fecha_creado) = EXTRACT(YEAR FROM CURRENT_DATE)
      GROUP BY EXTRACT(MONTH FROM i.fecha_creado)
      ORDER BY month;
    `;


    // console.log('Data fetch completed after 3 seconds.');

    return data.rows;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch revenue data.');
  }
}

export async function fetchLatestInvoices(userEmail: string) {
  noStore();
  
  try {
    const data = await sql<LatestInvoiceRaw>`
      SELECT invoices.amount, customers.name, customers.email, invoices.id, invoices.status
      FROM invoices
      JOIN customers ON invoices.customer_id = customers.id
      
      ORDER BY invoices.id_tmp DESC
      LIMIT 5`;

    const latestInvoices = data.rows.map((invoice) => ({
      ...invoice,
      amount: formatCurrency(invoice.amount),
    }));
    return latestInvoices;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch the latest invoices.');
  }
}

export async function fetchCardData(userEmail: string) {
  noStore();
  
  try {
    // You can probably combine these into a single SQL query
    // However, we are intentionally splitting them to demonstrate
    // how to initialize multiple queries in parallel with JS.
    const invoiceCountPromise = sql`
      SELECT 
        COUNT(*) 
      FROM 
        invoices
      JOIN 
        customers ON invoices.customer_id = customers.id
      `;

    const customerCountPromise = sql`SELECT COUNT(*) FROM customers
      `;

    const invoiceStatusPromise = sql`
    SELECT
      SUM(CASE WHEN status = 'Pagado' THEN amount ELSE 0 END) AS "paid",
      SUM(CASE WHEN status = 'Pendiente' THEN amount ELSE 0 END) AS "pending"
    FROM 
      invoices
    JOIN 
      customers ON invoices.customer_id = customers.id
    `;

    const data = await Promise.all([
      invoiceCountPromise,
      customerCountPromise,
      invoiceStatusPromise,
    ]);

    const numberOfInvoices = Number(data[0].rows[0].count ?? '0');
    const numberOfCustomers = Number(data[1].rows[0].count ?? '0');
    const totalPaidInvoices = formatCurrency(data[2].rows[0].paid ?? '0');
    const totalPendingInvoices = formatCurrency(data[2].rows[0].pending ?? '0');

    return {
      numberOfCustomers,
      numberOfInvoices,
      totalPaidInvoices,
      totalPendingInvoices,
    };
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch card data.');
  }
}

// export async function fetchFilteredInvoices(
//   query: string,
//   currentPage: number,
//   userEmail: string
// ) {
//   noStore();

//   // Si el query ha cambiado, resetear la página a 1
//   const pageToFetch = query ? 1 : currentPage;
//   const offset = (pageToFetch - 1) * ITEMS_PER_PAGE;

//   try {
//     const invoices = await sql<InvoicesTable>`
//       SELECT
//         invoices.id,
//         invoices.amount,
//         invoices.fecha_creado,
//         invoices.fecha_para_pagar,
//         invoices.status,
//         customers.name,
//         customers.email
//       FROM invoices
//       JOIN customers ON invoices.customer_id = customers.id
//       WHERE
       
//         (customers.name ILIKE ${`%${query}%`} OR
//         customers.email ILIKE ${`%${query}%`} OR
//         invoices.id::text ILIKE ${`%${query}%`} OR
//         invoices.fecha_creado::text ILIKE ${`%${query}%`} OR
//         invoices.status ILIKE ${`%${query}%`})
//       ORDER BY invoices.id_tmp DESC
//       LIMIT ${ITEMS_PER_PAGE} OFFSET ${offset}
//     `;

//     // Verificar si hay resultados
//     if (invoices.rows.length === 0) {
//       console.warn('No invoices found for the current page.');
//     }

//     return invoices.rows;
//   } catch (error) {
//     console.error('Database Error:', error);
//     throw new Error('Failed to fetch invoices.');
//   }
// }


// This function fetches filtered invoices and their associated products


export async function fetchFilteredInvoices(
  query: string,
  currentPage: number,
  userEmail: string
) {
  noStore();

  const pageToFetch = query ? 1 : currentPage;
  const offset = (pageToFetch - 1) * ITEMS_PER_PAGE;

  try {
    // Fetch invoices data (no detailed products yet)
    const invoices = await sql<InvoicesTable>`
      SELECT
        invoices.id,
        invoices.id_tmp,
        invoices.amount,
        invoices.fecha_creado,
        invoices.fecha_para_pagar,
        invoices.status,
        customers.name,
        customers.email
      FROM invoices
      JOIN customers ON invoices.customer_id = customers.id
      WHERE
        (customers.name ILIKE ${`%${query}%`} OR
        customers.email ILIKE ${`%${query}%`} OR
        invoices.id::text ILIKE ${`%${query}%`} OR
        invoices.fecha_creado::text ILIKE ${`%${query}%`} OR
        invoices.status ILIKE ${`%${query}%`})
      ORDER BY invoices.id_tmp DESC
      LIMIT ${ITEMS_PER_PAGE} OFFSET ${offset}
    `;

    // Fetch products data separately
    const products = await sql`
      SELECT
        invoice_id,
        product_id,
        quantity,
        price
      FROM invoice_items
    `;

    // Process invoices and map products to each invoice
    const processedInvoices = invoices.rows.map((invoice) => {
      const invoiceProducts = products.rows.filter(
        (product) => product.invoice_id === invoice.id
      );

      return {
        ...invoice,
        products: invoiceProducts.map((product) => ({
          product_id: product.product_id,
          quantity: product.quantity,
          price: product.price,
        })),
      };
    });

    return processedInvoices;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch invoices.');
  }
}






export async function fetchInvoicesPages(query: string, userEmail: string) {
  noStore();
  
  try {
    const count = await sql`SELECT COUNT(*)
    FROM invoices
    JOIN customers ON invoices.customer_id = customers.id
    WHERE
      
      (customers.name ILIKE ${`%${query}%`} OR
      customers.email ILIKE ${`%${query}%`} OR
      invoices.amount::text ILIKE ${`%${query}%`} OR
      invoices.fecha_creado::text ILIKE ${`%${query}%`} OR
      invoices.status ILIKE ${`%${query}%`})
  `;

    const totalPages = Math.ceil(Number(count.rows[0].count) / ITEMS_PER_PAGE);
    return totalPages;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch total number of invoices.');
  }
}

export async function fetchInvoiceById(id: string, userEmail: string) {
  noStore();
  
  try {
    const data = await sql<InvoiceForm>`
      SELECT
        invoices.id,
        invoices.customer_id,
        invoices.amount,
        invoices.employee_id,
        invoices.modo_pago,
        invoices.usocliente_cdfi,
        invoices.regimenfiscal_cdfi,
        invoices.fecha_para_pagar,
        invoices.fecha_pago,
        invoices.fecha_creado,
        invoices.status
      FROM 
        invoices 
      JOIN 
        customers ON invoices.customer_id = customers.id
      WHERE 
        customers.email = ${userEmail} 
      AND
        invoices.id = ${id};  
    `;

    const invoice = data.rows.map((invoice) => ({
      ...invoice,
      // Convert amount from cents to dollars
      amount: invoice.amount / 100,
    }));
    
    return invoice[0];
  } catch (error) {
    console.error('Database Error:', error);
    // throw new Error('Failed to fetch invoice.');

    return false // we can't return an error, because it can break the not-found functionality at app\dashboard\invoices\[id]\edit\not-found.tsx
  }
}

export async function fetchCustomers(userEmail: string) {
  noStore();

  try {
    const data = await sql<CustomerField>`
      SELECT
        id,
        name
      FROM customers
      ORDER BY name ASC
    `;

    const customers = data.rows;
    return customers;
  } catch (err) {
    console.error('Database Error:', err);
    throw new Error('Failed to fetch all customers.');
  }
}

export async function fetchFilteredCustomers(query: string, currentPage: number, userEmail: string) {
  noStore();

  const offset = (currentPage - 1) * ITEMS_PER_PAGE;
  
  try {
    const data = await sql<CustomersTableType>`
      SELECT
        customers.id,
        customers.name,
        customers.email,
        customers.rfc,
        customers.direccion,
        customers.telefono,
        customers.tipo_cliente,
        customers.fecha_creado,
        COUNT(invoices.id) AS total_invoices,
        SUM(CASE WHEN invoices.status = 'Pendiente' THEN invoices.amount ELSE 0 END) AS total_pending,
        SUM(CASE WHEN invoices.status = 'Pagado' THEN invoices.amount ELSE 0 END) AS total_paid
      FROM customers
      LEFT JOIN invoices ON customers.id = invoices.customer_id
      WHERE
        (
          customers.name ILIKE ${`%${query}%`} OR
          customers.id::text ILIKE ${`%${query}%`} OR
          customers.email ILIKE ${`%${query}%`}
        )
      GROUP BY customers.id, customers.name, customers.email, customers.rfc, customers.direccion, customers.telefono, customers.tipo_cliente, customers.fecha_creado
      ORDER BY customers.fecha_creado ASC
      LIMIT ${ITEMS_PER_PAGE} OFFSET ${offset}
    `;

    const customers = data.rows.map((customer) => ({
      ...customer,
      total_pending: Number(customer.total_pending),
      total_paid: Number(customer.total_paid),
    }));

    return customers;
  } catch (err) {
    console.error('Database Error:', err);
    throw new Error('Failed to fetch customer table.');
  }
}


export async function fetchCustomersPages(query: string, userEmail: string) {
  noStore();
  
  try {
    const count = await sql`SELECT COUNT(*)
    FROM customers
    WHERE
      
      (customers.name ILIKE ${`%${query}%`} OR
      customers.email ILIKE ${`%${query}%`})
  `;

    const totalPages = Math.ceil(Number(count.rows[0].count) / ITEMS_PER_PAGE);
    return totalPages;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch total number of customers.');
  }
}

export async function fetchCustomerById(id: string, userEmail: string) {
  noStore();
  
  try {
    const customer = await sql<CustomerForm>`
      SELECT
        id, name, email, rfc, direccion, telefono, tipo_cliente, fecha_creado
      FROM customers
      WHERE
        id = ${id};
    `;

    return customer.rows[0];
  } catch (error) {
    console.error('Database Error:', error);
    // throw new Error('Failed to fetch customer.');

    return false // we can't return an error, because it can break the not-found functionality at app\dashboard\invoices\[id]\edit\not-found.tsx
  }
}


export async function fetchEmployees(userEmail: string) {
  noStore();

  try {
    const data = await sql<EmployeeField>`
      SELECT
        id,
        name
      FROM employees
      where employees.email = ${userEmail}
      ORDER BY name ASC
    `;

    const employees = data.rows;
    return employees;
  } catch (err) {
    console.error('Database Error:', err);
    throw new Error('Failed to fetch all employees.');
  }
}

export async function fetchFilteredEmployees(query: string, currentPage: number, userEmail: string) {
  noStore();

  const offset = (currentPage - 1) * ITEMS_PER_PAGE;
  
  try {
    const data = await sql<EmployeesTableType>`
      SELECT
        employees.id,
        employees.name,
        employees.email,
        employees.rfc, 
        employees.direccion,  
        employees.telefono,  
        employees.tipo_empleado,
        employees.fecha_creado,
        COUNT(invoices.id) AS total_invoices,  -- Cuenta el total de facturas asociadas
        SUM(CASE WHEN invoices.status = 'Pendiente' THEN invoices.amount ELSE 0 END) AS total_pending,
        SUM(CASE WHEN invoices.status = 'Pagado' THEN invoices.amount ELSE 0 END) AS total_paid
      FROM employees
      LEFT JOIN invoices ON employees.id = invoices.employee_id
      WHERE
        (employees.name ILIKE ${`%${query}%`} OR
        employees.tipo_empleado ILIKE ${`%${query}%`})
      GROUP BY 
        employees.id, 
        employees.name, 
        employees.email,
        employees.rfc,
        employees.direccion,
        employees.telefono,
        employees.tipo_empleado,
        employees.fecha_creado  -- Asegúrate de incluir todas las columnas de employees en el GROUP BY
      ORDER BY employees.fecha_creado DESC
      LIMIT ${ITEMS_PER_PAGE} OFFSET ${offset}
    `;

    const employees = data.rows.map((employee) => ({
      ...employee,
      total_invoices: Number(employee.total_invoices),  // Convierte total_invoices a un número
    }));

    console.log(employees);
    
    return employees;
  } catch (err) {
    console.error('Database Error:', err);
    throw new Error('Failed to fetch employee table.');
  }
}


export async function fetchEmployeesPages(query: string, userEmail: string) {
  noStore();
  
  try {
    const count = await sql`SELECT COUNT(*)
    FROM employees
    WHERE
      
      (employees.name ILIKE ${`%${query}%`} OR
      employees.email ILIKE ${`%${query}%`})
  `;

    const totalPages = Math.ceil(Number(count.rows[0].count) / ITEMS_PER_PAGE);
    return totalPages;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch total number of employees.');
  }
}

export async function fetchEmployeeById(id: string, userEmail: string) {
  noStore();
  
  try {
    const customer = await sql<EmployeeForm>`
      SELECT
        id, name, email, rfc, direccion, telefono, tipo_empleado, fecha_creado
      FROM employees
      WHERE
        id = ${id};
    `;

    return customer.rows[0];
  } catch (error) {
    console.error('Database Error:', error);
    // throw new Error('Failed to fetch customer.');

    return false // we can't return an error, because it can break the not-found functionality at app\dashboard\invoices\[id]\edit\not-found.tsx
  }
}


export async function getUser(userEmail: string) {
  noStore();
  
  try {
    const user = await sql`SELECT * FROM employees WHERE email = ${userEmail}`;
    return user.rows[0] as User;
  } catch (error) {
    console.error('Failed to fetch user:', error);
    throw new Error('Failed to fetch user.');
  }
}


export async function getUser1(userEmail: string) {
  noStore();
  
  try {
    const user = await sql`SELECT * FROM users WHERE email = ${userEmail}`;
    return user.rows[0] as User;
  } catch (error) {
    console.error('Failed to fetch user:', error);
    throw new Error('Failed to fetch user.');
  }
}
