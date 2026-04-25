import { redirect } from "next/navigation";
import { logoutAction } from "@/app/actions";
import { AdminPanel } from "@/app/components/admin-panel";
import { getAdminUser } from "@/lib/auth";
import { getHalloweenData } from "@/lib/store";

export default async function AdminPage() {
  const username = await getAdminUser();
  if (!username) redirect("/login");
  const data = await getHalloweenData();

  return (
    <>
      <AdminPanel data={data} username={username} />
      <form action={logoutAction} className="logout-form">
        <button type="submit">Cerrar sesion</button>
      </form>
    </>
  );
}
