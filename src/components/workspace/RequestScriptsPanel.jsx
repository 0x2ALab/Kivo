import { useEffect, useRef, useState } from "react";
import { Plus } from "lucide-react";

import { CodeEditor } from "@/components/workspace/CodeEditor.jsx";
import { SCRIPT_AUTOCOMPLETE_ITEMS, SCRIPT_SNIPPET_GROUPS } from "@/lib/request-script-snippets.js";
import { cn } from "@/lib/utils.js";

export function RequestScriptsPanel({ state, onChange }) {
  const activePhase = state.scriptActivePhase === "after-response" ? "after-response" : "pre-request";
  const editorValue = activePhase === "after-response"
    ? String(state.scriptAfterResponse || "")
    : String(state.scriptPreRequest || "");
  const [openGroupKey, setOpenGroupKey] = useState("");
  const snippetMenuRef = useRef(null);

  useEffect(() => {
    if (!openGroupKey) {
      return;
    }

    function handlePointerDown(event) {
      if (!snippetMenuRef.current) {
        return;
      }

      if (!snippetMenuRef.current.contains(event.target)) {
        setOpenGroupKey("");
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setOpenGroupKey("");
      }
    }

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [openGroupKey]);

  function handleEditorChange(value) {
    if (activePhase === "after-response") {
      onChange("scriptAfterResponse", value);
      return;
    }
    onChange("scriptPreRequest", value);
  }

  function appendSnippet(code) {
    const current = String(editorValue || "");
    const next = current.trim() ? `${current}\n\n${code}` : code;
    handleEditorChange(next);
  }

  const hasPreScript = Boolean(String(state.scriptPreRequest || "").trim());
  const hasAfterScript = Boolean(String(state.scriptAfterResponse || "").trim());
  const scriptLastStatus = String(state.scriptLastStatus || "").trim();
  const scriptLastPhase = String(state.scriptLastPhase || "").trim();
  const scriptLastRunAt = String(state.scriptLastRunAt || "").trim();
  const scriptLastError = String(state.scriptLastError || "").trim();
  const scriptLastLogs = Array.isArray(state.scriptLastLogs) ? state.scriptLastLogs.map((entry) => String(entry || "")) : [];
  const scriptLastTests = Array.isArray(state.scriptLastTests)
    ? state.scriptLastTests.map((entry) => ({
      name: String(entry?.name || "Unnamed test"),
      ok: Boolean(entry?.ok),
      error: String(entry?.error || ""),
    }))
    : [];
  const scriptLastVars = state.scriptLastVars && typeof state.scriptLastVars === "object" && !Array.isArray(state.scriptLastVars)
    ? state.scriptLastVars
    : {};
  const hasScriptRunDetails = Boolean(
    scriptLastStatus ||
    scriptLastPhase ||
    scriptLastRunAt ||
    scriptLastError ||
    scriptLastLogs.length ||
    scriptLastTests.length ||
    Object.keys(scriptLastVars).length
  );
  const passedTestsCount = scriptLastTests.filter((entry) => entry.ok).length;
  const failedTestsCount = scriptLastTests.length - passedTestsCount;

  return (
    <div className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)_auto_auto] bg-background/10">
      <div className="flex items-center gap-1.5 px-3 py-2">
        <button
          type="button"
          onClick={() => onChange("scriptActivePhase", "pre-request")}
          className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] uppercase tracking-[0.14em] transition-colors",
            activePhase === "pre-request" ? "bg-primary/14 text-foreground" : "text-muted-foreground hover:bg-accent/25 hover:text-foreground"
          )}
        >
          Pre-request
          <span className={cn("h-1.5 w-1.5", hasPreScript ? "bg-success" : "bg-border")}></span>
        </button>
        <button
          type="button"
          onClick={() => onChange("scriptActivePhase", "after-response")}
          className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] uppercase tracking-[0.14em] transition-colors",
            activePhase === "after-response" ? "bg-primary/14 text-foreground" : "text-muted-foreground hover:bg-accent/25 hover:text-foreground"
          )}
        >
          After-response
          <span className={cn("h-1.5 w-1.5", hasAfterScript ? "bg-success" : "bg-border")}></span>
        </button>
      </div>

      <div className="min-h-0 overflow-hidden border-y border-border/14">
        <CodeEditor
          value={editorValue}
          onChange={handleEditorChange}
          language="javascript"
          lineNumbers={true}
          wrapLines={true}
          autocompleteItems={SCRIPT_AUTOCOMPLETE_ITEMS}
          placeholder={activePhase === "pre-request" ? "// Runs before the request is sent\n// Example:\n// kivo.request.addHeader(\"X-Trace\", \"1\");" : "// Runs after response is received\n// Example:\n// await kivo.test(\"status is 200\", () => {\n//   kivo.expect(kivo.response.status).toBe(200);\n// });"}
          disabled={false}
          className="bg-muted/[0.10]"
        />
      </div>

      <div ref={snippetMenuRef} className="flex flex-wrap items-center gap-1.5 px-3 py-2">
        {SCRIPT_SNIPPET_GROUPS.map((group) => (
          <div key={group.key} className="relative">
            <button
              type="button"
              className={cn(
                "px-2 py-1 text-[10px] uppercase tracking-[0.15em] transition-colors",
                openGroupKey === group.key ? "bg-accent/40 text-foreground" : "text-muted-foreground hover:bg-accent/22 hover:text-foreground"
              )}
              onClick={() => setOpenGroupKey((current) => (current === group.key ? "" : group.key))}
            >
              {group.label}
            </button>
            {openGroupKey === group.key ? (
              <div className="absolute bottom-[calc(100%+8px)] left-0 z-30 min-w-[220px] border border-border/40 bg-popover/98 p-1 shadow-2xl">
                {group.items.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-[12px] text-foreground transition-colors hover:bg-accent/35"
                    onClick={() => {
                      appendSnippet(item.code);
                      setOpenGroupKey("");
                    }}
                  >
                    <Plus className="h-3.5 w-3.5" /> {item.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        ))}
      </div>

      {hasScriptRunDetails ? (
        <div className="grid gap-2 border-t border-border/18 bg-muted/[0.06] px-3 py-2 text-[11px]">
          <div className="flex flex-wrap items-center gap-2 text-muted-foreground">
            <span className="uppercase tracking-[0.14em]">Last Script Run</span>
            {scriptLastStatus ? (
              <span className={cn(
                "px-1.5 py-0.5 text-[10px] uppercase tracking-[0.1em]",
                scriptLastStatus === "success"
                  ? "bg-success/16 text-success"
                  : "bg-amber-500/12 text-amber-500 dark:text-amber-400"
              )}>
                {scriptLastStatus}
              </span>
            ) : null}
            {scriptLastPhase ? (
              <span className="bg-accent/28 px-1.5 py-0.5 text-[10px] uppercase tracking-[0.1em] text-foreground">
                {scriptLastPhase}
              </span>
            ) : null}
            {scriptLastRunAt ? <span>{scriptLastRunAt}</span> : null}
          </div>

          {scriptLastTests.length > 0 ? (
            <div className="grid gap-1">
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="uppercase tracking-[0.14em]">Tests</span>
                <span className="text-success">{passedTestsCount} passed</span>
                <span className={failedTestsCount > 0 ? "text-amber-500 dark:text-amber-400" : "text-muted-foreground"}>{failedTestsCount} failed</span>
              </div>
              <div className="grid gap-1">
                {scriptLastTests.map((entry, index) => (
                  <div key={`${entry.name}-${index}`} className={cn("border-l-2 px-2 py-1", entry.ok ? "border-success bg-success/8" : "border-amber-500 bg-amber-500/[0.07]")}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-foreground">{entry.name}</span>
                      <span className={cn("text-[10px] uppercase tracking-[0.1em]", entry.ok ? "text-success" : "text-amber-500 dark:text-amber-400")}>{entry.ok ? "pass" : "fail"}</span>
                    </div>
                    {!entry.ok && entry.error ? <div className="mt-1 whitespace-pre-wrap text-amber-500 dark:text-amber-400">{entry.error}</div> : null}
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {scriptLastError ? (
            <div className="border-l-2 border-amber-500 bg-amber-500/[0.07] px-2 py-1 whitespace-pre-wrap text-amber-500 dark:text-amber-400">
              {scriptLastError}
            </div>
          ) : null}

          {scriptLastLogs.length > 0 ? (
            <div className="grid gap-1">
              <div className="uppercase tracking-[0.14em] text-muted-foreground">Logs</div>
              <pre className="thin-scrollbar max-h-28 overflow-auto bg-background/45 px-2 py-1 whitespace-pre-wrap text-muted-foreground">{scriptLastLogs.join("\n")}</pre>
            </div>
          ) : null}

          {Object.keys(scriptLastVars).length > 0 ? (
            <div className="grid gap-1">
              <div className="uppercase tracking-[0.14em] text-muted-foreground">Vars</div>
              <pre className="thin-scrollbar max-h-28 overflow-auto bg-background/45 px-2 py-1 whitespace-pre-wrap text-muted-foreground">{JSON.stringify(scriptLastVars, null, 2)}</pre>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
