'use client';

import { CustomerField } from '@/app/lib/definitions';
import Link from 'next/link';
import {
  ArchiveBoxIcon,
  AtSymbolIcon,
  BuildingOffice2Icon,
  CheckIcon,
  ClockIcon,
  HomeModernIcon,
  UserCircleIcon,
  UserIcon,
  WrenchIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@/app/ui/button';
import { createEmployee } from '@/app/lib/actions';
import { useFormState } from 'react-dom';
import { themeType } from '@/app/lib/theme';
import { useState } from 'react';
import Image from 'next/image';

export default function Form({ 
  userEmail,
  theme
} : { 
  userEmail: string;
  theme: themeType;
}) {

  const initialState = { message: null, errors: {} };
  const [state, dispatch] = useFormState(createEmployee, initialState);
  const [fotoBase64, setFotoBase64] = useState<string | null>(null);

  const uploadImage = (file) => {
    console.log('Archivo:', file);  // Verifica si el archivo está bien
  
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'piaimage');
    formData.append('folder', 'perfil');
    formData.append('resource_type', 'image');
    
    const cloudinaryUrl = 'https://api.cloudinary.com/v1_1/drn7ynbiq/upload';
    
    fetch(cloudinaryUrl, {
      method: 'POST',
      body: formData,
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.secure_url) {
          console.log('Imagen subida con éxito:', data.secure_url);
          // Usa esta URL para guardarla en tu base de datos o mostrar la imagen
          setFotoBase64(data.secure_url);
        } else {
          console.log('Error al subir la imagen:', data);
        }
      })
      .catch((error) => {
        console.error('Error al subir la imagen:', error);
      });
  };
  
  
  // Manejador para el cambio de archivo en un input
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      uploadImage(file); // Subir la imagen
    }
  };
  
  return (
    <form action={dispatch}>
      <input type="hidden" name="userEmail" value={userEmail} />
      <input type="hidden" name="photo" value={fotoBase64 || ""} />

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
          <label htmlFor="rfc" className={`mb-2 block text-sm font-medium
            ${theme.text}
          `}>
            RFC: 
          </label>
          <div className="relative">
            <input
              id="rfc"
              name="rfc"
              type="text"
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
          <label htmlFor="telefono" className={`mb-2 block text-sm font-medium
            ${theme.text}
          `}>
            Telefono: 
          </label>
          <div className="relative">
            <input
              id="telefono"
              name="telefono"
              type="text"
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
          <label htmlFor="direccion" className={`mb-2 block text-sm font-medium
            ${theme.text}
          `}>
            Direccion: 
          </label>
          <div className="relative">
            <input
              id="direccion"
              name="direccion"
              type="text"
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
          <label htmlFor="email" className={`mb-2 block text-sm font-medium
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
            <div id="email-error" aria-live="polite" aria-atomic="true">
              {state.errors?.email &&
                state.errors.email.map((error: string) => (
                  <p className="mt-2 text-sm text-red-500" key={error}>
                    {error}
                  </p>
                ))}
            </div>
          </div>
        </div>

        <div className="mb-4">
          <label htmlFor="password" className={`mb-2 block text-sm font-medium
            ${theme.text}
          `}>
            Password
          </label>
          <div className="relative mt-2 rounded-md">
            <div className="relative">
              <input
                id="password"
                name="password"
                type="password"
                placeholder="Enter the employee password"
                className={`peer block w-full rounded-md border 
                  py-2 pl-10 text-sm outline-2 placeholder:text-gray-500
                  ${theme.border} ${theme.bg} ${theme.text}
                `}
                aria-describedby="password-error"
              />
              <AtSymbolIcon className={`pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] 
                -translate-y-1/2 text-gray-500 peer-focus:text-gray-900
                ${theme.inputIcon}
              `}/>
            </div>
            <div id="password-error" aria-live="polite" aria-atomic="true">
              {state.errors?.password &&
                state.errors.password.map((error: string) => (
                  <p className="mt-2 text-sm text-red-500" key={error}>
                    {error}
                  </p>
                ))}
            </div>
          </div>
        </div>

        <div className="mb-4">
          <label htmlFor="confirm-password" className={`mb-2 block text-sm font-medium
            ${theme.text}
          `}>
            Confirm Password
          </label>
          <div className="relative mt-2 rounded-md">
            <div className="relative">
              <input
                id="confirm-password"
                name="confirm-password"
                type="password"
                placeholder="Confirm the employee password"
                className={`peer block w-full rounded-md border 
                  py-2 pl-10 text-sm outline-2 placeholder:text-gray-500
                  ${theme.border} ${theme.bg} ${theme.text}
                `}
                aria-describedby="confirm-password-error"
              />
              <AtSymbolIcon className={`pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] 
                -translate-y-1/2 text-gray-500 peer-focus:text-gray-900
                ${theme.inputIcon}
              `}/>
            </div>
            <div id="confirm-password-error" aria-live="polite" aria-atomic="true">
              {state.errors?.confirmPassword &&
                state.errors.confirmPassword.map((error: string) => (
                  <p className="mt-2 text-sm text-red-500" key={error}>
                    {error}
                  </p>
                ))}
            </div>
          </div>
        </div>

        <div className="mb-4">
          <label htmlFor="foto" className={`mb-2 block text-sm font-medium ${theme.text}`}>
            Foto:
          </label>
          <div className="relative">
            <input
              id="foto"
              name="foto"
              type="file"
              accept="image/*"
              className={`peer block w-full rounded-md border py-2 pl-10 text-sm outline-2 placeholder:text-gray-500 ${theme.border} ${theme.bg} ${theme.text}`}
              aria-describedby="foto-error"
              onChange={handleFileChange}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
              {fotoBase64 ? (
                <img
                 src={fotoBase64}
                 alt="Vista previa"
                 className="w-40 h-40 rounded-full object-cover"
                />
              ) : (
                <UserCircleIcon className="h-6 w-6 text-gray-500" />
              )}
            </div>
          </div>
          <div id="foto-error" aria-live="polite" aria-atomic="true">
            {state.errors?.photo &&
              state.errors.photo.map((error: string) => (
                <p className="mt-2 text-sm text-red-500" key={error}>
                  {error}
                </p>
              ))}
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
                  id="supervisor"
                  name="tipo_empleado"
                  type="radio"
                  value="Supervisor"
                  className={`h-4 w-4 cursor-pointer 
                    text-gray-600 focus:ring-2 ${theme.container} ${theme.border}
                  `}
                  aria-describedby="tipo_empleado-error"
                />
                <label
                  htmlFor="supervisor"
                  className={`ml-2 flex cursor-pointer items-center gap-1.5 rounded-full 
                  px-3 py-1.5 text-xs font-medium text-gray-600
                    ${theme.container} ${theme.border} ${theme.text}
                  `}
                >
                  Supervisor <UserIcon className="h-4 w-4" />
                </label>
              </div>
              <div className="flex items-center">
                <input
                  id="jefe-de-area"
                  name="tipo_empleado"
                  type="radio"
                  value="Jefe de area"
                  className={`h-4 w-4 cursor-pointer 
                    text-gray-600 focus:ring-2 ${theme.container} ${theme.border}
                  `}
                  aria-describedby="tipo_empleado-error"
                />
                <label
                  htmlFor="jefe-de-area"
                  className={`ml-2 flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-gray-600 ${theme.container} ${theme.border} ${theme.text}`}
                >
                  Jefe de area <HomeModernIcon className="h-4 w-4" />
                </label>
              </div>
              <div className="flex items-center">
                <input
                  id="asistente-de-inventario"
                  name="tipo_empleado"
                  type="radio"
                  value="Asistente de Inventario"
                  className={`h-4 w-4 cursor-pointer 
                    text-gray-600 focus:ring-2 ${theme.container} ${theme.border}
                  `}
                  aria-describedby="tipo_empleado-error"
                />
                <label
                  htmlFor="asistente-de-inventario"
                  className={`ml-2 flex cursor-pointer items-center gap-1.5 rounded-full 
                  px-3 py-1.5 text-xs font-medium text-gray-600
                    ${theme.container} ${theme.border} ${theme.text}
                  `}
                >
                  Asistente de Inventario <ArchiveBoxIcon className="h-4 w-4" />
                </label>
              </div>
              <div className="flex items-center">
                <input
                  id="gerente-de-la-planta-principal"
                  name="tipo_empleado"
                  type="radio"
                  value="Gerente de la planta principal"
                  className={`h-4 w-4 cursor-pointer 
                    text-gray-600 focus:ring-2 ${theme.container} ${theme.border}
                  `}
                  aria-describedby="tipo_empleado-error"
                />
                <label
                  htmlFor="gerente-de-la-planta-principal"
                  className={`ml-2 flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-gray-600 ${theme.container} ${theme.border} ${theme.text}`}
                >
                  Gerente de la planta principal <BuildingOffice2Icon className="h-4 w-4" />
                </label>
              </div>
              <div className="flex items-center">
                <input
                  id="auxiliar"
                  name="tipo_empleado"
                  type="radio"
                  value="Auxiliar"
                  className={`h-4 w-4 cursor-pointer 
                    text-gray-600 focus:ring-2 ${theme.container} ${theme.border}
                  `}
                  aria-describedby="tipo_empleado-error"
                />
                <label
                  htmlFor="auxiliar"
                  className={`ml-2 flex cursor-pointer items-center gap-1.5 rounded-full 
                  px-3 py-1.5 text-xs font-medium text-gray-600
                    ${theme.container} ${theme.border} ${theme.text}
                  `}
                >
                  Auxiliar <WrenchIcon className="h-4 w-4" />
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


        {state.message && (
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
        <Button type="submit">Create Employee</Button>
      </div>
    </form>
  );
}
