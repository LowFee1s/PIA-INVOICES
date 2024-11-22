import { getUser } from '@/app/lib/data';
import { darkTheme, lightTheme, systemDefault, themeType } from '@/app/lib/theme';
import Form from '@/app/ui/employees/create-form';
import Breadcrumbs from '@/app/ui/invoices/breadcrumbs';
import { auth } from '@/auth';
import { Metadata } from 'next'; 

export const metadata: Metadata = {
  title: 'Create Employee',
};
 
export default async function Page() {
  const session = await auth();
  const userEmail = session?.user?.email!;
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
    <main>
      <Breadcrumbs
        breadcrumbs={[
          { label: 'Employees', href: '/dashboard/employees' },
          {
            label: 'Create Employee',
            href: '/dashboard/employees/create',
            active: true,
          },
        ]}
        theme={theme}
      />
      <Form userEmail={userEmail} theme={theme}/>
    </main>
  );
}