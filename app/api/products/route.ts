// /app/api/products/route.ts o /pages/api/products.ts

import { Product } from '@/app/lib/definitions'; // Asegúrate de tener un tipo para los productos
import { NextResponse } from 'next/server';

export async function GET() {
  // Aquí simulo que los productos provienen de una base de datos
  const products: Product[] = [
    { id: '1', name: 'Product 1', description: "HOLA QUE TAL", price: 100.0 },
    { id: '2', name: 'Product 2', description: "HOLA QUE TAL", price: 150.0 },
    { id: '3', name: 'Product 3', description: "HOLA QUE TAL", price: 200.0 },
  ];

  // Retornamos la respuesta en formato JSON
  return NextResponse.json(products);
}
