'use client';

import {
  AtSymbolIcon,
  HomeModernIcon,
  UserCircleIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { Button } from '@/app/ui/button';
import { updateEmployee } from '@/app/lib/actions';
import { useFormState } from 'react-dom';
import { Employee } from '@/app/lib/definitions';
import { themeType } from '@/app/lib/theme';

export default function EditInvoiceForm({
  employee,
  userEmail,
  theme
}: {
  employee: Employee;
  userEmail: string;
  theme: themeType
}) {
  const updateEmployeeWithId = updateEmployee.bind(null, employee.id);
  const initialState = { message: null, errors: {} };
  const [state, dispatch] = useFormState(updateEmployeeWithId, initialState);

  return (
    <form action={dispatch}>
      <input type="hidden" name="userEmail" value={userEmail} />

      <div className={`rounded-md ${theme.container} p-4 md:p-6`}>
        <div className="mb-4">
          <label htmlFor="employee" className={`mb-2 block text-sm font-medium
            ${theme.text}
          `}>
            Name: 
          </label>
          <div className="relative">
            <input
              id="name"
              name="name"
              type="text"
              defaultValue={employee.name}
              placeholder="Type the employee name"
              className={`peer block w-full rounded-md border 
                py-2 pl-10 text-sm outline-2 placeholder:text-gray-500
                ${theme.border} ${theme.bg} ${theme.text}
              `}
              aria-describedby="name-error"
            />
            <UserCircleIcon className={`pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] 
              -translate-y-1/2 text-gray-500 ${theme.inputIcon}
            `}/>
          </div>
          <div id="name-error" aria-live="polite" aria-atomic="true">
            {state.errors?.name &&
              state.errors.name.map((error: string) => (
                <p className="mt-2 text-sm text-red-500" key={error}>
                  {error}
                </p>
              ))}
          </div>
        </div>

        <div className="mb-4">
          <label htmlFor="employee" className={`mb-2 block text-sm font-medium
            ${theme.text}
          `}>
            RFC: 
          </label>
          <div className="relative">
            <input
              id="rfc"
              name="rfc"
              type="text"
              defaultValue={employee.rfc}
              placeholder="Type the employee rfc"
              className={`peer block w-full rounded-md border 
                py-2 pl-10 text-sm outline-2 placeholder:text-gray-500
                ${theme.border} ${theme.bg} ${theme.text}
              `}
              aria-describedby="rfc-error"
            />
            <UserCircleIcon className={`pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] 
              -translate-y-1/2 text-gray-500 ${theme.inputIcon}
            `}/>
          </div>
          <div id="rfc-error" aria-live="polite" aria-atomic="true">
            {state.errors?.rfc &&
              state.errors.rfc.map((error: string) => (
                <p className="mt-2 text-sm text-red-500" key={error}>
                  {error}
                </p>
              ))}
          </div>
        </div>

        <div className="mb-4">
          <label htmlFor="employee" className={`mb-2 block text-sm font-medium
            ${theme.text}
          `}>
            Telefono: 
          </label>
          <div className="relative">
            <input
              id="telefono"
              name="telefono"
              type="text"
              defaultValue={employee.telefono}
              placeholder="Type the employee telefono"
              className={`peer block w-full rounded-md border 
                py-2 pl-10 text-sm outline-2 placeholder:text-gray-500
                ${theme.border} ${theme.bg} ${theme.text}
              `}
              aria-describedby="telefono-error"
            />
            <UserCircleIcon className={`pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] 
              -translate-y-1/2 text-gray-500 ${theme.inputIcon}
            `}/>
          </div>
          <div id="telefono-error" aria-live="polite" aria-atomic="true">
            {state.errors?.telefono &&
              state.errors.telefono.map((error: string) => (
                <p className="mt-2 text-sm text-red-500" key={error}>
                  {error}
                </p>
              ))}
          </div>
        </div>

        <div className="mb-4">
          <label htmlFor="employee" className={`mb-2 block text-sm font-medium
            ${theme.text}
          `}>
            Direccion: 
          </label>
          <div className="relative">
            <input
              id="direccion"
              name="direccion"
              type="text"
              defaultValue={employee.direccion}
              placeholder="Type the employee direccion"
              className={`peer block w-full rounded-md border 
                py-2 pl-10 text-sm outline-2 placeholder:text-gray-500
                ${theme.border} ${theme.bg} ${theme.text}
              `}
              aria-describedby="direccion-error"
            />
            <UserCircleIcon className={`pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] 
              -translate-y-1/2 text-gray-500 ${theme.inputIcon}
            `}/>
          </div>
          <div id="direccion-error" aria-live="polite" aria-atomic="true">
            {state.errors?.direccion &&
              state.errors.direccion.map((error: string) => (
                <p className="mt-2 text-sm text-red-500" key={error}>
                  {error}
                </p>
              ))}
          </div>
        </div>

        {/* Invoice Amount */}
        <div className="mb-4">
          <label htmlFor="amount" className={`mb-2 block text-sm font-medium
            ${theme.text}
          `}>
            Email
          </label>
          <div className="relative mt-2 rounded-md">
            <div className="relative">
              <input
                id="email"
                name="email"
                type="mail"
                defaultValue={employee.email}
                placeholder="Enter the employee email"
                className={`peer block w-full rounded-md border 
                  py-2 pl-10 text-sm outline-2 placeholder:text-gray-500
                  ${theme.border} ${theme.bg} ${theme.text}
                `}
                aria-describedby="email-error"
              />
              <AtSymbolIcon className={`pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] 
                -translate-y-1/2 text-gray-500 peer-focus:text-gray-900
                ${theme.inputIcon}
              `}/>
            </div>
            <div id="amount-error" aria-live="polite" aria-atomic="true">
              {state.errors?.email &&
                state.errors.email.map((error: string) => (
                  <p className="mt-2 text-sm text-red-500" key={error}>
                    {error}
                  </p>
                ))}
            </div>
          </div>
        </div>

        
        {/* Invoice Status */}
        <fieldset>
          <legend className={`mb-2 block text-sm font-medium ${theme.text}`}>
            Selecciona el tipo de empleado
          </legend>
          <div className={`rounded-md border px-[14px] py-3
            ${theme.bg} ${theme.border}
          `}>
            <div className="flex gap-4">
              <div className="flex items-center">
                <input
                  id="normal"
                  name="tipo_empleado"
                  type="radio"
                  value="Normal"
                  defaultChecked={employee.tipo_empleado === 'Auxiliar'}
                  className={`h-4 w-4 cursor-pointer 
                    text-gray-600 focus:ring-2 ${theme.container} ${theme.border}
                  `}
                  aria-describedby="tipo_empleado-error"
                />
                <label
                  htmlFor="normal"
                  className={`ml-2 flex cursor-pointer items-center gap-1.5 rounded-full 
                  px-3 py-1.5 text-xs font-medium text-gray-600
                    ${theme.container} ${theme.border} ${theme.text}
                  `}
                >
                  Normal <UserIcon className="h-4 w-4" />
                </label>
              </div>
              <div className="flex items-center">
                <input
                  id="asociado"
                  name="tipo_empleado"
                  type="radio"
                  value="Asociado"
                  defaultChecked={employee.tipo_empleado === "Auxiliar"}
                  className={`h-4 w-4 cursor-pointer 
                    text-gray-600 focus:ring-2 ${theme.container} ${theme.border}
                  `}
                  aria-describedby="tipo_empleado-error"
                />
                <label
                  htmlFor="asociado"
                  className={`ml-2 flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-gray-600 ${theme.container} ${theme.border} ${theme.text}`}
                >
                  Asociado <HomeModernIcon className="h-4 w-4" />
                </label>
              </div>
            </div>
          </div>
          <div id="tipo_empleado-error" aria-live="polite" aria-atomic="true">
            {state.errors?.tipo_empleado &&
              state.errors.tipo_empleado.map((error: string) => (
                <p className="mt-2 text-sm text-red-500" key={error}>
                  {error}
                </p>
              ))}
          </div>
        </fieldset>


        {state?.message && (
          <p className="mt-2 text-sm text-red-500"  key={state.message}>
            {state.message}
          </p>
        )}
      </div>
      <div className="mt-6 flex justify-end gap-4">
        <Link
          href="/dashboard/employees"
          className={`
            flex h-10 items-center rounded-lg px-4 text-sm font-medium 
            transition-colors
            ${theme.container} ${theme.border} ${theme.text}
            ${theme.hoverBg} ${theme.hoverText}
          `}
        >
          Cancel
        </Link>
        <Button type="submit">Update Employee</Button>
      </div>
    </form>
  );
}
