"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { clearSession, createSession, getAdminUser, verifyPassword } from "@/lib/auth";
import { allHouseNumbers } from "@/lib/map-data";
import { deleteParticipant, saveContent, saveParticipant } from "@/lib/store";

function requireNumber(value: FormDataEntryValue | null) {
  const number = Number(value);
  if (!Number.isInteger(number)) throw new Error("Numero invalido");
  return number;
}

export async function loginAction(formData: FormData) {
  const username = String(formData.get("username") || "").trim();
  const password = String(formData.get("password") || "");
  if (!verifyPassword(username, password)) {
    redirect("/login?error=1");
  }
  await createSession(username);
  redirect("/admin");
}

export async function logoutAction() {
  await clearSession();
  redirect("/");
}

export async function upsertParticipantAction(formData: FormData) {
  const admin = await getAdminUser();
  if (!admin) redirect("/login");
  const houseNumber = requireNumber(formData.get("houseNumber"));
  const count = requireNumber(formData.get("count"));
  const note = String(formData.get("note") || "").trim();
  if (!allHouseNumbers.includes(houseNumber) || count < 1) throw new Error("Datos invalidos");
  await saveParticipant({ houseNumber, count, note });
  revalidatePath("/");
  revalidatePath("/admin");
}

export async function deleteParticipantAction(formData: FormData) {
  const admin = await getAdminUser();
  if (!admin) redirect("/login");
  await deleteParticipant(requireNumber(formData.get("houseNumber")));
  revalidatePath("/");
  revalidatePath("/admin");
}

export async function saveContentAction(formData: FormData) {
  const admin = await getAdminUser();
  if (!admin) redirect("/login");
  const news = String(formData.get("news") || "")
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
  const rules = String(formData.get("rules") || "")
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
  await saveContent(news, rules);
  revalidatePath("/");
  revalidatePath("/admin");
}
