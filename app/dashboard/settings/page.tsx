import Form from '@/app/ui/settings/settings-form';
import { Metadata } from 'next';
import { auth } from '@/auth';
import { lusitana } from '@/app/ui/fonts';
import { getUser } from '@/app/lib/data';
import { darkTheme, defaultTheme, lightTheme, systemDefault, themeType } from '@/app/lib/theme';

export const metadata: Metadata = {
  title: 'Settings',
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
    <main className="w-full">
      <div className="flex w-full items-center justify-between mb-6">
        <h1 className={`${lusitana.className} text-2xl ${theme?.title || defaultTheme.title}`}>Settings</h1>
      </div>
      <Form user={user} theme={theme || defaultTheme} />
    </main>
  )
}