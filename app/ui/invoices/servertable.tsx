import EmployeesTable from "./table"; // Importa tu componente de tabla
import { fetchFilteredEmployees, fetchFilteredInvoices } from "@/app/lib/data";
import { themeType } from "@/app/lib/theme";
import { auth } from "@/auth";
import InvoicesTable from "./table";

export default async function InvoicesServerTable({
  query,
  currentPage,
  theme,
}: {
  query: string;
  currentPage: number;
  theme: themeType; // Cambia el tipo si es necesario
}) {
  const session = await auth();
  const userEmail = session?.user?.email || "";
  const invoices = await fetchFilteredInvoices(query, currentPage, userEmail);

  return <InvoicesTable invoices={invoices} theme={theme} />;
}
