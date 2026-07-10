import { created_reply_options } from './model';
import service from './service';
import {
    ErrorField,
    ErrorMessage,
    Payload,
    ValidationError,
    StatusPayload,
} from './type';
import { get_enum_keys, is_enum_key } from '@/api/utils/enum_checker';
import { sanitize_payload } from '@/api/utils/input_sanitizer';
import { validate_digit, validate_email } from '@/api/utils/input_validator';
import {
    Condition,
    HttpStatus,
    HttpStatusCode,
    Reply,
    ReplyErrorField,
    ReplyErrorMessage,
    ReplySuccessMessage,
    POStatus,
    Status
} from '@/api/utils/shared_types';
import field_validator from '@/api/utils/field_validator';
import { reply_result } from '@/api/utils/controller_replys';
import { emp_authentication } from '@/api/utils/controller_auth';
const po_status_enum = get_enum_keys(POStatus);

const module_name = 'Purchase Orders';


async function create(request: any, reply: any) {
    try {
        const lang = request.headers['accept-language'] || 'en-US';
        const user = request.user;

        emp_authentication(module_name, user, reply);

        const emp_id = user?.id;
        const requiredKeys = [
            'cus_id',
            'due_date',
            'issue_date',
            'ship_via',
            'qt_on',
            'shipping_terms',
            'tax_rate',
            'recipient_id',
            'comment',
            'status_sent_date',
            'status_goods_received_',
            'status_paid_date',
            'status_note',
            'remark',
            'project_id',
            'condition_paid',
            'delivery_province_id',
            'delivery_district_id',
            'delivery_subdistrict_id',
            'approved_by_emp_id',
            'purchasing_fname',
            'purchasing_lname'
        ];
        const missing_fields: string[] = field_validator(request.body, requiredKeys);
        if (missing_fields.length > 0) {
            return reply.code(HttpStatusCode.BAD_REQUEST).send(<Reply>
                reply_result(module_name, HttpStatusCode.BAD_REQUEST, missing_fields)
            );
        }

        const payload: Payload = request.body;
        const invalid_fields: ValidationError[] = [];
        if (payload.ship_via && payload.ship_via.length > 150) {
            invalid_fields.push({
                field: ErrorField.SHIP_VIA,
                message: ErrorMessage.SHIP_VIA_MAX_LENGTH
            });
        }
        if (payload.qt_on && payload.qt_on.length > 50) {
            invalid_fields.push({
                field: ErrorField.QT_ON,
                message: ErrorMessage.QT_ON_MAX_LENGTH
            });
        }
        if (payload.shipping_terms && payload.shipping_terms.length > 100) {
            invalid_fields.push({
                field: ErrorField.SHIPPING_TERMS,
                message: ErrorMessage.SHIPPING_TERMS_MIN_LENGTH
            });
        }
        if (payload.tax_rate && payload.tax_rate < 0) {
            invalid_fields.push({
                field: ErrorField.TAX_RATE,
                message: ErrorMessage.TAX_RATE_INVALID_MIN
            });
        }
        if (payload.tax_rate && payload.tax_rate > 3.4e+38) {
            invalid_fields.push({
                field: ErrorField.TAX_RATE,
                message: ErrorMessage.TAX_RATE_INVALID_MAX
            });
        }
        if (invalid_fields.length > 0) {
            console.error(`[Controller] Validation errors found in ${module_name} creation payload:`, invalid_fields);
            return reply.code(HttpStatusCode.UNPROCESSABLE_CONTENT).send(<Reply>
                reply_result(module_name, HttpStatusCode.UNPROCESSABLE_CONTENT, invalid_fields)
            );
        }

        const result = await service.create(payload, emp_id);
        return reply.code(result.statuscode).send(<Reply>
            reply_result(module_name, result.statuscode, null, result.data, {
                ...created_reply_options,
                language: lang
            })
        );

    } catch (error) {
        console.error(`[Controller] An error occurred during creating ${module_name}:`, error);
        return reply.code(HttpStatusCode.INTERNAL_SERVER_ERROR).send(<Reply>
            reply_result(module_name, HttpStatusCode.INTERNAL_SERVER_ERROR, null, [], null)
        );
    }
}

async function get(request: any, reply: any) {
    try {
        const lang = request.headers['accept-language'] || 'en-US';
        const user = request.user;
        const fields: string = request.reply_fields || '*';
        emp_authentication(module_name, user, reply);
        const emp_id = user?.id;
        const conditions: Condition = { sql: '', params: [] };
        const invalid_fields: ValidationError[] = [];
        if (request.params.po_id) {
            conditions.params.push(request.params.po_id || request.query.po_id);
            conditions.sql += ` AND po.po_id = $${conditions.params.length} `;
        }
        if (request.query.project_id) {
            conditions.params.push(request.query.project_id);
            conditions.sql += ` AND po.po_project_id = $${conditions.params.length} `;
        }
        if (request.query.qt_on) {
            conditions.params.push(request.query.qt_on);
            conditions.sql += ` AND po.po_qt_on = $${conditions.params.length} `;
        }
        if (request.query.recipient_id) {
            conditions.params.push(request.query.recipient_id);
            conditions.sql += ` AND po.po_recipient_id = $${conditions.params.length} `;
        }
        if (request.query.startdate) {
            conditions.params.push(request.query.startdate);
            conditions.sql += ` AND po.po_created_at >= $${conditions.params.length} `;
        }
        if (request.query.enddate) {
            conditions.params.push(request.query.enddate);
            conditions.sql += ` AND po.po_created_at <= $${conditions.params.length} `;
        }
        if (request.query.status && is_enum_key(po_status_enum, request.query.status)) {
            conditions.params.push(POStatus[request.query.status.trim().replace(/\s+/g, '_').toUpperCase() as keyof typeof POStatus]);
            conditions.sql += ` AND po.po_status = $${conditions.params.length} `;
        } else if (request.query.status) {
            console.error(`[Controller] Invalid OP Status enum value provided for ${module_name}: ${request.query.status}`);
            invalid_fields.push({
                field: ErrorField.STATUS,
                message: ErrorMessage.STATUS_INVALID
            });
        }
        if (invalid_fields.length > 0) {
            return reply.code(HttpStatusCode.UNPROCESSABLE_CONTENT).send(<Reply>
                reply_result(module_name, HttpStatusCode.UNPROCESSABLE_CONTENT, null, [], invalid_fields)
            );
        }

        const results = await service.get(conditions, fields);
        return reply.code(results.statuscode).send(<Reply>
            reply_result(module_name, results.statuscode, null, results.data, {
                ...created_reply_options,
                language: lang
            })
        );

    } catch (error) {
        console.error(`[Controller] An error occurred during deleting ${module_name}:`, error);
        return reply.code(HttpStatusCode.INTERNAL_SERVER_ERROR).send(<Reply>
            reply_result(module_name, HttpStatusCode.INTERNAL_SERVER_ERROR, null, [], null)
        );
    }
}

async function soft_delete(request: any, reply: any) {
    try {
        const lang = request.headers['accept-language'] || 'en-US';
        const user = request.user;

        emp_authentication(module_name, user, reply);

        if (!user || !user.id) {
            console.error(`[Controller] Missing user ID from authenticated request.`);
            return reply.code(HttpStatusCode.UNAUTHORIZED).send(<Reply>
                reply_result(module_name, HttpStatusCode.UNAUTHORIZED, null, [], null)
            );
        }
        const emp_id = user?.id;
        const missing_fields: string[] = [];
        if (!request.params.po_id) {
            missing_fields.push('po_id');
        }
        if (missing_fields.length > 0) {
            console.error(`[Controller] Missing required fields for deleting ${module_name}:`, missing_fields);
            return reply.code(HttpStatusCode.BAD_REQUEST).send(<Reply>
                reply_result(module_name, HttpStatusCode.BAD_REQUEST, null, missing_fields, null)
            );
        }

        const invalid_fields: ValidationError[] = [];
        const payload: StatusPayload = sanitize_payload(request.body);
        if (!is_enum_key(po_status_enum, payload.status?.trim().replace(/\s+/g, '_').toUpperCase()) && payload.status !== `Deleted`) {
            invalid_fields.push({
                field: ErrorField.STATUS,
                message: ErrorMessage.STATUS_INVALID
            });
        } else {
            payload.status = POStatus[payload.status.trim().replace(/\s+/g, '_').toUpperCase() as keyof typeof POStatus];
        }
        if (invalid_fields.length > 0) {
            console.error(`[Controller] Validation errors found in ${module_name} creation payload:`, invalid_fields);
            return reply.code(HttpStatusCode.UNPROCESSABLE_CONTENT).send(<Reply>
                reply_result(module_name, HttpStatusCode.UNPROCESSABLE_CONTENT, null, [], invalid_fields)
            );
        }

        const id: string = request.params.po_id;
        const result = await service.soft_delete(id, emp_id);
        return reply.code(result.statuscode).send(<Reply>
            reply_result(module_name, result.statuscode, result.data, [], null)
        );
    } catch (error) {
        console.error(`[Controller] An error occurred during deleting ${module_name}:`, error);
        return reply.code(HttpStatusCode.INTERNAL_SERVER_ERROR).send(<Reply>
            reply_result(module_name, HttpStatusCode.INTERNAL_SERVER_ERROR, null, [], null)
        );
    }
}

async function update(request: any, reply: any) {
    try {
        const lang = request.headers['accept-language'] || 'en-US';
        const user = request.user;

        emp_authentication(module_name, user, reply);
        
        const emp_id = user?.id;
        const missing_fields: string[] = field_validator(request.body, [
            'issue_date',
            'supplier_id',
            'ship_via',
            'qt_on',
            'shipping_terms',
            'tax_rate',
            'recipient_id',
            'comment'
        ]);
        if (!request.params.po_id) {
            missing_fields.unshift('po_id');
        }
        if (missing_fields.length > 0) {
            console.error(`[Controller] Missing required fields for updating ${module_name}:`, missing_fields);
            return reply.code(HttpStatusCode.BAD_REQUEST).send(<Reply>
                reply_result(module_name, HttpStatusCode.BAD_REQUEST, null, missing_fields, null)
            );
        }
        const payload: Payload = sanitize_payload(request.body);
        const id: string = request.params.po_id;
        const invalid_fields: ValidationError[] = [];
        if (payload.ship_via && payload.ship_via.length > 150) {
            invalid_fields.push({
                field: ErrorField.SHIP_VIA,
                message: ErrorMessage.SHIP_VIA_MAX_LENGTH
            });
        }
        if (payload.qt_on && payload.qt_on.length > 50) {
            invalid_fields.push({
                field: ErrorField.QT_ON,
                message: ErrorMessage.QT_ON_MAX_LENGTH
            });
        }
        if (payload.shipping_terms && payload.shipping_terms.length > 100) {
            invalid_fields.push({
                field: ErrorField.SHIPPING_TERMS,
                message: ErrorMessage.SHIPPING_TERMS_MIN_LENGTH
            });
        }
        if (payload.tax_rate && payload.tax_rate < 0) {
            invalid_fields.push({
                field: ErrorField.TAX_RATE,
                message: ErrorMessage.TAX_RATE_INVALID_MIN
            });
        }
        if (payload.tax_rate && payload.tax_rate > 3.4e+38) {
            invalid_fields.push({
                field: ErrorField.TAX_RATE,
                message: ErrorMessage.TAX_RATE_INVALID_MAX
            });
        }
        if (invalid_fields.length > 0) {
            console.error(`[Controller] Validation errors found in ${module_name} creation payload:`, invalid_fields);
            return reply.code(HttpStatusCode.UNPROCESSABLE_CONTENT).send(<Reply>
                reply_result(module_name, HttpStatusCode.UNPROCESSABLE_CONTENT, null, [], invalid_fields)
            );
        }

        const result = await service.update(id, payload, emp_id);
        return reply.code(result.statuscode).send(<Reply>
            reply_result(module_name, result.statuscode, result.data, [], null)
        );

    } catch (error) {
        console.error(`[Controller] An error occurred during updating ${module_name}:`, error);
        return reply.code(HttpStatusCode.INTERNAL_SERVER_ERROR).send(<Reply>
            reply_result(module_name, HttpStatusCode.INTERNAL_SERVER_ERROR, null, [], null)
        );
    }
}
async function update_status(request: any, reply: any) {
    try {
        const lang = request.headers['accept-language'] || 'en-US';
        const user = request.user;
        
        emp_authentication(module_name, user, reply);
        
        const emp_id = user?.id;
        const missing_fields: string[] = field_validator(request.body, [
            'status'
        ]);
        if (!request.params.po_id) {
            missing_fields.unshift('po_id');
        }
        if (missing_fields.length > 0) {
            console.error(`[Controller] Missing required fields for updating ${module_name} status:`, missing_fields);
            return reply.code(HttpStatusCode.BAD_REQUEST).send(<Reply>
                reply_result(module_name, HttpStatusCode.BAD_REQUEST, null, missing_fields, null)
            );
        }
        const invalid_fields: ValidationError[] = [];
        const payload: StatusPayload = sanitize_payload(request.body);
        if (!is_enum_key(po_status_enum, payload.status?.trim().replace(/\s+/g, '_').toUpperCase())) {
            invalid_fields.push({
                field: ErrorField.STATUS,
                message: ErrorMessage.STATUS_INVALID
            });
        } else {
            payload.status = POStatus[payload.status.trim().replace(/\s+/g, '_').toUpperCase() as keyof typeof POStatus];
        }
        if (invalid_fields.length > 0) {
            console.error(`[Controller] Validation errors found in ${module_name} creation payload:`, invalid_fields);
            return reply.code(HttpStatusCode.UNPROCESSABLE_CONTENT).send(<Reply>
                reply_result(module_name, HttpStatusCode.UNPROCESSABLE_CONTENT, null, [], invalid_fields)
            );
        }

        const id: string = request.params.po_id;
        const result = await service.update_status(id, payload, emp_id);
        return reply.code(result.statuscode).send(<Reply>
            reply_result(module_name, result.statuscode, result.data, [], null)
        );
    } catch (error) {
        console.error(`[Controller] An error occurred during updating ${module_name} status:`, error);
        return reply.code(HttpStatusCode.INTERNAL_SERVER_ERROR).send(<Reply>
            reply_result(module_name, HttpStatusCode.INTERNAL_SERVER_ERROR, null, [], null)
        );
    }
}


export default {
    create,
    get,
    soft_delete,
    update,
    update_status
};
