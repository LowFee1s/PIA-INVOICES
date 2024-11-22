'use client';

import { useState, useEffect } from 'react';
import { CustomerField } from '@/app/lib/definitions';
import Link from 'next/link';
import {
  CheckIcon,
  ClockIcon,
  CurrencyDollarIcon,
  UserCircleIcon,
  PlusIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@/app/ui/button';
import { createInvoice } from '@/app/lib/actions';
import { useFormState } from 'react-dom';
import { themeType } from '@/app/lib/theme';

type Product = {
  id: string;
  name: string;
  price: number;
};

export default function Form({ 
  customers,
  theme,
}: { 
  customers: CustomerField[];
  theme: themeType;
}) {
  const initialState = { message: null, errors: {} };
  const [state, dispatch] = useFormState(createInvoice, initialState);
  const [isPaid, setIsPaid] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [total, setTotal] = useState(0);
  const [products, setProducts] = useState<Product[]>([]); // Estado para productos

  // Cargar los productos desde la API
  useEffect(() => {
    const fetchProducts = async () => {
      const response = await fetch('/api/products');
      if (response.ok) {
        const data: Product[] = await response.json();
        setProducts(data);
      } else {
        console.error('Failed to fetch products');
      }
    };

    fetchProducts();
  }, []);

  const handleStatusChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsPaid(e.target.value === 'Pagado');
  };

  const handleAddProduct = () => {
    if (!selectedProductId) return;
    const product = products.find((p) => p.id === selectedProductId);
    if (product) {
      setSelectedProducts((prev) => [...prev, product]);
      setTotal((prev) => prev + product.price);
    }
    setSelectedProductId('');
  };

  const handleRemoveProduct = (index: number) => {
    const product = selectedProducts[index];
    if (product) {
      setSelectedProducts((prev) => prev.filter((_, i) => i !== index));
      setTotal((prev) => prev - product.price);
    }
  };

  return (
    <form action={dispatch}>
      <div className={`rounded-md ${theme.container} p-4 md:p-6`}>
        {/* Customer Name */}
        <div className="mb-4">
          <label
            htmlFor="customer"
            className={`mb-2 block text-sm font-medium ${theme.text}`}
          >
            Choose customer
          </label>
          <div className="relative">
            <select
              id="customer"
              name="customerId"
              className={`peer block w-full cursor-pointer rounded-md border 
                py-2 pl-10 text-sm outline-2 placeholder:text-gray-500
                ${theme.border} ${theme.bg} ${theme.text}`}
              defaultValue=""
              aria-describedby="customer-error"
            >
              <option value="" disabled>
                Select a customer
              </option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </select>
            <UserCircleIcon
              className={`pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] 
              -translate-y-1/2 text-gray-500 ${theme.inputIcon}`}
            />
          </div>
          <div id="customer-error" aria-live="polite" aria-atomic="true">
            {state.errors?.customerId &&
              state.errors.customerId.map((error: string) => (
                <p className="mt-2 text-sm text-red-500" key={error}>
                  {error}
                </p>
              ))}
          </div>
        </div>

          {/* Invoice Amount
          <div className="mb-4">
          <label
            htmlFor="amount"
            className={`mb-2 block text-sm font-medium ${theme.text}`}
          >
            Choose an amount
          </label>
          <div className="relative mt-2 rounded-md">
            <input
              id="amount"
              name="amount"
              type="number"
              step="0.01"
              placeholder="Enter USD amount"
              className={`peer block w-full rounded-md border 
                py-2 pl-10 text-sm outline-2 placeholder:text-gray-500
                ${theme.border} ${theme.bg} ${theme.text}`}
              aria-describedby="amount-error"
            />
            <CurrencyDollarIcon
              className={`pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] 
              -translate-y-1/2 text-gray-500 ${theme.inputIcon}`}
            />
          </div>
          <div id="amount-error" aria-live="polite" aria-atomic="true">
            {state.errors?.amount &&
              state.errors.amount.map((error: string) => (
                <p className="mt-2 text-sm text-red-500" key={error}>
                  {error}
                </p>
              ))}
          </div>
        </div> */}

        {/* Product Selection */}
        <div className="mb-4">
          <label
            htmlFor="products"
            className={`mb-2 block text-sm font-medium ${theme.text}`}
          >
            Add Products
          </label>
          <div className="flex items-center gap-2">
            <select
              id="products"
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className={`peer block w-full cursor-pointer rounded-md border 
                py-2 text-sm outline-2 placeholder:text-gray-500
                ${theme.border} ${theme.bg} ${theme.text}`}
            >
              <option value="" disabled>
                Select a product
              </option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} - ${product.price.toFixed(2)}
                </option>
              ))}
            </select>
            <Button type="button" onClick={handleAddProduct}>
              <PlusIcon className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Selected Products Table */}
        {selectedProducts.length > 0 && (
          <div className="mb-4">
            <h3 className={`mb-2 text-sm font-medium ${theme.text}`}>Invoice Items</h3>
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className={`border-b ${theme.border}`}>
                  <th className="py-2 text-left">Product</th>
                  <th className="py-2 text-right">Price</th>
                  <th className="py-2 text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {selectedProducts.map((product, index) => (
                  <tr key={index} className={`border-b ${theme.border}`}>
                    <td className="py-2">{product.name}</td>
                    <td className="py-2 text-right">${product.price.toFixed(2)}</td>
                    <td className="py-2 text-center">
                      <Button
                        type="button"
                        onClick={() => handleRemoveProduct(index)}
                        className="text-red-500"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-4 text-right">
              <p className={`text-lg font-bold ${theme.text}`}>
                Total: ${total.toFixed(2)}
              </p>
            </div>
          </div>
        )}

        {/* Invoice Status */}
        <fieldset>
          <legend className={`mb-2 block text-sm font-medium ${theme.text}`}>
            Set the invoice status
          </legend>
          <div className={`rounded-md border px-[14px] py-3 ${theme.bg} ${theme.border}`}>
            <div className="flex gap-4">
              <div className="flex items-center">
                <input
                  id="pendiente"
                  name="status"
                  type="radio"
                  value="Pendiente"
                  className={`h-4 w-4 cursor-pointer text-gray-600 focus:ring-2 ${theme.container} ${theme.border}`}
                  aria-describedby="status-error"
                  onChange={handleStatusChange}
                />
                <label
                  htmlFor="pendiente"
                  className={`ml-2 flex cursor-pointer items-center gap-1.5 rounded-full 
                  px-3 py-1.5 text-xs font-medium text-gray-600 ${theme.container} ${theme.border} ${theme.text}`}
                >
                  Pendiente <ClockIcon className="h-4 w-4" />
                </label>
              </div>
              <div className="flex items-center">
                <input
                  id="pagado"
                  name="status"
                  type="radio"
                  value="Pagado"
                  className={`h-4 w-4 cursor-pointer text-gray-600 focus:ring-2 ${theme.container} ${theme.border}`}
                  aria-describedby="status-error"
                  onChange={handleStatusChange}
                />
                <label
                  htmlFor="pagado"
                  className="ml-2 flex cursor-pointer items-center gap-1.5 rounded-full bg-green-500 px-3 py-1.5 text-xs font-medium text-white"
                >
                  Pagado <CheckIcon className="h-4 w-4" />
                </label>
              </div>
            </div>
          </div>
          <div id="status-error" aria-live="polite" aria-atomic="true">
            {state.errors?.status &&
              state.errors.status.map((error: string) => (
                <p className="mt-2 text-sm text-red-500" key={error}>
                  {error}
                </p>
              ))}
          </div>
        </fieldset>

        {/* Additional Fields for "Pagado" */}
          {isPaid && (
          <div className="mt-4 space-y-4">
            {/* Uso de Factura */}
            <div>
              <label htmlFor="uso_factura" className={`mb-2 block text-sm font-medium ${theme.text}`}>
                Uso de Factura
              </label>
              <select
                id="uso_factura"
                name="uso_factura"
                className={`peer block w-full cursor-pointer rounded-md border 
                  py-2 text-sm outline-2 placeholder:text-gray-500
                  ${theme.border} ${theme.bg} ${theme.text}`}
              >
                <option value="Gastos Generales">Gastos Generales</option>
                <option value="Compra de Materia Prima">Compra de Materia Prima</option>
                <option value="Equipo de Transporte">Equipo de Transporte</option>
              </select>
            </div>

            {/* Régimen Fiscal */}
            <div>
              <label htmlFor="regimen_fiscal" className={`mb-2 block text-sm font-medium ${theme.text}`}>
                Régimen Fiscal
              </label>
              <select
                id="regimen_fiscal"
                name="regimen_fiscal"
                className={`peer block w-full cursor-pointer rounded-md border 
                  py-2 text-sm outline-2 placeholder:text-gray-500
                  ${theme.border} ${theme.bg} ${theme.text}`}
              >
                <option value="Persona Física">Persona Física</option>
                <option value="Persona Moral">Persona Moral</option>
              </select>
            </div>

            {/* Método de Pago */}
            <div>
              <label htmlFor="metodo_pago" className={`mb-2 block text-sm font-medium ${theme.text}`}>
                Método de Pago
              </label>
              <select
                id="metodo_pago"
                name="metodo_pago"
                className={`peer block w-full cursor-pointer rounded-md border 
                  py-2 text-sm outline-2 placeholder:text-gray-500
                  ${theme.border} ${theme.bg} ${theme.text}`}
              >
                <option value="Tarjeta de Débito">Tarjeta de Credito/Debito</option>
                <option value="Efectivo">Efectivo</option>
              </select>
            </div>
          </div>
        )}

      </div>

      <div className="mt-6 flex justify-end gap-4">
        <Link
          href="/dashboard/invoices"
          className={`flex h-10 items-center rounded-lg px-4 text-sm font-medium 
            ${theme.container} ${theme.border} ${theme.text}
            ${theme.hoverBg} ${theme.hoverText}`}
        >
          Cancel
        </Link>
        <Button type="submit">Create Invoice</Button>
      </div>
    </form>
  );
}






