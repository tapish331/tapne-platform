/**
 * UploadImage helpers (T21)
 * - No JSX; expose pure helpers for validation and upload orchestration
 */

import type { PresignResult, ConfirmResult } from "../../lib/server/media.client";
import { defaultClient } from "../../lib/server/media.client";

export type UploadLimits = {
  maxBytes?: number; // default 5MB
  allowedTypes?: string[]; // default [image/jpeg, image/png, image/webp]
};

export type UploadResult = {
  key: string;
  url: string; // public URL
  thumbnailUrl: string;
};

export function validateImage(
  file: { type?: string; size?: number; name?: string },
  limits: UploadLimits = {}
): { ok: true } | { ok: false; error: string } {
  const allowed = limits.allowedTypes || ["image/jpeg", "image/png", "image/webp"];
  const max = limits.maxBytes ?? 5 * 1024 * 1024;
  const type = String(file?.type || "");
  const size = Number(file?.size || 0);
  if (!allowed.includes(type)) return { ok: false, error: "Unsupported image type" } as const;
  if (size <= 0 || size > max) return { ok: false, error: "Image too large" } as const;
  return { ok: true } as const;
}

export async function prepareAndUpload(
  file: Blob & { name?: string; type?: string },
  client: {
    presignUpload: (args: { filename: string; contentType: string }) => PresignResult;
    uploadToUrl: (uploadUrl: string, file: Blob) => Promise<void>;
    confirmUpload: (key: string) => ConfirmResult;
  } = defaultClient
): Promise<UploadResult> {
  const filename = String((file as any)?.name || "image.bin");
  const contentType = String((file as any)?.type || "application/octet-stream");
  const presign = client.presignUpload({ filename, contentType });
  await client.uploadToUrl(presign.uploadUrl, file);
  const conf = client.confirmUpload(presign.key);
  return { key: presign.key, url: presign.publicUrl, thumbnailUrl: conf.thumbnail.url };
}

// Test helper to simulate a drop event producing a File-like object
export function simulateDrop(name: string, type: string, size: number): { name: string; type: string; size: number } {
  return { name, type, size };
}

