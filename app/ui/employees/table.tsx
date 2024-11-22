"use client";

import React, { useState } from 'react';  
import Search from '@/app/ui/search';  
import { fetchFilteredCustomers } from '@/app/lib/data';  
import { CreateCustomer, CreateEmployee, DeleteCustomer, DeleteEmployee, UpdateCustomer, UpdateEmployee, ViewDetailsCustomer, ViewDetailsEmployee } from '../invoices/buttons';  
import { auth } from '@/auth';  
import { themeType } from '@/app/lib/theme';  
import { Customer, Employee } from '@/app/lib/definitions';
import { formatCurrency } from '@/app/lib/utils';
import { EmployeeDetailsModal } from './modal';

export default function EmployeesTable({  
  employees,
  theme  
}: {  
  employees: Employee[];
  theme: themeType;  
}) {  

  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  const openModal = (employee: Employee) => setSelectedEmployee(employee);
  const closeModal = () => setSelectedEmployee(null);


  return (
    <div className="w-full">
      <div className="mt-4 flex items-center justify-between gap-2 md:mt-8">
        <Search placeholder="Search employees..." theme={theme} />
        <CreateEmployee />
      </div>

      <div className="mt-6 flow-root">
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full align-middle">
            <div className={`
              overflow-hidden rounded-md ${theme.container}
              p-2 md:pt-0
            `}>
              <div className="md:hidden">
                {employees?.map((employee) => (
                  <div
                    key={employee.id}
                    className={`
                      mb-2 w-full ${theme.bg} p-4
                    `}>
                    <div className="flex items-center justify-between border-b pb-4">
                      <div>
                        <div className="mb-2 flex items-center">
                          <div className="flex items-center gap-3">
                            <p className={`${theme.title}`}>{employee.name}</p>
                          </div>
                        </div>
                        <p className="text-sm text-gray-500">
                          {employee.tipo_empleado}
                        </p>
                        <p className="text-sm text-gray-500">
                          {employee.telefono}
                        </p>
                      </div>
                    </div>
                    <div className={`pt-4 text-sm ${theme.title}`}>
                      <p>{employee.total_invoices} invoices</p>
                    </div>
                    <div className="flex justify-end gap-2">
                      <ViewDetailsEmployee
                        id={employee.id}
                        onOpen={() => openModal(employee)}
                        theme={theme}
                      />
                      <UpdateEmployee id={employee.id} theme={theme} />
                      <DeleteEmployee disabled={false} id={employee.id} theme={theme} />
                    </div>
                  </div>
                ))}
              </div>
              <table className={`
                hidden min-w-full rounded-md ${theme.text} md:table
              `}>
                <thead className={`
                  ${theme.container}
                  text-left text-sm font-normal
                `}>
                  <tr>
                    <th scope="col" className="px-4 py-5 font-medium sm:pl-6">
                      Id Empleado
                    </th>
                    <th scope="col" className="px-3 py-5 font-medium">
                      Name
                    </th>
                    <th scope="col" className="px-3 py-5 font-medium">
                      Cargo
                    </th>
                    <th scope="col" className="px-3 py-5 font-medium">
                      Telefono
                    </th>
                    <th scope="col" className="px-4 py-5 font-medium">
                      Total invoices made
                    </th>
                  </tr>
                </thead>

                <tbody className={`
                  divide-y ${theme.divide} 
                  ${theme.text}
                `}>
                  {employees.map((employee) => (
                    <tr key={employee.id} className="group">
                      <td className={`
                        whitespace-nowrap ${theme.bg} py-5 pl-4 pr-3 text-sm 
                        ${theme.title} sm:pl-6 rounded-l-md
                      `}>
                        <div className="flex items-center gap-3">
                          <p>{employee.id}</p>
                        </div>
                      </td>
                      <td className={`
                        whitespace-nowrap ${theme.bg} py-5 pl-4 pr-3 text-sm 
                        ${theme.title} sm:pl-6 rounded-l-md
                      `}>
                        <div className="flex items-center gap-3">
                          <p>{employee.name}</p>
                        </div>
                      </td>
                      <td className={`
                        whitespace-nowrap ${theme.bg} ${theme.text} px-4 py-5 text-sm        
                      `}>
                        {employee.tipo_empleado}
                      </td>
                      <td className={`
                        whitespace-nowrap ${theme.bg} px-4 py-5 text-sm ${theme.text}   
                      `}>
                        {employee.telefono}
                      </td>
                      <td className={`whitespace-nowrap ${theme.bg} px-4 py-5 
                        ${theme.text}  
                        `}>
                        {employee.total_invoices}
                      </td>
                      <td className={`whitespace-nowrap py-3 pl-6 pr-3 ${theme.bg} rounded-r-md`}>
                        <div className="flex justify-end gap-3">
                          <ViewDetailsEmployee
                            id={employee.id}
                            onOpen={() => openModal(employee)}
                            theme={theme}
                          />
                          <UpdateEmployee id={employee.id} theme={theme} />
                          <DeleteEmployee disabled={false} id={employee.id} theme={theme} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      {/* Modal */}
      {selectedEmployee && (
        <EmployeeDetailsModal employee={selectedEmployee} onClose={closeModal} />
      )}
    </div>
  );
}


