"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { SUPABASE_URL } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { isStatus, type BookingStatus } from "@/lib/types";

type Result = { ok: true } | { ok: false; error: string };

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

/* ---------------- Bookings ---------------- */

export async function updateBookingStatus(id: string, status: BookingStatus): Promise<Result> {
  const { supabase } = await requireAdmin();
  if (!isStatus(status) || !z.string().uuid().safeParse(id).success) return { ok: false, error: "Invalid request." };

  const { error } = await supabase.from("bookings").update({ status }).eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin", "layout");
  return { ok: true };
}

/* ---------------- Gallery ---------------- */

const PUBLIC_PREFIX = `${SUPABASE_URL}/storage/v1/object/public/gallery/`;

const NewPhoto = z.object({
  storage_path: z.string().min(1).max(300),
  caption: z.string().trim().min(1, "Add a caption.").max(120),
  description: z.string().trim().max(1000).transform((v) => v || null),
  is_published: z.boolean(),
});

/** Called after the browser has uploaded the file directly to Supabase Storage. */
export async function createPhoto(input: z.input<typeof NewPhoto>): Promise<Result> {
  const { supabase, user } = await requireAdmin();
  const parsed = NewPhoto.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const { storage_path, ...rest } = parsed.data;
  const { error } = await supabase.from("gallery").insert({
    ...rest,
    storage_path,
    image_url: PUBLIC_PREFIX + storage_path.split("/").map(encodeURIComponent).join("/"),
    uploaded_by: user.id,
  });
  if (error) {
    await supabase.storage.from("gallery").remove([storage_path]);
    return { ok: false, error: error.message };
  }

  refreshGallery();
  return { ok: true };
}

const PhotoChanges = z
  .object({
    caption: z.string().trim().min(1, "Add a caption.").max(120),
    description: z.string().trim().max(1000).transform((v) => v || null),
    sort_order: z.number().int().min(-100000).max(100000),
    is_published: z.boolean(),
  })
  .partial();

export async function updatePhoto(id: string, changes: z.input<typeof PhotoChanges>): Promise<Result> {
  const { supabase } = await requireAdmin();
  const parsed = PhotoChanges.safeParse(changes);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const { error } = await supabase.from("gallery").update(parsed.data).eq("id", id);
  if (error) return { ok: false, error: error.message };

  refreshGallery();
  return { ok: true };
}

export async function deletePhoto(id: string): Promise<Result> {
  const { supabase } = await requireAdmin();
  const { data: photo } = await supabase.from("gallery").select("storage_path").eq("id", id).maybeSingle();
  if (!photo) return { ok: false, error: "Photo not found." };

  const { error } = await supabase.from("gallery").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  await supabase.storage.from("gallery").remove([photo.storage_path]);

  refreshGallery();
  return { ok: true };
}

function refreshGallery() {
  revalidatePath("/"); // public site
  revalidatePath("/admin/gallery");
}
