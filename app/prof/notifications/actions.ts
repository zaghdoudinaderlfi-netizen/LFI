"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { marquerNotificationLue, marquerToutesNotificationsLues } from "@/lib/notifications";

export async function ouvrirNotificationAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/connexion");
  }

  const id = formData.get("id");
  const lien = formData.get("lien");

  if (typeof id === "string") {
    await marquerNotificationLue(id, session.user.id);
  }

  revalidatePath("/prof", "layout");
  redirect(typeof lien === "string" && lien ? lien : "/prof/notifications");
}

export async function toutMarquerLuAction() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/connexion");
  }

  await marquerToutesNotificationsLues(session.user.id);

  revalidatePath("/prof", "layout");
  redirect("/prof/notifications");
}
