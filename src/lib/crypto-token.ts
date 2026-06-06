import "server-only";
import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "crypto";
import { serverEnv } from "@/lib/env";

/** Derives a 32-byte key from META_TOKEN_ENC_KEY. */
function key(): Buffer {
  const { META_TOKEN_ENC_KEY } = serverEnv();
  if (!META_TOKEN_ENC_KEY) throw new Error("META_TOKEN_ENC_KEY is not set");
  return createHash("sha256").update(META_TOKEN_ENC_KEY).digest();
}

/** AES-256-GCM encrypt → "iv:tag:ciphertext" (base64). */
export function encryptToken(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv.toString("base64"), tag.toString("base64"), enc.toString("base64")].join(
    ":",
  );
}

export function decryptToken(payload: string): string {
  const [ivB64, tagB64, dataB64] = payload.split(":");
  const decipher = createDecipheriv(
    "aes-256-gcm",
    key(),
    Buffer.from(ivB64, "base64"),
  );
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));
  return Buffer.concat([
    decipher.update(Buffer.from(dataB64, "base64")),
    decipher.final(),
  ]).toString("utf8");
}
