import sql_query from "@/api/utils/sql_query";
import { Condition, HttpStatusCode, Response } from "@/api/utils/shared_types";
import { Payload, StockStatus } from "./type";

async function count_duplicate(conditions: Condition): Promise<Response> {
    const sql = `
        SELECT
            (SELECT COUNT(wsrb_id) FROM public.wastrel_steel_round_bars WHERE wsrb_code = $1${conditions.sql}) AS duplicate_code
    `;
    try {
        const result = await sql_query(sql, conditions.params);
        return {
            statuscode: HttpStatusCode.OK,
            error: null,
            data: result
        };
    } catch (error) {
        console.error("[Service] An error occurred during counting wastrel steel round bar duplicates:", error);
        return {
            statuscode: HttpStatusCode.INTERNAL_SERVER_ERROR,
            error,
            data: null
        };
    }
}

async function create(payload: Payload): Promise<Response> {
    const sql = `
        INSERT INTO public.wastrel_steel_round_bars (
            wsrb_mm_id,
            wsrb_srb_id,
            wsrb_code,
            wsrb_diameter,
            wsrb_length,
            wsrb_quantity,
            wsrb_available_quantity,
            wsrb_loc_id,
            wsrb_location_type,
            wsrb_location,
            wsrb_status,
            wsrb_ord_id,
            wsrb_odd_id,
            wsrb_remark
        ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
        ) RETURNING *;
    `;
    try {
        const quantity = payload.quantity ?? 1;
        const available_quantity = payload.available_quantity ?? quantity;
        const result = await sql_query(sql, [
            payload.mm_id,
            payload.srb_id ?? null,
            payload.code,
            payload.diameter,
            payload.length,
            quantity,
            available_quantity,
            payload.loc_id ?? null,
            payload.location_type ?? null,
            payload.location ?? null,
            StockStatus.RESERVED,
            payload.ord_id ?? null,
            payload.odd_id ?? null,
            payload.remark ?? null
        ]);
        if (result.length === 0) {
            console.error("[Service] Failed to create wastrel steel round bar: No row was created.");
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
        console.error("[Service] An error occurred during creating wastrel steel round bar:", error);
        return {
            statuscode: HttpStatusCode.INTERNAL_SERVER_ERROR,
            error,
            data: null
        };
    }
}

async function get(conditions: Condition = { sql: "", params: [] }, filter: string = "*"): Promise<Response> {
    const sql = `
        WITH wsrb_cte AS (
            SELECT
                wsrb_id,
                wsrb_mm_id,
                mm_code AS wsrb_mm_code,
                mm_name AS wsrb_mm_name,
                mm_shape_type::text AS wsrb_mm_shape_type,
                mm_grade AS wsrb_mm_grade,
                wsrb_srb_id,
                srb_code AS wsrb_srb_code,
                wsrb_code,
                wsrb_diameter,
                wsrb_length,
                wsrb_quantity,
                wsrb_available_quantity,
                wsrb_loc_id,
                loc_code AS wsrb_loc_code,
                loc_name AS wsrb_loc_name,
                loc_type::text AS wsrb_loc_type,
                wsrb_location_type::text AS wsrb_location_type,
                wsrb_location,
                wsrb_status::text AS wsrb_status,
                wsrb_ord_id,
                ord_no AS wsrb_ord_no,
                wsrb_odd_id,
                odd_ord_id AS wsrb_odd_ord_id,
                wsrb_remark,
                wsrb_created_at,
                wsrb_updated_at
            FROM public.wastrel_steel_round_bars
            LEFT JOIN public.material_masters ON wastrel_steel_round_bars.wsrb_mm_id = material_masters.mm_id
            LEFT JOIN public.steel_round_bars ON wastrel_steel_round_bars.wsrb_srb_id = steel_round_bars.srb_id
            LEFT JOIN public.locations ON wastrel_steel_round_bars.wsrb_loc_id = locations.loc_id
            LEFT JOIN public.orders ON wastrel_steel_round_bars.wsrb_ord_id = orders.ord_id
            LEFT JOIN public.order_details ON wastrel_steel_round_bars.wsrb_odd_id = order_details.odd_id
            WHERE 1=1${conditions.sql}
            ORDER BY wsrb_created_at DESC
        )
        SELECT ${filter} FROM wsrb_cte;
    `;
    try {
        const results = await sql_query(sql, conditions.params);
        if (results.length === 0) {
            console.error("[Service] Failed to find wastrel steel round bar(s): Not found.");
            return {
                statuscode: HttpStatusCode.NOT_FOUND,
                error: "Wastrel steel round bar not found.",
                data: null
            };
        }
        return {
            statuscode: HttpStatusCode.OK,
            error: null,
            data: results
        };
    } catch (error) {
        console.error("[Service] An error occurred during getting wastrel steel round bars:", error);
        return {
            statuscode: HttpStatusCode.INTERNAL_SERVER_ERROR,
            error,
            data: null
        };
    }
}

async function update(id: string, payload: Payload): Promise<Response> {
    const sql = `
        UPDATE public.wastrel_steel_round_bars
        SET
            wsrb_mm_id = $1,
            wsrb_srb_id = $2,
            wsrb_code = $3,
            wsrb_diameter = $4,
            wsrb_length = $5,
            wsrb_quantity = $6,
            wsrb_available_quantity = $7,
            wsrb_loc_id = $8,
            wsrb_location_type = $9,
            wsrb_location = $10,
            wsrb_ord_id = $11,
            wsrb_odd_id = $12,
            wsrb_remark = $13,
            wsrb_updated_at = NOW()
        WHERE wsrb_id = $14
        RETURNING wsrb_id;
    `;
    try {
        const result = await sql_query(sql, [
            payload.mm_id,
            payload.srb_id ?? null,
            payload.code,
            payload.diameter,
            payload.length,
            payload.quantity ?? 1,
            payload.available_quantity ?? (payload.quantity ?? 1),
            payload.loc_id ?? null,
            payload.location_type ?? null,
            payload.location ?? null,
            payload.ord_id ?? null,
            payload.odd_id ?? null,
            payload.remark ?? null,
            id
        ]);
        if (result.length === 0) {
            console.error("[Service] Failed to update wastrel steel round bar: No row was updated.");
            return {
                statuscode: HttpStatusCode.NOT_FOUND,
                error: "No row was updated.",
                data: null
            };
        }
        return {
            statuscode: HttpStatusCode.NO_CONTENT,
            error: null,
            data: null
        };
    } catch (error) {
        console.error("[Service] An error occurred during updating wastrel steel round bar:", error);
        return {
            statuscode: HttpStatusCode.INTERNAL_SERVER_ERROR,
            error,
            data: null
        };
    }
}

async function update_status(id: string, status: StockStatus): Promise<Response> {
    const sql = `
        UPDATE public.wastrel_steel_round_bars
        SET
            wsrb_status = $1,
            wsrb_updated_at = NOW()
        WHERE wsrb_id = $2
        RETURNING wsrb_id;
    `;
    try {
        const result = await sql_query(sql, [status, id]);
        if (result.length === 0) {
            console.error("[Service] Failed to update wastrel steel round bar status: No row was updated.");
            return {
                statuscode: HttpStatusCode.NOT_FOUND,
                error: "No row was updated.",
                data: null
            };
        }
        return {
            statuscode: HttpStatusCode.NO_CONTENT,
            error: null,
            data: null
        };
    } catch (error) {
        console.error("[Service] An error occurred during updating wastrel steel round bar status:", error);
        return {
            statuscode: HttpStatusCode.INTERNAL_SERVER_ERROR,
            error,
            data: null
        };
    }
}

const service = {
    count_duplicate,
    create,
    get,
    update,
    update_status
};

export default service;
