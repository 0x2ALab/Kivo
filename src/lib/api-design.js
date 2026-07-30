function parseJson(value) {
  try {
    return { ok: true, value: JSON.parse(String(value || "")) };
  } catch {
    return { ok: false, value: null };
  }
}

function inferSchema(value) {
  if (Array.isArray(value)) {
    return {
      type: "array",
      items: value.length > 0 ? inferSchema(value[0]) : {}
    };
  }

  if (value && typeof value === "object") {
    const properties = {};
    const required = [];
    Object.entries(value).forEach(([key, child]) => {
      properties[key] = inferSchema(child);
      if (child !== null && child !== undefined) {
        required.push(key);
      }
    });
    return {
      type: "object",
      properties,
      ...(required.length ? { required } : {})
    };
  }

  if (value === null) return { type: "null" };
  if (typeof value === "number") return { type: Number.isInteger(value) ? "integer" : "number" };
  if (typeof value === "boolean") return { type: "boolean" };
  return { type: "string" };
}

function mockFromSchema(schema) {
  if (!schema || typeof schema !== "object") return null;
  if (schema.example !== undefined) return schema.example;
  if (schema.default !== undefined) return schema.default;

  if (schema.type === "array") {
    return [mockFromSchema(schema.items)];
  }
  if (schema.type === "object" || schema.properties) {
    return Object.fromEntries(
      Object.entries(schema.properties || {}).map(([key, child]) => [key, mockFromSchema(child)])
    );
  }
  if (schema.type === "integer") return 1;
  if (schema.type === "number") return 1.1;
  if (schema.type === "boolean") return true;
  if (schema.type === "null") return null;
  return "string";
}

function typeName(value) {
  if (Array.isArray(value)) return "array";
  if (value === null) return "null";
  if (typeof value === "number" && Number.isInteger(value)) return "integer";
  return typeof value;
}

function matchesType(value, expectedType) {
  if (!expectedType) return true;
  const types = Array.isArray(expectedType) ? expectedType : [expectedType];
  return types.some((type) => {
    if (type === "array") return Array.isArray(value);
    if (type === "object") return value && typeof value === "object" && !Array.isArray(value);
    if (type === "integer") return typeof value === "number" && Number.isInteger(value);
    if (type === "number") return typeof value === "number";
    if (type === "null") return value === null;
    return typeof value === type;
  });
}

function validateValue(value, schema, path, errors) {
  if (!schema || typeof schema !== "object") return;

  if (!matchesType(value, schema.type)) {
    errors.push(`${path} expected ${Array.isArray(schema.type) ? schema.type.join(" or ") : schema.type}, got ${typeName(value)}`);
    return;
  }

  if ((schema.type === "object" || schema.properties) && value && typeof value === "object" && !Array.isArray(value)) {
    (schema.required || []).forEach((key) => {
      if (value[key] === undefined) errors.push(`${path}.${key} is required`);
    });
    Object.entries(schema.properties || {}).forEach(([key, child]) => {
      if (value[key] !== undefined) validateValue(value[key], child, `${path}.${key}`, errors);
    });
  }

  if (schema.type === "array" && Array.isArray(value) && schema.items) {
    value.forEach((item, index) => validateValue(item, schema.items, `${path}[${index}]`, errors));
  }
}

function getContentType(request) {
  const explicit = (request?.headers || [])
    .find((row) => row?.enabled && String(row.key || "").trim().toLowerCase() === "content-type")
    ?.value;
  if (explicit) return String(explicit).trim();
  if (request?.bodyType === "json" || request?.bodyType === "graphql") return "application/json";
  if (request?.bodyType === "soap") return "application/soap+xml";
  if (request?.bodyType === "xml") return "application/xml";
  if (request?.bodyType === "yaml") return "application/yaml";
  if (request?.bodyType === "text") return "text/plain";
  return "application/octet-stream";
}

function enabledRows(rows) {
  return (rows || []).filter((row) => row?.enabled && String(row.key || "").trim());
}

export function buildRequestJsonSchema(request) {
  if (request?.bodyType !== "json") return null;
  const parsed = parseJson(request?.body);
  return parsed.ok ? inferSchema(parsed.value) : null;
}

export function buildMockFromRequest(request) {
  const schema = buildRequestJsonSchema(request);
  return schema ? mockFromSchema(schema) : null;
}

export function validateJsonAgainstSchema(value, schema) {
  const errors = [];
  validateValue(value, schema, "$", errors);
  return { ok: errors.length === 0, errors };
}

export function validateResponseBodyAgainstRequest(request, responseBody) {
  const schema = buildRequestJsonSchema(request);
  if (!schema) {
    return { ok: false, errors: ["No JSON request schema is available."], schema: null };
  }

  const parsed = typeof responseBody === "string" ? parseJson(responseBody) : { ok: true, value: responseBody };
  if (!parsed.ok) {
    return { ok: false, errors: ["Response body is not valid JSON."], schema };
  }

  return { ...validateJsonAgainstSchema(parsed.value, schema), schema };
}

export function buildOpenApiOperation(request) {
  const method = String(request?.method || "GET").toLowerCase();
  const parameters = [
    ...enabledRows(request?.queryParams).map((row) => ({
      name: String(row.key),
      in: "query",
      required: false,
      schema: { type: "string" },
      example: String(row.value || "")
    })),
    ...enabledRows(request?.headers).filter((row) => String(row.key).toLowerCase() !== "content-type").map((row) => ({
      name: String(row.key),
      in: "header",
      required: false,
      schema: { type: "string" },
      example: String(row.value || "")
    }))
  ];
  const schema = buildRequestJsonSchema(request);
  const hasBody = !["get", "head"].includes(method) && request?.bodyType && request.bodyType !== "none";
  const contentType = getContentType(request);

  return {
    summary: String(request?.name || "Untitled request"),
    ...(parameters.length ? { parameters } : {}),
    ...(hasBody ? {
      requestBody: {
        required: true,
        content: {
          [contentType]: {
            ...(schema ? { schema } : {}),
            ...(request?.body ? { example: request.bodyType === "json" ? parseJson(request.body).value : String(request.body) } : {})
          }
        }
      }
    } : {}),
    responses: {
      "200": {
        description: "OK"
      }
    }
  };
}

export function formatDesignBlock(title, value) {
  const body = typeof value === "string" ? value : JSON.stringify(value, null, 2);
  return `## ${title}\n\n\`\`\`json\n${body}\n\`\`\``;
}
