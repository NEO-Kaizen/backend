export const json = (ref: string) => ({
  content: { "application/json": { schema: { $ref: `#/components/schemas/${ref}` } } },
});

export const error = (description: string, schema = "ErrorResponse") => ({
  description,
  ...json(schema),
});
