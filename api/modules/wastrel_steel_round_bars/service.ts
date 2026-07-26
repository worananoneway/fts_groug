import sql_query from "@/api/utils/sql_query";
import { Condition, HttpStatusCode, Response } from "@/api/utils/shared_types";
import { Payload, StockStatus } from "./type";

const module_name = `wastrel_steel_round_bars`;

async function create(payload: Payload, emp_id: string): Promise<Response> {
    const sql = `
        INSERT INTO public.wastrel_steel_round_bars (
            wsrb_mm_id,
            wsrb_srb_id,
            wsrb_diameter,
            wsrb_length,
            wsrb_quantity,
            wsrb_available_quantity,
            wsrb_po_id,
            wsrb_podetail_id,
            wsrb_remark,
            wsrb_emp_id,
            wsrb_status
        ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'Reserved'
        ) RETURNING *;
    `;
    try {
        const quantity = payload.quantity ?? 1;
        const available_quantity = payload.available_quantity ?? quantity;
        const result = await sql_query(sql, [
            payload.mm_id,
            payload.srb_id ?? null,
            payload.diameter,
            payload.length,
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

// เพิ่มคอลัมน์ที่เก็บให้อัตโนมัติถ้ายังไม่มี (idempotent) — จะได้ไม่ต้องรัน migration เอง
let locationColumnEnsured = false;
async function ensureLocationColumn(): Promise<void> {
    if (locationColumnEnsured) return;
    try {
        await sql_query(`ALTER TABLE public.wastrel_steel_round_bars ADD COLUMN IF NOT EXISTS wsrb_location text`);
        locationColumnEnsured = true;
    } catch (error) {
        console.error(`[Service] ensure ${module_name} location column failed:`, error);
    }
}

async function get(conditions: Condition = { sql: ``, params: [] }, filter: string = `*`): Promise<Response> {
    await ensureLocationColumn();
    const sql = `
        WITH ${module_name}_cte AS (
            SELECT
                wsrb_id,
                wsrb_mm_id,
                mm_code AS wsrb_mm_code,
                mm_name AS wsrb_mm_name,
                mm_shape_type::text AS wsrb_mm_shape_type,
                mm_grade AS wsrb_mm_grade,
                wsrb_srb_id,
                srb_code AS wsrb_srb_code,
                wsrb_display_id,
                wsrb_diameter,
                wsrb_length,
                wsrb_quantity,
                wsrb_available_quantity,
                wsrb_status::text AS wsrb_status,
                wsrb_po_id,
                po_number AS wsrb_po_number,
                wsrb_podetail_id,
                podetail_po_id AS wsrb_podetail_po_id,
                wsrb_remark,
                wsrb_location,
                wsrb_created_at,
                wsrb_updated_at,
                wsrb_emp_id,
                emp_display_id AS wsrb_emp_display_id,
                emp_prefix::text AS wsrb_emp_prefix,
                emp_firstname_th AS wsrb_emp_fname_th,
                emp_lastname_th AS wsrb_emp_lname_th,
                emp_firstname_en AS wsrb_emp_fname_en,
                emp_lastname_en AS wsrb_emp_lname_en
            FROM public.wastrel_steel_round_bars
            LEFT JOIN public.material_masters ON wastrel_steel_round_bars.wsrb_mm_id = material_masters.mm_id
            LEFT JOIN public.steel_round_bars ON wastrel_steel_round_bars.wsrb_srb_id = steel_round_bars.srb_id
            LEFT JOIN public.purchase_orders ON wastrel_steel_round_bars.wsrb_po_id = purchase_orders.po_id
            LEFT JOIN public.purchase_orders_details ON wastrel_steel_round_bars.wsrb_podetail_id = purchase_orders_details.podetail_id
            LEFT JOIN public.employees ON wastrel_steel_round_bars.wsrb_emp_id = employees.emp_id
            WHERE 1=1${conditions.sql}
            ORDER BY wsrb_created_at DESC
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
        UPDATE public.wastrel_steel_round_bars
        SET
            wsrb_mm_id = $2,
            wsrb_srb_id = $3,
            wsrb_diameter = $4,
            wsrb_length = $5,
            wsrb_quantity = $6,
            wsrb_available_quantity = $7,
            wsrb_po_id = $8,
            wsrb_podetail_id = $9,
            wsrb_remark = $10,
            wsrb_emp_id = $11
        WHERE wsrb_id = $1
        RETURNING wsrb_id;
    `;
    try {
        const result = await sql_query(sql, [
            id,
            payload.mm_id,
            payload.srb_id,
            payload.diameter,
            payload.length,
            payload.quantity ?? 1,
            payload.available_quantity ?? (payload.quantity ?? 1),
            payload.po_id,
            payload.podetail_id,
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
            error,
            data: null
        };
    }
}

async function update_status(id: string, status: StockStatus, emp_id: string): Promise<Response> {
    const sql = `
        UPDATE public.wastrel_steel_round_bars
        SET
            wsrb_status = $2,
            wsrb_emp_id = $3
        WHERE wsrb_id = $1
        RETURNING wsrb_id;
    `;
    try {
        const result = await sql_query(sql, [id, status, emp_id]);
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

async function update_location(ids: string[], location: string | null, emp_id: string): Promise<Response> {
    if (!ids.length) {
        return { statuscode: HttpStatusCode.NO_CONTENT, error: null, data: null };
    }
    await ensureLocationColumn();
    const sql = `
        UPDATE public.wastrel_steel_round_bars
        SET wsrb_location = $2, wsrb_emp_id = $3
        WHERE wsrb_id = ANY($1::text[])
        RETURNING wsrb_id;
    `;
    try {
        await sql_query(sql, [ids, location, emp_id]);
        return { statuscode: HttpStatusCode.NO_CONTENT, error: null, data: null };
    } catch (error) {
        console.error(`[Service] An error occurred during updating ${module_name} location:`, error);
        return { statuscode: HttpStatusCode.INTERNAL_SERVER_ERROR, error, data: null };
    }
}

const service = {
    create,
    get,
    update,
    update_status,
    update_location
};

export default service;
