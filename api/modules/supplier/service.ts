import sql_query from "@/api/utils/sql_query";
import { Payload } from "./type";
import { Condition, Response, HttpStatusCode } from "@/api/utils/shared_types";

async function count_duplicate(conditions: Condition): Promise<Response> {
    const sql = `
        SELECT 
            (SELECT COUNT(supplier_id) FROM public.suppliers WHERE supplier_tax_id = $1${conditions.sql}) AS duplicate_tax_id,
            (SELECT COUNT(supplier_id) FROM public.suppliers WHERE supplier_name_th = $2${conditions.sql}) AS duplicate_name_th,
            (SELECT COUNT(supplier_id) FROM public.suppliers WHERE supplier_name_en = $3${conditions.sql}) AS duplicate_name_en
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
        INSERT INTO public.suppliers (
            supplier_name_th,
            supplier_name_en,
            supplier_tax_id,
            supplier_tax_type,
            supplier_contact_name,
            supplier_contact_phone,
            supplier_contact_fax,
            supplier_contact_email,
            supplier_address,
            supplier_subdistrict_id,
            supplier_district_id,
            supplier_province_id,
            supplier_postcode,
            supplier_branch_type,
            supplier_branch_number,
            supplier_emp_id,
            supplier_status
            
        ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, 'Active'
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
            console.error("[Service] Failed to create supplier: No rows returned.");
            return {
                
                statuscode: HttpStatusCode.INTERNAL_SERVER_ERROR,
                error: "Failed to create supplier.",
                data: null
            };
        }
        return {
            statuscode: HttpStatusCode.CREATED,
            error: null,
            data: result
        };
    } catch (error) {
        console.error("[Service] An error occurred during creating supplier:", error);
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
            supplier_id,
            supplier_display_id,
            supplier_name_th,
            supplier_name_en,
            supplier_tax_id,
            supplier_tax_type,
            supplier_contact_name,
            supplier_contact_phone,
            supplier_contact_fax,
            supplier_contact_email,
            supplier_address,
            supplier_subdistrict_id,
            subdistrict_name_th as supplier_subdistrict_name_th,
            subdistrict_name_en as supplier_subdistrict_name_en,        
            supplier_district_id,
            district_name_th as supplier_district_name_th,
            district_name_en as supplier_district_name_en,
            supplier_province_id,
            province_name_th as supplier_province_name_th,
            province_name_en as supplier_province_name_en,
            supplier_postcode,            
            supplier_branch_type,
            supplier_branch_number,
            supplier_pp20_file,
            supplier_created_at,
            supplier_updated_at,
            supplier_emp_id,
            emp_prefix,
            emp_firstname_th as supplier_emp_fname_th,
            emp_lastname_th as supplier_emp_lname_th,
            emp_firstname_en as supplier_emp_fname_en,
            emp_lastname_en as supplier_emp_lname_en,
            supplier_status
        FROM public.suppliers
        LEFT JOIN  public.subdistricts ON suppliers.supplier_subdistrict_id = subdistricts.subdistrict_id
        LEFT JOIN  public.districts ON suppliers.supplier_district_id = districts.district_id
        LEFT JOIN  public.provinces ON suppliers.supplier_province_id = provinces.province_id
        JOIN  public.employees ON suppliers.supplier_emp_id = employees.emp_id
        WHERE 1=1 AND supplier_status != 'Deleted'${conditions.sql}
        ORDER BY supplier_created_at DESC;
    `;

    try {
        const results = await sql_query(sql, conditions.params);
        if (results.length === 0) {
            console.error("[Service] Failed to update supplier: supplier not found.");
            return {
                statuscode: HttpStatusCode.NOT_FOUND,
                error: "supplier not found.",
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

async function soft_delete(id: string, emp_id: string): Promise<Response> {
    const sql = `
        UPDATE public.suppliers
        SET
            supplier_status = 'Deleted',
            supplier_emp_id = $2
            
        WHERE supplier_id = $1
        RETURNING supplier_id;
    `;
    try {
        const result = await sql_query(sql, [id, emp_id]);
        if (result.length === 0) {
            console.error("[Service] Failed to delete supplier: Supplier not found.");
            return {
                statuscode: HttpStatusCode.NOT_FOUND,
                error: "Supplier not found.",
                data: null
            };
        }
        return {
            statuscode: HttpStatusCode.NO_CONTENT,
            error: null,
            data: null
        };
    } catch (error) {
        console.error("[Service] An error occurred during deleting supplier:", error);
        return {
            statuscode: HttpStatusCode.INTERNAL_SERVER_ERROR,
            error: error,
            data: null
        };
    }
}
async function update(id: string, payload: Payload, emp_id: string): Promise<Response> {
    const sql = `
        UPDATE public.suppliers
        SET
            supplier_name_th = $1,
            supplier_name_en = $2,
            supplier_tax_id = $3,
            supplier_tax_type = $4,
            supplier_contact_name = $5,
            supplier_contact_phone = $6,
            supplier_contact_fax = $7,
            supplier_contact_email = $8,
            supplier_address = $9,
            supplier_subdistrict_id	= $10,
            supplier_district_id = $11,	
            supplier_province_id = $12,	
            supplier_postcode = $13,
            supplier_branch_type = $14, 
            supplier_branch_number = $15,
            supplier_emp_id = $16
        
        WHERE supplier_id = $17
        RETURNING supplier_id;
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
            console.error("[Service] Failed to update supplier: Supplier not found.");
            return {
                statuscode: HttpStatusCode.NOT_FOUND,
                error: "Supplier not found.",
                data: null
            };
        }
        return {
            statuscode: HttpStatusCode.NO_CONTENT,
            error: null,
            data: null
        };
    } catch (error) {
        console.error("[Service] An error occurred during updating supplier:", error);
        return {
            statuscode: HttpStatusCode.INTERNAL_SERVER_ERROR,
            error: error,
            data: null
        };
    }
}
async function update_status(id: string, status: string, emp_id: string): Promise<Response> {
    const sql = `
        UPDATE public.suppliers
        SET
            supplier_status = $1,
            supplier_emp_id = $2
        WHERE supplier_id = $3
        RETURNING supplier_id;
    `;
    try {
        const result = await sql_query(sql, [
            status,
            emp_id,
            id
        ]);
        if (result.length === 0) {
            console.error("[Service] Failed to update supplier status: Supplier not found.");
            return {
                statuscode: HttpStatusCode.NOT_FOUND,
                error: "Supplier not found.",
                data: null
            };
        }
        return {
            statuscode: HttpStatusCode.NO_CONTENT,
            error: null,
            data: null
        };
    } catch (error) {
        console.error("[Service] An error occurred during updating supplier status:", error);
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