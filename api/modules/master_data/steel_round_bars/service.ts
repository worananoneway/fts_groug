import sql_query from "@/api/utils/sql_query";
import { ErrorField, ErrorMessage, Payload } from "./type";
import { Condition, Response, HttpStatusCode,  } from "@/api/utils/shared_types";
const module_name = 'steel_round_bars';

async function count_duplicate(conditions: Condition): Promise<Response> {
    const sql = `
        SELECT
            (SELECT COUNT(srb_id) FROM public.steel_round_bars WHERE srb_code = $1${conditions.sql}) AS duplicate_code
    `;
    try {
        const result = await sql_query(sql, [
            ...conditions.params
        ]);
        if (result[0]?.duplicate_code > 0) {
            return {
                statuscode: HttpStatusCode.CONFLICT,
                error: [{ field: ErrorField.CODE, message: ErrorMessage.CODE_DUPLICATE }],
                data: result
            }
        }
        return {
            statuscode: HttpStatusCode.OK,
            error: null,
            data: result
        };
    } catch (error) {
        console.error(`[Service] An error occurred during counting duplicates:`, error);
        return {
            statuscode: HttpStatusCode.INTERNAL_SERVER_ERROR,
            error: error,
            data: null
        };
    }
}
async function create(payload: Payload, emp_id: string): Promise<Response> {
    const sql = `
        INSERT INTO public.steel_round_bars (
            srb_mm_id,
            srb_code,
            srb_diameter,
            srb_length,
            srb_quantity,
            srb_available_quantity,
            srb_received_date,
            srb_remark,
            srb_emp_id,
            srb_status
        ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, 'Active'
        ) RETURNING *;
    `;
    try {
        const quantity = payload.quantity ?? 1;
        const available_quantity = payload.available_quantity ?? quantity;
        const result = await sql_query(sql, [
            payload.mm_id,
            payload.code,
            payload.diameter,
            payload.length,
            quantity,
            available_quantity,
            payload.received_date,
            payload.remark,
            emp_id
        ]);
        if (result.length === 0) {
            console.error(`[Service] Failed to create ${module_name}: No row was created.`);
            return {
                statuscode: HttpStatusCode.INTERNAL_SERVER_ERROR,
                error: `No row was created.`,
                data: null
            };
        }
        return {
            statuscode: HttpStatusCode.CREATED,
            error: null,
            data: result
        };
    } catch (error) {
        console.error(`[Service] An error occurred during creating ${module_name}:`, error);
        return {
            statuscode: HttpStatusCode.INTERNAL_SERVER_ERROR,
            error: error,
            data: null
        };
    }
}
async function get(conditions: Condition = { sql: ``, params: [] }, filter: string = `*`): Promise<Response> {
    const sql = `
        WITH ${module_name}_cte AS (
            SELECT
                srb_id,
                srb_mm_id,
                mm_code AS srb_mm_code,
                mm_name AS srb_mm_name,
                mm_shape_type AS srb_mm_shape_type,
                mm_grade AS srb_mm_grade,
                srb_code,
                srb_diameter,
                srb_length,
                srb_quantity,
                srb_available_quantity,
                srb_status,
                srb_received_date,
                srb_remark,
                srb_created_at,
                srb_updated_at
            FROM public.steel_round_bars
            LEFT JOIN public.material_masters ON steel_round_bars.srb_mm_id = material_masters.mm_id
            WHERE 1=1 AND srb_status != 'Inactive' ${conditions.sql}
            ORDER BY srb_created_at DESC
        )
        SELECT ${filter} FROM ${module_name}_cte;
    `;
    try {
        const results = await sql_query(sql, conditions.params);
        if (results.length === 0) {
            console.error(`[Service] Failed to find ${module_name}(s): Not found.`);
            return {
                statuscode: HttpStatusCode.NOT_FOUND,
                error: `${module_name} not found.`,
                data: null
            };
        }
        return {
            statuscode: HttpStatusCode.OK,
            error: null,
            data: results
        };
    } catch (error) {
        console.error(`[Service] An error occurred during getting ${module_name}s:`, error);
        return {
            statuscode: HttpStatusCode.INTERNAL_SERVER_ERROR,
            error: error,
            data: null
        };
    }
}
async function soft_delete(id: string, emp_id: string): Promise<Response> {
    const sql = `
        UPDATE public.steel_round_bars
        SET
            srb_status = 'Deleted',
            srb_emp_id = $2
        WHERE srb_id = $1
        RETURNING srb_id;
    `;
    try {
        const result = await sql_query(sql, [id, emp_id]);
        if (result.length === 0) {
            console.error(`[Service] Failed to delete ${module_name}: No row was deleted.`);
            return {
                statuscode: HttpStatusCode.NOT_FOUND,
                error: `No row was deleted.`,
                data: null
            };
        }
        return {
            statuscode: HttpStatusCode.NO_CONTENT,
            error: null,
            data: null
        };
    } catch (error) {
        console.error(`[Service] An error occurred during deleting ${module_name}:`, error);
        return {
            statuscode: HttpStatusCode.INTERNAL_SERVER_ERROR,
            error: error,
            data: null
        };
    }
}
async function update(id: string, payload: Payload, emp_id: string): Promise<Response> {
    const sql = `
        UPDATE public.steel_round_bars
        SET
            srb_mm_id = $2,
            srb_code = $3,
            srb_diameter = $4,
            srb_length = $5,
            srb_quantity = $6,
            srb_available_quantity = $7,
            srb_received_date = $8,
            srb_remark = $9,
            srb_emp_id = $10
        WHERE srb_id = $1
        RETURNING srb_id;
    `;
    try {
        const result = await sql_query(sql, [
            id,
            payload.mm_id,
            payload.code,
            payload.diameter,
            payload.length,
            payload.quantity,
            payload.available_quantity,
            payload.received_date,
            payload.remark,
            emp_id
        ]);
        if (result.length === 0) {
            console.error(`[Service] Failed to update ${module_name}: No row was updated.`);
            return {
                statuscode: HttpStatusCode.NOT_FOUND,
                error: `No row was updated.`,
                data: null
            };
        }
        return {
            statuscode: HttpStatusCode.NO_CONTENT,
            error: null,
            data: null
        };
    } catch (error) {
        console.error(`[Service] An error occurred during updating ${module_name}:`, error);
        return {
            statuscode: HttpStatusCode.INTERNAL_SERVER_ERROR,
            error: error,
            data: null
        };
    }
}
async function update_status(id: string, status: string, emp_id: string): Promise<Response> {
    const sql = `
        UPDATE public.steel_round_bars
        SET
            srb_status = $1,
            srb_emp_id = $2
        WHERE srb_id = $3
        RETURNING srb_id;
    `;
    try {
        const result = await sql_query(sql, [
            status,
            emp_id,
            id
        ]);
        if (result.length === 0) {
            console.error(`[Service] Failed to update ${module_name} status: No row was updated.`);
            return {
                statuscode: HttpStatusCode.NOT_FOUND,
                error: `No row was updated.`,
                data: null
            };
        }
        return {
            statuscode: HttpStatusCode.NO_CONTENT,
            error: null,
            data: null
        };
    } catch (error) {
        console.error(`[Service] An error occurred during updating ${module_name} status:`, error);
        return {
            statuscode: HttpStatusCode.INTERNAL_SERVER_ERROR,
            error: error,
            data: null
        };
    }
}

export default {
    count_duplicate,
    create,
    get,
    soft_delete,
    update,
    update_status
};