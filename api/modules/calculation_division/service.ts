import sql_query from "@/api/utils/sql_query";
import { Condition, HttpStatusCode, Response } from "@/api/utils/shared_types";

async function get_wastrel_steel_round_bars(conditions: Condition = { sql: "", params: [] }): Promise<Response> {
    const sql = `
        SELECT
            wsrb_id,
            wsrb_mm_id,
            wsrb_srb_id,
            wsrb_code,
            wsrb_diameter,
            wsrb_length,
            wsrb_available_quantity,
            wsrb_loc_id,
            wsrb_location_type::text AS wsrb_location_type,
            wsrb_location,
            wsrb_status::text AS wsrb_status
        FROM public.wastrel_steel_round_bars
        WHERE wsrb_available_quantity > 0
          AND wsrb_status::text IN ('Active', 'Reserved', 'AVAILABLE')
          ${conditions.sql}
        ORDER BY wsrb_length ASC, wsrb_code ASC;
    `;

    try {
        const result = await sql_query(sql, conditions.params);
        return {
            statuscode: HttpStatusCode.OK,
            error: null,
            data: result
        };
    } catch (error) {
        console.error("[Service] Failed to get wastrel steel round bars:", error);
        return {
            statuscode: HttpStatusCode.INTERNAL_SERVER_ERROR,
            error,
            data: null
        };
    }
}

async function get_steel_round_bars(conditions: Condition = { sql: "", params: [] }): Promise<Response> {
    const sql = `
        SELECT
            srb_id,
            srb_mm_id,
            srb_code,
            srb_diameter,
            srb_length,
            srb_available_quantity,
            srb_loc_id,
            srb_location_type::text AS srb_location_type,
            srb_location,
            srb_status::text AS srb_status
        FROM public.steel_round_bars
        WHERE srb_available_quantity > 0
          AND srb_status::text IN ('Active', 'AVAILABLE')
          ${conditions.sql}
        ORDER BY srb_length ASC, srb_code ASC;
    `;

    try {
        const result = await sql_query(sql, conditions.params);
        return {
            statuscode: HttpStatusCode.OK,
            error: null,
            data: result
        };
    } catch (error) {
        console.error("[Service] Failed to get steel round bars:", error);
        return {
            statuscode: HttpStatusCode.INTERNAL_SERVER_ERROR,
            error,
            data: null
        };
    }
}

async function get_wastrel_ms_plates(conditions: Condition = { sql: "", params: [] }): Promise<Response> {
    const sql = `
        SELECT
            wmsp_id,
            wmsp_mm_id,
            wmsp_msp_id,
            wmsp_stock_code,
            wmsp_length,
            wmsp_width,
            wmsp_thickness,
            wmsp_available_quantity,
            wmsp_loc_id,
            wmsp_location_type::text AS wmsp_location_type,
            wmsp_location,
            wmsp_status::text AS wmsp_status
        FROM public.wastrel_ms_plates
        WHERE wmsp_available_quantity > 0
          AND wmsp_status::text IN ('Active', 'Reserved', 'AVAILABLE')
          ${conditions.sql}
        ORDER BY (wmsp_length * wmsp_width) ASC, wmsp_stock_code ASC;
    `;

    try {
        const result = await sql_query(sql, conditions.params);
        return {
            statuscode: HttpStatusCode.OK,
            error: null,
            data: result
        };
    } catch (error) {
        console.error("[Service] Failed to get wastrel MS plates:", error);
        return {
            statuscode: HttpStatusCode.INTERNAL_SERVER_ERROR,
            error,
            data: null
        };
    }
}

async function get_ms_plates(conditions: Condition = { sql: "", params: [] }): Promise<Response> {
    const sql = `
        SELECT
            msp_id,
            msp_mm_id,
            msp_code,
            msp_length,
            msp_width,
            msp_thickness,
            msp_available_quantity,
            msp_loc_id,
            msp_location_type::text AS msp_location_type,
            msp_location,
            msp_status::text AS msp_status
        FROM public.ms_plates
        WHERE msp_available_quantity > 0
          AND msp_status::text IN ('Active', 'AVAILABLE')
          ${conditions.sql}
        ORDER BY (msp_length * msp_width) ASC, msp_code ASC;
    `;

    try {
        const result = await sql_query(sql, conditions.params);
        return {
            statuscode: HttpStatusCode.OK,
            error: null,
            data: result
        };
    } catch (error) {
        console.error("[Service] Failed to get MS plates:", error);
        return {
            statuscode: HttpStatusCode.INTERNAL_SERVER_ERROR,
            error,
            data: null
        };
    }
}

const service = {
    get_wastrel_steel_round_bars,
    get_steel_round_bars,
    get_wastrel_ms_plates,
    get_ms_plates
};

export default service;
