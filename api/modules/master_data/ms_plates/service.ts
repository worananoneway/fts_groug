import sql_query from "@/api/utils/sql_query";
import { ErrorField, ErrorMessage, Payload } from "./type";
import { Condition, Response, HttpStatusCode } from "@/api/utils/shared_types";

const module_name = 'ms_plates';
async function count_duplicate(conditions: Condition): Promise<Response> {
    const sql = `
        SELECT 
            (SELECT COUNT(msp_id) FROM public.ms_plates WHERE msp_code = $1${conditions.sql}) AS duplicate_code
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
        console.error(`[Service] An error occurred during counting duplicates for ${module_name}:`, error);
        return {
            statuscode: HttpStatusCode.INTERNAL_SERVER_ERROR,
            error: error,
            data: null
        };
    }
}
async function create(payload: Payload, emp_id: string | null): Promise<Response> {
    const sql = `
        INSERT INTO public.ms_plates(
            msp_mm_id,
            msp_code,
            msp_length,
            msp_width,
            msp_thickness,
            msp_quantity,
            msp_available_quantity,
            msp_received_date,
            msp_remark,
            msp_emp_id,
            msp_status
        ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,'Active'
        ) RETURNING *;
    `;
    try {
        const result = await sql_query(sql, [
            payload.mm_id,
            payload.code,
            payload.length,
            payload.width,
            payload.thickness,
            payload.quantity,
            payload.available_quantity,
            payload.received_date,
            payload.remark,
            emp_id,
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
                msp_id,
                msp_mm_id,
                msp_code,
                msp_length,
                msp_width,
                msp_thickness,
                msp_quantity,
                msp_available_quantity,
                msp_status,
                msp_received_date,
                msp_remark,
                msp_created_at,
                msp_updated_at,
                msp_emp_id
            FROM public.ms_plates
            WHERE 1=1 AND msp_status != 'Deleted' ${conditions.sql}
            ORDER BY msp_created_at DESC
        )
        SELECT ${filter} FROM ${module_name}_cte;
    `;
    try {
        const results = await sql_query(sql, conditions.params);
        if (results.length === 0) {
            console.error(`[Service] Failed to update ${module_name}: ${module_name} not found.`);
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
        console.error(`[Service] An error occurred during getting ${module_name}:`, error);
        return {
            statuscode: HttpStatusCode.INTERNAL_SERVER_ERROR,
            error: error,
            data: null
        };
    }
}
async function soft_delete(id: string, emp_id: string | null): Promise<Response> {
    const sql = `
        UPDATE public.ms_plates
        SET msp_status = 'Deleted',
            msp_emp_id = $2
        WHERE msp_id = $1
        RETURNING *;
    `;
    try {
        const result = await sql_query(sql, [id, emp_id]);
        if (result.length === 0) {
            console.error(`[Service] Failed to soft delete ${module_name}: ${module_name} not found.`);
            return {
                statuscode: HttpStatusCode.NOT_FOUND,
                error: `${module_name} not found.`,
                data: null
            };
        }
        return {
            statuscode: HttpStatusCode.NO_CONTENT,
            error: null,
            data: result
        };
    } catch (error) {
        console.error(`[Service] An error occurred during soft deleting ${module_name}:`, error);
        return {
            statuscode: HttpStatusCode.INTERNAL_SERVER_ERROR,
            error: error,
            data: null
        };
    }
}

async function update(id: string, payload: Payload, emp_id: string | null): Promise<Response> {
    const sql = `
        UPDATE public.ms_plates
        SET
            msp_code = $2,
            msp_length = $3,
            msp_width = $4,
            msp_thickness = $5,
            msp_quantity = $6,
            msp_available_quantity = $7,
            msp_received_date = $8,
            msp_remark = $9,
            msp_emp_id = $10
        WHERE msp_id = $1
        RETURNING *;
    `;
    try {
        const result = await sql_query(sql, [
            id,
            payload.code,
            payload.length,
            payload.width,
            payload.thickness,
            payload.quantity,
            payload.available_quantity,
            payload.received_date,
            payload.remark,
            emp_id
        ]);
        if (result.length === 0) {
            console.error(`[Service] Failed to update ${module_name}: ${module_name} not found.`);
            return {
                statuscode: HttpStatusCode.NOT_FOUND,
                error: `${module_name} not found.`,
                data: null
            };
        }
        return {
            statuscode: HttpStatusCode.NO_CONTENT,
            error: null,
            data: result
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
async function update_status(id: string, status: string, emp_id: string | null): Promise<Response> {
    const sql = `
        UPDATE public.ms_plates
        SET
            msp_status = $2,
            msp_emp_id = $3
        WHERE msp_id = $1
        RETURNING msp_id, msp_status;
    `;
    try {
        const result = await sql_query(sql, [id, status, emp_id]);
        if (result.length === 0) {
            console.error(`[Service] Failed to update ${module_name} status: ${module_name} not found.`);
            return {
                statuscode: HttpStatusCode.NOT_FOUND,
                error: `${module_name} not found.`,
                data: null
            };
        }
        return {
            statuscode: HttpStatusCode.NO_CONTENT,
            error: null,
            data: result
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
    create,
    count_duplicate,
    get,
    soft_delete,
    update,
    update_status
};