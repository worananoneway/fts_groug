import sql_query from "@/api/utils/sql_query";
import { Condition, HttpStatusCode, Response } from "@/api/utils/shared_types";
import { Payload, StockStatus } from "./type";
const module_name = 'wastrel_ms_plates';
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
        console.error(`[Service] An error occurred during counting ${module_name} duplicates:`, error);
        return {
            statuscode: HttpStatusCode.INTERNAL_SERVER_ERROR,
            error,
            data: null
        };
    }
}

async function create(payload: Payload, emp_id: string): Promise<Response> {
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
            wmsp_po_id,
            wmsp_podetail_id,
            wmsp_remark,
            wmsp_emp_id,
            wmsp_status
        ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 'Reserved' 
        ) RETURNING *;
    `;
    try {
        const quantity = payload.quantity ?? 1;
        const available_quantity = payload.available_quantity ?? quantity;
        const result = await sql_query(sql, [
            payload.mm_id,
            payload.msp_id,
            payload.stock_code,
            payload.length,
            payload.width,
            payload.thickness,
            quantity,
            available_quantity,
            payload.po_id,
            payload.podetail_id,
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
            error,
            data: null
        };
    }
}

async function get(conditions: Condition = { sql: ``, params: [] }, filter: string = `*`): Promise<Response> {
    const sql = `
        WITH ${module_name}_cte AS (
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
                wmsp_status,
                wmsp_po_id,
                po_no AS wmsp_po_no,
                wmsp_podetail_id,
                podetail_po_id AS wmsp_podetail_po_id,
                wmsp_remark,
                wmsp_created_at,
                wmsp_updated_at
            FROM public.wastrel_ms_plates
            LEFT JOIN public.material_masters ON wastrel_ms_plates.wmsp_mm_id = material_masters.mm_id
            LEFT JOIN public.ms_plates ON wastrel_ms_plates.wmsp_msp_id = ms_plates.msp_id
            LEFT JOIN public.purchase_orders ON wastrel_ms_plates.wmsp_po_id = purchase_orders.po_id
            LEFT JOIN public.purchase_order_details ON wastrel_ms_plates.wmsp_podetail_id = purchase_order_details.podetail_id
            LEFT JOIN public.employees ON wastrel_ms_plates.wmsp_emp_id = employees.emp_id
            WHERE 1=1${conditions.sql}
            ORDER BY wmsp_created_at DESC
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
            error,
            data: null
        };
    }
}

async function update(id: string, payload: Payload, emp_id: string): Promise<Response> {
    const sql = `
        UPDATE public.wastrel_ms_plates
        SET
            wmsp_mm_id = $2,
            wmsp_msp_id = $3,
            wmsp_stock_code = $4,
            wmsp_length = $5,
            wmsp_width = $6,
            wmsp_thickness = $7,
            wmsp_quantity = $8,
            wmsp_available_quantity = $9,
            wmsp_po_id = $10,
            wmsp_podetail_id = $11,
            wmsp_remark = $12,
            wmsp_emp_id = $13
        WHERE wmsp_id = $1
        RETURNING wmsp_id;
    `;
    try {
        const result = await sql_query(sql, [
            id,
            payload.mm_id,
            payload.msp_id,
            payload.stock_code,
            payload.length,
            payload.width,
            payload.thickness,
            payload.quantity ?? 1,
            payload.available_quantity ?? (payload.quantity ?? 1),
            payload.po_id,
            payload.podetail_id,
            payload.remark,
            emp_id,
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
            error,
            data: null
        };
    }
}

async function update_status(id: string, status: StockStatus, emp_id: string): Promise<Response> {
    const sql = `
        UPDATE public.wastrel_ms_plates
        SET
            wmsp_status = $3,
            wmsp_emp_id = $2
        WHERE wmsp_id = $1
        RETURNING wmsp_id;
    `;
    try {
        const result = await sql_query(sql, [id, emp_id, status]);
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
