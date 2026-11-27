"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { createPhoto, deletePhoto, updatePhoto } from "@/app/admin/actions";
import { Panel } from "@/components/admin/ui";
import { getBrowserClient } from "@/lib/supabase/client";
import type { GalleryPhoto } from "@/lib/types";

const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIDE = 2000;

/** Shrinks large photos before upload (max 2000px on the long side, JPEG). */
async function prepareImage(file: File): Promise<{ blob: Blob; ext: string; type: string }> {
  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, MAX_SIDE / Math.max(bmp.width, bmp.height));
    if (scale === 1 && file.size < 1.5 * 1024 * 1024) return { blob: file, ext, type: file.type };
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/jpeg", 0.86));
    return blob ? { blob, ext: "jpg", type: "image/jpeg" } : { blob: file, ext, type: file.type };
  } catch {
    return { blob: file, ext, type: file.type };
  }
}

type Toast = { text: string; error?: boolean } | null;

export function GalleryManager({ photos }: { photos: GalleryPhoto[] }) {
  const router = useRouter();
  const [toast, setToast] = useState<Toast>(null);
  const [filter, setFilter] = useState<"" | "pub" | "draft">("");
  const [editing, setEditing] = useState<GalleryPhoto | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const notify = (text: string, error?: boolean) => setToast({ text, error });
  const shown = photos.filter((p) => !filter || (filter === "pub" ? p.is_published : !p.is_published));

  return (
    <>
      <UploadPanel
        onDone={(published) => {
          notify(published ? "Photo uploaded and published." : "Photo uploaded (not published yet).");
          router.refresh();
        }}
        onError={(m) => notify(m, true)}
      />

      <Panel
        className="mt-6"
        title="Photos"
        action={
          <select aria-label="Filter photos" className="field w-auto" value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)}>
            <option value="">All photos</option>
            <option value="pub">Published</option>
            <option value="draft">Not published</option>
          </select>
        }
      >
        <div className="grid grid-cols-[repeat(auto-fill,minmax(230px,1fr))] gap-4 p-5">
          {shown.map((p) => (
            <PhotoCard
              key={p.id}
              photo={p}
              onEdit={() => setEditing(p)}
              onResult={(text, error) => {
                notify(text, error);
                if (!error) router.refresh();
              }}
            />
          ))}
          {!shown.length && (
            <p className="col-span-full py-8 text-center text-muted">
              {photos.length
                ? "No photos match this filter."
                : "No photos yet. Upload your first one above. Until you publish photos, the website shows its built-in sample photos."}
            </p>
          )}
        </div>
      </Panel>

      {editing && (
        <EditDialog
          photo={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            notify("Photo updated.");
            router.refresh();
          }}
          onError={(m) => notify(m, true)}
        />
      )}

      {toast && (
        <div
          role="status"
          className={`fixed right-5 bottom-5 z-[300] max-w-[calc(100vw-40px)] rounded-lg border border-l-4 border-line bg-surface px-4 py-3 font-medium shadow-xl ${
            toast.error ? "border-l-danger" : "border-l-gold"
          }`}
        >
          {toast.text}
        </div>
      )}
    </>
  );
}

function UploadPanel({ onDone, onError }: { onDone: (published: boolean) => void; onError: (m: string) => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [caption, setCaption] = useState("");
  const [description, setDescription] = useState("");
  const [publish, setPublish] = useState(true);
  const [drag, setDrag] = useState(false);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  function pick(f: File | undefined) {
    if (!f) return;
    if (!ACCEPTED.includes(f.type)) return onError("Please choose a JPG, PNG or WebP image.");
    setFile(f);
    setPreview(URL.createObjectURL(f));
    if (!caption) setCaption(f.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").slice(0, 120));
  }

  async function upload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return onError("Choose a photo first.");
    setBusy(true);
    try {
      const img = await prepareImage(file);
      const path = `${new Date().getFullYear()}/${crypto.randomUUID()}.${img.ext}`;
      const { error: upErr } = await getBrowserClient()
        .storage.from("gallery")
        .upload(path, img.blob, { contentType: img.type, cacheControl: "31536000" });
      if (upErr) throw new Error(upErr.message);

      const res = await createPhoto({ storage_path: path, caption, description, is_published: publish });
      if (!res.ok) throw new Error(res.error);

      setFile(null);
      setPreview("");
      setCaption("");
      setDescription("");
      setPublish(true);
      if (inputRef.current) inputRef.current.value = "";
      onDone(publish);
    } catch (err) {
      onError(`Upload failed: ${err instanceof Error ? err.message : "unknown error"}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Panel title="Upload a photo">
      <form onSubmit={upload} className="grid gap-6 p-5 md:grid-cols-[260px_1fr]">
        <label
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); pick(e.dataTransfer.files[0]); }}
          className={`relative flex min-h-[220px] cursor-pointer flex-col items-center justify-center gap-1.5 overflow-hidden rounded-xl border-2 border-dashed p-4 text-center text-muted transition hover:border-gold hover:bg-gold/5 ${
            drag ? "border-gold bg-gold/10" : "border-gold/35"
          }`}
        >
          <input ref={inputRef} type="file" accept={ACCEPTED.join(",")} className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
          <span className="flex h-12 w-12 items-center justify-center rounded-full border border-gold/60 text-2xl text-gold">＋</span>
          <strong className="text-fg">Choose a photo</strong>
          <span className="text-sm">or drag it here · JPG, PNG, WebP</span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {preview && <img src={preview} alt="Preview" className="absolute inset-0 h-full w-full object-cover" />}
        </label>

        <div>
          <label className="mb-4 block">
            <span className="label">Caption</span>
            <input className="field" required maxLength={120} value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="e.g. Garden Reception" />
          </label>
          <label className="mb-4 block">
            <span className="label">
              Description <small className="font-normal text-muted">(optional)</small>
            </span>
            <textarea className="field min-h-[90px]" maxLength={1000} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Venue, theme, or a note about the event" />
          </label>
          <label className="mb-4 flex cursor-pointer items-center gap-2.5 font-medium">
            <input type="checkbox" className="h-[18px] w-[18px] accent-gold" checked={publish} onChange={(e) => setPublish(e.target.checked)} />
            Publish to the website right away
          </label>
          <button type="submit" className="btn-gold rounded-md text-xs tracking-[0.12em] uppercase" disabled={busy}>
            {busy ? "Uploading…" : "Upload photo"}
          </button>
        </div>
      </form>
    </Panel>
  );
}

function PhotoCard({ photo: p, onEdit, onResult }: { photo: GalleryPhoto; onEdit: () => void; onResult: (text: string, error?: boolean) => void }) {
  const [pending, start] = useTransition();

  return (
    <div className={`lux-card flex flex-col overflow-hidden ${pending ? "opacity-60" : ""}`}>
      <div className="relative aspect-[4/3] bg-secondary">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={p.image_url} alt={p.caption} loading="lazy" className="h-full w-full object-cover" />
        <span
          className={`absolute top-2.5 left-2.5 rounded-full px-2.5 py-0.5 text-xs font-bold ${
            p.is_published ? "border border-ok/40 bg-black/70 text-ok" : "border border-line bg-black/70 text-muted"
          }`}
        >
          {p.is_published ? "Published" : "Not published"}
        </span>
      </div>
      <div className="flex-1 px-3.5 py-3">
        <div className="font-serif text-[17px] text-gold">{p.caption}</div>
        {p.description && <div className="mt-0.5 text-[13px] text-muted">{p.description}</div>}
      </div>
      <div className="flex flex-wrap gap-1.5 px-3.5 pb-3.5">
        <button
          type="button"
          className="btn rounded-md border border-gold/50 text-gold hover:bg-gold/10 btn-sm"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const res = await updatePhoto(p.id, { is_published: !p.is_published });
              onResult(res.ok ? (p.is_published ? "Photo removed from the website." : "Photo published to the website.") : res.error, !res.ok);
            })
          }
        >
          {p.is_published ? "Unpublish" : "Publish"}
        </button>
        <button type="button" className="btn rounded-md border border-gold/50 text-gold hover:bg-gold/10 btn-sm" disabled={pending} onClick={onEdit}>
          Edit
        </button>
        <button
          type="button"
          className="btn btn-sm rounded-md border border-danger/50 text-danger hover:bg-danger-soft"
          disabled={pending}
          onClick={() => {
            if (!confirm(`Delete "${p.caption}"? This removes it from the website and can't be undone.`)) return;
            start(async () => {
              const res = await deletePhoto(p.id);
              onResult(res.ok ? "Photo deleted." : res.error, !res.ok);
            });
          }}
        >
          Delete
        </button>
      </div>
    </div>
  );
}

function EditDialog({
  photo,
  onClose,
  onSaved,
  onError,
}: {
  photo: GalleryPhoto;
  onClose: () => void;
  onSaved: () => void;
  onError: (m: string) => void;
}) {
  const [caption, setCaption] = useState(photo.caption);
  const [description, setDescription] = useState(photo.description ?? "");
  const [order, setOrder] = useState(String(photo.sort_order));
  const [published, setPublished] = useState(photo.is_published);
  const [pending, start] = useTransition();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-photo-title"
        className="lux-panel max-h-[92vh] w-full max-w-[480px] overflow-y-auto p-6"
        onSubmit={(e) => {
          e.preventDefault();
          start(async () => {
            const res = await updatePhoto(photo.id, {
              caption,
              description,
              sort_order: parseInt(order, 10) || 0,
              is_published: published,
            });
            if (res.ok) onSaved();
            else onError(res.error);
          });
        }}
      >
        <h2 id="edit-photo-title" className="gold-text mb-4 text-2xl">Edit photo</h2>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photo.image_url} alt="" className="mb-4 max-h-[220px] w-full rounded-xl object-cover" />
        <label className="mb-4 block">
          <span className="label">Caption</span>
          <input className="field" required maxLength={120} value={caption} onChange={(e) => setCaption(e.target.value)} autoFocus />
        </label>
        <label className="mb-4 block">
          <span className="label">Description</span>
          <textarea className="field min-h-[90px]" maxLength={1000} value={description} onChange={(e) => setDescription(e.target.value)} />
        </label>
        <label className="mb-4 block">
          <span className="label">
            Display order <small className="font-normal text-muted">(lower numbers show first)</small>
          </span>
          <input type="number" step={1} className="field" value={order} onChange={(e) => setOrder(e.target.value)} />
        </label>
        <label className="mb-5 flex cursor-pointer items-center gap-2.5 font-medium">
          <input type="checkbox" className="h-[18px] w-[18px] accent-gold" checked={published} onChange={(e) => setPublished(e.target.checked)} />
          Published on the website
        </label>
        <div className="flex justify-end gap-2.5">
          <button type="button" className="btn rounded-md border border-gold/50 text-gold hover:bg-gold/10" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn-gold" disabled={pending}>
            {pending ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
