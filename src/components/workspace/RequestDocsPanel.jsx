import { Braces, FileJson2, ShieldCheck, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button.jsx";
import {
  buildMockFromRequest,
  buildOpenApiOperation,
  buildRequestJsonSchema,
  formatDesignBlock,
  validateResponseBodyAgainstRequest
} from "@/lib/api-design.js";

function appendBlock(current, block) {
  const prefix = String(current || "").trim();
  return prefix ? `${prefix}\n\n${block}` : block;
}

export function RequestDocsPanel({ request, onChange }) {
  const schema = buildRequestJsonSchema(request);
  const mock = buildMockFromRequest(request);
  const operation = buildOpenApiOperation(request);
  const responseBody = request?.lastResponse?.rawBody || request?.lastResponse?.body || "";
  const canCheckContract = Boolean(schema && responseBody && !request?.lastResponse?.isBinary);
  const appendContractCheck = () => {
    const result = validateResponseBodyAgainstRequest(request, responseBody);
    onChange("docs", appendBlock(request.docs, formatDesignBlock("Contract Check", {
      ok: result.ok,
      errors: result.errors,
      schema: result.schema
    })));
  };

  return (
    <div className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)] px-3 py-3">
      <div className="flex min-h-0 flex-wrap items-center justify-between gap-2 border-b border-border/20 pb-2">
        <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Notes</div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 px-2.5 text-[11px]"
            onClick={() => onChange("docs", appendBlock(request.docs, formatDesignBlock("OpenAPI Operation", operation)))}
          >
            <FileJson2 className="h-3 w-3" />
            OpenAPI
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 px-2.5 text-[11px]"
            onClick={() => schema && onChange("docs", appendBlock(request.docs, formatDesignBlock("JSON Schema", schema)))}
            disabled={!schema}
          >
            <Braces className="h-3 w-3" />
            Schema
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 px-2.5 text-[11px]"
            onClick={() => mock && onChange("docs", appendBlock(request.docs, formatDesignBlock("Mock Response", mock)))}
            disabled={!mock}
          >
            <Sparkles className="h-3 w-3" />
            Mock
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 px-2.5 text-[11px]"
            onClick={appendContractCheck}
            disabled={!canCheckContract}
          >
            <ShieldCheck className="h-3 w-3" />
            Contract
          </Button>
        </div>
      </div>
      <textarea
        className="thin-scrollbar min-h-0 flex-1 resize-none border-0 bg-transparent p-3 text-[12px] leading-5 text-foreground outline-none"
        value={request.docs}
        onChange={(event) => onChange("docs", event.target.value)}
        placeholder="Request notes, examples, reminders..."
      />
    </div>
  );
}
