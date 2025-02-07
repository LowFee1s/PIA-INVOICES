import Table from '@/app/ui/employees/table';
import { lusitana } from '@/app/ui/fonts';
import { InvoicesTableSkeleton } from '@/app/ui/skeletons';
import { Suspense } from 'react';
import { Metadata } from 'next'; 
import { systemDefault, darkTheme, lightTheme, themeType } from '@/app/lib/theme';
import Pagination from '@/app/ui/customers/pagination';
import { fetchEmployeesPages, getUser } from '@/app/lib/data';
import { auth } from '@/auth';
import EmployeesServerTable from '@/app/ui/employees/servertable';

export const metadata: Metadata = {
  title: 'Employees',
};
 
export default async function Page({
  searchParams,
}: {
  searchParams?: {
    query?: string;
    page?: string;
  };
}) {
  const query = searchParams?.query || '';
  const currentPage = Number(searchParams?.page) || 1;

  const session = await auth();
  const userEmail = session?.user?.email!;
  const totalPages = await fetchEmployeesPages(query, userEmail);

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
        <h1 className={`${lusitana.className} text-2xl ${theme.title}`}>Employees</h1>
      </div>
      <Suspense key={query} fallback={<InvoicesTableSkeleton theme={theme} />}>
        <EmployeesServerTable query={query} currentPage={currentPage} theme={theme} />
      </Suspense>
      <div className="mt-5 flex w-full justify-center">
        <Pagination totalPages={totalPages} theme={theme} />
      </div>
    </div>
  );
}