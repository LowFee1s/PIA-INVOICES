import CustomersTable from "./table"; // Importa tu componente de tabla
import { fetchFilteredCustomers } from "@/app/lib/data";
import { themeType } from "@/app/lib/theme";
import { auth } from "@/auth";

export default async function CustomersServerTable({
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
  const customers = await fetchFilteredCustomers(query, currentPage, userEmail);

  return <CustomersTable customers={customers} theme={theme} />;
}
