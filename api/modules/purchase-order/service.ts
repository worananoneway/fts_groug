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
async function create(payload: Payload, emp_id: string): Promise<Response> {
    const sql = `
        INSERT INTO public.purchase_orders (
            po_issue_date,
            po_supplier_id,
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
            payload.issue_date,
            payload.supplier_id,
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
            payment_supplier_id,
            payment_po_id,
            payment_project_id,
            payment_emp_id
            
        ) VALUES (
            $1, $2, $3, $4, $5
        ) RETURNING *;
    `;
    try {
        const result = await sql_query(sql, [
            payload.date,
            payload.supplier_id,
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
            po_supplier_id,
            po_ship_via,
            po_qt_on,
            po_shipping_terms,
            po_tax_rate,
            po_recipient_id,
            po_comment,
            po_project_id,
            po_emp_id
            
        ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
        ) RETURNING *;
    `;
    try {
        const result = await sql_query(sql, [
            payload.number,
            payload.issue_date,
            payload.supplier_id,
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
        po.po_id,
        po.po_number,
        po.po_issue_date,
        po.po_supplier_id,
        sup.supplier_display_id AS po_supplier_display_id,
        sup.supplier_name_th AS po_supplier_name_th,
        sup.supplier_name_en AS po_supplier_name_en,
        sup.supplier_tax_id AS po_supplier_tax_id,
        sup.supplier_tax_type AS po_supplier_tax_type,
        sup.supplier_contact_name AS po_supplier_contact_name,
        sup.supplier_contact_phone AS po_supplier_contact_phone,
        sup.supplier_contact_fax AS po_supplier_contact_fax,
        sup.supplier_contact_email AS po_supplier_contact_email,
        sup.supplier_address AS po_supplier_address,
        sup.supplier_subdistrict_id AS po_supplier_subdistrict_id,
        s.subdistrict_name_th AS supplier_subdistrict_name_th,
        s.subdistrict_name_en AS supplier_subdistrict_name_en,        
        sup.supplier_district_id AS po_supplier_district_id,
        d.district_name_th AS po_district_name_th,
        d.district_name_en AS po_district_name_en,
        sup.supplier_province_id AS po_supplier_province_id,
        p.province_name_th AS po_supplier_province_name_th,
        p.province_name_en AS po_supplier_province_name_en,
        sup.supplier_postcode AS po_supplier_postcode,            
        sup.supplier_branch_type AS po_supplier_branch_type,
        sup.supplier_branch_number AS po_supplier_branch_number,
        po.po_ship_via,
        po.po_qt_on,
        po.po_shipping_terms,
        po.po_tax_rate,
        po.po_recipient_id,
        emp_re.emp_display_id AS po_recipient_display_id,
        emp_re.emp_photo_file AS po_recipient_photo_file,
        emp_re.emp_prefix AS po_recipient_prefix,
        emp_re.emp_firstname_th AS po_recipient_firstname_th,
        emp_re.emp_lastname_th AS po_recipient_lastname_th,
        emp_re.emp_firstname_en AS po_recipient_firstname_en,
        emp_re.emp_lastname_en AS po_recipient_lastname_en,
        emp_re.emp_number_id AS po_recipient_number_id,
        emp_re.emp_department_id AS po_recipient_department_id,
        dept.department_name_th AS po_recipient_department_name_th,
        dept.department_name_en  AS po_recipient_department_name_en,
        emp_re.emp_position_id AS po_recipient_position_id,
        pos.position_name_th AS po_recipient_position_name_th,
        pos.position_name_en AS po_recipient_position_name_en,
        emp_re.emp_email AS po_recipient_email,
        emp_re.emp_phone AS po_recipient_phone,
        po.po_comment,            
        po.po_status_sent_date,
        po.po_status_goods_received_date,
        po.po_status_paid_date,
        po.po_status_note,
        det.details,
        det.subtotal AS po_subtotal,
        det.tax_rate AS po_tax_rate_calc,
        det.tax AS po_tax_amount,
        det.total AS po_total_amount,
        po.po_created_at,
        po.po_updated_at,
        po.po_emp_id,
        emp.emp_prefix,
        emp.emp_firstname_th AS po_emp_fname_th,
        emp.emp_lastname_th AS po_emp_lname_th,
        emp.emp_firstname_en AS po_emp_fname_en,
        emp.emp_lastname_en AS po_emp_lname_en,
        po.po_status,
        po.po_project_id,
        pro.project_display_id AS po_project_display_id,
        pro.project_name_th AS po_project_name_th,
        pro.project_name_en AS po_project_name_en

    FROM public.purchase_orders po
    LEFT JOIN public.suppliers sup ON po.po_supplier_id = sup.supplier_id
    LEFT JOIN public.subdistricts s ON sup.supplier_subdistrict_id = s.subdistrict_id
    LEFT JOIN public.districts d ON sup.supplier_district_id = d.district_id
    LEFT JOIN public.provinces p ON sup.supplier_province_id = p.province_id
    LEFT JOIN public.employees emp_re ON po.po_recipient_id = emp_re.emp_id
    LEFT JOIN public.departments dept ON emp_re.emp_department_id = dept.department_id
    LEFT JOIN public.positions pos ON emp_re.emp_position_id = pos.position_id
    LEFT JOIN public.employees emp ON po.po_emp_id = emp.emp_id
    JOIN public.projects pro ON po.po_project_id = pro.project_id


    JOIN LATERAL (
        SELECT 
            jsonb_agg(
                jsonb_build_object(
                    'id', pod.podetail_id,
                    'on', pod.podetail_on,
                    'department', pod.podetail_department,
                    'type', pod.podetail_type,
                    'description', pod.podetail_description,
                    'qty', pod.podetail_qty,
                    'discount', pod.podetail_discount,
                    'unit_price', pod.podetail_unit_price,
                    'total', pod.podetail_qty * pod.podetail_unit_price * (1 - COALESCE(pod.podetail_discount, 0) / 100.0),
                    'created_at', pod.podetail_created_at,
                    'updated_at', pod.podetail_updated_at,
                    'emp', jsonb_build_object(
                        'id', emp_pod.emp_id,
                        'prefix', emp_pod.emp_prefix,
                        'name', concat_ws(' ', emp_pod.emp_firstname_th, emp_pod.emp_lastname_th)
                    )
                )
                ORDER BY pod.podetail_on ASC
            ) AS details,
            COALESCE(SUM(pod.podetail_qty * pod.podetail_unit_price * (1 - COALESCE(pod.podetail_discount, 0) / 100.0)),0) AS subtotal,
            po.po_tax_rate                                              AS tax_rate,
            COALESCE(SUM(pod.podetail_qty * pod.podetail_unit_price * (1 - COALESCE(pod.podetail_discount, 0) / 100.0)),0)
                * po.po_tax_rate / 100.0                                AS tax,
            COALESCE(SUM(pod.podetail_qty * pod.podetail_unit_price * (1 - COALESCE(pod.podetail_discount, 0) / 100.0)),0)
                * (1 + po.po_tax_rate / 100.0)                          AS total
        FROM public.purchase_orders_details pod
        LEFT JOIN public.employees emp_pod ON pod.podetail_emp_id = emp_pod.emp_id
        WHERE pod.podetail_po_id = po.po_id
    ) det ON TRUE

    WHERE 1=1 ${conditions.sql}
    ORDER BY sup.supplier_created_at DESC;
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
            po_supplier_id = $2,
            po_ship_via = $3,
            po_qt_on = $4,
            po_shipping_terms = $5,
            po_tax_rate = $6,
            po_recipient_id = $7,
            po_comment = $8,
            po_emp_id = $9
        
        WHERE po_id = $10
        RETURNING po_id;
    `;
    try {
        const result = await sql_query(sql, [
            payload.issue_date,
            payload.supplier_id,
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

async function hard_delete (po_id: string): Promise<Response> {
    const sql = `
        DELETE FROM public.payment_vouchers
        WHERE payment_po_id = $1;
    `;
    try {
        const result = await sql_query(sql, [po_id]);
        return {
            statuscode: HttpStatusCode.NO_CONTENT,
            error: null,
            data: null
        };
    } catch (error) {
        console.error("[Service] An error occurred during deleting payment voucher:", error);
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
    hard_delete,
    get,
    update,
    update_status
};