import AcmeLogo from '@/app/ui/acme-logo';
import ForgotForm from '@/app/ui/forgot-form';
import { Metadata } from 'next'; 

export const metadata: Metadata = {
  title: 'Forgot password',
};
 
export default function LoginPage() {
  return (
    <main className="flex items-center justify-end md:h-screen">
      <div className="relative mx-auto flex w-full max-w-[400px] flex-col space-y-2.5 p-4 md:-mt-32">
        <div className="flex h-20 w-full items-end rounded-lg bg-blue-800 p-3 md:h-32">
          <div className="w-52 text-white md:w-72">
            <AcmeLogo />
          </div>
        </div>
        <ForgotForm />
      </div>
    </main>
  );
}