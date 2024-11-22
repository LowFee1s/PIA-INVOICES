import { themeType } from '@/app/lib/theme';
import { CheckIcon, ClockIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';

export default function InvoiceStatus({ 
  status,
  theme
}: 
{ 
  status: string;
  theme: themeType;
 }) {
  return (
    <span
      className={clsx(
        `inline-flex items-center rounded-full px-2 py-1 text-xs
          ${status === 'Pendiente' && `${theme.container}`}
        `,
        {
          'bg-gray-500 text-white': status === 'Pendiente',
          'bg-green-700 text-white': status === 'Pagado',
        },
      )}
    >
      {status === 'Pendiente' ? (
        <>
          Pendiente
          <ClockIcon className="ml-1 w-4 text-white" />
        </>
      ) : null}
      {status === 'Pagado' ? (
        <>
          Pagado
          <CheckIcon className="ml-1 w-4 text-white" />
        </>
      ) : null}
    </span>
  );
}
