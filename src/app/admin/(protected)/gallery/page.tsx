import { requireAdmin } from "@/lib/auth";
import type { GalleryPhoto } from "@/lib/types";
import { GalleryManager } from "./GalleryManager";

export default async function GalleryPage() {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase
    .from("gallery")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("uploaded_at", { ascending: false });

  return (
    <>
      {error && <p className="mb-4 text-danger">Couldn&apos;t load photos: {error.message}</p>}
      <GalleryManager photos={(data ?? []) as GalleryPhoto[]} />
    </>
  );
}
