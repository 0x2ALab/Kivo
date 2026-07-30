import { Plus, Trash2 } from "lucide-react";

import { Input } from "@/components/ui/input.jsx";
import { SelectMenu } from "@/components/workspace/SelectMenu.jsx";
import { TableEditor } from "@/components/workspace/RequestTableEditor.jsx";
import { cn } from "@/lib/utils.js";

const DEFAULT_USER_AGENT_VALUE = "kivo/0.4.1";

export const webSocketBodyModes = [
  { value: "json", label: "JSON" },
  { value: "text", label: "Raw" }
];

export function WebSocketSettingsPanel({ state, onChange }) {
  return (
    <div className="h-full min-h-0 overflow-hidden text-[12px] text-muted-foreground">
      <div className="h-full thin-scrollbar overflow-auto px-4 py-4">
        <div className="grid max-w-[760px] gap-5">
          <div className="grid gap-1">
            <div className="text-[12px] font-semibold text-foreground">Connection behavior</div>
            <p className="text-[12px] text-muted-foreground">Configure WebSocket transport settings saved with this request.</p>
          </div>

          <div className="grid gap-4 border-y border-border/15 bg-background/10 py-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <NumberInput
                label="Timeout (ms)"
                value={Number.isFinite(state.timeoutMs) ? String(state.timeoutMs) : "0"}
                onChange={(value) => onChange("timeoutMs", value)}
              />
              <NumberInput
                label="Keep Alive Interval (ms)"
                value={Number.isFinite(state.webSocketKeepAliveIntervalMs) ? String(state.webSocketKeepAliveIntervalMs) : "0"}
                onChange={(value) => onChange("webSocketKeepAliveIntervalMs", value)}
              />
            </div>

            <div className="grid gap-2 border-t border-border/12 pt-4">
              <label className="text-[10px] uppercase tracking-[0.18em]">Proxy Override</label>
              <SelectMenu
                value={state.proxyMode || "inherit"}
                options={[
                  { value: "inherit", label: "Use app proxy settings" },
                  { value: "off", label: "Disable proxy" },
                  { value: "custom", label: "Custom proxy" },
                ]}
                onChange={(value) => onChange("proxyMode", value)}
                className="max-w-[260px]"
              />
              {state.proxyMode === "custom" ? (
                <div className="grid gap-2 lg:grid-cols-3">
                  <Input value={state.proxyHttp || ""} onChange={(event) => onChange("proxyHttp", event.target.value)} placeholder="HTTP proxy" className="h-9 border-border/25 bg-background/20" />
                  <Input value={state.proxyHttps || ""} onChange={(event) => onChange("proxyHttps", event.target.value)} placeholder="HTTPS proxy" className="h-9 border-border/25 bg-background/20" />
                  <Input value={state.noProxy || ""} onChange={(event) => onChange("noProxy", event.target.value)} placeholder="No proxy hosts" className="h-9 border-border/25 bg-background/20" />
                </div>
              ) : null}
            </div>

            <div className="grid gap-2 border-t border-border/12 pt-4">
              <label className="text-[10px] uppercase tracking-[0.18em]">Client Certificate Override</label>
              <Input value={state.clientCertificatePath || ""} onChange={(event) => onChange("clientCertificatePath", event.target.value)} placeholder="Client certificate PEM path" className="h-9 border-border/25 bg-background/20" />
              <Input value={state.clientKeyPath || ""} onChange={(event) => onChange("clientKeyPath", event.target.value)} placeholder="Client private key PEM path" className="h-9 border-border/25 bg-background/20" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function buildSsePreviewUrl(rawUrl, queryParams = []) {
  const trimmed = String(rawUrl ?? "").trim();
  if (!trimmed) return "";

  const normalized = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  return appendEnabledQueryParams(normalized, queryParams);
}

export function buildWebSocketPreviewUrl(rawUrl, queryParams = []) {
  const baseUrl = toWebSocketUrl(rawUrl);
  return appendEnabledQueryParams(baseUrl, queryParams);
}

export function buildSocketIoPreviewUrl(rawUrl, queryParams = []) {
  const baseUrl = buildWebSocketPreviewUrl(rawUrl, queryParams);
  if (!baseUrl) return "";

  try {
    const parsed = new URL(baseUrl);
    if (!parsed.pathname || parsed.pathname === "/") {
      parsed.pathname = "/socket.io/";
    }
    if (!parsed.searchParams.has("EIO")) {
      parsed.searchParams.set("EIO", "4");
    }
    parsed.searchParams.set("transport", "websocket");
    return parsed.toString();
  } catch {
    return baseUrl;
  }
}

export function SseHeadersPanel({ headers, onHeadersChange }) {
  const systemHeaders = [
    { key: "Accept", value: "text/event-stream" },
    { key: "Cache-Control", value: "no-cache" },
    { key: "User-Agent", value: `${DEFAULT_USER_AGENT_VALUE} (runtime)` }
  ];

  return (
    <SystemHeadersPanel
      title="Stream Headers"
      systemHeaders={systemHeaders}
      rows={headers}
      onChange={onHeadersChange}
      tableTitle="Custom Headers"
    />
  );
}

export function SocketIoHeadersPanel({ headers, onHeadersChange }) {
  const systemHeaders = [
    { key: "Connection", value: "Upgrade" },
    { key: "Upgrade", value: "websocket" },
    { key: "Sec-WebSocket-Version", value: "13" },
    { key: "User-Agent", value: `${DEFAULT_USER_AGENT_VALUE} (runtime)` }
  ];

  return (
    <SystemHeadersPanel
      title="Socket.IO Handshake Headers"
      systemHeaders={systemHeaders}
      rows={headers}
      onChange={onHeadersChange}
      tableTitle="Custom Headers"
    />
  );
}

export function SseOptionsPanel({ state, onChange }) {
  return (
    <div className="h-full min-h-0 overflow-hidden text-[12px] text-muted-foreground">
      <div className="h-full thin-scrollbar overflow-auto px-4 py-4">
        <div className="grid max-w-[680px] gap-5">
          <div className="grid gap-1">
            <div className="text-[12px] font-semibold text-foreground">Event stream options</div>
            <p className="text-[12px] text-muted-foreground">These options are saved with your SSE request settings.</p>
          </div>

          <div className="grid gap-4 border-y border-border/15 bg-background/10 py-4">
            <NumberInput
              label="Retry (ms)"
              value={Number.isFinite(state.sseRetryMs) ? String(state.sseRetryMs) : "3000"}
              onChange={(value) => onChange("sseRetryMs", value)}
            />

            <div className="grid gap-2">
              <label className="text-[10px] uppercase tracking-[0.18em]">Last Event ID</label>
              <Input
                value={state.sseLastEventId ?? ""}
                onChange={(event) => onChange("sseLastEventId", event.target.value)}
                placeholder="Optional resume token"
                className="h-10 max-w-[420px] border-border/25 bg-background/20"
              />
            </div>

            <label className="flex items-center gap-2 text-[12px] text-foreground">
              <input
                type="checkbox"
                className="h-4 w-4 accent-primary"
                checked={Boolean(state.sseWithCredentials)}
                onChange={(event) => onChange("sseWithCredentials", event.target.checked)}
              />
              Send credentials with EventSource
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

export function createSocketIoEventRow(name = "message") {
  return {
    id: `sio-${Math.random().toString(36).slice(2, 10)}`,
    name,
    enabled: true,
    listen: true,
    emit: true,
    description: "",
    payloadType: "json",
    payload: "{\n\n}",
    ackTimeoutMs: null
  };
}

export function SocketIoEventsPanel({
  state,
  events,
  selectedEventId,
  onChange,
  onSelectEvent,
  onAddEvent,
  onRemoveEvent,
  onUpdateEvent
}) {
  const modeOptions = [
    { value: "both", label: "Emit + Listen" },
    { value: "emit", label: "Emit only" },
    { value: "listen", label: "Listen only" },
    { value: "none", label: "Disabled mode" }
  ];

  function getModeValue(event) {
    if (event.emit && event.listen) return "both";
    if (event.emit) return "emit";
    if (event.listen) return "listen";
    return "none";
  }

  function applyMode(eventId, value) {
    if (value === "both") {
      onUpdateEvent(eventId, { emit: true, listen: true });
      return;
    }
    if (value === "emit") {
      onUpdateEvent(eventId, { emit: true, listen: false });
      return;
    }
    if (value === "listen") {
      onUpdateEvent(eventId, { emit: false, listen: true });
      return;
    }
    onUpdateEvent(eventId, { emit: false, listen: false });
  }

  return (
    <div className="h-full min-h-0 overflow-hidden text-[12px] text-muted-foreground">
      <div className="h-full thin-scrollbar overflow-auto px-4 py-4">
        <div className="grid gap-5">
          <div className="grid gap-1">
            <div className="text-[12px] font-semibold text-foreground">Socket.IO defaults</div>
            <p className="text-[12px] text-muted-foreground">Defaults are used for all events unless overridden in a row.</p>
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            <div className="grid gap-2">
              <label className="text-[10px] uppercase tracking-[0.18em]">Namespace</label>
              <Input
                value={state.socketIoNamespace ?? "/"}
                onChange={(event) => onChange("socketIoNamespace", event.target.value)}
                placeholder="/"
                className="h-10 max-w-[320px] border-border/25 bg-background/20"
              />
            </div>
            <NumberInput
              label="Ack Timeout (ms)"
              value={Number.isFinite(state.socketIoAckTimeoutMs) ? String(state.socketIoAckTimeoutMs) : "0"}
              onChange={(value) => onChange("socketIoAckTimeoutMs", value)}
            />
          </div>

          <div className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)] bg-background/5">
            <div className="grid min-w-[440px] grid-cols-[minmax(96px,1fr)_96px_64px_64px_30px] items-center gap-2 border-y border-border/12 px-3 py-2 text-[10px] uppercase tracking-[0.16em] text-muted-foreground xl:min-w-0 xl:grid-cols-[minmax(0,1.2fr)_132px_90px_88px_minmax(0,1fr)_44px]">
              <div className="flex items-center gap-2">
                <span>Events</span>
                <button
                  type="button"
                  className="inline-flex h-5 w-5 items-center justify-center bg-card/45 text-foreground transition-colors hover:bg-card/70"
                  onClick={onAddEvent}
                  title="Add event row"
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>
              <span>Mode</span>
              <span>Enabled</span>
              <span>Payload</span>
              <span className="hidden xl:block">Description</span>
              <span />
            </div>

            <div className="thin-scrollbar min-h-[180px] overflow-auto">
              {events.map((eventRow) => {
                const isSelected = eventRow.id === selectedEventId;
                return (
                  <div
                    key={eventRow.id}
                    onClick={() => onSelectEvent(eventRow.id)}
                    className={cn(
                      "grid min-w-[440px] cursor-pointer grid-cols-[minmax(96px,1fr)_96px_64px_64px_30px] items-center gap-2 px-3 py-2 transition-colors xl:min-w-0 xl:grid-cols-[minmax(0,1.2fr)_132px_90px_88px_minmax(0,1fr)_44px]",
                      isSelected ? "bg-primary/8" : "hover:bg-card/30"
                    )}
                  >
                    <Input
                      value={eventRow.name || ""}
                      onClick={(event) => event.stopPropagation()}
                      onFocus={() => onSelectEvent(eventRow.id)}
                      onChange={(event) => onUpdateEvent(eventRow.id, { name: event.target.value })}
                      placeholder="event_name"
                      className="h-8 border-border/20 bg-background/20"
                    />

                    <div onClick={(event) => event.stopPropagation()}>
                      <SelectMenu
                        value={getModeValue(eventRow)}
                        options={modeOptions}
                        onChange={(value) => {
                          onSelectEvent(eventRow.id);
                          applyMode(eventRow.id, value);
                        }}
                        className="w-full"
                        buttonClassName="h-8 px-1 text-[10px] xl:px-2 xl:text-[11px]"
                      />
                    </div>

                    <label className="flex items-center justify-center gap-2 text-[11px] text-foreground" onClick={(event) => event.stopPropagation()}>
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-primary"
                        checked={eventRow.enabled ?? true}
                        onChange={(event) => {
                          onSelectEvent(eventRow.id);
                          onUpdateEvent(eventRow.id, { enabled: event.target.checked });
                        }}
                      />
                    </label>

                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onSelectEvent(eventRow.id);
                      }}
                      className={cn(
                        "h-8 px-2 text-[11px] uppercase tracking-[0.12em] transition-colors",
                        isSelected
                          ? "bg-primary/10 text-primary"
                          : "bg-card/30 text-muted-foreground hover:bg-card/55 hover:text-foreground"
                      )}
                    >
                      Use
                    </button>

                    <Input
                      value={eventRow.description || ""}
                      onClick={(event) => event.stopPropagation()}
                      onFocus={() => onSelectEvent(eventRow.id)}
                      onChange={(event) => onUpdateEvent(eventRow.id, { description: event.target.value })}
                      placeholder="Description"
                      className="hidden h-8 border-border/20 bg-background/20 xl:block"
                    />

                    <button
                      type="button"
                      className="inline-flex h-8 w-8 items-center justify-center text-muted-foreground transition-colors hover:bg-card/45 hover:text-red-300"
                      onClick={(event) => {
                        event.stopPropagation();
                        onRemoveEvent(eventRow.id);
                      }}
                      title="Remove event"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}

              {events.length === 0 ? (
                <div className="px-3 py-6 text-[12px] text-muted-foreground">
                  No events configured. Add one to emit or listen.
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function toWebSocketUrl(rawUrl) {
  const trimmed = String(rawUrl ?? "").trim();
  if (!trimmed) return "";

  if (/^wss?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed.replace(/^http/i, "ws");
  }

  return `wss://${trimmed}`;
}

function appendEnabledQueryParams(rawUrl, queryParams = []) {
  if (!rawUrl) return "";

  try {
    const parsed = new URL(rawUrl);
    queryParams.forEach((row) => {
      if (row?.enabled && String(row.key || "").trim()) {
        parsed.searchParams.append(String(row.key).trim(), String(row.value || ""));
      }
    });
    return parsed.toString();
  } catch {
    return rawUrl;
  }
}

function SystemHeadersPanel({ title, systemHeaders, rows, onChange, tableTitle }) {
  return (
    <div className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)]">
      <div className="border-b border-border/12 px-3 py-2 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
        {title}
      </div>
      <div className="thin-scrollbar min-h-0 overflow-auto bg-transparent">
        {systemHeaders.map((row) => (
          <div key={row.key} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] px-3 py-2 text-[12px] transition-colors hover:bg-card/25">
            <div className="text-foreground">{row.key}</div>
            <div className="text-muted-foreground">{row.value}</div>
          </div>
        ))}
        <div className="border-t border-border/12">
          <TableEditor
            rows={rows}
            onChange={onChange}
            keyLabel="header"
            valueLabel="value"
            title={tableTitle}
            addLabel="Add"
          />
        </div>
      </div>
    </div>
  );
}

function NumberInput({ label, value, onChange }) {
  return (
    <div className="grid gap-2">
      <label className="text-[10px] uppercase tracking-[0.18em]">{label}</label>
      <Input
        type="text"
        inputMode="numeric"
        value={value}
        onChange={(event) => {
          const digitsOnly = event.target.value.replace(/[^0-9]/g, "");
          const nextValue = Number.parseInt(digitsOnly, 10);
          onChange(Number.isFinite(nextValue) && nextValue >= 0 ? nextValue : 0);
        }}
        className="h-10 max-w-[220px] border-border/25 bg-background/20 [appearance:textfield]"
      />
    </div>
  );
}
