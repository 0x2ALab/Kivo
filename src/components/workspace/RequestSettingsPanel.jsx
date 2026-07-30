import { Input } from "@/components/ui/input.jsx";

export function RequestSettingsPanel({ state, onChange }) {
  const tagsText = Array.isArray(state.tags) ? state.tags.join(", ") : "";

  function handleTagsChange(value) {
    const tags = value
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
    onChange("tags", tags);
  }

  return (
    <div className="h-full min-h-0 overflow-hidden text-[12px] text-muted-foreground">
      <div className="h-full thin-scrollbar overflow-auto px-4 py-4">
        <div className="grid max-w-[760px] gap-5">
          <div className="grid gap-1">
            <div className="text-[12px] font-semibold text-foreground">Request behavior</div>
            <p className="text-[12px] text-muted-foreground">Tune transport defaults saved with this request.</p>
          </div>

          <div className="grid gap-2">
            <label className="text-[10px] uppercase tracking-[0.18em]">Tags</label>
            <Input
              value={tagsText}
              onChange={(event) => handleTagsChange(event.target.value)}
              placeholder="e.g., create, update"
              className="h-10 border-border/25 bg-background/20"
            />
          </div>

          <div className="grid gap-4 border-y border-border/15 bg-background/10 py-4">
            <SettingToggle
              title="URL Encoding"
              description="Automatically encode query parameters in the URL."
              checked={state.urlEncoding ?? true}
              onChange={(checked) => onChange("urlEncoding", checked)}
            />
            <SettingToggle
              title="Automatically Follow Redirects"
              description="Follow HTTP redirects automatically."
              checked={state.followRedirects ?? true}
              onChange={(checked) => onChange("followRedirects", checked)}
            />
            <SettingToggle
              title="Use Cookie Jar"
              description="Automatically send stored cookies and capture Set-Cookie from responses."
              checked={state.useCookieJar ?? true}
              onChange={(checked) => onChange("useCookieJar", checked)}
            />

            <div className="grid gap-3 sm:grid-cols-2">
              <NumberSetting
                label="Max Redirects"
                value={Number.isFinite(state.maxRedirects) ? String(state.maxRedirects) : "5"}
                onChange={(value) => onChange("maxRedirects", value)}
              />
              <NumberSetting
                label="Timeout (ms)"
                value={Number.isFinite(state.timeoutMs) ? String(state.timeoutMs) : "0"}
                onChange={(value) => onChange("timeoutMs", value)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingToggle({ title, description, checked, onChange }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <div className="text-[12px] font-medium text-foreground">{title}</div>
        <p className="mt-1 text-[12px] text-muted-foreground">{description}</p>
      </div>
      <input
        type="checkbox"
        className="mt-1 h-4 w-4 shrink-0 accent-primary"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
    </div>
  );
}

function NumberSetting({ label, value, onChange }) {
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
        className="h-10 max-w-[180px] border-border/25 bg-background/20"
      />
    </div>
  );
}
