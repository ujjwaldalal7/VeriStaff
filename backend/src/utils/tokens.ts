import crypto from "node:crypto";

export const createSecureToken = (bytes = 32) =>
  crypto.randomBytes(bytes).toString("hex");

export const createSha256 = (payload: string) =>
  crypto.createHash("sha256").update(payload).digest("hex");
