import sql_query from "@/api/utils/sql_query";
import { Payload, PVPayload } from "./type";
import { Condition, Response, HttpStatusCode } from "@/api/utils/shared_types";

async function count_duplicate(conditions: Condition): Promise<Response> {
    const sql = `
        SELECT 
            (SELECT COUNT(po_id) FROM public.purchase_orders WHERE po_number LIKE $1${conditions.sql}) AS duplicate_number
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
        console.error("[Service] An error occurred during counting duplicates:", error);
        return {
            statuscode: HttpStatusCode.INTERNAL_SERVER_ERROR,
            error: error,
            data: null
        };
    }
}
async function create(payload: Payload, emp_id: string | null): Promise<Response> {
    const sql = `
        INSERT INTO public.purchase_orders (
            po_issue_date,
            po_ship_via,
            po_qt_on,
            po_shipping_terms,
            po_tax_rate,
            po_recipient_id,
            po_comment,
            po_project_id,
            po_emp_id
            
        ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9
        ) RETURNING *;
    `;
    try {
        const result = await sql_query(sql, [
            payload.issue_date,
            payload.ship_via,
            payload.qt_on,
            payload.shipping_terms,
            payload.tax_rate,
            payload.recipient_id,
            payload.comment,
            payload.project_id,
            emp_id
        ]);
        if (result.length === 0) {
            console.error("[Service] Failed to create purchase orders: No rows returned.");
            return {
                
                statuscode: HttpStatusCode.INTERNAL_SERVER_ERROR,
                error: "Failed to create purchase orders.",
                data: null
            };
        }
        return {
            statuscode: HttpStatusCode.CREATED,
            error: null,
            data: result
        };
    } catch (error) {
        console.error("[Service] An error occurred during creating purchase orders:", error);
        return {
            statuscode: HttpStatusCode.INTERNAL_SERVER_ERROR,
            error: error,
            data: null
        };
    }
}
async function create_pv(payload: PVPayload, emp_id: string): Promise<Response> {
    const sql = `
        INSERT INTO public.payment_vouchers (
            payment_date,
            payment_po_id,
            payment_project_id,
            payment_emp_id
            
        ) VALUES (
            $1, $2, $3, $4
        ) RETURNING *;
    `;
    try {
        const result = await sql_query(sql, [
            payload.date,
            payload.po_id,
            payload.project_id,
            emp_id
        ]);
        if (result.length === 0) {
            console.error("[Service] Failed to create purchase orders: No rows returned.");
            return {
                
                statuscode: HttpStatusCode.INTERNAL_SERVER_ERROR,
                error: "Failed to create purchase orders.",
                data: null
            };
        }
        return {
            statuscode: HttpStatusCode.CREATED,
            error: null,
            data: result
        };
    } catch (error) {
        console.error("[Service] An error occurred during creating purchase orders:", error);
        return {
            statuscode: HttpStatusCode.INTERNAL_SERVER_ERROR,
            error: error,
            data: null
        };
    }
}
async function create_rev(payload: Payload, emp_id: string): Promise<Response> {
    const sql = `
        INSERT INTO public.purchase_orders (
            po_number,
            po_issue_date,
            po_ship_via,
            po_qt_on,
            po_shipping_terms,
            po_tax_rate,
            po_recipient_id,
            po_comment,
            po_project_id,
            po_emp_id
            
        ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
        ) RETURNING *;
    `;
    try {
        const result = await sql_query(sql, [
            payload.number,
            payload.issue_date,
            payload.ship_via,
            payload.qt_on,
            payload.shipping_terms,
            payload.tax_rate,
            payload.recipient_id,
            payload.comment,
            payload.project_id,
            emp_id
        ]);
        if (result.length === 0) {
            console.error("[Service] Failed to create purchase orders: No rows returned.");
            return {
                
                statuscode: HttpStatusCode.INTERNAL_SERVER_ERROR,
                error: "Failed to create purchase orders.",
                data: null
            };
        }
        return {
            statuscode: HttpStatusCode.CREATED,
            error: null,
            data: result
        };
    } catch (error) {
        console.error("[Service] An error occurred during creating purchase orders:", error);
        return {
            statuscode: HttpStatusCode.INTERNAL_SERVER_ERROR,
            error: error,
            data: null
        };
    }
}
async function get(conditions: Condition = { sql: "", params: [] }): Promise<Response> {
const sql = `
    SELECT 
        po.po_id
    FROM public.purchase_orders po
    WHERE 1=1 ${conditions.sql}
`;


    try {
        const results = await sql_query(sql, conditions.params);
        if (results.length === 0) {
            console.error("[Service] Failed to update purchase orders: purchase orders not found.");
            return {
                statuscode: HttpStatusCode.NOT_FOUND,
                error: "purchase orders not found.",
                data: null
            };
        }        
        return {
            statuscode: HttpStatusCode.OK,
            error: null,
            data: results
        };
    } catch (error) {
        console.error("[Service] An error occurred during getting suppliers:", error);
        return {
            statuscode: HttpStatusCode.INTERNAL_SERVER_ERROR,
            error: error,
            data: null
        };
    }
}
async function update(id: string, payload: Payload, emp_id: string): Promise<Response> {
    const sql = `
        UPDATE public.purchase_orders
        SET
            po_issue_date = $1,
            po_ship_via = $2,
            po_qt_on = $3,
            po_shipping_terms = $4,
            po_tax_rate = $5,
            po_recipient_id = $6,
            po_comment = $7,
            po_emp_id = $8

        WHERE po_id = $9
        RETURNING po_id;
    `;
    try {
        const result = await sql_query(sql, [
            payload.issue_date,
            payload.ship_via,
            payload.qt_on,
            payload.shipping_terms,
            payload.tax_rate,
            payload.recipient_id,
            payload.comment,
            emp_id,
            id
        ]);
        if (result.length === 0) {
            console.error("[Service] Failed to update purchase orders: purchase orders not found.");
            return {
                statuscode: HttpStatusCode.NOT_FOUND,
                error: "purchase orders not found.",
                data: null
            };
        }
        return {
            statuscode: HttpStatusCode.NO_CONTENT,
            error: null,
            data: null
        };
    } catch (error) {
        console.error("[Service] An error occurred during updating purchase orders:", error);
        return {
            statuscode: HttpStatusCode.INTERNAL_SERVER_ERROR,
            error: error,
            data: null
        };
    }
}
async function update_status(id: string, payload: Payload, emp_id: string): Promise<Response> {
    const sql = `
        UPDATE public.purchase_orders
        SET
            po_status_sent_date = $1,
            po_status_goods_received_date = $2,
            po_status_paid_date = $3,
            po_status_note = $4,
            po_status = $5,
            po_emp_id = $6
        WHERE po_id = $7
        RETURNING po_id;
    `;
    try {
        const result = await sql_query(sql, [
            payload.sent_date,
            payload.goods_received_date,
            payload.paid_date,
            payload.status_note,
            payload.status,
            emp_id,
            id
        ]);
        if (result.length === 0) {
            console.error("[Service] Failed to update purchase orders status: purchase orders REV not found.");
            return {
                statuscode: HttpStatusCode.NOT_FOUND,
                error: "purchase orders REV not found.",
                data: null
            };
        }
        return {
            statuscode: HttpStatusCode.NO_CONTENT,
            error: null,
            data: null
        };
    } catch (error) {
        console.error("[Service] An error occurred during updating purchase orders  status:", error);
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
    create_pv,
    create_rev,
    get,
    update,
    update_status
};