import sql_query from "@/api/utils/sql_query";
import { Payload } from "./type";
import { Condition, HttpStatusCode, Response } from "@/api/utils/shared_types";

const module_name = 'locations';

// นับรหัสตำแหน่งที่ซ้ำ (loc_code เป็น UNIQUE ในฐานข้อมูล)
async function count_duplicate(conditions: Condition): Promise<Response> {
    const sql = `
        SELECT
            (SELECT COUNT(loc_id) FROM public.locations WHERE loc_code = $1 AND loc_status != 'Deleted'${conditions.sql}) AS duplicate_code
    `;
    try {
        const result = await sql_query(sql, [
            ...conditions.params
        ]);
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
async function create(payload: Payload): Promise<Response> {
    const sql = `
        INSERT INTO public.locations (
            loc_code,
            loc_name,
            loc_type,
            loc_parent_id,
            loc_detail,
            loc_status
        ) VALUES (
            $1, $2, $3, $4, $5, 'Active'
        ) RETURNING
            loc_id,
            loc_code,
            loc_name,
            loc_type::text AS loc_type,
            loc_parent_id,
            loc_detail,
            loc_status::text AS loc_status,
            loc_created_at,
            loc_updated_at;
    `;
    try {
        const result = await sql_query(sql, [
            payload.code,
            payload.name,
            payload.type,
            payload.parent_id,
            payload.detail
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
// หมายเหตุ: conditions.sql ต้องอ้างคอลัมน์ด้วย alias `l.` เพราะ join ตารางเดิมซ้ำเป็นตำแหน่งแม่ (p)
async function get(conditions: Condition = { sql: ``, params: [] }, filter: string = `*`): Promise<Response> {
    const sql = `
        WITH ${module_name}_cte AS (
            SELECT
                l.loc_id,
                l.loc_code,
                l.loc_name,
                l.loc_type::text AS loc_type,
                l.loc_parent_id,
                p.loc_code AS loc_parent_code,
                p.loc_name AS loc_parent_name,
                p.loc_type::text AS loc_parent_type,
                l.loc_detail,
                l.loc_status::text AS loc_status,
                l.loc_created_at,
                l.loc_updated_at
            FROM public.locations l
            LEFT JOIN public.locations p ON l.loc_parent_id = p.loc_id
            WHERE 1=1 AND l.loc_status != 'Deleted' ${conditions.sql}
            ORDER BY l.loc_type, l.loc_code
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
async function soft_delete(id: string): Promise<Response> {
    const sql = `
        UPDATE public.locations
        SET
            loc_status = 'Deleted',
            loc_updated_at = CURRENT_TIMESTAMP
        WHERE loc_id = $1
        RETURNING loc_id;
    `;
    try {
        const result = await sql_query(sql, [id]);
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
async function update(id: string, payload: Payload): Promise<Response> {
    const sql = `
        UPDATE public.locations
        SET
            loc_code = $1,
            loc_name = $2,
            loc_type = $3,
            loc_parent_id = $4,
            loc_detail = $5,
            loc_updated_at = CURRENT_TIMESTAMP
        WHERE loc_id = $6
        RETURNING loc_id;
    `;
    try {
        const result = await sql_query(sql, [
            payload.code,
            payload.name,
            payload.type,
            payload.parent_id,
            payload.detail,
            id
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

export default {
    count_duplicate,
    create,
    get,
    soft_delete,
    update
};
