export const TriagemResponse = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid", example: "6f1c2a8e-3d4b-4c5a-9e7f-1a2b3c4d5e6f" },
    adherentToScope: { type: "string", enum: ["Sim", "Nao"], example: "Sim" },
    adherentJustification: { type: "string", example: "" },
    changeCategory: { type: "string", enum: ["Sim", "Nao"], example: "Nao" },
    newCategory: { type: "string", nullable: true },
    preliminaryComplexity: { type: "string", nullable: true },
    perceivedRisks: { type: "string", nullable: true },
    suggestedResponsible: { type: "string", nullable: true },
    suggestedResponsibleJustification: { type: "string", nullable: true },
    exitStatus: { type: "integer", example: 18 },
    result: { type: "string", nullable: true },
    conclusionJustification: { type: "string", nullable: true },
  },
};