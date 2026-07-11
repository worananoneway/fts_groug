import sql_query from "@/api/utils/sql_query";
import { Payload } from "./type";
import { Condition, Response, HttpStatusCode } from "@/api/utils/shared_types";
const module_name = 'customers';
async function count_duplicate(conditions: Condition): Promise<Response> {
    const sql = `
        SELECT 
            (SELECT COUNT(customer_id) FROM public.customers WHERE customer_tax_id = $1${conditions.sql}) AS duplicate_tax_id
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
        console.error(`[Service] An error occurred during counting duplicates for ${module_name}:`, error);
        return {
            statuscode: HttpStatusCode.INTERNAL_SERVER_ERROR,
            error: error,
            data: null
        };
    }
}
async function create(payload: Payload, emp_id: string | null): Promise<Response> {
    const sql = `
        INSERT INTO public.customers (
            customer_name_th,
            customer_name_en,
            customer_tax_id,
            customer_tax_type,
            customer_contact_name,
            customer_contact_phone,
            customer_contact_fax,
            customer_contact_email,
            customer_address,
            customer_subdistrict_id,
            customer_district_id,
            customer_province_id,
            customer_postcode,
            customer_branch_type,
            customer_branch_number,
            customer_emp_id,
            customer_status
        ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,'Active'
        ) RETURNING *;
    `;
    try {
        const result = await sql_query(sql, [
            payload.name_th,
            payload.name_en,
            payload.tax_id,
            payload.tax_type,
            payload.contact_name,
            payload.contact_phone,
            payload.contact_fax,
            payload.contact_email,
            payload.address,
            payload.subdistrict_id,
            payload.district_id,
            payload.province_id,
            payload.postcode,
            payload.branch_type,
            payload.branch_number,
            emp_id
        ]);
        if (result.length === 0) {
            console.error(`[Service] Failed to create ${module_name}: No row was created.`);
            return {
                statuscode: HttpStatusCode.INTERNAL_SERVER_ERROR,
                error: `No row was created.`,
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
async function get(conditions: Condition = { sql: ``, params: [] }, filter: string = `*`): Promise<Response> {
    const sql = `
        WITH customer_cte AS (
            SELECT 
                customer_id,
                customer_display_id,
                customer_name_th,
                customer_name_en,
                customer_tax_id,
                customer_tax_type,
                customer_contact_name,
                customer_contact_phone,
                customer_contact_fax,
                customer_contact_email,
                customer_address,
                customer_subdistrict_id,
                subdistrict_name_th AS customer_subdistrict_name_th,
                subdistrict_name_en AS customer_subdistrict_name_en,
                customer_district_id,
                district_name_th AS customer_district_name_th,
                district_name_en AS customer_district_name_en,
                customer_province_id,
                province_name_th AS customer_province_name_th,
                province_name_en AS customer_province_name_en,
                customer_postcode,
                customer_branch_type,
                customer_branch_number,
                customer_pp20_file,
                customer_certificate_file,
                customer_created_at,
                customer_updated_at,
                customer_emp_id,
                emp_prefix AS customer_emp_prefix,
                emp_firstname_th AS customer_emp_firstname_th,
                emp_lastname_th AS customer_emp_lastname_th,
                emp_firstname_en AS customer_emp_firstname_en,
                emp_lastname_en AS customer_emp_lastname_en,
                customer_status
            FROM public.customers
            JOIN public.subdistricts ON customers.customer_subdistrict_id = subdistricts.subdistrict_id
            JOIN public.districts ON customers.customer_district_id = districts.district_id
            JOIN public.provinces ON customers.customer_province_id = provinces.province_id
            LEFT JOIN public.employees ON customers.customer_emp_id = employees.emp_id
            WHERE 1=1 AND customer_status != 'Deleted' AND customer_status != 'Inactive' ${conditions.sql}
            ORDER BY customer_created_at DESC
        )
        SELECT ${filter} FROM customer_cte;
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
        console.error(`[Service] An error occurred during getting customers:`, error);
        return {
            statuscode: HttpStatusCode.INTERNAL_SERVER_ERROR,
            error: error,
            data: null
        };
    }
}
async function soft_delete(id: string, emp_id: string | null): Promise<Response> {
    const sql = `
        UPDATE public.customers
        SET
            customer_status = 'Deleted',
            customer_emp_id = $2
        WHERE customer_id = $1
        RETURNING customer_id;
    `;
    try {
        const result = await sql_query(sql, [id, emp_id]);
        if (result.length === 0) {
            console.error(`[Service] Failed to delete ${module_name}: No row was deleted.`);
            return {
                statuscode: HttpStatusCode.NOT_FOUND,
                error: `No row was deleted.`,
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
            error: error,
            data: null
        };
    }
}
async function update(id: string, payload: Payload, emp_id: string | null): Promise<Response> {
    const sql = `
        UPDATE public.customers
        SET
            customer_name_th = $1,
            customer_name_en = $2,
            customer_tax_id = $3,
            customer_tax_type = $4,
            customer_contact_name = $5,
            customer_contact_phone = $6,
            customer_contact_fax = $7,
            customer_contact_email = $8,
            customer_address = $9,
            customer_subdistrict_id = $10,
            customer_district_id = $11,
            customer_province_id = $12,
            customer_postcode = $13,
            customer_branch_type = $14,
            customer_branch_number = $15,
            customer_emp_id = $16
        WHERE customer_id = $17
        RETURNING customer_id;
    `;
    try {
        const result = await sql_query(sql, [
            payload.name_th,
            payload.name_en,
            payload.tax_id,
            payload.tax_type,
            payload.contact_name,
            payload.contact_phone,
            payload.contact_fax,
            payload.contact_email,
            payload.address,
            payload.subdistrict_id,
            payload.district_id,
            payload.province_id,
            payload.postcode,
            payload.branch_type,
            payload.branch_number,
            emp_id,
            id
        ]);
        if (result.length === 0) {
            console.error(`[Service] Failed to update ${module_name}: No row was updated.`);
            return {
                statuscode: HttpStatusCode.NOT_FOUND,
                error: `No row was updated.`,
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
async function update_status(id: string, status: string, emp_id: string | null): Promise<Response> {
    const sql = `
        UPDATE public.customers
        SET
            customer_status = $1,
            customer_emp_id = $2
        WHERE customer_id = $3
        RETURNING customer_id;
    `;
    try {
        const result = await sql_query(sql, [
            status,
            emp_id,
            id
        ]);
        if (result.length === 0) {
            console.error(`[Service] Failed to update ${module_name} status: No row was updated.`);
            return {
                statuscode: HttpStatusCode.NOT_FOUND,
                error: `No row was updated.`,
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

export default {
    count_duplicate,
    create,
    get,
    soft_delete,
    update,
    update_status
};