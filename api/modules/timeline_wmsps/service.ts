import sql_query from "@/api/utils/sql_query";
import { Payload } from "./type";
import { Condition, Response, HttpStatusCode } from "@/api/utils/shared_types";

async function create(payload: Payload, emp_id: string | null): Promise<Response> {
    const sql = `
        INSERT INTO public.timeline_wmsps (
            tlwmsp_wmsp_id,
            tlwmsp_ord_id,
            tlwmsp_odd_id,
            tlwmsp_sr_id,
            tlwmsp_event_type,
            tlwmsp_quantity_change,
            tlwmsp_length_before,
            tlwmsp_width_before,
            tlwmsp_length_after,
            tlwmsp_width_after,
            tlwmsp_status_before,
            tlwmsp_status_after,
            tlwmsp_location_before,
            tlwmsp_location_after,
            tlwmsp_remark,
            tlwmsp_emp_id
        ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
        ) RETURNING *;
    `;
    try {
        const result = await sql_query(sql, [
            payload.wmsp_id,
            payload.ord_id,
            payload.odd_id,
            payload.sr_id,
            payload.event_type,
            payload.quantity_change,
            payload.length_before,
            payload.width_before,
            payload.length_after,
            payload.width_after,
            payload.status_before,
            payload.status_after,
            payload.location_before,
            payload.location_after,
            payload.remark,
            emp_id
        ]);
        if (result.length === 0) {
            console.error("[Service] Failed to create timeline wastrel MS plate: No row was created.");
            return {
                statuscode: HttpStatusCode.INTERNAL_SERVER_ERROR,
                error: "No row was created.",
                data: null
            };
        }
        return {
            statuscode: HttpStatusCode.CREATED,
            error: null,
            data: result
        };
    } catch (error) {
        console.error("[Service] An error occurred during creating timeline wastrel MS plate:", error);
        return {
            statuscode: HttpStatusCode.INTERNAL_SERVER_ERROR,
            error: error,
            data: null
        };
    }
}
async function get(conditions: Condition = { sql: "", params: [] }, filter: string = "*"): Promise<Response> {
    const sql = `
        WITH timeline_wmsp_cte AS (
            SELECT
                tlwmsp_id,
                tlwmsp_wmsp_id,
                tlwmsp_ord_id,
                tlwmsp_odd_id,
                tlwmsp_sr_id,
                tlwmsp_event_type,
                tlwmsp_quantity_change,
                tlwmsp_length_before,
                tlwmsp_width_before,
                tlwmsp_length_after,
                tlwmsp_width_after,
                tlwmsp_status_before,
                tlwmsp_status_after,
                tlwmsp_location_before,
                tlwmsp_location_after,
                tlwmsp_event_at,
                tlwmsp_remark,
                tlwmsp_created_at,
                tlwmsp_updated_at,
                tlwmsp_emp_id
            FROM public.timeline_wmsps
            WHERE 1=1${conditions.sql}
            ORDER BY tlwmsp_created_at DESC
        )
        SELECT ${filter} FROM timeline_wmsp_cte;
    `;
    try {
        const results = await sql_query(sql, conditions.params);
        if (results.length === 0) {
            console.error("[Service] Failed to get timeline wastrel MS plates: Timeline wastrel MS plate not found.");
            return {
                statuscode: HttpStatusCode.NOT_FOUND,
                error: "Timeline wastrel MS plate not found.",
                data: null
            };
        }
        return {
            statuscode: HttpStatusCode.OK,
            error: null,
            data: results
        };
    } catch (error) {
        console.error("[Service] An error occurred during getting timeline wastrel MS plates:", error);
        return {
            statuscode: HttpStatusCode.INTERNAL_SERVER_ERROR,
            error: error,
            data: null
        };
    }
}

export default {
    create,
    get
};
