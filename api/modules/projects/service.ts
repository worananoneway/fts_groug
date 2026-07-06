import sql_query from "@/api/utils/sql_query";
import { Payload } from "./type";
import { Condition, Response, HttpStatusCode } from "@/api/utils/shared_types";
async function count_duplicate(conditions: Condition): Promise<Response> {
    const sql = `
        SELECT 
            (SELECT COUNT(project_id) FROM public.projects WHERE project_name_th = $1${conditions.sql}) AS duplicate_name_th,
            (SELECT COUNT(project_id) FROM public.projects WHERE project_name_en = $2${conditions.sql}) AS duplicate_name_en
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
        INSERT INTO public.projects (
            project_name_th,
            project_name_en,
            project_contact_name,
            project_contact_phone,
            project_contact_fax,
            project_contact_email,
            project_customer_id,
            project_manager_id,
            project_budget,
            project_closing_date,
            project_note,
            project_status,
            project_emp_id
            
            
        ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
        ) RETURNING *;
    `;
    try {
        const result = await sql_query(sql, [
            payload.name_th,
            payload.name_en,
            payload.contact_name,
            payload.contact_phone,
            payload.contact_fax,
            payload.contact_email,
            payload.customer_id,
            payload.manager_id,
            payload.budget,
            payload.closing_date,
            payload.note,
            payload.status,
            emp_id
        ]);
        if (result.length === 0) {
            console.error("[Service] Failed to create project: No rows returned.");
            return {
                statuscode: HttpStatusCode.INTERNAL_SERVER_ERROR,
                error: "Failed to create project.",
                data: null
            };
        }
        return {
            statuscode: HttpStatusCode.CREATED,
            error: null,
            data: result
        };
    } catch (error) {
        console.error("[Service] An error occurred during creating project:", error);
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
            pro.project_id,
            pro.project_display_id,
            pro.project_name_th,
            pro.project_name_en,
            pro.project_contact_name,
            pro.project_contact_phone,
            pro.project_contact_fax,
            pro.project_contact_email,
            pro.project_customer_id,
            cus.customer_display_id,
            cus.customer_name_th as project_customer_name_th,
            cus.customer_name_en as project_customer_name_en,
            pro.project_manager_id,
            mng.emp_firstname_th as project_manager_fname_th,
            mng.emp_lastname_th as project_manager_lname_th,
            mng.emp_firstname_en as project_manager_fname_en,
            mng.emp_lastname_en as project_manager_lname_en,
            mng.emp_prefix as project_manager_prefix,
            mng.emp_display_id as project_manager_display_id,
            pro.project_closing_date,
            pro.project_budget,
            pro.project_note,
            pro.project_created_at,
            pro.project_updated_at,
            pro.project_emp_id,
            emp.emp_prefix,
            emp.emp_firstname_th as project_emp_fname_th,
            emp.emp_lastname_th as project_emp_lname_th,
            emp.emp_firstname_en as project_emp_fname_en,
            emp.emp_lastname_en as project_emp_lname_en,                        
            pro.project_status
        FROM public.projects pro
        LEFT JOIN  public.customers cus ON pro.project_customer_id = cus.customer_id
        LEFT JOIN  public.employees emp ON pro.project_emp_id = emp.emp_id
        LEFT JOIN  public.employees mng ON pro.project_manager_id = mng.emp_id
        WHERE 1=1${conditions.sql}
        ORDER BY pro.project_created_at DESC;
    `;

    try {
        const results = await sql_query(sql, conditions.params);
        if (results.length === 0) {
            console.error("[Service] Failed to update project: project not found.");
            return {
                statuscode: HttpStatusCode.NOT_FOUND,
                error: "project not found.",
                data: null
            };
        }        
        return {
            statuscode: HttpStatusCode.OK,
            error: null,
            data: results
        };
    } catch (error) {
        console.error("[Service] An error occurred during getting projects:", error);
        return {
            statuscode: HttpStatusCode.INTERNAL_SERVER_ERROR,
            error: error,
            data: null
        };
    }
}
async function get_customer_by_id(customer_id: string): Promise<Response> {
    const sql = `
        SELECT
            customer_status
        FROM public.customers
        WHERE customer_status = 'Active' AND customer_id = $1;
    `;
    try {
        const result = await sql_query(sql, [customer_id]);
        if (result.length === 0) {
            console.error("[Service] Customer not found.");
            return {
                statuscode: HttpStatusCode.NOT_FOUND,
                error: "Customer not found.",
                data: null
            };
        }
        return {
            statuscode: HttpStatusCode.OK,
            error: null,
            data: result[0]
        };
    } catch (error) {
        console.error("[Service] An error occurred during getting customer by ID:", error);
        return {
            statuscode: HttpStatusCode.INTERNAL_SERVER_ERROR,
            error: error,
            data: null
        };
    }
}
async function get_manager_by_id(id:string): Promise<Response> {
    const sql = `
        SELECT
            emp_status
        FROM public.employees
        WHERE emp_status = 'Active' AND emp_id = $1;
    `;
    try {
        const result = await sql_query(sql, [id]);
        if (result.length === 0) {
            console.error("[Service] Manager not found.");
            return {
                statuscode: HttpStatusCode.NOT_FOUND,
                error: "Manager not found.",
                data: null
            };
        }
        return {
            statuscode: HttpStatusCode.OK,
            error: null,
            data: result[0]
        };
    } catch (error) {
        console.error("[Service] An error occurred during getting manager by ID:", error);
        return {
            statuscode: HttpStatusCode.INTERNAL_SERVER_ERROR,
            error: error,
            data: null
        };
    }
}
async function update(id: string, payload: Payload, emp_id: string): Promise<Response> {
    const sql = `
        UPDATE public.projects
        SET
            project_name_th = $1,
            project_name_en = $2,
            project_contact_name = $3,
            project_contact_phone = $4,
            project_contact_fax = $5,
            project_contact_email = $6,
            project_customer_id = $7,
            project_manager_id	= $8,
            project_budget = $9,	
            project_closing_date = $10,	
            project_note = $11,
            project_status = $12,
            project_emp_id = $13
        
        WHERE project_id = $14
        RETURNING project_id;
    `;
    try {
        const result = await sql_query(sql, [
            payload.name_th,
            payload.name_en,
            payload.contact_name,
            payload.contact_phone,
            payload.contact_fax,
            payload.contact_email,
            payload.customer_id,
            payload.manager_id,
            payload.budget,
            payload.closing_date,
            payload.note,
            payload.status,
            emp_id,
            id
        ]);
        if (result.length === 0) {
            console.error("[Service] Failed to update project: Project not found.");
            return {
                statuscode: HttpStatusCode.NOT_FOUND,
                error: "Project not found.",
                data: null
            };
        }
        return {
            statuscode: HttpStatusCode.NO_CONTENT,
            error: null,
            data: null
        };
    } catch (error) {
        console.error("[Service] An error occurred during updating project:", error);
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
    get_manager_by_id,
    get_customer_by_id,
    update
};