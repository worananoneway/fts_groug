import sql_query from "@/api/utils/sql_query";
import { Condition, Response, HttpStatusCode } from "@/api/utils/shared_types";

async function get(conditions: Condition = { sql: ``, params: [] }): Promise<Response> {
    const sql = `
        SELECT
            emp_id,
            emp_display_id,
            emp_prefix,
            emp_firstname_th,
            emp_lastname_th,
            emp_firstname_en,
            emp_lastname_en,
            emp_email,
            emp_phone,
            emp_department_id,
            emp_position_id,
            emp_status
        FROM public.employees
        WHERE 1=1${conditions.sql}
        ORDER BY emp_firstname_th ASC;
    `;
    try {
        const results = await sql_query(sql, conditions.params);
        return {
            statuscode: HttpStatusCode.OK,
            error: null,
            data: results
        };
    } catch (error) {
        console.error(`[Service] An error occurred during getting employees:`, error);
        return {
            statuscode: HttpStatusCode.INTERNAL_SERVER_ERROR,
            error: error,
            data: null
        };
    }
}

export default {
    get
};
