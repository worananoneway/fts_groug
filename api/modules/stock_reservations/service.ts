import sql_query from "@/api/utils/sql_query";
import { Condition, HttpStatusCode, Response } from "@/api/utils/shared_types";
import { Payload, ReservationStatus } from "./type";

async function create(payload: Payload): Promise<Response> {
    const sql = `
        INSERT INTO public.stock_reservations (
            sr_po_id,
            sr_podetail_id,
            sr_stock_type,
            sr_stock_id,
            sr_reserved_quantity,
            sr_reserved_length_mm,
            sr_reserved_width_mm,
            sr_status
        ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8
        ) RETURNING *;
    `;
    try {
        const result = await sql_query(sql, [
            payload.po_id,
            payload.podetail_id,
            payload.stock_type,
            payload.stock_id,
            payload.reserved_quantity ?? 1,
            payload.reserved_length_mm ?? null,
            payload.reserved_width_mm ?? null,
            payload.status ?? ReservationStatus.RESERVED
        ]);
        if (result.length === 0) {
            console.error("[Service] Failed to create stock reservation: No row was created.");
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
        console.error("[Service] An error occurred during creating stock reservation:", error);
        return {
            statuscode: HttpStatusCode.INTERNAL_SERVER_ERROR,
            error,
            data: null
        };
    }
}

async function get(conditions: Condition = { sql: "", params: [] }, filter: string = "*"): Promise<Response> {
    const sql = `
        WITH stock_reservation_cte AS (
            SELECT
                sr.sr_id,
                sr.sr_po_id,
                ord.ord_no AS sr_ord_no,
                sr.sr_podetail_id,
                odd.odd_shape_type::text AS sr_odd_shape_type,
                odd.odd_required_length_mm AS sr_odd_required_length_mm,
                odd.odd_required_width_mm AS sr_odd_required_width_mm,
                odd.odd_required_thickness_mm AS sr_odd_required_thickness_mm,
                odd.odd_required_diameter_mm AS sr_odd_required_diameter_mm,
                odd.odd_quantity AS sr_odd_quantity,
                sr.sr_stock_type::text AS sr_stock_type,
                sr.sr_stock_id,
                COALESCE(srb.srb_code, wsrb.wsrb_code, msp.msp_code, wmsp.wmsp_stock_code) AS sr_stock_code,
                COALESCE(srb.srb_status::text, wsrb.wsrb_status::text, msp.msp_status::text, wmsp.wmsp_status::text) AS sr_stock_status,
                sr.sr_reserved_quantity,
                sr.sr_reserved_length_mm,
                sr.sr_reserved_width_mm,
                sr.sr_status::text AS sr_status,
                sr.sr_reserved_at,
                sr.sr_used_at,
                sr.sr_created_at,
                sr.sr_updated_at
            FROM public.stock_reservations sr
            LEFT JOIN public.orders ord ON sr.sr_po_id = ord.po_id
            LEFT JOIN public.order_details odd ON sr.sr_podetail_id = odd.podetail_id
            LEFT JOIN public.steel_round_bars srb
                ON sr.sr_stock_type::text = 'Round_bar'
                AND sr.sr_stock_id = srb.srb_id
            LEFT JOIN public.wastrel_steel_round_bars wsrb
                ON sr.sr_stock_type::text = 'Wastrel_round_bar'
                AND sr.sr_stock_id = wsrb.wsrb_id
            LEFT JOIN public.ms_plates msp
                ON sr.sr_stock_type::text = 'Ms_plate'
                AND sr.sr_stock_id = msp.msp_id
            LEFT JOIN public.wastrel_ms_plates wmsp
                ON sr.sr_stock_type::text = 'Wastrel_ms_plate'
                AND sr.sr_stock_id = wmsp.wmsp_id
            WHERE 1=1${conditions.sql}
            ORDER BY sr.sr_created_at DESC
        )
        SELECT ${filter || "*"} FROM stock_reservation_cte;
    `;
    try {
        const results = await sql_query(sql, conditions.params);
        if (results.length === 0) {
            console.error("[Service] Failed to find stock reservation(s): Not found.");
            return {
                statuscode: HttpStatusCode.NOT_FOUND,
                error: "Stock reservation not found.",
                data: null
            };
        }
        return {
            statuscode: HttpStatusCode.OK,
            error: null,
            data: results
        };
    } catch (error) {
        console.error("[Service] An error occurred during getting stock reservations:", error);
        return {
            statuscode: HttpStatusCode.INTERNAL_SERVER_ERROR,
            error,
            data: null
        };
    }
}

async function soft_delete(id: string): Promise<Response> {
    const sql = `
        UPDATE public.stock_reservations
        SET
            sr_status = $2,
            sr_updated_at = NOW()
        WHERE sr_id = $1
        RETURNING sr_id;
    `;
    try {
        const result = await sql_query(sql, [id, ReservationStatus.INACTIVE]);
        if (result.length === 0) {
            console.error("[Service] Failed to delete stock reservation: No row was deleted.");
            return {
                statuscode: HttpStatusCode.NOT_FOUND,
                error: "No row was deleted.",
                data: null
            };
        }
        return {
            statuscode: HttpStatusCode.NO_CONTENT,
            error: null,
            data: null
        };
    } catch (error) {
        console.error("[Service] An error occurred during deleting stock reservation:", error);
        return {
            statuscode: HttpStatusCode.INTERNAL_SERVER_ERROR,
            error,
            data: null
        };
    }
}

const service = {
    create,
    get,
    soft_delete
};

export default service;
