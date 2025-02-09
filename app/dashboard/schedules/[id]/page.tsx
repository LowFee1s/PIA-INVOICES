import { fetchEmployeeSchedules, getUser } from '@/app/lib/data';
import { useRouter } from 'next/router';
import { lusitana } from '@/app/ui/fonts';
import { InvoicesTableSkeleton } from '@/app/ui/skeletons';
import { systemDefault, darkTheme, lightTheme, themeType } from '@/app/lib/theme';
import { auth } from '@/auth';
import { Suspense } from 'react';

export const metadata = {
  title: 'Employee Schedule Details',
};

export default async function EmployeeSchedulePage({ params }) {
  const { id } = params;
  const session = await auth();
  const userEmail = session?.user?.email!;
  const schedules = await fetchEmployeeSchedules(id, userEmail);

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
    <div className="w-full">
      <div className="flex w-full items-center justify-between">
        <h1 className={`${lusitana.className} text-2xl ${theme.title}`}>Schedules for Employee</h1>
      </div>
      <Suspense fallback={<InvoicesTableSkeleton theme={theme} />}>
        <div className="mt-4 space-y-2">
          <h2 className="text-lg font-bold">Schedules</h2>
          {schedules.length > 0 ? (
            schedules.map((schedule) => (
              <div key={schedule.id} className="flex justify-between">
                <p>
                  {/* Validar si la fecha es válida antes de mostrar */}
                  {schedule.date ? new Date(schedule.date).toLocaleString() : 'No date available'} - 
                  {schedule.check_in ? new Date(schedule.check_in).toLocaleString() : 'No check-in time'} - 
                  {schedule.check_out ? new Date(schedule.check_out).toLocaleString() : 'No check-out time'}
                </p>
              </div>
            ))
          ) : (
            <p>No schedules found for this employee</p>
          )}
        </div>
      </Suspense>
    </div>
  );
}
