import { generateYAxis } from '@/app/lib/utils';
import { CalendarIcon } from '@heroicons/react/24/outline';
import { lusitana } from '@/app/ui/fonts';
import { Revenue } from '@/app/lib/definitions';
import { fetchRevenue } from '@/app/lib/data';
import { themeType } from '@/app/lib/theme';

// This component is representational only.
// For data visualization UI, check out:
// https://www.tremor.so/
// https://www.chartjs.org/
// https://airbnb.io/visx/

// export default async function RevenueChart({theme}:{theme:themeType}) {
//   const revenue: Revenue[] = await fetchRevenue();
//   for (let i in revenue) {
//     revenue[i].revenue = revenue[i].revenue / 100;
//   }

//   const chartHeight = 350;
//   // NOTE: comment in this code when you get to this point in the course

//   const { yAxisLabels, topLabel } = generateYAxis(revenue);

//   if (!revenue || revenue.length === 0) {
//     return <div>
//       <p className="mt-4 text-xl text-center text-gray-400">Grafico de ganancias.</p>
//       <p className="mt-4 text-base text-center text-gray-400">No data available.</p>
//     </div>

//   }

//   return (
//     <div className="w-full md:col-span-4">
//       <h2 className={`${lusitana.className} mb-4 text-xl md:text-2xl
//         ${theme.title}
//       `}>
//         Recent Revenue
//       </h2>
//       {/* NOTE: comment in this code when you get to this point in the course */}

//       <div className={`rounded-xl p-4 ${theme.container}`}>
//         <div className={`sm:grid-cols-13 mt-0 grid grid-cols-12 items-end gap-2 rounded-md 
//           ${theme.bg} p-4 md:gap-4
//         `}>
//           <div
//             className="mb-6 hidden flex-col justify-between text-sm text-gray-400 sm:flex"
//             style={{ height: `${chartHeight}px` }}
//           >
//             {yAxisLabels.map((label) => (
//               <p key={label}>{label}</p>
//             ))}
//           </div>

//           {revenue.map((month) => (
//             <div key={month.month} className="flex flex-col items-center gap-2">
//               <div
//                 className="w-full rounded-md bg-blue-300"
//                 style={{
//                   height: `${(chartHeight / topLabel) * month.revenue}px`,
//                 }}
//                 title={`$: ${month.revenue}`}
//               ></div>
//               <p className="-rotate-90 text-sm text-gray-400 sm:rotate-0">
//                 {month.month}
//               </p>
//             </div>
//           ))}
//         </div>
//         <div className="flex items-center pb-2 pt-6">
//           <CalendarIcon className="h-5 w-5 text-gray-500" />
//           <h3 className="ml-2 text-sm text-gray-500 ">From the current year</h3>
//         </div>
//       </div>
//     </div>
//   );
// }

export default async function RevenueChart({ theme }: { theme: themeType }) {
  const revenue: Revenue[] = await fetchRevenue();
  
  // Normaliza los datos dividiendo por 100
  const normalizedRevenue = revenue.map((month) => ({
    ...month,
    revenue: month.revenue / 100,
  }));

  if (!normalizedRevenue || normalizedRevenue.length === 0) {
    return (
      <div>
        <p className="mt-4 text-xl text-center text-gray-400">Grafico de ganancias.</p>
        <p className="mt-4 text-base text-center text-gray-400">No data available.</p>
      </div>
    );
  }

  const chartHeight = 350;

  // Generar etiquetas del eje Y y el valor más alto
  const { yAxisLabels, topLabel } = generateYAxis(normalizedRevenue);

  return (
    <div className="w-full md:col-span-4">
      <h2
        className={`${lusitana.className} mb-4 text-xl md:text-2xl ${theme.title}`}
      >
        Recent Revenue
      </h2>

      <div className={`rounded-xl p-4 ${theme.container}`}>
        <div
          className={`sm:grid-cols-13 mt-0 grid grid-cols-12 items-end gap-2 rounded-md 
          ${theme.bg} p-4 md:gap-4`}
        >
          <div
            className="mb-6 hidden flex-col justify-between text-sm text-gray-400 sm:flex"
            style={{ height: `${chartHeight}px` }}
          >
            {yAxisLabels.map((label) => (
              <p key={label}>{label}</p>
            ))}
          </div>

          {normalizedRevenue.map((month) => (
            <div key={month.month} className="flex flex-col items-center gap-2">
              <div
                className="w-full rounded-md bg-blue-300"
                style={{
                  height: `${(chartHeight * month.revenue) / topLabel}px`,
                }}
                title={`$: ${month.revenue.toFixed(2)}`}
              ></div>
              <p className="-rotate-90 text-sm text-gray-400 sm:rotate-0">
                {month.month}
              </p>
            </div>
          ))}
        </div>
        <div className="flex items-center pb-2 pt-6">
          <CalendarIcon className="h-5 w-5 text-gray-500" />
          <h3 className="ml-2 text-sm text-gray-500">From the current year</h3>
        </div>
      </div>
    </div>
  );
}
