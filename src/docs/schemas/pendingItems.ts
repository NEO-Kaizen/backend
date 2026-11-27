export const ReviewDecisionValidate = {
  type: "object",
  required: ["id", "decision"],
  properties: {
    id: { type: "string", example: "00000000-0000-4000-8000-000000000099" },
    decision: { type: "string", enum: ["validate"], example: "validate" },
    note: { type: "string", maxLength: 2000, example: "Parece correto." },
  },
};

export const ReviewDecisionReopen = {
  type: "object",
  required: ["id", "decision", "comment"],
  properties: {
    id: { type: "string", example: "00000000-0000-4000-8000-000000000099" },
    decision: { type: "string", enum: ["reopen"], example: "reopen" },
    comment: { type: "string", maxLength: 2000, example: "Precisa de correção no campo X." },
  },
};
