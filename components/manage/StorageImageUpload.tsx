"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const allowedMimeTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"]);

export default function StorageImageUpload({ name, folder, folderScopeField, folderScopeOptions, bucket = "site-media", privateWhenUnchecked = false, label = "Upload one image" }: {
  name: string;
  folder: string;
  folderScopeField?: string;
  folderScopeOptions?: Record<string, string>;
  bucket?: "site-media" | "member-media";
  privateWhenUnchecked?: boolean;
  label?: string;
}) {
  const [value, setValue] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  async function upload(file: File | undefined, input: HTMLInputElement) {
    if (!file) return;
    if (!allowedMimeTypes.has(file.type)) {
      setStatus("Choose a JPEG, PNG, WebP, AVIF, or GIF image.");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setStatus("Each image must be 10 MB or smaller.");
      return;
    }
    setBusy(true);
    setStatus("Uploading…");
    try {
      const supabase = createClient();
      const form = input.closest("form");
      const visibility = privateWhenUnchecked
        ? form?.querySelector<HTMLInputElement>('input[name="is_public"]')?.checked ?? true
        : true;
      const targetBucket = privateWhenUnchecked && !visibility ? "member-media" : bucket;
      const extension = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
      const scopeControl = folderScopeField
        ? form?.querySelector<HTMLInputElement | HTMLSelectElement>(`[name="${CSS.escape(folderScopeField)}"]`)
        : null;
      const rawScope = scopeControl?.value?.trim() || "society";
      const scope = folderScopeOptions?.[rawScope] ?? rawScope;
      const safeFolder = [folder, scope].filter(Boolean).map((part) => part.toLowerCase().replace(/[^a-z0-9_-]/g, "-")).join("/");
      const path = `${safeFolder}/${crypto.randomUUID()}.${extension}`;
      const { error } = await supabase.storage.from(targetBucket).upload(path, file, {
        contentType: file.type,
        cacheControl: "31536000",
        upsert: false,
      });
      if (error) throw error;
      const reference = targetBucket === "site-media"
        ? supabase.storage.from(targetBucket).getPublicUrl(path).data.publicUrl
        : `storage://${targetBucket}/${path}`;
      setValue(reference);
      setStatus("Image uploaded. Save the form to link it to this record.");
    } catch (error) {
      console.error("Storage image upload failed", { name: error instanceof Error ? error.name : "unknown" });
      setStatus("Upload failed. Sign in with the matching content permission and try again.");
    } finally {
      setBusy(false);
    }
  }

  return <div className="mt-2">
    <input type="hidden" name={name} value={value} />
    <label className="block rounded-xl border border-dashed border-slate-300 px-3 py-3 text-xs font-normal text-muted dark:border-slate-700">
      {label} · 10 MB maximum
      <input className="mt-2 block w-full text-xs" type="file" accept="image/jpeg,image/png,image/webp,image/avif,image/gif" disabled={busy || Boolean(value)} onChange={(event) => void upload(event.currentTarget.files?.[0], event.currentTarget)} />
    </label>
    {status && <p aria-live="polite" className="mt-1 text-xs text-muted">{status}</p>}
  </div>;
}
