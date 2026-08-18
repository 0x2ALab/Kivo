export const FORBIDDEN_SCRIPT_TOKENS = [
  "window",
  "document",
  "globalThis",
  "self",
  "localStorage",
  "sessionStorage",
  "indexedDB",
  "caches",
  "navigator",
  "location",
  "process",
  "require",
  "module",
  "import",
  "fetch",
  "XMLHttpRequest",
  "WebSocket",
  "EventSource",
  "Worker",
  "SharedWorker",
  "importScripts",
  "eval",
  "Function",
  "constructor",
  "__proto__",
  "prototype",
];

export const MAX_SCRIPT_SOURCE_CHARS = 20_000;

export function validateScriptSource(source) {
  if (String(source || "").length > MAX_SCRIPT_SOURCE_CHARS) {
    return `Script is too large. Keep scripts under ${MAX_SCRIPT_SOURCE_CHARS.toLocaleString()} characters.`;
  }

  for (const token of FORBIDDEN_SCRIPT_TOKENS) {
    const pattern = new RegExp(`(^|[^A-Za-z0-9_$])${token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^A-Za-z0-9_$]|$)`);
    if (pattern.test(source)) {
      return `Blocked unsafe script token: ${token}`;
    }
  }
  return "";
}
