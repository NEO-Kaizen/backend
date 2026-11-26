import { z } from "zod";
import { isOrderedDateRange } from "../../shared/datetime/businessDay.ts";
import type { DashboardQuery } from "../DTOs/reports/Dashboard.dto.ts";

const optionalDate = z.iso.date("Data inválida — use o formato AAAA-MM-DD.").optional();
const optionalId = z.coerce.number().int().positive().optional();

export const dashboardQuerySchema = z
  .object({
    from: optionalDate,
    to: optionalDate,
    situation: z.enum(["open", "closed", "overdue", "unassigned"]).optional(),
    statusId: optionalId,
    categoryId: optionalId,
    priorityId: z.union([z.coerce.number().int().positive(), z.literal("unassigned")]).optional(),
  })
  .strict()
  .refine((query) => isOrderedDateRange(query), {
    message: "A data inicial não pode ser posterior à data final.",
    path: ["from"],
  }) satisfies z.ZodType<DashboardQuery>;
