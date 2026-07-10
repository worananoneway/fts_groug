import sql_query from "@/api/utils/sql_query";
import { Payload, StatusPayload } from "./type";
import { Condition, Response, HttpStatusCode } from "@/api/utils/shared_types";
const module_name = 'Purchase Orders';

async function create(payload: Payload, emp_id: string): Promise<Response> {
    const sql = `
        INSERT INTO public.purchase_orders (
            po_cus_id,
            po_due_date,
            po_remark,
            po_issue_date,
            po_ship_via,
            po_qt_on,
            po_shipping_terms,
            po_tax_rate,
            po_recipient_id,
            po_comment,
            po_project_id,
            po_condition_paid,
            po_delivery_province_id,
            po_delivery_district_id,
            po_delivery_subdistrict_id,
            po_approved_by_emp_id,
            po_purchasing_fname,
            po_purchasing_lname,
            po_status_sent_date,
            po_status_goods_received_,
            po_status_paid_date,
            po_status_note,
            po_emp_id
        ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
            $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
            $21, $22, $23
        ) RETURNING *;
    `;
    try {
        const result = await sql_query(sql, [
            payload.customer_id,
            payload.due_date,
            payload.remark,
            payload.issue_date,
            payload.ship_via,
            payload.qt_on,
            payload.shipping_terms,
            payload.tax_rate,
            payload.recipient_id,
            payload.comment,
            payload.project_id,
            payload.condition_paid,
            payload.delivery_province_id,
            payload.delivery_district_id,
            payload.delivery_subdistrict_id,
            payload.approved_by_emp_id,
            payload.purchasing_fname,
            payload.purchasing_lname,
            payload.sent_date,
            payload.goods_received_date,
            payload.paid_date,
            payload.status_note,
            emp_id
        ]);
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
            error: error,
            data: null
        };
    }
}
async function get(conditions: Condition = { sql: ``, params: [] }): Promise<Response> {
    const sql = `
        SELECT
            po.po_id,
            po.po_number,
            po.po_cus_id AS po_customer_id,
            cus.customer_display_id AS po_customer_display_id,
            cus.customer_name_th AS po_customer_name_th,
            cus.customer_name_en AS po_customer_name_en,
            cus.customer_tax_id AS po_customer_tax_id,
            cus.customer_tax_type AS po_customer_tax_type,
            cus.customer_contact_name AS po_customer_contact_name,
            cus.customer_contact_phone AS po_customer_contact_phone,
            cus.customer_contact_fax AS po_customer_contact_fax,
            cus.customer_contact_email AS po_customer_contact_email,
            cus.customer_address AS po_customer_address,
            cus.customer_subdistrict_id AS po_customer_subdistrict_id,
            customer_subdistrict.subdistrict_name_th AS po_customer_subdistrict_name_th,
            customer_subdistrict.subdistrict_name_en AS po_customer_subdistrict_name_en,
            cus.customer_district_id AS po_customer_district_id,
            customer_district.district_name_th AS po_customer_district_name_th,
            customer_district.district_name_en AS po_customer_district_name_en,
            cus.customer_province_id AS po_customer_province_id,
            customer_province.province_name_th AS po_customer_province_name_th,
            customer_province.province_name_en AS po_customer_province_name_en,
            cus.customer_postcode AS po_customer_postcode,
            cus.customer_branch_type AS po_customer_branch_type,
            cus.customer_branch_number AS po_customer_branch_number,
            po.po_due_date,
            po.po_remark,
            po.po_issue_date,
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
            NULL::text AS po_recipient_department_name_th,
            NULL::text AS po_recipient_department_name_en,
            emp_re.emp_position_id AS po_recipient_position_id,
            NULL::text AS po_recipient_position_name_th,
            NULL::text AS po_recipient_position_name_en,
            emp_re.emp_email AS po_recipient_email,
            emp_re.emp_phone AS po_recipient_phone,
            po.po_comment,
            po.po_status_sent_date,
            po.po_status_goods_received_ AS po_status_goods_received_date,
            po.po_status_paid_date,
            po.po_status_note,
            po.po_condition_paid,
            po.po_delivery_province_id,
            delivery_province.province_name_th AS po_delivery_province_name_th,
            delivery_province.province_name_en AS po_delivery_province_name_en,
            po.po_delivery_district_id,
            delivery_district.district_name_th AS po_delivery_district_name_th,
            delivery_district.district_name_en AS po_delivery_district_name_en,
            po.po_delivery_subdistrict_id,
            delivery_subdistrict.subdistrict_name_th AS po_delivery_subdistrict_name_th,
            delivery_subdistrict.subdistrict_name_en AS po_delivery_subdistrict_name_en,
            po.po_approved_by_emp_id,
            approved_emp.emp_prefix AS po_approved_by_emp_prefix,
            concat_ws(
                ' ',
                approved_emp.emp_firstname_th,
                approved_emp.emp_lastname_th
            ) AS po_approved_by_emp_name_th,
            concat_ws(
                ' ',
                approved_emp.emp_firstname_en,
                approved_emp.emp_lastname_en
            ) AS po_approved_by_emp_name_en,
            po.po_purchasing_fname,
            po.po_purchasing_lname,
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
        LEFT JOIN public.customers cus ON po.po_cus_id = cus.customer_id
        LEFT JOIN public.subdistricts customer_subdistrict
            ON cus.customer_subdistrict_id = customer_subdistrict.subdistrict_id
        LEFT JOIN public.districts customer_district
            ON cus.customer_district_id = customer_district.district_id
        LEFT JOIN public.provinces customer_province
            ON cus.customer_province_id = customer_province.province_id
        LEFT JOIN public.employees emp_re ON po.po_recipient_id = emp_re.emp_id
        LEFT JOIN public.employees emp ON po.po_emp_id = emp.emp_id
        LEFT JOIN public.projects pro ON po.po_project_id = pro.project_id
        LEFT JOIN public.provinces delivery_province
            ON po.po_delivery_province_id = delivery_province.province_id
        LEFT JOIN public.districts delivery_district
            ON po.po_delivery_district_id = delivery_district.district_id
        LEFT JOIN public.subdistricts delivery_subdistrict
            ON po.po_delivery_subdistrict_id = delivery_subdistrict.subdistrict_id
        LEFT JOIN public.employees approved_emp
            ON po.po_approved_by_emp_id = approved_emp.emp_id
        LEFT JOIN LATERAL (
            SELECT
                jsonb_agg(
                    jsonb_build_object(
                        'id', pod.podetail_id,
                        'po_id', pod.podetail_po_id,
                        'material_id', pod.podetail_mm_id,
                        'material_name', mm.mm_name,
                        'material_shape_type', mm.mm_shape_type,
                        'required_length_mm', pod.podetail_required_length_mm,
                        'required_width_mm', pod.podetail_required_width_mm,
                        'required_thickness_mm', pod.podetail_required_thickness_mm,
                        'required_diameter_mm', pod.podetail_required_diameter_mm,
                        'cut_quantity', pod.podetail_cut_quantity,
                        'remaining_quantity', pod.podetail_remaining_quantity,
                        'allow_wastrel', pod.podetail_allow_wastrel,
                        'allow_rotation', pod.podetail_allow_rotation,
                        'status', pod.podetail_status,
                        'remark', pod.podetail_remark,
                        'on', pod.podetail_on,
                        'unit', pod.podetail_unit,
                        'description', pod.podetail_description,
                        'qty', pod.podetail_qty,
                        'discount', pod.podetail_discount,
                        'unit_price', pod.podetail_unit_price,
                        'total', COALESCE(pod.podetail_qty, 0)
                            * COALESCE(pod.podetail_unit_price, 0)
                            * (1 - COALESCE(pod.podetail_discount, 0) / 100.0),
                        'emp_id', pod.podetail_emp_id,
                        'created_at', pod.podetail_created_at,
                        'updated_at', pod.podetail_updated_at,
                        'emp', jsonb_build_object(
                            'id', emp_pod.emp_id,
                            'prefix', emp_pod.emp_prefix,
                            'name', concat_ws(' ', emp_pod.emp_firstname_th, emp_pod.emp_lastname_th)
                        )
                    )
                    ORDER BY pod.podetail_on ASC NULLS LAST, pod.podetail_created_at ASC
                ) AS details,
                COALESCE(
                    SUM(
                        COALESCE(pod.podetail_qty, 0)
                        * COALESCE(pod.podetail_unit_price, 0)
                        * (1 - COALESCE(pod.podetail_discount, 0) / 100.0)
                    ),
                    0
                ) AS subtotal,
                COALESCE(po.po_tax_rate, 0) AS tax_rate,
                COALESCE(
                    SUM(
                        COALESCE(pod.podetail_qty, 0)
                        * COALESCE(pod.podetail_unit_price, 0)
                        * (1 - COALESCE(pod.podetail_discount, 0) / 100.0)
                    ),
                    0
                ) * COALESCE(po.po_tax_rate, 0) / 100.0 AS tax,
                COALESCE(
                    SUM(
                        COALESCE(pod.podetail_qty, 0)
                        * COALESCE(pod.podetail_unit_price, 0)
                        * (1 - COALESCE(pod.podetail_discount, 0) / 100.0)
                    ),
                    0
                ) * (1 + COALESCE(po.po_tax_rate, 0) / 100.0) AS total
            FROM public.purchase_orders_details pod
            LEFT JOIN public.material_masters mm ON pod.podetail_mm_id = mm.mm_id
            LEFT JOIN public.employees emp_pod ON pod.podetail_emp_id = emp_pod.emp_id
            WHERE pod.podetail_po_id = po.po_id
        ) det ON TRUE
        WHERE 1=1 ${conditions.sql}
        ORDER BY po.po_created_at DESC;
    `;


    try {
        const results = await sql_query(sql, conditions.params);
        if (results.length === 0) {
            console.error(`[Service] ${module_name} not found.`);
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
async function soft_delete (po_id: string, emp_id: string): Promise<Response> {
    const sql = `
        UPDATE public.purchase_orders
        SET po_deleted_at = NOW(), po_emp_id = $2
        WHERE po_id = $1;
    `;
    try {
        const result = await sql_query(sql, [po_id, emp_id]);
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
async function update(id: string, payload: Payload, emp_id: string): Promise<Response> {
    const sql = `
        UPDATE public.purchase_orders
        SET
            po_cus_id = $1,
            po_due_date = $2,
            po_remark = $3,
            po_issue_date = $4,
            po_ship_via = $5,
            po_qt_on = $6,
            po_shipping_terms = $7,
            po_tax_rate = $8,
            po_recipient_id = $9,
            po_comment = $10,
            po_project_id = $11,
            po_condition_paid = $12,
            po_delivery_province_id = $13,
            po_delivery_district_id = $14,
            po_delivery_subdistrict_id = $15,
            po_approved_by_emp_id = $16,
            po_purchasing_fname = $17,
            po_purchasing_lname = $18,
            po_emp_id = $19,
            po_updated_at = NOW()
        WHERE po_id = $20
        RETURNING po_id;
    `;
    try {
        const result = await sql_query(sql, [
            payload.customer_id,
            payload.due_date,
            payload.remark,
            payload.issue_date,
            payload.ship_via,
            payload.qt_on,
            payload.shipping_terms,
            payload.tax_rate,
            payload.recipient_id,
            payload.comment,
            payload.project_id,
            payload.condition_paid,
            payload.delivery_province_id,
            payload.delivery_district_id,
            payload.delivery_subdistrict_id,
            payload.approved_by_emp_id,
            payload.purchasing_fname,
            payload.purchasing_lname,
            emp_id,
            id
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
            error: error,
            data: null
        };
    }
}
async function update_status(id: string, payload: StatusPayload, emp_id: string): Promise<Response> {
    const sql = `
        UPDATE public.purchase_orders
        SET
            po_status_sent_date = $1,
            po_status_goods_received_ = $2,
            po_status_paid_date = $3,
            po_status_note = $4,
            po_status = $5,
            po_emp_id = $6,
            po_updated_at = NOW()
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
            console.error(`[Service] Failed to update ${module_name} status: ${module_name} not found.`);
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
        console.error(`[Service] An error occurred during updating ${module_name} status:`, error);
        return {
            statuscode: HttpStatusCode.INTERNAL_SERVER_ERROR,
            error: error,
            data: null
        };
    }
}



const purchase_order_service = {
    create,
    get,
    update,
    update_status,
    soft_delete
};

export default purchase_order_service;
