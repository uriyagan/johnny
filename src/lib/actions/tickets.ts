"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser, requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type Status = Database["public"]["Enums"]["ticket_status"];

/** Client opens a new ticket. */
export async function createTicket(formData: FormData) {
  const subject = String(formData.get("subject") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  if (!subject || !body) redirect("/support?error=empty");

  const user = await requireUser();
  const supabase = createClient();

  const { data: ticket, error } = await supabase
    .from("tickets")
    .insert({ user_id: user.id, subject, status: "open" })
    .select("id")
    .single();
  if (error || !ticket) redirect("/support?error=failed");

  await supabase.from("ticket_messages").insert({
    ticket_id: ticket.id,
    sender_id: user.id,
    from_admin: false,
    body,
  });

  redirect(`/support/${ticket.id}`);
}

/** Client replies to their own ticket (reopens it). */
export async function clientReply(formData: FormData) {
  const ticketId = String(formData.get("ticket_id") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  if (!ticketId || !body) return;

  const user = await requireUser();
  const supabase = createClient();

  await supabase.from("ticket_messages").insert({
    ticket_id: ticketId,
    sender_id: user.id,
    from_admin: false,
    body,
  });
  await supabase
    .from("tickets")
    .update({ status: "open" })
    .eq("id", ticketId)
    .eq("user_id", user.id);

  revalidatePath(`/support/${ticketId}`);
}

/** Admin replies (marks the ticket answered). */
export async function adminReply(formData: FormData) {
  const ticketId = String(formData.get("ticket_id") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  if (!ticketId || !body) return;

  const admin = await requireAdmin();
  const supabase = createClient();

  await supabase.from("ticket_messages").insert({
    ticket_id: ticketId,
    sender_id: admin.id,
    from_admin: true,
    body,
  });
  await supabase
    .from("tickets")
    .update({ status: "answered" })
    .eq("id", ticketId);

  revalidatePath(`/admin/tickets/${ticketId}`);
}

/** Admin changes a ticket status. */
export async function setTicketStatus(formData: FormData) {
  const ticketId = String(formData.get("ticket_id") ?? "").trim();
  const status = String(formData.get("status") ?? "") as Status;
  if (!ticketId || !["open", "answered", "closed"].includes(status)) return;

  await requireAdmin();
  const supabase = createClient();
  await supabase.from("tickets").update({ status }).eq("id", ticketId);

  revalidatePath(`/admin/tickets/${ticketId}`);
}
