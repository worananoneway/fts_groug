import sql_query from "@/api/utils/sql_query";
import { Condition, Response, HttpStatusCode } from "@/api/utils/shared_types";

async function get_provinces(conditions: Condition = { sql: "", params: [] }): Promise<Response> {
    const sql = `
        SELECT 
            province_id,
            province_name_th,
            province_name_en,
            province_geography_id

        FROM public.provinces
        WHERE 1=1 ${conditions.sql}
        ORDER BY province_geography_id ASC
    `;

    try {
        const results = await sql_query(sql, conditions.params);
        return {
            statuscode: HttpStatusCode.OK,
            error: null,
            data: results
        };
    } catch (error) {
        console.error("[Service] An error occurred during getting provinces:", error);
        return {
            statuscode: HttpStatusCode.INTERNAL_SERVER_ERROR,
            error: error,
            data: null
        };
    }
}
async function get_districts(conditions: Condition = { sql: "", params: [] }): Promise<Response> {
    const sql = `
        SELECT 
            district_id,
            district_name_th,
            district_name_en,
            district_province_id

        FROM public.districts
        WHERE 1=1 ${conditions.sql}
        ORDER BY district_province_id ASC;
    `;

    try {
        const results = await sql_query(sql, conditions.params);
        return {
            statuscode: HttpStatusCode.OK,
            error: null,
            data: results
        };
    } catch (error) {
        console.error("[Service] An error occurred during getting districts:", error);
        return {
            statuscode: HttpStatusCode.INTERNAL_SERVER_ERROR,
            error: error,
            data: null
        };
    }
}
async function get_subdistricts(conditions: Condition = { sql: "", params: [] }): Promise<Response> {
    const sql = `
        SELECT 
            subdistrict_id,
            subdistrict_name_th,
            subdistrict_name_en,
            subdistrict_district_id,
            subdistrict_zip_code

        FROM public.subdistricts
        WHERE 1=1 ${conditions.sql}
        ORDER BY subdistrict_district_id ASC;
    `;

    try {
        const results = await sql_query(sql, conditions.params);
        return {
            statuscode: HttpStatusCode.OK,
            error: null,
            data: results
        };
    } catch (error) {
        console.error("[Service] An error occurred during getting subdistricts:", error);
        return {
            statuscode: HttpStatusCode.INTERNAL_SERVER_ERROR,
            error: error,
            data: null
        };
    }
}


export default {
    get_provinces,
    get_districts,
    get_subdistricts
};