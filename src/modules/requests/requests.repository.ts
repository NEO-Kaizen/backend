import db from "../../database/conection.ts"
import { requestCategoryToIdMAP, type RequesterBlock, type RequesterTable } from "../../shared/types/requests.ts"
import type { CreateRequestPayload } from "../DTOs/requests/RequestRequests.dto.ts"
import type { CreateRequestResponse } from "../DTOs/requests/RequestResponse.dto.ts"

export async function findRequesterByEmail(email: RequesterBlock["corporateEmail"]) {

    const requesterExist: RequesterTable | null = await db("requesters").where({ corporateEmail: email }).first()

    if (requesterExist) {
        return requesterExist
    }

    return null

}

export async function saveRequester(requester: RequesterBlock) {
    return await db("requester").insert({
        full_name: requester.fullName,
        corporate_email: requester.corporateEmail,
        requester_area: requester.area,
        department: requester.department,
        manager_name: requester.manager,
        additional_contact: requester.additionalContact,
        created_at: db.fn.now(),
        updated_at: db.fn.now(),
    }).returning("id") as number
}

export async function saveRequest(request: CreateRequestPayload, requesterId: number) {
    return await db("request").insert({
        protocol:"MAAT-TEMP-TEMP", // Adiconar logica de geração de protocolo
        requester_id: requesterId,
        category_id: requestCategoryToIdMAP[request.demand.category],
        current_process_name: request.demand.processName,
        title: request.demand.title,
        necessity_description: request.demand.description,
        result_justification: request.demand.justification,
        monthly_approximated_volumetry: request.operational.volumetry,
        item_average_execution_time: request.operational.averageExecutionTime,
        perceived_operational_impact: request.operational.operationalImpact,
        desired_deadline: request.operational.desiredDeadline,
        prefarable_schedule_mapping: !request.schedulePreferences ? null : request.schedulePreferences,
        status: "Solicitação enviada",
        analist_id: null,
        total_score: null,
        created_at: db.fn.now(),
        updated_at: db.fn.now(),
    }).returning(['protocol', 'status', 'createdAt']) as CreateRequestResponse
} 


