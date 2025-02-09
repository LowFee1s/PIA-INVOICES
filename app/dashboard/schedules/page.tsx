import { lusitana } from '@/app/ui/fonts';
import { InvoicesTableSkeleton } from '@/app/ui/skeletons';
import { Suspense } from 'react';
import { Metadata } from 'next'; 
import { systemDefault, darkTheme, lightTheme, themeType } from '@/app/lib/theme';
import { fetchEmployeesAll, getUser } from '@/app/lib/data';
import { auth } from '@/auth';

export const metadata = {
  title: 'Employee Schedules',
};

export default async function SchedulesPage() {
  const session = await auth();
  const userEmail = session?.user?.email!;
  const employees = await fetchEmployeesAll();

  const user = await getUser(userEmail);
  let theme: themeType;

  switch(user.theme) {
    case 'system':
      theme = systemDefault;
      break;
    case 'dark':
      theme = darkTheme;
      break;
    case 'light':
      theme = lightTheme;
      break;
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className={`${lusitana.className} text-3xl font-semibold text-gray-800`}>
          Employee Schedules
        </h1>
      </div>

      <Suspense fallback={<InvoicesTableSkeleton theme={theme} />}>
        <div className="space-y-6">
          {employees.map((employee) => (
            <div
              key={employee.id}
              className="bg-white shadow-lg rounded-lg p-4 hover:shadow-xl transition-shadow duration-300"
            >
              <a
                href={`/dashboard/schedules/${employee.id}`}
                className="block text-lg font-medium text-blue-600 hover:text-blue-800 transition-colors duration-200"
              >
                <div className="flex justify-between items-center">
                  <div className="flex flex-col space-y-1">
                    <span className="text-xl font-semibold">{employee.name}</span>
                    <span className="text-sm text-gray-500">{employee.tipo_empleado}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">{employee.id}</span>
                  </div>
                </div>
              </a>
            </div>
          ))}
        </div>
      </Suspense>
    </div>
  );
}
