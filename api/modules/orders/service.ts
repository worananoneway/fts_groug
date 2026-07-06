import sql_query from "@/api/utils/sql_query";
import { Condition, Response, HttpStatusCode } from "@/api/utils/shared_types";

async function get_orders(conditions: Condition = { sql: "", params: [] }): Promise<Response> {
    const sql = `
        SELECT
            o.ord_id,
            o.ord_no,
            c.customer_name_th,
            o.ord_date,
            o.ord_due_date,
            o.ord_status,
            o.ord_total_items,
            o.ord_remark
        FROM public.orders o
        LEFT JOIN public.customers c ON c.customer_id = o.ord_cus_id
        WHERE 1=1 ${conditions.sql}
        ORDER BY o.ord_date DESC, o.ord_no DESC;
    `;
    try {
        const results = await sql_query(sql, conditions.params);
        return {
            statuscode: HttpStatusCode.OK,
            error: null,
            data: results
        };
    } catch (error) {
        console.error("[Service] An error occurred during getting orders:", error);
        return {
            statuscode: HttpStatusCode.INTERNAL_SERVER_ERROR,
            error: error,
            data: null
        };
    }
}

async function get_order_details(conditions: Condition = { sql: "", params: [] }): Promise<Response> {
    const sql = `
        SELECT
            d.odd_id,
            d.odd_ord_id,
            d.odd_shape_type,
            m.mm_name,
            d.odd_required_diameter_mm,
            d.odd_required_length_mm,
            d.odd_required_width_mm,
            d.odd_required_thickness_mm,
            d.odd_quantity,
            d.odd_remaining_quantity,
            d.odd_status
        FROM public.order_details d
        LEFT JOIN public.material_masters m ON m.mm_id = d.odd_mm_id
        WHERE 1=1 ${conditions.sql}
        ORDER BY d.odd_created_at ASC;
    `;
    try {
        const results = await sql_query(sql, conditions.params);
        return {
            statuscode: HttpStatusCode.OK,
            error: null,
            data: results
        };
    } catch (error) {
        console.error("[Service] An error occurred during getting order details:", error);
        return {
            statuscode: HttpStatusCode.INTERNAL_SERVER_ERROR,
            error: error,
            data: null
        };
    }
}

export default {
    get_orders,
    get_order_details
};
