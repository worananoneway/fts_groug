import { reply_options } from './model';
import { reply_result } from '@/api/utils/controller_replys';
import { emp_authentication } from '@/api/utils/controller_auth';
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
        const emp_id = request.user;
        emp_authentication(module_name, emp_id, reply);
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
            return reply.code(HttpStatusCode.BAD_REQUEST).send(<Reply>
                reply_result(module_name, HttpStatusCode.BAD_REQUEST, missing_fields)
            );
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
        if (!payload.name_en && payload.name_en.length > 100) {
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
            return reply.code(HttpStatusCode.UNPROCESSABLE_CONTENT).send(
                reply_result(module_name, HttpStatusCode.UNPROCESSABLE_CONTENT, invalid_fields)
            );
        }

        const conditions: Condition = { sql: '', params: [payload.name_th, payload.name_en] };
        const duplicate_check = await service.count_duplicate(conditions);
        if (duplicate_check.statuscode !== HttpStatusCode.OK) {
            return reply.code(duplicate_check.statuscode).send(
                reply_result(module_name, duplicate_check.statuscode, Array.isArray(duplicate_check.error) ? duplicate_check.error : null)
            );
        }
        const result = await service.create(payload, emp_id);
        return reply.code(result.statuscode).send(<Reply>
            reply_result(module_name, result.statuscode, null, result.data, reply_options)
        );
    } catch (error) {
        console.error("[Controller] An error occurred during creating project:", error);
        return reply.code(HttpStatusCode.INTERNAL_SERVER_ERROR).send(<Reply>
            reply_result(module_name, HttpStatusCode.INTERNAL_SERVER_ERROR)
        );
    }
}
async function get(request: any, reply: any) {
    try {
        const lang = request.headers['accept-language'] || 'en-US';
        const emp_id = request?.user?.id;
        emp_authentication(module_name, emp_id, reply);
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
            return reply.code(HttpStatusCode.UNPROCESSABLE_CONTENT).send(<Reply>
                reply_result(module_name, HttpStatusCode.UNPROCESSABLE_CONTENT, invalid_fields)
            );
        }
        const results = await service.get(conditions);
        return reply.code(results.statuscode).send(<Reply>
            reply_result(module_name, results.statuscode, null, results.data, reply_options)
        );
    } catch (error) {
        console.error("[Controller] An error occurred during deleting project:", error);
        return reply.code(HttpStatusCode.INTERNAL_SERVER_ERROR).send(<Reply>
            reply_result(module_name, HttpStatusCode.INTERNAL_SERVER_ERROR)
        );
    }
}
async function update(request: any, reply: any) {
    try {
        const lang = request.headers['accept-language'] || 'en-US';
        const emp_id = request?.user?.id;
        emp_authentication(module_name, emp_id, reply);
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
            return reply.code(HttpStatusCode.BAD_REQUEST).send(<Reply>
                reply_result(module_name, HttpStatusCode.BAD_REQUEST, missing_fields)
            );
        }
        const payload: Payload = sanitize_payload(request.body);
        const project_id: string = request.params.project_id;
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
        if (invalid_fields.length > 0) {
            console.error("[Controller] Validation errors found in project creation payload:", invalid_fields);
            return reply.code(HttpStatusCode.UNPROCESSABLE_CONTENT).send(<Reply>
                reply_result(module_name, HttpStatusCode.UNPROCESSABLE_CONTENT, invalid_fields)
            );
        }
        const conditions: Condition = { sql: ' AND project_id != $3', params: [payload.name_th, payload.name_en, project_id] };
        const duplicate_check = await service.count_duplicate(conditions);
        if (duplicate_check.statuscode !== HttpStatusCode.OK) {
            return reply.code(duplicate_check.statuscode).send(<Reply>
                reply_result(module_name, duplicate_check.statuscode, Array.isArray(duplicate_check.error) ? duplicate_check.error : null)
            );
        }
        const result = await service.update(project_id, payload, emp_id);
        return reply.code(result.statuscode).send(<Reply>
            reply_result(module_name, result.statuscode, null, result.data, reply_options)
        );
    } catch (error) {
        console.error("[Controller] An error occurred during updating project:", error);
        return reply.code(HttpStatusCode.INTERNAL_SERVER_ERROR).send(<Reply>
            reply_result(module_name, HttpStatusCode.INTERNAL_SERVER_ERROR)
        );
    }
}
export default {
    create,
    get,
    update,

};