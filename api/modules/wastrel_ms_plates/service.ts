import sql_query from "@/api/utils/sql_query";
import { Condition, HttpStatusCode, Response } from "@/api/utils/shared_types";
import { Payload, StockStatus } from "./type";
const module_name = 'wastrel_ms_plates';
async function create(payload: Payload, emp_id: string): Promise<Response> {
    const sql = `
        INSERT INTO public.wastrel_ms_plates (
            wmsp_mm_id,
            wmsp_msp_id,
            wmsp_length,
            wmsp_width,
            wmsp_thickness,
            wmsp_quantity,
            wmsp_available_quantity,
            wmsp_po_id,
            wmsp_podetail_id,
            wmsp_remark,
            wmsp_emp_id
        ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
        ) RETURNING *;
    `;
    try {
        const quantity = payload.quantity ?? 1;
        const available_quantity = payload.available_quantity ?? quantity;
        const result = await sql_query(sql, [
            payload.mm_id,
            payload.msp_id ?? null,
            payload.length,
            payload.width,
            payload.thickness,
            quantity,
            available_quantity,
            payload.po_id ?? null,
            payload.podetail_id ?? null,
            payload.remark ?? null,
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
                wmsp_display_id,
                wmsp_length,
                wmsp_width,
                wmsp_thickness,
                wmsp_quantity,
                wmsp_available_quantity,
                wmsp_status::text AS wmsp_status,
                wmsp_po_id,
                po_number AS wmsp_po_number,
                wmsp_podetail_id,
                podetail_po_id AS wmsp_podetail_po_id,
                wmsp_remark,
                wmsp_created_at,
                wmsp_updated_at,
                wmsp_emp_id,
                emp_display_id AS wmsp_emp_display_id,
                emp_prefix::text AS wmsp_emp_prefix,
                emp_firstname_th AS wmsp_emp_fname_th,
                emp_lastname_th AS wmsp_emp_lname_th,
                emp_firstname_en AS wmsp_emp_fname_en,
                emp_lastname_en AS wmsp_emp_lname_en
            FROM public.wastrel_ms_plates
            LEFT JOIN public.material_masters ON wastrel_ms_plates.wmsp_mm_id = material_masters.mm_id
            LEFT JOIN public.ms_plates ON wastrel_ms_plates.wmsp_msp_id = ms_plates.msp_id
            LEFT JOIN public.purchase_orders ON wastrel_ms_plates.wmsp_po_id = purchase_orders.po_id
            LEFT JOIN public.purchase_orders_details ON wastrel_ms_plates.wmsp_podetail_id = purchase_orders_details.podetail_id
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
            wmsp_length = $4,
            wmsp_width = $5,
            wmsp_thickness = $6,
            wmsp_quantity = $7,
            wmsp_available_quantity = $8,
            wmsp_po_id = $9,
            wmsp_podetail_id = $10,
            wmsp_remark = $11,
            wmsp_emp_id = $12,
            wmsp_updated_at = NOW()
        WHERE wmsp_id = $1
        RETURNING wmsp_id;
    `;
    try {
        const result = await sql_query(sql, [
            id,
            payload.mm_id,
            payload.msp_id ?? null,
            payload.length,
            payload.width,
            payload.thickness,
            payload.quantity ?? 1,
            payload.available_quantity ?? (payload.quantity ?? 1),
            payload.po_id ?? null,
            payload.podetail_id ?? null,
            payload.remark ?? null,
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
    create,
    get,
    update,
    update_status
};

export default service;
