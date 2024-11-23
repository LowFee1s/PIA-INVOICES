import EmployeesTable from "./table"; // Importa tu componente de tabla
import { fetchFilteredEmployees } from "@/app/lib/data";
import { themeType } from "@/app/lib/theme";
import { auth } from "@/auth";

export default async function EmployeesServerTable({
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
  const employees = await fetchFilteredEmployees(query, currentPage, userEmail);

  return <EmployeesTable employees={employees} user={userEmail} theme={theme} />;
}
