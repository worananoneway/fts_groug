import sql_query from "@/api/utils/sql_query";
import { Condition, HttpStatusCode, Response } from "@/api/utils/shared_types";
import { Payload, StockStatus } from "./type";

async function count_duplicate(conditions: Condition): Promise<Response> {
    const sql = `
        SELECT
            (SELECT COUNT(wmsp_id) FROM public.wastrel_ms_plates WHERE wmsp_stock_code = $1${conditions.sql}) AS duplicate_stock_code
    `;
    try {
        const result = await sql_query(sql, conditions.params);
        return {
            statuscode: HttpStatusCode.OK,
            error: null,
            data: result
        };
    } catch (error) {
        console.error("[Service] An error occurred during counting wastrel MS plate duplicates:", error);
        return {
            statuscode: HttpStatusCode.INTERNAL_SERVER_ERROR,
            error,
            data: null
        };
    }
}

async function create(payload: Payload): Promise<Response> {
    const sql = `
        INSERT INTO public.wastrel_ms_plates (
            wmsp_mm_id,
            wmsp_msp_id,
            wmsp_stock_code,
            wmsp_length,
            wmsp_width,
            wmsp_thickness,
            wmsp_quantity,
            wmsp_available_quantity,
            wmsp_loc_id,
            wmsp_location_type,
            wmsp_location,
            wmsp_status,
            wmsp_ord_id,
            wmsp_odd_id,
            wmsp_remark
        ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
        ) RETURNING *;
    `;
    try {
        const quantity = payload.quantity ?? 1;
        const available_quantity = payload.available_quantity ?? quantity;
        const result = await sql_query(sql, [
            payload.mm_id,
            payload.msp_id ?? null,
            payload.stock_code,
            payload.length,
            payload.width,
            payload.thickness,
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
            console.error("[Service] Failed to create wastrel MS plate: No row was created.");
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
        console.error("[Service] An error occurred during creating wastrel MS plate:", error);
        return {
            statuscode: HttpStatusCode.INTERNAL_SERVER_ERROR,
            error,
            data: null
        };
    }
}

async function get(conditions: Condition = { sql: "", params: [] }, filter: string = "*"): Promise<Response> {
    const sql = `
        WITH wmsp_cte AS (
            SELECT
                wmsp_id,
                wmsp_mm_id,
                mm_code AS wmsp_mm_code,
                mm_name AS wmsp_mm_name,
                mm_shape_type::text AS wmsp_mm_shape_type,
                mm_grade AS wmsp_mm_grade,
                wmsp_msp_id,
                msp_code AS wmsp_msp_code,
                wmsp_stock_code,
                wmsp_length,
                wmsp_width,
                wmsp_thickness,
                wmsp_quantity,
                wmsp_available_quantity,
                wmsp_loc_id,
                loc_code AS wmsp_loc_code,
                loc_name AS wmsp_loc_name,
                loc_type::text AS wmsp_loc_type,
                wmsp_location_type::text AS wmsp_location_type,
                wmsp_location,
                wmsp_status::text AS wmsp_status,
                wmsp_ord_id,
                ord_no AS wmsp_ord_no,
                wmsp_odd_id,
                odd_ord_id AS wmsp_odd_ord_id,
                wmsp_remark,
                wmsp_created_at,
                wmsp_updated_at
            FROM public.wastrel_ms_plates
            LEFT JOIN public.material_masters ON wastrel_ms_plates.wmsp_mm_id = material_masters.mm_id
            LEFT JOIN public.ms_plates ON wastrel_ms_plates.wmsp_msp_id = ms_plates.msp_id
            LEFT JOIN public.locations ON wastrel_ms_plates.wmsp_loc_id = locations.loc_id
            LEFT JOIN public.orders ON wastrel_ms_plates.wmsp_ord_id = orders.ord_id
            LEFT JOIN public.order_details ON wastrel_ms_plates.wmsp_odd_id = order_details.odd_id
            WHERE 1=1${conditions.sql}
            ORDER BY wmsp_created_at DESC
        )
        SELECT ${filter} FROM wmsp_cte;
    `;
    try {
        const results = await sql_query(sql, conditions.params);
        if (results.length === 0) {
            console.error("[Service] Failed to find wastrel MS plate(s): Not found.");
            return {
                statuscode: HttpStatusCode.NOT_FOUND,
                error: "Wastrel MS plate not found.",
                data: null
            };
        }
        return {
            statuscode: HttpStatusCode.OK,
            error: null,
            data: results
        };
    } catch (error) {
        console.error("[Service] An error occurred during getting wastrel MS plates:", error);
        return {
            statuscode: HttpStatusCode.INTERNAL_SERVER_ERROR,
            error,
            data: null
        };
    }
}

async function update(id: string, payload: Payload): Promise<Response> {
    const sql = `
        UPDATE public.wastrel_ms_plates
        SET
            wmsp_mm_id = $1,
            wmsp_msp_id = $2,
            wmsp_stock_code = $3,
            wmsp_length = $4,
            wmsp_width = $5,
            wmsp_thickness = $6,
            wmsp_quantity = $7,
            wmsp_available_quantity = $8,
            wmsp_loc_id = $9,
            wmsp_location_type = $10,
            wmsp_location = $11,
            wmsp_ord_id = $12,
            wmsp_odd_id = $13,
            wmsp_remark = $14,
            wmsp_updated_at = NOW()
        WHERE wmsp_id = $15
        RETURNING wmsp_id;
    `;
    try {
        const result = await sql_query(sql, [
            payload.mm_id,
            payload.msp_id ?? null,
            payload.stock_code,
            payload.length,
            payload.width,
            payload.thickness,
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
            console.error("[Service] Failed to update wastrel MS plate: No row was updated.");
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
        console.error("[Service] An error occurred during updating wastrel MS plate:", error);
        return {
            statuscode: HttpStatusCode.INTERNAL_SERVER_ERROR,
            error,
            data: null
        };
    }
}

async function update_status(id: string, status: StockStatus): Promise<Response> {
    const sql = `
        UPDATE public.wastrel_ms_plates
        SET
            wmsp_status = $1,
            wmsp_updated_at = NOW()
        WHERE wmsp_id = $2
        RETURNING wmsp_id;
    `;
    try {
        const result = await sql_query(sql, [status, id]);
        if (result.length === 0) {
            console.error("[Service] Failed to update wastrel MS plate status: No row was updated.");
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
        console.error("[Service] An error occurred during updating wastrel MS plate status:", error);
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
