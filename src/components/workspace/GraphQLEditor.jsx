import { Wand2 } from "lucide-react";

import { Button } from "@/components/ui/button.jsx";
import { CodeEditor } from "@/components/workspace/CodeEditor.jsx";
import { formatGraphqlText, formatJsonText } from "@/lib/formatters.js";

export function GraphQLEditor({ query, variables, onQueryChange, onVariablesChange, disabled }) {
  function handleFormatQuery() {
    onQueryChange(formatGraphqlText(query));
  }

  function handleFormatVariables() {
    try {
      onVariablesChange(formatJsonText(variables || "{}"));
    } catch {
    }
  }

  return (
    <div className="grid h-full min-h-0 grid-rows-[minmax(0,1fr)_auto_minmax(0,1fr)] overflow-hidden bg-background/5">
      <EditorSection title="Query" actionLabel="Format Query" onFormat={handleFormatQuery} disabled={disabled}>
        <CodeEditor
          value={query}
          onChange={onQueryChange}
          placeholder={"query GetUsers {\n  users {\n    id\n    name\n  }\n}"}
          language="graphql"
          disabled={disabled}
        />
      </EditorSection>

      <div className="h-px bg-border/12" />

      <EditorSection title="Variables" actionLabel="Format Variables" onFormat={handleFormatVariables} disabled={disabled}>
        <CodeEditor
          value={variables}
          onChange={onVariablesChange}
          placeholder={"{\n  \"id\": 1\n}"}
          language="json"
          disabled={disabled}
        />
      </EditorSection>
    </div>
  );
}

function EditorSection({ title, actionLabel, onFormat, disabled, children }) {
  return (
    <div className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)]">
      <div className="flex items-center justify-between border-b border-border/12 px-3 py-2 text-[11px] text-muted-foreground lg:text-[12px]">
        <span className="font-medium text-foreground">{title}</span>
        <Button type="button" variant="outline" size="sm" className="h-7 px-2.5 text-[11px]" onClick={onFormat} disabled={disabled}>
          <Wand2 className="h-3 w-3" />
          {actionLabel}
        </Button>
      </div>
      {children}
    </div>
  );
}
