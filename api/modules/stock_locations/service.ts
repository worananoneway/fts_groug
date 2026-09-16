import sql_query from "@/api/utils/sql_query";
import { Payload } from "./type";
import { Condition, HttpStatusCode, Response } from "@/api/utils/shared_types";

const module_name = 'stock_locations';

// เช็คว่ารหัสตำแหน่งจัดเก็บมีอยู่จริง (กัน FK พังเป็น 500)
async function count_location(loc_id: string): Promise<Response> {
    const sql = `
        SELECT COUNT(loc_id) AS total FROM public.locations
        WHERE loc_id = $1 AND loc_status != 'Deleted';
    `;
    try {
        const result = await sql_query(sql, [loc_id]);
        return {
            statuscode: HttpStatusCode.OK,
            error: null,
            data: result
        };
    } catch (error) {
        console.error(`[Service] An error occurred during counting locations for ${module_name}:`, error);
        return {
            statuscode: HttpStatusCode.INTERNAL_SERVER_ERROR,
            error: error,
            data: null
        };
    }
}
// หมายเหตุ: conditions.sql ต้องอ้างคอลัมน์ด้วย alias `sl.` เพราะ join กับตาราง locations (loc)
async function get(conditions: Condition = { sql: ``, params: [] }, filter: string = `*`): Promise<Response> {
    const sql = `
        WITH ${module_name}_cte AS (
            SELECT
                sl.sl_id,
                sl.sl_stock_type::text AS sl_stock_type,
                sl.sl_stock_code,
                sl.sl_loc_id,
                loc.loc_code AS sl_loc_code,
                loc.loc_name AS sl_loc_name,
                loc.loc_type::text AS sl_loc_type,
                sl.sl_scheduled_at,
                sl.sl_remark,
                sl.sl_emp_id,
                sl.sl_status::text AS sl_status,
                sl.sl_created_at,
                sl.sl_updated_at
            FROM public.stock_locations sl
            LEFT JOIN public.locations loc ON sl.sl_loc_id = loc.loc_id
            WHERE 1=1 AND sl.sl_status != 'Deleted' ${conditions.sql}
            ORDER BY sl.sl_stock_type, sl.sl_stock_code
        )
        SELECT ${filter || `*`} FROM ${module_name}_cte;
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
        UPDATE public.stock_locations
        SET
            sl_status = 'Deleted',
            sl_emp_id = $2,
            sl_updated_at = CURRENT_TIMESTAMP
        WHERE sl_id = $1
        RETURNING sl_id;
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
// เพิ่ม/แก้ตำแหน่งจัดเก็บของรหัสสินค้าเดิม โดยยึดคู่ (sl_stock_type, sl_stock_code) ที่เป็น UNIQUE
// ส่ง loc_id เป็น null ได้ = ล้างตำแหน่งจัดเก็บของรหัสนั้น
async function upsert(payload: Payload, emp_id: string | null): Promise<Response> {
    const sql = `
        INSERT INTO public.stock_locations (
            sl_stock_type,
            sl_stock_code,
            sl_loc_id,
            sl_scheduled_at,
            sl_remark,
            sl_emp_id,
            sl_status
        ) VALUES (
            $1, $2, $3, $4::timestamptz, $5, $6, 'Active'
        )
        ON CONFLICT (sl_stock_type, sl_stock_code) DO UPDATE SET
            sl_loc_id = EXCLUDED.sl_loc_id,
            sl_scheduled_at = EXCLUDED.sl_scheduled_at,
            sl_remark = EXCLUDED.sl_remark,
            sl_emp_id = EXCLUDED.sl_emp_id,
            sl_status = 'Active',
            sl_updated_at = NOW()
        RETURNING sl_id;
    `;
    try {
        const result = await sql_query(sql, [
            payload.stock_type,
            payload.stock_code,
            payload.loc_id,
            payload.scheduled_at,
            payload.remark,
            emp_id
        ]);
        if (result.length === 0) {
            console.error(`[Service] Failed to upsert ${module_name}: No row was upserted.`);
            return {
                statuscode: HttpStatusCode.INTERNAL_SERVER_ERROR,
                error: `No row was upserted.`,
                data: null
            };
        }
        return {
            statuscode: HttpStatusCode.OK,
            error: null,
            data: result
        };
    } catch (error) {
        console.error(`[Service] An error occurred during upserting ${module_name}:`, error);
        return {
            statuscode: HttpStatusCode.INTERNAL_SERVER_ERROR,
            error: error,
            data: null
        };
    }
}

export default {
    count_location,
    get,
    soft_delete,
    upsert
};
