import sql_query from "@/api/utils/sql_query";
import { Condition, HttpStatusCode, Response } from "@/api/utils/shared_types";
import { Payload } from "./type";

async function create(payload: Payload): Promise<Response> {
    const sql = `
        INSERT INTO public.timeline_srbs (
            tlsrb_srb_id,
            tlsrb_po_id,
            tlsrb_podetail_id,
            tlsrb_sr_id,
            tlsrb_event_type,
            tlsrb_quantity_change,
            tlsrb_length_before,
            tlsrb_length_after,
            tlsrb_status_before,
            tlsrb_status_after,
            tlsrb_location_before,
            tlsrb_location_after,
            tlsrb_event_at,
            tlsrb_remark
        ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8,
            $9, $10, $11, $12,
            COALESCE($13, CURRENT_TIMESTAMP), $14
        )
        RETURNING *;
    `;
    try {
        const result = await sql_query(sql, [
            payload.srb_id,
            payload.po_id ?? null,
            payload.podetail_id ?? null,
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
            console.error("[Service] Failed to create timeline SRB: No row was created.");
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
        console.error("[Service] An error occurred during creating timeline SRB:", error);
        return {
            statuscode: HttpStatusCode.INTERNAL_SERVER_ERROR,
            error: error,
            data: null
        };
    }
}

async function get(conditions: Condition = { sql: "", params: [] }, filter: string = "*"): Promise<Response> {
    const sql = `
        WITH timeline_srbs_cte AS (
            SELECT
                tlsrb_id,
                tlsrb_srb_id,
                srb_code AS tlsrb_srb_code,
                tlsrb_po_id,
                po_number AS tlsrb_ord_no,
                tlsrb_podetail_id,
                podetail_status AS tlsrb_odd_status,
                tlsrb_sr_id,
                sr_status AS tlsrb_sr_status,
                tlsrb_event_type,
                tlsrb_quantity_change,
                tlsrb_length_before,
                tlsrb_length_after,
                tlsrb_status_before,
                tlsrb_status_after,
                tlsrb_location_before,
                tlsrb_location_after,
                tlsrb_event_at,
                tlsrb_remark,
                tlsrb_created_at,
                tlsrb_updated_at
            FROM public.timeline_srbs
            LEFT JOIN public.steel_round_bars ON timeline_srbs.tlsrb_srb_id = steel_round_bars.srb_id
            LEFT JOIN public.purchase_orders ON timeline_srbs.tlsrb_po_id = purchase_orders.po_id
            LEFT JOIN public.purchase_orders_details ON timeline_srbs.tlsrb_podetail_id = purchase_orders_details.podetail_id
            LEFT JOIN public.stock_reservations ON timeline_srbs.tlsrb_sr_id = stock_reservations.sr_id
            WHERE 1=1${conditions.sql}
            ORDER BY tlsrb_event_at DESC, tlsrb_created_at DESC
        )
        SELECT ${filter} FROM timeline_srbs_cte;
    `;
    try {
        const results = await sql_query(sql, conditions.params);
        if (results.length === 0) {
            console.error("[Service] Failed to find timeline SRB(s): Not found.");
            return {
                statuscode: HttpStatusCode.NOT_FOUND,
                error: "Timeline SRB not found.",
                data: null
            };
        }
        return {
            statuscode: HttpStatusCode.OK,
            error: null,
            data: results
        };
    } catch (error) {
        console.error("[Service] An error occurred during getting timeline SRBs:", error);
        return {
            statuscode: HttpStatusCode.INTERNAL_SERVER_ERROR,
            error: error,
            data: null
        };
    }
}

export async function get_srbs(id: string) {
    const sql = `
    SELECT
        srb_available_quantity,
        srb_quantity
    FROM public.steel_round_bars
    WHERE srb_id = $1;
    `;
    try {
        const results = await sql_query(sql, [id]);
        return {
            statuscode: HttpStatusCode.OK,
            error: null,
            data: results[0]
        };
    } catch (error) {
        console.error(`[Service] An error occurred during getting SRB:`, error);
        return {
            statuscode: HttpStatusCode.INTERNAL_SERVER_ERROR,
            error: error,
            data: null
        };
    }
}

export async function update_srbs(id: string, payload: any) {
    const sql = `
        UPDATE public.steel_round_bars
        SET
            srb_available_quantity = $2,
            srb_quantity = $3
        WHERE srb_id = $1;
    `;
    try {
        await sql_query(sql, [id, payload.total_available_quantity, payload.total_quantity]);
        return {
            statuscode: HttpStatusCode.OK,
            error: null,
            data: null
        };
    } catch (error) {
        console.error(`[Service] An error occurred during updating SRB:`, error);
        return {
            statuscode: HttpStatusCode.INTERNAL_SERVER_ERROR,
            error: error,
            data: null
        };
    }
}

const service = {
    create,
    get,
    get_srbs,
    update_srbs,
};

export default service;
