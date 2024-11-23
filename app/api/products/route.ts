// /app/api/products/route.ts o /pages/api/products.ts

import { Product } from '@/app/lib/definitions'; // Asegúrate de tener un tipo para los productos
import { NextResponse } from 'next/server';

export async function GET() {
  // Aquí simulo que los productos provienen de una base de datos
  const products: Product[] = [
    { id: '1', name: 'Lámina de Acero Galvanizado', description: 'Lámina galvanizada de alta resistencia, ideal para techos y cubiertas.', price: 2700.0 },
    { id: '2', name: 'Placa de Acero A36', description: 'Placa de acero estructural, ideal para construcción y fabricación industrial.', price: 4500.0 },
    { id: '3', name: 'Perfil Tubular Rectangular (PTR)', description: 'PTR de acero para estructuras metálicas y proyectos de construcción.', price: 2200.0 },
    { id: '4', name: 'Varilla Corrugada', description: 'Varilla de acero corrugado para refuerzo en estructuras de concreto.', price: 160.0 },
    { id: '5', name: 'Tubo de Acero Inoxidable', description: 'Tubo inoxidable para aplicaciones industriales y decorativas.', price: 7200.0 },
    { id: '6', name: 'Ángulo de Acero', description: 'Ángulo laminado en caliente para uso estructural y decorativo.', price: 1800.0 },
    { id: '7', name: 'Canal de Acero C', description: 'Canal en forma de C utilizado en estructuras metálicas y fabricación industrial.', price: 3400.0 },
    { id: '8', name: 'Rollo de Acero Calibre 24', description: 'Rollo de acero de uso general, fácil de cortar y moldear.', price: 9800.0 },
    { id: '9', name: 'Solera de Acero', description: 'Solera plana para refuerzos estructurales y fabricación de maquinaria.', price: 950.0 },
    { id: '10', name: 'Tubo Conduit de Acero', description: 'Tubo para proteger cables eléctricos en instalaciones industriales.', price: 450.0 },
    { id: '11', name: 'Acero Redondo', description: 'Acero redondo laminado en caliente para estructuras y ejes mecánicos.', price: 1900.0 },
    { id: '12', name: 'Perfiles IPR', description: 'Perfiles en forma de I para vigas estructurales y soportes metálicos.', price: 8800.0 },
    { id: '13', name: 'Chapa de Acero Antideslizante', description: 'Chapa antideslizante para pisos industriales y rampas.', price: 3200.0 },
    { id: '14', name: 'Malla de Acero Soldada', description: 'Malla metálica para refuerzos en obras de concreto y cercados.', price: 1250.0 },
    { id: '15', name: 'Perfil HSS (Hollow Structural Section)', description: 'Perfil hueco estructural ideal para vigas y columnas.', price: 5400.0 },
    { id: '16', name: 'Tubería de Acero al Carbón', description: 'Tubería para sistemas de conducción de fluidos a alta presión.', price: 4100.0 },
    { id: '17', name: 'Alambre de Acero Galvanizado', description: 'Alambre de uso industrial y agrícola, resistente a la corrosión.', price: 850.0 },
    { id: '18', name: 'Panel Aislante de Acero', description: 'Panel para aislamiento térmico y acústico en construcciones.', price: 15500.0 },
    { id: '19', name: 'Placa de Acero Inoxidable 304', description: 'Placa inoxidable para fabricación de equipos industriales.', price: 12000.0 },
    { id: '20', name: 'Acero Corten', description: 'Acero resistente a la corrosión atmosférica, usado en diseño y arquitectura.', price: 7800.0 },
  ];
  

  // Retornamos la respuesta en formato JSON
  return NextResponse.json(products);
}
