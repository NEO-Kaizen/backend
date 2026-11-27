export const MappingResponse = {
  type: "object",
  properties: {
    protocol: { type: "string", example: "MAAT-8K3P-9X2M" },
    id: { type: "string", format: "uuid", example: "aaaaaaaa-aaaa-4000-8000-000000000021" },
    scheduledFor: { type: "string", format: "date-time", nullable: true },
    durationMinutes: { type: "integer", nullable: true, minimum: 15, maximum: 480 },
    modality: { type: "string", enum: ["REMOTE", "IN_PERSON"], nullable: true },
    meetingLink: { type: "string", nullable: true },
    location: { type: "string", nullable: true },
    participants: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string", nullable: true },
          name: { type: "string" },
          email: { type: "string", format: "email" },
        },
      },
    },
    notes: { type: "string", nullable: true },
  },
};
