const DEFAULT_MIME = "application/octet-stream";
const DATA_URL_RE = /^data:(?<mime>[^;,]+)?(?<params>(?:;[^,]*)*?),(?<data>[\s\S]*)$/i;
function canUseFromBase64() {
  return typeof Uint8Array.fromBase64 === "function";
}
function tryDecodeURIComponent(s) {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}
function likelyUriComponent(s) {
  return /%[0-9A-Fa-f]{2}/.test(s) || s.includes("+");
}
function bytesToArrayBuffer(bytes) {
  const buf = bytes.buffer;
  if (buf instanceof ArrayBuffer) {
    return buf.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
  }
  const ab = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(ab).set(bytes);
  return ab;
}
function parseDataUrl(input) {
  const s = (input || "").trim();
  if (!s.toLowerCase().startsWith("data:")) return null;
  const m = s.match(DATA_URL_RE);
  if (!m?.groups) return null;
  const mimeType = (m.groups.mime || DEFAULT_MIME).trim() || DEFAULT_MIME;
  const params = (m.groups.params || "").toLowerCase();
  const isBase64 = params.includes(";base64");
  const data = m.groups.data ?? "";
  return { mimeType, isBase64, data };
}
function decodeBase64ToBytes(base64, options = {}) {
  const alphabet = options.alphabet || "base64";
  const lastChunkHandling = options.lastChunkHandling || "loose";
  const s = (base64 || "").trim();
  if (canUseFromBase64()) {
    return Uint8Array.fromBase64(s, { alphabet, lastChunkHandling });
  }
  const normalized = alphabet === "base64url" ? s.replace(/-/g, "+").replace(/_/g, "/") : s;
  const padLen = (4 - normalized.length % 4) % 4;
  const padded = normalized + "=".repeat(padLen);
  const binary = typeof atob === "function" ? atob(padded) : "";
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}
async function blobToBytes(blob) {
  const ab = await blob.arrayBuffer();
  return new Uint8Array(ab);
}
function looksLikeBase64(s) {
  const t = (s || "").trim();
  if (!t) return { isBase64: false, alphabet: "base64" };
  const hasUrlAlphabet = /[-_]/.test(t) && !/[+/]/.test(t);
  const alphabet = hasUrlAlphabet ? "base64url" : "base64";
  const normalized = alphabet === "base64url" ? t.replace(/-/g, "+").replace(/_/g, "/") : t;
  const cleaned = normalized.replace(/[\r\n\s]/g, "");
  const allowed = /^[A-Za-z0-9+/]*={0,2}$/.test(cleaned);
  if (!allowed) return { isBase64: false, alphabet };
  if (cleaned.length < 8) return { isBase64: false, alphabet };
  return { isBase64: true, alphabet };
}
function canParseUrl(value) {
  try {
    if (typeof URL === "undefined") return false;
    if (typeof URL.canParse === "function") return URL.canParse(value);
    new URL(value);
    return true;
  } catch {
    return false;
  }
}
function extensionByMimeType(mimeType) {
  const t = (mimeType).toLowerCase().split(";")[0].trim();
  if (!t) return "bin";
  const mapped = {
    "text/plain": "txt",
    "text/markdown": "md",
    "text/html": "html",
    "application/json": "json",
    "application/xml": "xml",
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
    "image/svg+xml": "svg",
    "application/pdf": "pdf"
  };
  if (mapped[t]) return mapped[t];
  const slashIdx = t.indexOf("/");
  if (slashIdx <= 0 || slashIdx >= t.length - 1) return "bin";
  let subtype = t.slice(slashIdx + 1);
  if (subtype.includes("+")) subtype = subtype.split("+")[0];
  if (subtype.includes(".")) subtype = subtype.split(".").pop() || subtype;
  return subtype || "bin";
}
function fallbackHashHex(bytes) {
  let h = 2166136261;
  for (let i = 0; i < bytes.length; i++) {
    h ^= bytes[i];
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16).padStart(8, "0").repeat(8);
}
async function sha256Hex(bytes) {
  try {
    const subtle = globalThis.crypto?.subtle;
    if (!subtle) return fallbackHashHex(bytes);
    const digest = await subtle.digest("SHA-256", bytes);
    const out = new Uint8Array(digest);
    return Array.from(out, (b) => b.toString(16).padStart(2, "0")).join("");
  } catch {
    return fallbackHashHex(bytes);
  }
}
function isBase64Like(input) {
  return looksLikeBase64(input).isBase64;
}
async function normalizeDataAsset(input, options = {}) {
  const maxBytes = options.maxBytes ?? 50 * 1024 * 1024;
  const namePrefix = (options.namePrefix || "asset").trim() || "asset";
  const preserveFileName = options.preserveFileName ?? false;
  let source = "text";
  let blob;
  let incomingFile = null;
  if (input instanceof File) {
    source = "file";
    incomingFile = input;
    blob = options.mimeType && options.mimeType !== input.type ? new Blob([await input.arrayBuffer()], { type: options.mimeType }) : input;
  } else if (input instanceof Blob) {
    source = "blob";
    blob = options.mimeType && options.mimeType !== input.type ? new Blob([await input.arrayBuffer()], { type: options.mimeType }) : input;
  } else {
    const raw = (input instanceof URL ? input.toString() : String(input ?? "")).trim();
    const parsed = parseDataUrl(raw);
    const decodedUri = options.uriComponent ? tryDecodeURIComponent(raw) : likelyUriComponent(raw) ? tryDecodeURIComponent(raw) : raw;
    if (parsed) {
      source = "data-url";
    } else if (canParseUrl(raw)) {
      source = "url";
    } else if (isBase64Like(raw)) {
      source = "base64";
    } else if (decodedUri !== raw && (parseDataUrl(decodedUri) || isBase64Like(decodedUri) || canParseUrl(decodedUri))) {
      source = "uri";
    } else {
      source = "text";
    }
    const stringSource = source === "uri" ? decodedUri : raw;
    blob = await stringToBlob(stringSource, {
      mimeType: options.mimeType,
      uriComponent: options.uriComponent,
      isBase64: source === "base64" ? true : void 0,
      maxBytes
    });
  }
  const bytes = await blobToBytes(blob);
  if (bytes.byteLength > maxBytes) throw new Error(`Data too large: ${bytes.byteLength} bytes`);
  const hash = await sha256Hex(bytes);
  const mimeType = (options.mimeType || blob.type || DEFAULT_MIME).trim() || DEFAULT_MIME;
  const extension = extensionByMimeType(mimeType);
  const hashedName = options.filename || `${namePrefix}-${hash.slice(0, 16)}.${extension}`;
  const finalName = preserveFileName && incomingFile?.name ? incomingFile.name : hashedName;
  const file = incomingFile && preserveFileName && !options.mimeType ? incomingFile : new File([blob], finalName, { type: mimeType });
  return {
    hash,
    name: file.name,
    type: file.type || mimeType,
    size: file.size,
    source,
    file
  };
}
async function stringToBlobOrFile(input, options = {}) {
  const maxBytes = options.maxBytes ?? 50 * 1024 * 1024;
  const raw = (input ?? "").trim();
  const parsedDataUrl = parseDataUrl(raw);
  if (parsedDataUrl) {
    const mimeType2 = options.mimeType || parsedDataUrl.mimeType || DEFAULT_MIME;
    const payload = options.uriComponent ? tryDecodeURIComponent(parsedDataUrl.data) : likelyUriComponent(parsedDataUrl.data) ? tryDecodeURIComponent(parsedDataUrl.data) : parsedDataUrl.data;
    const isBase642 = options.isBase64 ?? parsedDataUrl.isBase64;
    if (isBase642) {
      const bytes = decodeBase64ToBytes(payload, {
        alphabet: options.base64?.alphabet || "base64",
        lastChunkHandling: options.base64?.lastChunkHandling || "loose"
      });
      if (bytes.byteLength > maxBytes) throw new Error(`Decoded data too large: ${bytes.byteLength} bytes`);
      const blob3 = new Blob([bytesToArrayBuffer(bytes)], { type: mimeType2 });
      if (!options.asFile) return blob3;
      return new File([blob3], options.filename || "file", { type: mimeType2 });
    }
    const blob2 = new Blob([payload], { type: mimeType2 });
    if (!options.asFile) return blob2;
    return new File([blob2], options.filename || "file", { type: mimeType2 });
  }
  try {
    if (typeof URL !== "undefined" && URL.canParse?.(raw)) {
      const res = await fetch(raw);
      const blob2 = await res.blob();
      const mimeType2 = options.mimeType || blob2.type || DEFAULT_MIME;
      const typed = blob2.type === mimeType2 ? blob2 : new Blob([await blob2.arrayBuffer()], { type: mimeType2 });
      if (!options.asFile) return typed;
      return new File([typed], options.filename || "file", { type: mimeType2 });
    }
  } catch {
  }
  const maybeDecoded = options.uriComponent ? tryDecodeURIComponent(raw) : likelyUriComponent(raw) ? tryDecodeURIComponent(raw) : raw;
  const base64Hint = looksLikeBase64(maybeDecoded);
  const isBase64 = options.isBase64 ?? base64Hint.isBase64;
  const mimeType = options.mimeType || (isBase64 ? DEFAULT_MIME : "text/plain;charset=utf-8");
  if (isBase64) {
    const bytes = decodeBase64ToBytes(maybeDecoded, {
      alphabet: options.base64?.alphabet || base64Hint.alphabet,
      lastChunkHandling: options.base64?.lastChunkHandling || "loose"
    });
    if (bytes.byteLength > maxBytes) throw new Error(`Decoded data too large: ${bytes.byteLength} bytes`);
    const blob2 = new Blob([bytesToArrayBuffer(bytes)], { type: mimeType });
    if (!options.asFile) return blob2;
    return new File([blob2], options.filename || "file", { type: mimeType });
  }
  const blob = new Blob([maybeDecoded], { type: mimeType });
  if (!options.asFile) return blob;
  return new File([blob], options.filename || "file", { type: mimeType });
}
async function stringToBlob(input, options = {}) {
  return await stringToBlobOrFile(input, { ...options, asFile: false });
}

export { isBase64Like, normalizeDataAsset, parseDataUrl };
//# sourceMappingURL=Base64Data.js.map
