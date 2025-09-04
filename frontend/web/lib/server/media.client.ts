/**
 * Minimal media client for presigned uploads (T21)
 * - Pure functions with deterministic key derivation mirroring backend logic
 * - No real network I/O; tests can stub these methods
 */

export type PresignInput = {
  filename: string;
  contentType: string;
};

export type PresignResult = {
  key: string;
  uploadUrl: string;
  publicUrl: string;
};

export type ConfirmResult = {
  ok: true;
  key: string;
  thumbnail: { key: string; url: string };
};

function trimTrailingSlash(url: string): string {
  return url.replace(/\/+$/, "");
}

function randomHex(bytes = 6): string {
  // Non-crypto; good enough for test fixtures here
  const n = bytes * 2;
  let out = "";
  for (let i = 0; i < n; i++) out += Math.floor(Math.random() * 16).toString(16);
  return out;
}

function extFrom(contentType: string, filename: string): string {
  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
  };
  if (map[contentType]) return map[contentType];
  const m = filename.toLowerCase().match(/\.([a-z0-9]+)$/);
  const ext = m?.[1] || "";
  if (["jpg", "jpeg", "png", "webp"].includes(ext)) return ext === "jpeg" ? "jpg" : ext;
  throw new Error("Unsupported content type");
}

export function presignUpload(input: PresignInput, env: NodeJS.ProcessEnv = process.env): PresignResult {
  const { filename, contentType } = input || ({} as PresignInput);
  if (!filename || !contentType) throw new Error("filename and contentType are required");
  if (!contentType.startsWith("image/")) throw new Error("Only image uploads are allowed");

  const s3Endpoint = trimTrailingSlash(env.S3_ENDPOINT || "https://s3.local");
  const s3Bucket = env.S3_BUCKET || "tapne";
  const cdnBaseUrl = trimTrailingSlash(env.MEDIA_CDN_URL || "https://cdn.local");

  const now = new Date();
  const yyyy = String(now.getUTCFullYear());
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(now.getUTCDate()).padStart(2, "0");
  const ext = extFrom(contentType, filename);
  const rand = randomHex(6);
  const key = `uploads/images/${yyyy}/${mm}/${dd}/${rand}.${ext}`;
  const uploadUrl = `${s3Endpoint}/${s3Bucket}/${encodeURIComponent(
    key
  )}?x-id=PutObject&content-type=${encodeURIComponent(contentType)}&X-Amz-Signature=${randomHex(16)}`;
  const publicUrl = `${cdnBaseUrl}/${key}`;

  return { key, uploadUrl, publicUrl };
}

export async function uploadToUrl(_uploadUrl: string, _file: Blob): Promise<void> {
  // No-op in this kata; networkless by design. In a real app, PUT the file here.
  return;
}

function makeThumbKey(key: string): string {
  const lastSlash = key.lastIndexOf("/");
  const dir = lastSlash >= 0 ? key.slice(0, lastSlash) : "";
  const base = lastSlash >= 0 ? key.slice(lastSlash + 1) : key;
  const name = base.replace(/\.[^.]+$/, "");
  const outDir = dir.replace(/\/images(\/|$)/, "/images/thumbs$1");
  return `${outDir}/${name}-thumb.jpg`;
}

export function confirmUpload(key: string, env: NodeJS.ProcessEnv = process.env): ConfirmResult {
  if (!key) throw new Error("key is required");
  const cdnBaseUrl = trimTrailingSlash(env.MEDIA_CDN_URL || "https://cdn.local");
  const thumbKey = makeThumbKey(key.replace(/^\/+/, ""));
  return { ok: true, key, thumbnail: { key: thumbKey, url: `${cdnBaseUrl}/${thumbKey}` } };
}

export const defaultClient = {
  presignUpload,
  uploadToUrl,
  confirmUpload,
};

