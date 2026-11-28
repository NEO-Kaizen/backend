export const AssigneeSummary = {
  type: "object",
  required: ["id", "name", "email", "jobTitle", "capacity"],
  properties: {
    id: { type: "string", format: "uuid" },
    name: { type: "string" },
    email: { type: "string", format: "email" },
    jobTitle: { type: "string", nullable: true },
    capacity: { type: "integer" },
  },
};

export const RequestMutationAcknowledgement = {
  type: "object",
  required: ["protocol", "updated"],
  properties: {
    protocol: { type: "string", example: "MAAT-8K3P-9X2M" },
    updated: { type: "boolean", enum: [true] },
  },
};

export const RequestInternalDetail = {
  type: "object",
  required: [
    "protocol",
    "status",
    "priority",
    "prioritization",
    "assignee",
    "correctionAlert",
    "pendingSummary",
    "unread",
    "requester",
    "demand",
    "operational",
    "schedulePreferences",
    "mappingDate",
    "meeting",
    "attachments",
    "openedAt",
    "lastUpdate",
    "internalObservations",
  ],
  properties: {
    protocol: { type: "string" },
    status: { type: "string" },
    priority: { type: "string", nullable: true },
    prioritization: {
      type: "object",
      required: ["score", "maxScore", "label"],
      properties: {
        score: { type: "number", nullable: true },
        maxScore: { type: "number", example: 50 },
        label: { type: "string", nullable: true },
      },
    },
    assignee: {
      type: "object",
      nullable: true,
      required: ["id", "name"],
      properties: {
        id: { type: "string", nullable: true },
        name: { type: "string", nullable: true },
        email: { type: "string", format: "email", nullable: true },
      },
    },
    mappingAssignee: {
      type: "object",
      nullable: true,
      required: ["id", "name"],
      properties: {
        id: { type: "string", nullable: true },
        name: { type: "string", nullable: true },
        email: { type: "string", format: "email", nullable: true },
      },
    },
    correctionAlert: {
      type: "object",
      nullable: true,
      properties: {
        count: { type: "integer" },
        batchId: { type: "string" },
      },
    },
    pendingSummary: {
      type: "object",
      required: ["total", "requested", "responded", "validated"],
      properties: {
        total: { type: "integer" },
        requested: { type: "integer" },
        responded: { type: "integer" },
        validated: { type: "integer" },
      },
    },
    unread: {
      type: "object",
      required: ["count", "hasUnread", "lastUnreadAt"],
      properties: {
        count: { type: "integer" },
        hasUnread: { type: "boolean" },
        lastUnreadAt: { type: "string", format: "date-time", nullable: true },
      },
    },
    requester: {
      type: "object",
      required: ["fullName", "corporateEmail", "area", "manager"],
      properties: {
        fullName: { type: "string" },
        corporateEmail: { type: "string", format: "email" },
        area: { type: "string" },
        department: { type: "string" },
        manager: { type: "string" },
        additionalContact: { type: "string" },
      },
    },
    demand: {
      type: "object",
      required: [
        "title",
        "requestType",
        "category",
        "processName",
        "description",
        "problem",
        "expectedResult",
        "justification",
      ],
      properties: {
        title: { type: "string" },
        requestType: { type: "string" },
        category: { type: "string" },
        processName: { type: "string" },
        description: { type: "string" },
        problem: { type: "string" },
        expectedResult: { type: "string" },
        justification: { type: "string" },
      },
    },
    operational: {
      type: "object",
      required: [
        "processDescription",
        "processSteps",
        "systemsUsed",
        "executionFrequency",
        "volumetry",
        "peopleInvolved",
        "averageExecutionTime",
        "monthlyEffortHours",
        "hasManualControls",
        "mainRisks",
        "clientImpact",
        "operationalImpact",
        "desiredDeadline",
        "perceivedCriticality",
      ],
      properties: {
        processDescription: { type: "string" },
        processSteps: { type: "string" },
        systemsUsed: { type: "string" },
        executionFrequency: { type: "string" },
        volumetry: { type: "string" },
        peopleInvolved: { type: "integer" },
        averageExecutionTime: { type: "string" },
        monthlyEffortHours: { type: "number" },
        hasManualControls: {
          oneOf: [{ type: "boolean", enum: [false] }, { type: "string" }],
        },
        mainRisks: { type: "string" },
        clientImpact: { type: "string" },
        operationalImpact: { type: "string" },
        desiredDeadline: { type: "string", format: "date" },
        perceivedCriticality: { type: "string" },
      },
    },
    complementary: {
      type: "object",
      properties: {
        hasProcessDocumentation: {
          oneOf: [{ type: "boolean", enum: [false] }, { type: "string" }],
        },
        hasSimilarSolution: { oneOf: [{ type: "boolean", enum: [false] }, { type: "string" }] },
        dependsOnOtherAreas: { oneOf: [{ type: "boolean", enum: [false] }, { type: "string" }] },
        handlesRestrictedInfo: { oneOf: [{ type: "boolean", enum: [false] }, { type: "string" }] },
        additionalNotes: { type: "string" },
      },
    },
    schedulePreferences: { type: "array", items: { type: "string" }, nullable: true },
    mappingDate: { type: "string", format: "date", nullable: true },
    meeting: {
      type: "object",
      nullable: true,
      required: ["scheduledFor", "link"],
      properties: {
        scheduledFor: { type: "string", format: "date-time" },
        link: { type: "string", nullable: true },
      },
    },
    attachments: {
      type: "array",
      items: {
        type: "object",
        required: ["fileName", "mimeType", "sizeBytes", "downloadUrl", "canDownload"],
        properties: {
          fileName: { type: "string" },
          mimeType: { type: "string" },
          sizeBytes: { type: "integer" },
          downloadUrl: { type: "string", nullable: true },
          canDownload: { type: "boolean" },
        },
      },
    },
    openedAt: { type: "string", format: "date-time" },
    lastUpdate: { type: "string", format: "date-time" },
    internalObservations: { type: "string", nullable: true },
  },
};

export const AssignRequestResponse = {
  type: "object",
  required: ["protocol", "assignee", "status"],
  properties: {
    protocol: { type: "string" },
    assignee: {
      type: "object",
      nullable: true,
      required: ["id", "name", "email"],
      properties: {
        id: { type: "string" },
        name: { type: "string" },
        email: { type: "string", format: "email" },
      },
    },
    status: { type: "string" },
  },
};

export const RequestStatusChangeResponse = {
  type: "object",
  required: ["protocol", "status", "previous", "next", "lastUpdate"],
  properties: {
    protocol: { type: "string" },
    status: { type: "string" },
    previous: { type: "string" },
    next: { type: "string" },
    lastUpdate: { type: "string", format: "date-time" },
  },
};

export const InternalRequestUpdate = {
  type: "object",
  required: ["requester", "demand", "operational"],
  properties: {
    requester: {
      type: "object",
      required: ["area", "manager"],
      properties: {
        area: { type: "string" },
        department: { type: "string" },
        manager: { type: "string" },
        additionalContact: { type: "string" },
      },
    },
    demand: { $ref: "#/components/schemas/RequestInternalDetail/properties/demand" },
    operational: {
      $ref: "#/components/schemas/RequestInternalDetail/properties/operational",
    },
    complementary: {
      $ref: "#/components/schemas/RequestInternalDetail/properties/complementary",
    },
  },
};
