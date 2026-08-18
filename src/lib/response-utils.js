const CONTENT_TYPE_EXTENSIONS = [
  [/application\/json|\+json/i, "json"],
  [/text\/html/i, "html"],
  [/application\/xml|text\/xml|\+xml/i, "xml"],
  [/ya?ml/i, "yaml"],
  [/text\/csv/i, "csv"],
  [/text\/plain/i, "txt"],
  [/application\/pdf/i, "pdf"],
  [/application\/zip/i, "zip"],
  [/image\/png/i, "png"],
  [/image\/jpe?g/i, "jpg"],
  [/image\/gif/i, "gif"],
  [/image\/webp/i, "webp"],
  [/application\/octet-stream/i, "bin"],
];

function sanitizeFileName(value) {
  return String(value || "")
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, "_")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 160);
}

export function getHeaderValue(headers, targetName) {
  const normalizedTarget = String(targetName || "").toLowerCase();
  const match = Object.entries(headers || {}).find(([key]) => String(key).toLowerCase() === normalizedTarget);
  return match ? String(match[1] || "") : "";
}

export function parseContentDispositionFilename(value) {
  const source = String(value || "");
  const encodedMatch = source.match(/filename\*\s*=\s*(?:UTF-8'')?([^;]+)/i);
  if (encodedMatch) {
    try {
      return sanitizeFileName(decodeURIComponent(encodedMatch[1].trim().replace(/^"|"$/g, "")));
    } catch {
      return sanitizeFileName(encodedMatch[1]);
    }
  }

  const plainMatch = source.match(/filename\s*=\s*("[^"]+"|[^;]+)/i);
  return plainMatch ? sanitizeFileName(plainMatch[1].trim().replace(/^"|"$/g, "")) : "";
}

export function extensionFromContentType(contentType, fallback = "bin") {
  const type = String(contentType || "");
  const match = CONTENT_TYPE_EXTENSIONS.find(([pattern]) => pattern.test(type));
  return match ? match[1] : fallback;
}

export function getResponseDownloadName(response, headers = response?.headers || {}) {
  const dispositionName = parseContentDispositionFilename(getHeaderValue(headers, "content-disposition"));
  if (dispositionName) return dispositionName;

  const contentType = response?.contentType || getHeaderValue(headers, "content-type");
  const extension = extensionFromContentType(contentType, response?.isBinary ? "bin" : "txt");
  return `response.${extension}`;
}
