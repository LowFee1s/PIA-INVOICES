import Form from '@/app/ui/employees/edit-form';
import Breadcrumbs from '@/app/ui/invoices/breadcrumbs';
import { fetchEmployeeById, getUser } from '@/app/lib/data';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { auth } from '@/auth';
import { darkTheme, lightTheme, systemDefault, themeType } from '@/app/lib/theme';

export const metadata: Metadata = {
  title: 'Edit Employee',
};
 
export default async function Page({ params }: { params: { id: string } }) {
  const id = params.id;
  const session = await auth();
  const userEmail = session?.user?.email!;

  const employee = await fetchEmployeeById(id, userEmail);

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

  if (!employee) {
    return notFound();
  }
  
  return (
    <main>
      <Breadcrumbs
        breadcrumbs={[
          { label: 'Employees', href: '/dashboard/employees' },
          {
            label: 'Edit Employees',
            href: `/dashboard/employees/${id}/edit`,
            active: true,
          },
        ]}
        theme={theme}
      />
      <Form employee={employee} userEmail={userEmail} theme={theme} />
    </main>
  )
}