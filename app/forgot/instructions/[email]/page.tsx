"use client"

import AcmeLogo from '@/app/ui/acme-logo';
import { lusitana } from '@/app/ui/fonts';
import { systemDefault } from '@/app/lib/theme';
import { Button } from '@/app/ui/button';
import { useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';


 
export default function LoginPage({params}: {params: {email: string}}) {
  let email = params.email.replace('%40','@');
  return (
    <main className="flex items-center justify-end">
      <div className="relative mx-auto flex w-full max-w-[400px] flex-col space-y-2.5 p-4">
        <div className="flex h-40 w-full items-end rounded-lg bg-blue-500 p-3 md:h-36">
          <div className="w-32 text-white md:w-36">
            <AcmeLogo />
          </div>
        </div>
        <div className="flex-1 rounded-lg bg-gray-50 dark:bg-[#212121]
					px-6 pb-4 pt-8
				">
					<h1 className={`${lusitana.className} mb-3 text-2xl ${systemDefault.title} text-ellipsis overflow-hidden`}>
						If you typed your email address correctly, a message with instructions 
            to reset your password was sent to {email}
					</h1>
        </div>
        <ButtonBack />
      </div>
    </main>
  );

}

function ButtonBack() {
  const { pending } = useFormStatus();

  const { replace } = useRouter();

  return (
    <Button className='mt-4 w-full' aria-disabled={pending} onClick={() => {
      replace('/login');
    }}>
      Go back to the Login page <ArrowLeftIcon className="ml-auto h-5 w-5 text-gray-50" />
    </Button>
  );
}