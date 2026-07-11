import sql_query from "@/api/utils/sql_query";
import { Payload } from "./type";
import { Condition, Response, HttpStatusCode } from "@/api/utils/shared_types";

const module_name = 'purchase_order_details';

async function create(condition: Condition): Promise<Response> {
    const sql = `
        INSERT INTO public.purchase_orders_details (
            podetail_mm_id,
            podetail_required_length_mm,
            podetail_required_width_mm,
            podetail_required_thickness_mm,
            podetail_required_diameter_mm,
            podetail_cut_quantity,
            podetail_remaining_quantity,
            podetail_allow_wastrel,
            podetail_allow_rotation,
            podetail_status,
            podetail_remark,
            podetail_on,
            podetail_unit,
            podetail_description,
            podetail_qty,
            podetail_discount,
            podetail_unit_price,
            podetail_emp_id,
            podetail_po_id
        ) VALUES ${condition.sql}
        RETURNING *;
    `;
    const result: any[] = [];
    try {
        result.push(await sql_query(sql, condition.params));
        if (result.length === 0) {
            console.error(`[Service] Failed to create ${module_name}: No rows returned.`);
            return {
                
                statuscode: HttpStatusCode.INTERNAL_SERVER_ERROR,
                error: `Failed to create ${module_name}.`,
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
            error: `Failed to create ${module_name}.`,
            data: null
        };
    }
}
async function get(conditions: Condition = { sql: "", params: [] }): Promise<Response> {
    const sql = `
        SELECT 

            podetail_id

        FROM public.purchase_orders_details
        WHERE 1=1${conditions.sql}
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
            error: `Failed to get ${module_name}.`,
            data: null
        };
    }
}
async function hard_delete(id: string): Promise<Response> {
    const sql = `
        DELETE FROM public.purchase_orders_details
        WHERE podetail_id = $1
        RETURNING podetail_id;
    `;
    try {
        const result = await sql_query(sql, [id]);
        if (result.length === 0) {
            console.error(`[Service] Failed to delete ${module_name}: No row was deleted.`);
            return {
                statuscode: HttpStatusCode.NOT_FOUND,
                error: `${module_name} not found.`,
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
            error: `Failed to delete ${module_name}.`,
            data: null
        };
    }
}
async function update( conditions: Condition ): Promise<Response> {
    const sql = `
        UPDATE public.purchase_orders_details AS podetail
        SET 
            podetail_mm_id                  = values.podetail_mm_id::varchar(20),
            podetail_required_length_mm     = values.podetail_required_length_mm::numeric(12, 3),
            podetail_required_width_mm      = values.podetail_required_width_mm::numeric(12, 3),
            podetail_required_thickness_mm  = values.podetail_required_thickness_mm::numeric(12, 3),
            podetail_required_diameter_mm   = values.podetail_required_diameter_mm::numeric(12, 3),
            podetail_cut_quantity           = values.podetail_cut_quantity::int4,
            podetail_remaining_quantity     = values.podetail_remaining_quantity::int4,
            podetail_allow_wastrel          = values.podetail_allow_wastrel::bool,
            podetail_allow_rotation         = values.podetail_allow_rotation::bool,
            podetail_status                 = values.podetail_status::purchase_order_detail_status_enum,
            podetail_remark                 = values.podetail_remark::text,
            podetail_on                     = values.podetail_on::int4,
            podetail_unit                   = values.podetail_unit::varchar(80),
            podetail_description            = values.podetail_description::varchar(1000),
            podetail_qty                    = values.podetail_qty::int4,
            podetail_discount               = values.podetail_discount::numeric(15, 2),
            podetail_unit_price             = values.podetail_unit_price::numeric(15, 2),
            podetail_emp_id                 = values.podetail_emp_id::varchar(20),
            podetail_po_id                  = values.podetail_po_id::varchar(20),
            podetail_updated_at             = CURRENT_TIMESTAMP
        FROM (
            VALUES ${conditions.sql}
            ) AS values(
                podetail_id,
                podetail_mm_id,
                podetail_required_length_mm,
                podetail_required_width_mm,
                podetail_required_thickness_mm,
                podetail_required_diameter_mm,
                podetail_cut_quantity,
                podetail_remaining_quantity,
                podetail_allow_wastrel,
                podetail_allow_rotation,
                podetail_status,
                podetail_remark,
                podetail_on,
                podetail_unit,
                podetail_description,
                podetail_qty,
                podetail_discount,
                podetail_unit_price,
                podetail_emp_id,
                podetail_po_id
            )
        WHERE podetail.podetail_id = values.podetail_id
        RETURNING podetail.podetail_id;
    `;   
    try {
        const result = await sql_query(sql, [
            ...conditions.params,
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
            data: null
        };
    } catch (error) {
        console.error(`[Service] An error occurred during updating ${module_name}:`, error);
        return {
            statuscode: HttpStatusCode.INTERNAL_SERVER_ERROR,
            error: `Failed to update ${module_name}.`,
            data: null
        };
    }
}

export default {
    create,
    get,
    hard_delete,
    update
};
