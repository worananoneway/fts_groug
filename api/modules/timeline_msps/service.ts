import sql_query from "@/api/utils/sql_query";
import { Condition, HttpStatusCode, Response } from "@/api/utils/shared_types";
import { Payload } from "./type";

async function create(payload: Payload): Promise<Response> {
    const sql = `
        INSERT INTO public.timeline_msps (
            tlmsp_msp_id,
            tlmsp_ord_id,
            tlmsp_odd_id,
            tlmsp_sr_id,
            tlmsp_event_type,
            tlmsp_quantity_change,
            tlmsp_length_before,
            tlmsp_width_before,
            tlmsp_length_after,
            tlmsp_width_after,
            tlmsp_status_before,
            tlmsp_status_after,
            tlmsp_location_before,
            tlmsp_location_after,
            tlmsp_event_at,
            tlmsp_remark
        ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8,
            $9, $10, $11, $12, $13, $14,
            COALESCE($15, CURRENT_TIMESTAMP), $16
        )
        RETURNING *;
    `;
    try {
        const result = await sql_query(sql, [
            payload.msp_id,
            payload.ord_id ?? null,
            payload.odd_id ?? null,
            payload.sr_id ?? null,
            payload.event_type,
            payload.quantity_change ?? null,
            payload.length_before ?? null,
            payload.width_before ?? null,
            payload.length_after ?? null,
            payload.width_after ?? null,
            payload.status_before ?? null,
            payload.status_after ?? null,
            payload.location_before ?? null,
            payload.location_after ?? null,
            payload.event_at ?? null,
            payload.remark ?? null
        ]);
        if (result.length === 0) {
            console.error("[Service] Failed to create timeline MSP: No row was created.");
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
        console.error("[Service] An error occurred during creating timeline MSP:", error);
        return {
            statuscode: HttpStatusCode.INTERNAL_SERVER_ERROR,
            error: error,
            data: null
        };
    }
}

async function get(conditions: Condition = { sql: "", params: [] }, filter: string = "*"): Promise<Response> {
    const sql = `
        WITH timeline_msps_cte AS (
            SELECT
                tlmsp_id,
                tlmsp_msp_id,
                msp_code AS tlmsp_msp_code,
                tlmsp_ord_id,
                ord_no AS tlmsp_ord_no,
                tlmsp_odd_id,
                odd_status AS tlmsp_odd_status,
                tlmsp_sr_id,
                sr_status AS tlmsp_sr_status,
                tlmsp_event_type,
                tlmsp_quantity_change,
                tlmsp_length_before,
                tlmsp_width_before,
                tlmsp_length_after,
                tlmsp_width_after,
                tlmsp_status_before,
                tlmsp_status_after,
                tlmsp_location_before,
                tlmsp_location_after,
                tlmsp_event_at,
                tlmsp_remark,
                tlmsp_created_at,
                tlmsp_updated_at
            FROM public.timeline_msps
            LEFT JOIN public.ms_plates ON timeline_msps.tlmsp_msp_id = ms_plates.msp_id
            LEFT JOIN public.orders ON timeline_msps.tlmsp_ord_id = orders.ord_id
            LEFT JOIN public.order_details ON timeline_msps.tlmsp_odd_id = order_details.odd_id
            LEFT JOIN public.stock_reservations ON timeline_msps.tlmsp_sr_id = stock_reservations.sr_id
            WHERE 1=1${conditions.sql}
            ORDER BY tlmsp_event_at DESC, tlmsp_created_at DESC
        )
        SELECT ${filter} FROM timeline_msps_cte;
    `;
    try {
        const results = await sql_query(sql, conditions.params);
        if (results.length === 0) {
            console.error("[Service] Failed to find timeline MSP(s): Not found.");
            return {
                statuscode: HttpStatusCode.NOT_FOUND,
                error: "Timeline MSP not found.",
                data: null
            };
        }
        return {
            statuscode: HttpStatusCode.OK,
            error: null,
            data: results
        };
    } catch (error) {
        console.error("[Service] An error occurred during getting timeline MSPs:", error);
        return {
            statuscode: HttpStatusCode.INTERNAL_SERVER_ERROR,
            error: error,
            data: null
        };
    }
}

const service = {
    create,
    get
};

export default service;
