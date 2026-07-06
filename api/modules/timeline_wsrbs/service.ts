import sql_query from "@/api/utils/sql_query";
import { Condition, HttpStatusCode, Response } from "@/api/utils/shared_types";
import { Payload } from "./type";

async function create(payload: Payload): Promise<Response> {
    const sql = `
        INSERT INTO public.timeline_wsrbs (
            tlwsrb_wsrb_id,
            tlwsrb_ord_id,
            tlwsrb_odd_id,
            tlwsrb_sr_id,
            tlwsrb_event_type,
            tlwsrb_quantity_change,
            tlwsrb_length_before,
            tlwsrb_length_after,
            tlwsrb_status_before,
            tlwsrb_status_after,
            tlwsrb_location_before,
            tlwsrb_location_after,
            tlwsrb_event_at,
            tlwsrb_remark
        ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8,
            $9, $10, $11, $12,
            COALESCE($13, CURRENT_TIMESTAMP), $14
        )
        RETURNING *;
    `;
    try {
        const result = await sql_query(sql, [
            payload.wsrb_id,
            payload.ord_id ?? null,
            payload.odd_id ?? null,
            payload.sr_id ?? null,
            payload.event_type,
            payload.quantity_change ?? null,
            payload.length_before ?? null,
            payload.length_after ?? null,
            payload.status_before ?? null,
            payload.status_after ?? null,
            payload.location_before ?? null,
            payload.location_after ?? null,
            payload.event_at ?? null,
            payload.remark ?? null
        ]);
        if (result.length === 0) {
            console.error("[Service] Failed to create timeline WSRB: No row was created.");
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
        console.error("[Service] An error occurred during creating timeline WSRB:", error);
        return {
            statuscode: HttpStatusCode.INTERNAL_SERVER_ERROR,
            error: error,
            data: null
        };
    }
}

async function get(conditions: Condition = { sql: "", params: [] }, filter: string = "*"): Promise<Response> {
    const sql = `
        WITH timeline_wsrbs_cte AS (
            SELECT
                tlwsrb_id,
                tlwsrb_wsrb_id,
                wsrb_code AS tlwsrb_wsrb_code,
                tlwsrb_ord_id,
                ord_no AS tlwsrb_ord_no,
                tlwsrb_odd_id,
                odd_status AS tlwsrb_odd_status,
                tlwsrb_sr_id,
                sr_status AS tlwsrb_sr_status,
                tlwsrb_event_type,
                tlwsrb_quantity_change,
                tlwsrb_length_before,
                tlwsrb_length_after,
                tlwsrb_status_before,
                tlwsrb_status_after,
                tlwsrb_location_before,
                tlwsrb_location_after,
                tlwsrb_event_at,
                tlwsrb_remark,
                tlwsrb_created_at,
                tlwsrb_updated_at
            FROM public.timeline_wsrbs
            LEFT JOIN public.wastrel_steel_round_bars ON timeline_wsrbs.tlwsrb_wsrb_id = wastrel_steel_round_bars.wsrb_id
            LEFT JOIN public.orders ON timeline_wsrbs.tlwsrb_ord_id = orders.ord_id
            LEFT JOIN public.order_details ON timeline_wsrbs.tlwsrb_odd_id = order_details.odd_id
            LEFT JOIN public.stock_reservations ON timeline_wsrbs.tlwsrb_sr_id = stock_reservations.sr_id
            WHERE 1=1${conditions.sql}
            ORDER BY tlwsrb_event_at DESC, tlwsrb_created_at DESC
        )
        SELECT ${filter} FROM timeline_wsrbs_cte;
    `;
    try {
        const results = await sql_query(sql, conditions.params);
        if (results.length === 0) {
            console.error("[Service] Failed to find timeline WSRB(s): Not found.");
            return {
                statuscode: HttpStatusCode.NOT_FOUND,
                error: "Timeline WSRB not found.",
                data: null
            };
        }
        return {
            statuscode: HttpStatusCode.OK,
            error: null,
            data: results
        };
    } catch (error) {
        console.error("[Service] An error occurred during getting timeline WSRBs:", error);
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
