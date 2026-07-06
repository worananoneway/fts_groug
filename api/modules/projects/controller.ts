import {
    Contact,
    Customer,
    Emp,
    Manager,
    Project
} from './model';
import service from './service';
import {
    ErrorField,
    ErrorMessage,
    Payload,
    ValidationError
} from './type';

import { get_enum_keys, is_enum_key } from '@/api/utils/enum_checker';
import { sanitize_payload } from '@/api/utils/input_sanitizer';
import { validate_digit, validate_email } from '@/api/utils/input_validator';
import {
    BranchType,
    Condition,
    HttpStatus,
    HttpStatusCode,
    Reply,
    ReplyErrorField,
    ReplyErrorMessage,
    ReplySuccessMessage,
    Status,
    ProjectStatus,
    TaxType,
} from '@/api/utils/shared_types';
import field_validator from '@/api/utils/field_validator';

const branch_type_enum = get_enum_keys(BranchType);
const status_enum = get_enum_keys(Status);
const tax_type_enum = get_enum_keys(TaxType);
const project_status_enum = get_enum_keys(ProjectStatus);

const module_name = 'Project';

async function create(request: any, reply: any) {
    try {
        const lang = request.headers['accept-language'] || 'en-US';
        const user = request.user;
        // if (!user || !user.id) {
        //     console.error("[Controller] Missing user ID from authenticated request.");
        //     return reply.code(HttpStatusCode.UNAUTHORIZED).send(<Reply>{
        //         status: HttpStatus.UNAUTHORIZED,
        //         statuscode: HttpStatusCode.UNAUTHORIZED,
        //         details: {
        //             error: ReplyErrorField.UNAUTHORIZED,
        //             message: ReplyErrorMessage.UNAUTHORIZED
        //         }
        //     });
        // }
        const emp_id = user?.id;
        const requiredKeys = [
            'name_th',
            'name_en',
            'contact_name',
            'contact_phone',
            'contact_fax',
            'contact_email',
            'customer_id',
            'manager_id',
            'budget',
            'closing_date',
            'note',
            'status'
        ];
        const missing_fields: string[] = field_validator(request.body, requiredKeys);
        if (missing_fields.length > 0) {
            console.error("[Controller] Missing required fields for project creation:", missing_fields);
            return reply.code(HttpStatusCode.BAD_REQUEST).send(<Reply>{
                status: HttpStatus.BAD_REQUEST,
                statuscode: HttpStatusCode.BAD_REQUEST,
                details: {
                    error: ReplyErrorField.VALIDATION_ERROR,
                    message: ReplyErrorMessage.VALIDATION_ERROR,
                    errors: missing_fields.map(field => {
                        let message = ErrorMessage[field.toUpperCase() + '_REQUIRED' as keyof typeof ErrorMessage];
                        return {
                            field: field.toUpperCase() as ValidationError['field'],
                            message: message as ValidationError['message']
                        };
                    })
                }
            });
        }
        
        const payload: Payload = request.body;
        const invalid_fields: ValidationError[] = [];
        if (payload.status && is_enum_key(project_status_enum, payload.status)) {
            payload.status = ProjectStatus[payload.status.trim().replace(/\s+/g, '_').toUpperCase() as keyof typeof ProjectStatus];
        } else if (payload.status) {
            console.error("[Controller] Invalid Type enum of status value provided for customer: ", payload.status);
            invalid_fields.push({
                field: ErrorField.STATUS,
                message: ErrorMessage.STATUS_INVALID
            });
        }
        // check name_th 
        if (payload.name_th.length < 5) {

            invalid_fields.push({
                field: ErrorField.NAME_TH,
                message: ErrorMessage.NAME_TH_MIN_LENGTH
            });
        }
        if (payload.name_th !== null && payload.name_th.length > 100) {
            invalid_fields.push({
                field: ErrorField.NAME_TH,
                message: ErrorMessage.NAME_TH_MAX_LENGTH
            });
        }
        // check name_en
        if (!payload.name_en && payload.name_en.length < 5) {
            invalid_fields.push({
                field: ErrorField.NAME_EN,
                message: ErrorMessage.NAME_EN_MIN_LENGTH
            });
        }
        if ( !payload.name_en && payload.name_en.length > 100) {
            invalid_fields.push({
                field: ErrorField.NAME_EN,
                message: ErrorMessage.NAME_EN_MAX_LENGTH
            });
        }
        // check contact_phone max length 20
        if (payload.contact_phone !== null && payload.contact_phone.length > 20) {
            invalid_fields.push({
                field: ErrorField.CONTACT_PHONE,
                message: ErrorMessage.CONTACT_PHONE_MAX_LENGTH
            });
        }
        // check contact_fax max length 20
        if (payload.contact_fax !== null && payload.contact_fax.length > 20) {
            invalid_fields.push({
                field: ErrorField.CONTACT_FAX,
                message: ErrorMessage.CONTACT_FAX_MAX_LENGTH
            });
        }
        // check contact_email format and max length 150
        if (payload.contact_email !== null && !validate_email(payload.contact_email)) {
            invalid_fields.push({
                field: ErrorField.CONTACT_EMAIL,
                message: ErrorMessage.CONTACT_EMAIL_INVALID
            });
        }
        if (payload.contact_email !== null && payload.contact_email.length > 150) {
            invalid_fields.push({
                field: ErrorField.CONTACT_EMAIL,
                message: ErrorMessage.CONTACT_EMAIL_MAX_LENGTH
            });
        }
        if (payload.budget === null && payload.budget < 0) {
            invalid_fields.push({
                field: ErrorField.BUDGET,
                message: ErrorMessage.BUDGET_MIN_VALUE
            });
        }
        if (payload.budget === null && payload.budget > 3.4e+38) {
            invalid_fields.push({
                field: ErrorField.BUDGET,
                message: ErrorMessage.BUDGET_MAX_VALUE
            });
        }
        if (invalid_fields.length > 0) {
            console.error("[Controller] Validation errors found in project creation payload:", invalid_fields);
            return reply.code(HttpStatusCode.UNPROCESSABLE_CONTENT).send(<Reply>{
                status: HttpStatus.UNPROCESSABLE_CONTENT,
                statuscode: HttpStatusCode.UNPROCESSABLE_CONTENT,
                details: {
                    error: ReplyErrorField.VALIDATION_ERROR,
                    message: ReplyErrorMessage.VALIDATION_ERROR,
                    errors: invalid_fields
                }
            });
        }
        const conditions: Condition = { sql: '', params: [payload.name_th, payload.name_en] };
        const duplicate_check = await service.count_duplicate(conditions);
        if (duplicate_check.statuscode !== HttpStatusCode.OK) {
            return reply.code(HttpStatusCode.INTERNAL_SERVER_ERROR).send(<Reply>{
                status: HttpStatus.INTERNAL_SERVER_ERROR,
                statuscode: HttpStatusCode.INTERNAL_SERVER_ERROR,
                details: {
                    error: ReplyErrorField.INTERNAL_SERVER_ERROR,
                    message: ReplyErrorMessage.INTERNAL_SERVER_ERROR
                }
            });
        }
        const duplicates = duplicate_check.data![0];
        const duplicate_errors: ValidationError[] = [];
        if (duplicates.duplicate_name_th > 0) {
            duplicate_errors.push({
                field: ErrorField.NAME_TH,
                message: ErrorMessage.NAME_TH_DUPLICATE
            });
        }
        if (duplicates.duplicate_name_en > 0) {
            duplicate_errors.push({
                field: ErrorField.NAME_EN,
                message: ErrorMessage.NAME_EN_DUPLICATE
            });
        }
        if (duplicate_errors.length > 0) {
            console.error("[Controller] Duplicate errors found in project creation:", duplicate_errors);
            return reply.code(HttpStatusCode.CONFLICT).send(<Reply>{
                status: HttpStatus.CONFLICT,
                statuscode: HttpStatusCode.CONFLICT,
                details: {
                    error: ReplyErrorField.DUPLICATE_ENTRY,
                    message: ReplyErrorMessage.DUPLICATE_ENTRY,
                    duplicates: duplicate_errors
                }
            })
        }
        const result = await service.create(payload, emp_id);
        switch (result.statuscode) {
            case HttpStatusCode.CREATED:
                const data = result.data![0];
                console.log("[Controller] Project created successfully with ID:", data.project_id);
                return reply.code(HttpStatusCode.CREATED).send(<Reply>{
                    status: HttpStatus.CREATED,
                    statuscode: HttpStatusCode.CREATED,
                    details: {
                        message: "customer " + ReplySuccessMessage.CREATED,
                        id: data.project_id,
                        display_id: data.project_display_id,
                        name_th: data.project_name_th,
                        name_en: data.project_name_en,
                        contact: new Contact(
                            data.project_contact_name,
                            data.project_contact_phone,
                            data.project_contact_fax,
                            data.project_contact_email
                        ),
                        customer_id: data.project_customer_id,
                        manager_id: data.project_manager_id,
                        budget: data.project_budget,
                        closing_date: data.project_closing_date,
                        note: data.project_note,
                        status: data.project_status,
                    }
                });
            case HttpStatusCode.INTERNAL_SERVER_ERROR:
                return reply.code(HttpStatusCode.INTERNAL_SERVER_ERROR).send(<Reply>{
                    status: HttpStatus.INTERNAL_SERVER_ERROR,
                    statuscode: HttpStatusCode.INTERNAL_SERVER_ERROR,
                    details: {
                        error: ReplyErrorField.INTERNAL_SERVER_ERROR,
                        message: ReplyErrorMessage.INTERNAL_SERVER_ERROR
                    }
                });
            default:
                console.error("[Controller] An unrecognized status code was returned from creating project:", result.statuscode);
                return reply.code(HttpStatusCode.INTERNAL_SERVER_ERROR).send(<Reply>{
                    status: HttpStatus.INTERNAL_SERVER_ERROR,
                    statuscode: HttpStatusCode.INTERNAL_SERVER_ERROR,
                    details: {
                        error: ReplyErrorField.UNRECOGNIZED_STATUSCODE,
                        message: ReplyErrorMessage.UNRECOGNIZED_STATUSCODE
                    }
                });
        }
    } catch (error) {
        console.error("[Controller] An error occurred during creating project:", error);
        return reply.code(HttpStatusCode.INTERNAL_SERVER_ERROR).send(<Reply>{
            status: HttpStatus.INTERNAL_SERVER_ERROR,
            statuscode: HttpStatusCode.INTERNAL_SERVER_ERROR,
            details: {
                error: ReplyErrorField.INTERNAL_SERVER_ERROR,
                message: ReplyErrorMessage.INTERNAL_SERVER_ERROR
            }
        });
    }
}
async function get(request: any, reply: any) {
    try {
        const lang = request.headers['accept-language'] || 'en-US';
        const user = request.user;
        const conditions: Condition = { sql: '', params: [] };
        const invalid_fields: ValidationError[] = [];

        if (request.params.project_id) {
            conditions.params.push(request.params.project_id);
            conditions.sql += ` AND project_id = $${conditions.params.length} `;
        }
        if (request.query.status && is_enum_key(project_status_enum, request.query.status)) {
            conditions.params.push(ProjectStatus[request.query.status.toUpperCase() as keyof typeof ProjectStatus]);
            conditions.sql += ` AND pro.project_status = $${conditions.params.length} `;
        } else if (request.query.status) {
            console.error("[Controller] Invalid status enum value provided for project: ", request.query.status);
            invalid_fields.push({
                field: ErrorField.STATUS,
                message: ErrorMessage.STATUS_INVALID
            });
        }
        if (invalid_fields.length > 0) {
            return reply.code(HttpStatusCode.UNPROCESSABLE_CONTENT).send(<Reply>{
                status: HttpStatus.UNPROCESSABLE_CONTENT,
                statuscode: HttpStatusCode.UNPROCESSABLE_CONTENT,
                details: {
                    error: ReplyErrorField.VALIDATION_ERROR,
                    message: ReplyErrorMessage.VALIDATION_ERROR,
                    errors: invalid_fields
                }
            });
        }
        const results = await service.get(conditions);
        switch (results.statuscode) {
            case HttpStatusCode.OK:
                console.log(`[Controller] Successfully retrieved ${results.data!.length || 0} projects.`);
                return reply.code(HttpStatusCode.OK).send(<Reply>{
                    status: HttpStatus.OK,
                    statuscode: HttpStatusCode.OK,
                    details: {
                        customer_id: request.query.customer_id,
                        manager_id: request.query.manager_id,
                        status: request.query.status,
                        projects: results.data?.map(project => new Project(
                            project.project_id,
                            project.project_display_id,
                            project.project_name_th,
                            project.project_name_en,
                            project.project_notifications || [],
                            new Contact(
                                project.project_contact_name,
                                project.project_contact_phone,
                                project.project_contact_fax,
                                project.project_contact_email
                            ),
                            new Customer(
                                project.project_customer_id,
                                project.customer_display_id,
                                lang === "th-TH" ? project.project_customer_name_th : project.project_customer_name_en
                            ),
                            new Manager(
                                project.project_manager_id,
                                project.project_manager_display_id,
                                project.project_manager_prefix,
                                lang === "th-TH" ? project.project_manager_fname_th + " " + project.project_manager_lname_th : project.project_manager_fname_en + " " + project.project_manager_lname_en
                            ),
                            project.project_budget,
                            project.project_closing_date,
                            project.project_note,
                            project.project_po_file,
                            project.project_created_at,
                            project.project_updated_at,
                            new Emp(
                                project.project_emp_id,
                                project.project_emp_prefix,
                                lang === "th-TH" ? project.project_emp_fname_th + " " + project.project_emp_lname_th : project.project_emp_fname_en + " " + project.project_emp_lname_en
                            ),
                            project.project_status
                        ))
                    }
                });
            case HttpStatusCode.INTERNAL_SERVER_ERROR:
                return reply.code(HttpStatusCode.INTERNAL_SERVER_ERROR).send(<Reply>{
                    status: HttpStatus.INTERNAL_SERVER_ERROR,
                    statuscode: HttpStatusCode.INTERNAL_SERVER_ERROR,
                    details: {
                        error: ReplyErrorField.INTERNAL_SERVER_ERROR,
                        message: ReplyErrorMessage.INTERNAL_SERVER_ERROR
                    }
                });
            case HttpStatusCode.NOT_FOUND:
                return reply.code(HttpStatusCode.NOT_FOUND).send(<Reply>{
                    status: HttpStatus.NOT_FOUND,
                    statuscode: HttpStatusCode.NOT_FOUND,
                    details: {
                        error: ReplyErrorField.NOT_FOUND,
                        message: ReplyErrorMessage.NOT_FOUND
                    }
                });
            case HttpStatusCode.INTERNAL_SERVER_ERROR:
                return reply.code(HttpStatusCode.INTERNAL_SERVER_ERROR).send(<Reply>{
                    status: HttpStatus.INTERNAL_SERVER_ERROR,
                    statuscode: HttpStatusCode.INTERNAL_SERVER_ERROR,
                    details: {
                        error: ReplyErrorField.INTERNAL_SERVER_ERROR,
                        message: ReplyErrorMessage.INTERNAL_SERVER_ERROR
                    }
                });
            default:
                console.error("[Controller] An unrecognized status code was returned from getting project:", results.statuscode);
                return reply.code(HttpStatusCode.INTERNAL_SERVER_ERROR).send(<Reply>{
                    status: HttpStatus.INTERNAL_SERVER_ERROR,
                    statuscode: HttpStatusCode.INTERNAL_SERVER_ERROR,
                    details: {
                        error: ReplyErrorField.UNRECOGNIZED_STATUSCODE,
                        message: ReplyErrorMessage.UNRECOGNIZED_STATUSCODE
                    }
                });
        }
    } catch (error) {
        console.error("[Controller] An error occurred during deleting project:", error);
        return reply.code(HttpStatusCode.INTERNAL_SERVER_ERROR).send(<Reply>{
            status: HttpStatus.INTERNAL_SERVER_ERROR,
            statuscode: HttpStatusCode.INTERNAL_SERVER_ERROR,
            details: {
                error: ReplyErrorField.INTERNAL_SERVER_ERROR,
                message: ReplyErrorMessage.INTERNAL_SERVER_ERROR
            }
        });
    }
}
async function update(request: any, reply: any) {
    try {
        const lang = request.headers['accept-language'] || 'en-US';
        const user = request.user;
        const emp_id = user.id;
        const missing_fields: string[] = field_validator(request.body, [
            'name_th',
            'name_en',
            'contact_name',
            'contact_phone',
            'contact_fax',
            'contact_email',
            'customer_id',
            'manager_id',
            'budget',
            'closing_date',
            'note',
            'status'
        ]);
        if (!request.params.project_id) {
            missing_fields.unshift('project_id');
        }
        if (missing_fields.length > 0) {
            console.error("[Controller] Missing required fields for updating project:", missing_fields);
            return reply.code(HttpStatusCode.BAD_REQUEST).send(<Reply>{
                status: HttpStatus.BAD_REQUEST,
                statuscode: HttpStatusCode.BAD_REQUEST,
                details: {
                    error: ReplyErrorField.VALIDATION_ERROR,
                    message: ReplyErrorMessage.VALIDATION_ERROR,
                    errors: missing_fields.map(field => {
                        let message = ErrorMessage[field.toUpperCase() + '_REQUIRED' as keyof typeof ErrorMessage];
                        return {
                            field: field.toUpperCase() as ValidationError['field'],
                            message: message as ValidationError['message']
                        };
                    })
                }
            });
        }
        const payload: Payload = sanitize_payload(request.body);
        const project_id: string = request.params.project_id;
        const project_data = await service.get({ sql: ' AND project_id = $1 ', params: [project_id] });
        if (project_data.statuscode === HttpStatusCode.NOT_FOUND) {
            return reply.code(HttpStatusCode.NOT_FOUND).send(<Reply>{
                status: HttpStatus.NOT_FOUND,
                statuscode: HttpStatusCode.NOT_FOUND,
                details: {
                    error: ReplyErrorField.NOT_FOUND,
                    message: ReplyErrorMessage.NOT_FOUND,
                }
            })
        } else if (project_data.statuscode === HttpStatusCode.INTERNAL_SERVER_ERROR) {
            return reply.code(HttpStatusCode.INTERNAL_SERVER_ERROR).send(<Reply>{
                status: HttpStatus.INTERNAL_SERVER_ERROR,
                statuscode: HttpStatusCode.INTERNAL_SERVER_ERROR,
                details: {
                    error: ReplyErrorField.INTERNAL_SERVER_ERROR,
                    message: ReplyErrorMessage.INTERNAL_SERVER_ERROR,
                }
            });
        }
        const current_data = project_data.data![0];
        if (current_data.supplier_status === Status.INACTIVE) {
            console.error(`[Controller] Project with ID ${project_id} is inactive and cannot be updated`);
            return reply.code(HttpStatusCode.CONFLICT).send(<Reply>{
                status: HttpStatus.CONFLICT,
                statuscode: HttpStatusCode.CONFLICT,
                details: {
                    error: ErrorField.STATUS,
                    message: ErrorMessage.STATUS_CONFLICT
                }
            })
        }
        const invalid_fields: ValidationError[] = [];
        // check name_th 
        if (payload.name_th.length < 5) {
            invalid_fields.push({
                field: ErrorField.NAME_TH,
                message: ErrorMessage.NAME_TH_MIN_LENGTH
            });
        }
        if (payload.name_th.length > 100) {
            invalid_fields.push({
                field: ErrorField.NAME_TH,
                message: ErrorMessage.NAME_TH_MAX_LENGTH
            });
        }
        // check name_en
        if (payload.name_en.length < 5) {
            invalid_fields.push({
                field: ErrorField.NAME_EN,
                message: ErrorMessage.NAME_EN_MIN_LENGTH
            });
        }
        if (payload.name_en.length > 100) {
            invalid_fields.push({
                field: ErrorField.NAME_EN,
                message: ErrorMessage.NAME_EN_MAX_LENGTH
            });
        }
        // check contact_phone max length 20
        if (payload.contact_phone.length > 20) {
            invalid_fields.push({
                field: ErrorField.CONTACT_PHONE,
                message: ErrorMessage.CONTACT_PHONE_MAX_LENGTH
            });
        }
        // check contact_fax max length 20
        if (payload.contact_fax.length > 20) {
            invalid_fields.push({
                field: ErrorField.CONTACT_FAX,
                message: ErrorMessage.CONTACT_FAX_MAX_LENGTH
            });
        }
        // check contact_email format and max length 150
        if (!validate_email(payload.contact_email)) {
            invalid_fields.push({
                field: ErrorField.CONTACT_EMAIL,
                message: ErrorMessage.CONTACT_EMAIL_INVALID
            });
        }
        if (payload.contact_email.length > 150) {
            invalid_fields.push({
                field: ErrorField.CONTACT_EMAIL,
                message: ErrorMessage.CONTACT_EMAIL_MAX_LENGTH
            });
        }
        if (payload.budget < 0) {
            invalid_fields.push({
                field: ErrorField.BUDGET,
                message: ErrorMessage.BUDGET_MIN_VALUE
            });
        }
        if (payload.budget > 3.4e+38) {
            invalid_fields.push({
                field: ErrorField.BUDGET,
                message: ErrorMessage.BUDGET_MAX_VALUE
            });
        }
        const custormer_check = await service.get_customer_by_id(payload.customer_id);
        const manager_check = await service.get_manager_by_id(payload.manager_id);
        if (custormer_check.statuscode === HttpStatusCode.NOT_FOUND) {
            invalid_fields.push({
                field: ErrorField.CUSTOMER_ID,
                message: ErrorMessage.CUSTOMER_ID_NOT_FOUND
            });
        }
        if (manager_check.statuscode === HttpStatusCode.NOT_FOUND) {
            invalid_fields.push({
                field: ErrorField.MANAGER_ID,
                message: ErrorMessage.MANAGER_ID_NOT_FOUND
            });
        }
        if (invalid_fields.length > 0) {
            console.error("[Controller] Validation errors found in project creation payload:", invalid_fields);
            return reply.code(HttpStatusCode.UNPROCESSABLE_CONTENT).send(<Reply>{
                status: HttpStatus.UNPROCESSABLE_CONTENT,
                statuscode: HttpStatusCode.UNPROCESSABLE_CONTENT,
                details: {
                    error: ReplyErrorField.VALIDATION_ERROR,
                    message: ReplyErrorMessage.VALIDATION_ERROR,
                    errors: invalid_fields
                }
            });
        }
        const conditions: Condition = { sql: ' AND project_id != $3', params: [payload.name_th, payload.name_en, project_id] };
        const duplicate_check = await service.count_duplicate(conditions);
        if (duplicate_check.statuscode !== HttpStatusCode.OK) {
            return reply.code(HttpStatusCode.INTERNAL_SERVER_ERROR).send(<Reply>{
                status: HttpStatus.INTERNAL_SERVER_ERROR,
                statuscode: HttpStatusCode.INTERNAL_SERVER_ERROR,
                details: {
                    error: ReplyErrorField.INTERNAL_SERVER_ERROR,
                    message: ReplyErrorMessage.INTERNAL_SERVER_ERROR
                }
            });
        }
        const duplicates = duplicate_check.data![0];
        const duplicate_errors: ValidationError[] = [];
        if (duplicates.duplicate_name_th > 0) {
            duplicate_errors.push({
                field: ErrorField.NAME_TH,
                message: ErrorMessage.NAME_TH_DUPLICATE
            });
        }
        if (duplicates.duplicate_name_en > 0) {
            duplicate_errors.push({
                field: ErrorField.NAME_EN,
                message: ErrorMessage.NAME_EN_DUPLICATE
            });
        }
        if (duplicate_errors.length > 0) {
            console.error("[Controller] Duplicate errors found in project creation:", duplicate_errors);
            return reply.code(HttpStatusCode.BAD_REQUEST).send(<Reply>{
                status: HttpStatus.BAD_REQUEST,
                statuscode: HttpStatusCode.BAD_REQUEST,
                details: {
                    error: ReplyErrorField.DUPLICATE_ENTRY,
                    message: ReplyErrorMessage.DUPLICATE_ENTRY,
                    duplicates: duplicate_errors
                }
            })
        }
        const result = await service.update(project_id, payload, emp_id);
        switch (result.statuscode) {
            case HttpStatusCode.NO_CONTENT:
                return reply.code(HttpStatusCode.NO_CONTENT).send(<Reply>{
                    status: HttpStatus.NO_CONTENT,
                    statuscode: HttpStatusCode.NO_CONTENT,
                    details: {
                        message: ReplySuccessMessage.UPDATED
                    }
                })
            case HttpStatusCode.NOT_FOUND:
                return reply.code(HttpStatusCode.NOT_FOUND).send(<Reply>{
                    status: HttpStatus.NOT_FOUND,
                    statuscode: HttpStatusCode.NOT_FOUND,
                    details: {
                        error: ReplyErrorField.NOT_FOUND,
                        message: ReplyErrorMessage.NOT_FOUND,
                    }
                })
            case HttpStatusCode.INTERNAL_SERVER_ERROR:
                return reply.code(HttpStatusCode.INTERNAL_SERVER_ERROR).send(<Reply>{
                    status: HttpStatus.INTERNAL_SERVER_ERROR,
                    statuscode: HttpStatusCode.INTERNAL_SERVER_ERROR,
                    details: {
                        error: ReplyErrorField.INTERNAL_SERVER_ERROR,
                        message: ReplyErrorMessage.INTERNAL_SERVER_ERROR
                    }
                })
            default:
                console.error("[Controller] An unrecognized status code was returned from updating project:", result.statuscode)
                return reply.code(HttpStatusCode.INTERNAL_SERVER_ERROR).send(<Reply>{
                    status: HttpStatus.INTERNAL_SERVER_ERROR,
                    statuscode: HttpStatusCode.INTERNAL_SERVER_ERROR,
                    details: {
                        error: ReplyErrorField.UNRECOGNIZED_STATUSCODE,
                        message: ReplyErrorMessage.UNRECOGNIZED_STATUSCODE
                    }
                })
        }
    } catch (error) {
        console.error("[Controller] An error occurred during updating project:", error);
        return reply.code(HttpStatusCode.INTERNAL_SERVER_ERROR).send(<Reply>{
            status: HttpStatus.INTERNAL_SERVER_ERROR,
            statuscode: HttpStatusCode.INTERNAL_SERVER_ERROR,
            details: {
                error: ReplyErrorField.INTERNAL_SERVER_ERROR,
                message: ReplyErrorMessage.INTERNAL_SERVER_ERROR
            }
        });
    }
}
export default {
    create,
    get,
    update,

};