export const emptyObject = {
  type: "object",
  properties: {},
  additionalProperties: false,
} as const;

export const pinSchema = {
  type: "object",
  properties: {
    title: { type: "string", description: "Short name of the costly clause." },
    detail: { type: "string", description: "Why this costs Maya money or time." },
    quote: { type: "string", description: "Exact span copied from the lease." },
    costNote: { type: "string", description: "Dollar or date consequence." },
  },
  required: ["title", "detail", "quote"],
  additionalProperties: false,
} as const;

export const statusSchema = {
  type: "object",
  properties: {
    id: { type: "string", description: "Finding id from list_findings." },
    status: {
      type: "string",
      enum: ["open", "accepted", "dismissed"],
      description: "accepted = ask the landlord; dismissed = never raise again.",
    },
  },
  required: ["id", "status"],
  additionalProperties: false,
} as const;

export const idSchema = {
  type: "object",
  properties: {
    id: { type: "string", description: "Finding id." },
  },
  required: ["id"],
  additionalProperties: false,
} as const;

export const spanSchema = {
  type: "object",
  properties: {
    quote: {
      type: "string",
      description: "A substring of the lease to read back.",
    },
  },
  required: ["quote"],
  additionalProperties: false,
} as const;

export const fillSchema = {
  type: "object",
  properties: {
    field: {
      type: "string",
      enum: [
        "fullName",
        "email",
        "phone",
        "unit",
        "moveIn",
        "monthlyIncome",
        "hasPet",
      ],
      description: "Application field to write.",
    },
    value: { type: "string", description: "Value to set. hasPet is yes or no." },
  },
  required: ["field", "value"],
  additionalProperties: false,
} as const;

export const listSchema = {
  type: "object",
  properties: {
    status: {
      type: "string",
      enum: ["all", "open", "accepted", "dismissed"],
      description: "Filter. Default all.",
    },
  },
  additionalProperties: false,
} as const;
