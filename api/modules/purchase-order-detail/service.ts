import sql_query from "@/api/utils/sql_query";
import { Payload } from "./type";
import { Condition, Response, HttpStatusCode } from "@/api/utils/shared_types";

const module_name = 'purchase_order_details';

async function create(condition: Condition): Promise<Response> {
    const sql = `
        INSERT INTO public.purchase_orders_details (
            podetail_po_id,
            podetail_emp_id,
            podetail_on,
            podetail_department,
            podetail_type,
            podetail_description,
            podetail_qty,
            podetail_discount,
            podetail_unit_price
            
            
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
async function soft_delete(id: string): Promise<Response> {
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
            podetail_emp_id      = values.podetail_emp_id,
            podetail_department  = values.podetail_department::purchase_order_detail_department_enum,
            podetail_type        = values.podetail_type::expense_type_enum,
            podetail_description = values.podetail_description,
            podetail_qty         = values.podetail_qty :: int4,
            podetail_discount    = values.podetail_discount ::numeric(15, 2),
            podetail_unit_price  = values.podetail_unit_price :: numeric(15, 2)
            
        FROM (
            VALUES ${conditions.sql}
            ) AS values(
            podetail_id, 
            podetail_emp_id,
            podetail_department,
            podetail_type,
            podetail_description,
            podetail_qty,
            podetail_discount,
            podetail_unit_price
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
    soft_delete,
    update
};