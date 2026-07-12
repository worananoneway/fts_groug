import sql_query from "@/api/utils/sql_query";
import { Condition, Response, HttpStatusCode } from "@/api/utils/shared_types";

interface OrderDetailPayload {
    po_id: string;
    mm_id: string;
    shape_type: string;
    length: number;
    width: number | null;
    thickness: number | null;
    diameter: number | null;
    quantity: number;
    remaining_quantity: number;
}

async function get_orders(conditions: Condition = { sql: "", params: [] }): Promise<Response> {
    const sql = `
        SELECT
            o.po_id,
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
            d.podetail_id,
            d.odd_po_id,
            d.odd_mm_id,
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

async function update_order_status(id: string, status: string): Promise<Response> {
    const sql = `
        UPDATE public.orders
        SET
            ord_status = $1::public."order_status_enum",
            ord_updated_at = NOW()
        WHERE po_id = $2
        RETURNING po_id;
    `;
    try {
        const result = await sql_query(sql, [status, id]);
        if (result.length === 0) {
            return {
                statuscode: HttpStatusCode.NOT_FOUND,
                error: "Order not found.",
                data: null
            };
        }
        return {
            statuscode: HttpStatusCode.NO_CONTENT,
            error: null,
            data: null
        };
    } catch (error) {
        console.error("[Service] An error occurred during updating order status:", error);
        return {
            statuscode: HttpStatusCode.INTERNAL_SERVER_ERROR,
            error,
            data: null
        };
    }
}

async function get_material_masters(): Promise<Response> {
    const sql = `
        SELECT
            mm_id,
            mm_name,
            mm_shape_type,
            mm_status
        FROM public.material_masters
        WHERE mm_status::text = 'Active'
        ORDER BY mm_name ASC;
    `;
    try {
        const results = await sql_query(sql);
        return {
            statuscode: HttpStatusCode.OK,
            error: null,
            data: results
        };
    } catch (error) {
        console.error("[Service] An error occurred during getting material masters:", error);
        return {
            statuscode: HttpStatusCode.INTERNAL_SERVER_ERROR,
            error,
            data: null
        };
    }
}

async function create_order_detail(payload: OrderDetailPayload): Promise<Response> {
    const sql = `
        INSERT INTO public.order_details (
            odd_po_id,
            odd_mm_id,
            odd_shape_type,
            odd_required_length_mm,
            odd_required_width_mm,
            odd_required_thickness_mm,
            odd_required_diameter_mm,
            odd_quantity,
            odd_remaining_quantity,
            odd_status
        )
        VALUES (
            $1,
            $2,
            $3::public."shape_type_enum",
            $4,
            $5,
            $6,
            $7,
            $8,
            $9,
            'Pending'::public."order_detail_status_enum"
        )
        RETURNING podetail_id;
    `;
    try {
        const result = await sql_query(sql, [
            payload.po_id,
            payload.mm_id,
            payload.shape_type,
            payload.length,
            payload.width,
            payload.thickness,
            payload.diameter,
            payload.quantity,
            payload.remaining_quantity
        ]);
        return {
            statuscode: HttpStatusCode.CREATED,
            error: null,
            data: result
        };
    } catch (error) {
        console.error("[Service] An error occurred during creating order detail:", error);
        return {
            statuscode: HttpStatusCode.INTERNAL_SERVER_ERROR,
            error,
            data: null
        };
    }
}

async function update_order_detail(id: string, payload: Omit<OrderDetailPayload, "po_id">): Promise<Response> {
    const sql = `
        UPDATE public.order_details
        SET
            odd_mm_id = $1,
            odd_shape_type = $2::public."shape_type_enum",
            odd_required_length_mm = $3,
            odd_required_width_mm = $4,
            odd_required_thickness_mm = $5,
            odd_required_diameter_mm = $6,
            odd_quantity = $7,
            odd_remaining_quantity = $8,
            odd_updated_at = NOW()
        WHERE podetail_id = $9
        RETURNING podetail_id;
    `;
    try {
        const result = await sql_query(sql, [
            payload.mm_id,
            payload.shape_type,
            payload.length,
            payload.width,
            payload.thickness,
            payload.diameter,
            payload.quantity,
            payload.remaining_quantity,
            id
        ]);
        if (result.length === 0) {
            return {
                statuscode: HttpStatusCode.NOT_FOUND,
                error: "Order detail not found.",
                data: null
            };
        }
        return {
            statuscode: HttpStatusCode.NO_CONTENT,
            error: null,
            data: null
        };
    } catch (error) {
        console.error("[Service] An error occurred during updating order detail:", error);
        return {
            statuscode: HttpStatusCode.INTERNAL_SERVER_ERROR,
            error,
            data: null
        };
    }
}

async function update_order_detail_status(id: string, status: string): Promise<Response> {
    const sql = `
        UPDATE public.order_details
        SET
            odd_status = $1::public."order_detail_status_enum",
            odd_updated_at = NOW()
        WHERE podetail_id = $2
        RETURNING podetail_id;
    `;
    try {
        const result = await sql_query(sql, [status, id]);
        if (result.length === 0) {
            return {
                statuscode: HttpStatusCode.NOT_FOUND,
                error: "Order detail not found.",
                data: null
            };
        }
        return {
            statuscode: HttpStatusCode.NO_CONTENT,
            error: null,
            data: null
        };
    } catch (error) {
        console.error("[Service] An error occurred during updating order detail status:", error);
        return {
            statuscode: HttpStatusCode.INTERNAL_SERVER_ERROR,
            error,
            data: null
        };
    }
}

const ordersService = {
    get_orders,
    get_order_details,
    get_material_masters,
    create_order_detail,
    update_order_detail,
    update_order_status,
    update_order_detail_status
};

export default ordersService;
