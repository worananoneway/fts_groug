import service from './service';
import {
    ErrorField,
    ErrorMessage,
    Payload,
    ValidationError
} from './type';

import { get_enum_keys, is_enum_key } from '@/api/utils/enum_checker';
import { sanitize_payload, sanitize_string } from '@/api/utils/input_sanitizer';
import { validate_digit, validate_email } from '@/api/utils/input_validator';
import {
    Condition,
    HttpStatus,
    HttpStatusCode,
    Reply,
    ReplyErrorField,
    ReplyErrorMessage,
    ReplySuccessMessage,
    PodetailDepartment,
    PodetailType,
} from '@/api/utils/shared_types';
import field_validator from '@/api/utils/field_validator';
import { reply_result } from '@/api/utils/controller_replys';

const podetail_department = get_enum_keys(PodetailDepartment);
const podetail_type = get_enum_keys(PodetailType);

const module_name = 'Purchase Order Detail';

async function create(request: any, reply: any) {
    try {
        const lang = request.headers['accept-language'] || 'en-US';
        if(!request.body.items || !Array.isArray(request.body.items) || request.body.items.length === 0) {
            return reply.code(HttpStatusCode.CREATED).send(<Reply>{
                    status: HttpStatus.CREATED,
                    statuscode: HttpStatusCode.CREATED,
                    details: {
                        message: ReplySuccessMessage.CREATED,
                        po_id: null,
                        department: null,
                        type: null,
                        description: null,
                        qty: null,
                        discount: null,
                        unit_price: null
                    }
                });
        }
        const user = request.user;
        if (!user || !user.id) {
            console.error("[Controller] Missing user ID from authenticated request.");
            return reply.code(HttpStatusCode.UNAUTHORIZED).send(<Reply>
                reply_result(module_name, HttpStatusCode.UNAUTHORIZED)
            );
        }
        const emp_id = user.id;
        const requiredKeys = [
            'po_id',
            'department',
            'type',
            'description',
            'qty',
            'discount',
            'unit_price'
        ];
        const missing_fields: string[] = field_validator(request.body, requiredKeys);
        if (missing_fields.length > 0) {
            console.error("[Controller] Missing required fields for purchaseorder creation:", missing_fields);
            return reply.code(HttpStatusCode.BAD_REQUEST).send(<Reply>
                reply_result(module_name, HttpStatusCode.BAD_REQUEST, missing_fields)
            );
        }
        console.log("[Controller] Incoming request body:", request.body);
        const payload = Array.isArray(request.body) ? request.body : request.body.items || [];
        const invalid_fields: ValidationError[] = [];
        for (let check_value of payload) {
            if (check_value.department && is_enum_key(podetail_department, check_value.department.toUpperCase())) {
                check_value.department = PodetailDepartment[check_value.department.trim().replace(/\s+/g, '_').toUpperCase() as keyof typeof PodetailDepartment];
            } else if (check_value.department && !is_enum_key(podetail_department, check_value.department.toUpperCase())) {
                invalid_fields.push({
                    field: ErrorField.DEPARTMENT,
                    message: ErrorMessage.DEPARTMENT_INVALID
                });
            }
            if (check_value.type && is_enum_key(podetail_type, check_value.type.toUpperCase())) {
                check_value.type = PodetailType[check_value.type.trim().replace(/\s+/g, '_').toUpperCase() as keyof typeof PodetailType];
            } else if (check_value.type && !is_enum_key(podetail_type, check_value.type.toUpperCase())) {
                invalid_fields.push({
                    field: ErrorField.TYPE,
                    message: ErrorMessage.TYPE_INVALID
                });
            }
            if (check_value.description && check_value.description.length > 6000) {
                invalid_fields.push({
                    field: ErrorField.DESCRIPTION,
                    message: ErrorMessage.DESCRIPTION_MAX_LENGTH
                });
            }
            if (check_value.qty && check_value.qty < -2147483647) {
                invalid_fields.push({
                    field: ErrorField.QTY,
                    message: ErrorMessage.QTY_MIN_VALUE
                });
            }
            if (check_value.qty && check_value.qty > 2147483647) {
                invalid_fields.push({
                    field: ErrorField.QTY,
                    message: ErrorMessage.QTY_MAX_VALUE
                });
            }
            if (check_value.discount && check_value.discount < -3.4e+38) {
                invalid_fields.push({
                    field: ErrorField.DISCOUNT,
                    message: ErrorMessage.DISCOUNT_MIN_VALUE
                });
            }
            if (check_value.discount && check_value.discount > 3.4e+38) {
                invalid_fields.push({
                    field: ErrorField.DISCOUNT,
                    message: ErrorMessage.DISCOUNT_MAX_VALUE
                });
            }
            if (check_value.unit_price && check_value.unit_price < -3.4e+38) {
                invalid_fields.push({
                    field: ErrorField.UNIT_PRICE,
                    message: ErrorMessage.UNIT_PRICE_MIN_VALUE
                });
            }
            if (check_value.unit_price && check_value.unit_price > 3.4e+38) {
                invalid_fields.push({
                    field: ErrorField.UNIT_PRICE,
                    message: ErrorMessage.UNIT_PRICE_MAX_VALUE
                });
            }
        }
        if (invalid_fields.length > 0) {
            console.error("[Controller] Validation errors found in purchaseorder creation payload:", invalid_fields);
            return reply.code(HttpStatusCode.UNPROCESSABLE_CONTENT).send(<Reply>
                reply_result(module_name, HttpStatusCode.UNPROCESSABLE_CONTENT, invalid_fields)
            );
        }
        const po_ids = new Set(payload.map((item: Payload, index: number)=> item.po_id));
        if (po_ids.size > 1) {
            console.error("[Controller] Multiple po IDs found in payload for creating purchase order details.");
            return reply.code(HttpStatusCode.UNPROCESSABLE_CONTENT).send(<Reply>{
                status: HttpStatus.UNPROCESSABLE_CONTENT,
                statuscode: HttpStatusCode.UNPROCESSABLE_CONTENT,
                details: {
                    field: ErrorField.PO_ID,
                    message: ErrorMessage.MULTIPLE_PO_IDS
                }
            });
        }
        const po_id = po_ids.values().next().value;
        const conditions: Condition = {
            sql: '', 
            params: [po_id, emp_id]
        };
        if (Array.isArray(payload) && payload.length > 0) {
            const sql_mainpart: string[] = [];
            payload.map((item, index) => {
                const sql_subpart: string[] = ["$1", "$2"];
                conditions.params.push(item.no || index + 1);
                sql_subpart.push(`$${conditions.params.length}`);
                conditions.params.push(item.department);
                sql_subpart.push(`$${conditions.params.length}`);
                conditions.params.push(item.type);
                sql_subpart.push(`$${conditions.params.length}`);
                conditions.params.push(item.description);
                sql_subpart.push(`$${conditions.params.length}`);
                conditions.params.push(item.qty);
                sql_subpart.push(`$${conditions.params.length}`);
                conditions.params.push(item.discount);
                sql_subpart.push(`$${conditions.params.length}`);
                conditions.params.push(item.unit_price);
                sql_subpart.push(`$${conditions.params.length}`);
                sql_mainpart.push(`(${sql_subpart.join(', ')})`);
            });
            conditions.sql = sql_mainpart.join(', ');
        }
        const result = await service.create(conditions);
        reply.code(result.statuscode).send(<Reply>
            reply_result(module_name, result.statuscode, null, result.data)
        );

    } catch (error) {
        console.error("[Controller] An error occurred during creating purchaseorder:", error);
        return reply.code(HttpStatusCode.INTERNAL_SERVER_ERROR).send(<Reply>
            reply_result(module_name, HttpStatusCode.INTERNAL_SERVER_ERROR)
        );
    }
}
async function soft_delete(request: any, reply: any) {
    try {
        const lang = request.headers['accept-language'] || 'en-US';
                const user = request.user;
                if (!user || !user.id) {
                    console.error("[Controller] Missing user ID from authenticated request.");
                    return reply.code(HttpStatusCode.UNAUTHORIZED).send(<Reply>
                        reply_result(module_name, HttpStatusCode.UNAUTHORIZED)
                    );
                }
        
                if (!request.params.podetail_id) {
                    console.error("[Controller] Missing purchase order detail ID for deletion.");
                    return reply.code(HttpStatusCode.BAD_REQUEST).send(<Reply>
                        reply_result(module_name, HttpStatusCode.BAD_REQUEST)
                    );
                }
                const id: string = sanitize_string(request.params.podetail_id);
                const result = await service.soft_delete(id);
                reply.code(result.statuscode).send(<Reply>
                    reply_result(module_name, result.statuscode, null, result.data)
                );
    } catch (error) {
        console.error("[Controller] An error occurred during deleting purchase order detail:", error);
        return reply.code(HttpStatusCode.INTERNAL_SERVER_ERROR).send(<Reply>
            reply_result(module_name, HttpStatusCode.INTERNAL_SERVER_ERROR)
        );
    }
}
async function update(request: any, reply: any) {
    try {
        const lang = request.headers['accept-language'] || 'en-US';
        const user = request.user;
        if (!user || !user.id) {
            console.error("[Controller] Missing user ID from authenticated request.");
            return reply.code(HttpStatusCode.UNAUTHORIZED).send(<Reply>
                reply_result(module_name, HttpStatusCode.UNAUTHORIZED)
            );
        }
        console.log("[Controller] Incoming request body:", request.body);
        const emp_id = user.id;
        const payload = Array.isArray(request.body) ? request.body : request.body.items || [];
        const invalid_fields: ValidationError[] = [];
        payload.forEach((payload: Payload) => {
        if (payload.department && is_enum_key(podetail_department, payload.department.toUpperCase())) {
            payload.department = PodetailDepartment[payload.department.trim().replace(/\s+/g, '_').toUpperCase() as keyof typeof PodetailDepartment];
        } else if (payload.department && !is_enum_key(podetail_department, payload.department.toUpperCase())) {
            invalid_fields.push({
                field: ErrorField.DEPARTMENT,
                message: ErrorMessage.DEPARTMENT_INVALID
            });
        }
        if (payload.type && is_enum_key(podetail_type, payload.type.toUpperCase())) {
            payload.type = PodetailType[payload.type.trim().replace(/\s+/g, '_').toUpperCase() as keyof typeof PodetailType];
        } else if (payload.type && !is_enum_key(podetail_type, payload.type.toUpperCase())) {
            invalid_fields.push({
                field: ErrorField.TYPE,
                message: ErrorMessage.TYPE_INVALID
            });
        }
        if (payload.description && payload.description.length > 6000) {
            invalid_fields.push({
                field: ErrorField.DESCRIPTION,
                message: ErrorMessage.DESCRIPTION_MAX_LENGTH
            });
        }
        if (payload.qty && payload.qty < 0) {
            invalid_fields.push({
                field: ErrorField.QTY,
                message: ErrorMessage.QTY_MIN_VALUE
            });
        }
        if (payload.qty && payload.qty > 2147483647) {
            invalid_fields.push({
                field: ErrorField.QTY,
                message: ErrorMessage.QTY_MAX_VALUE
            });
        }
        if (payload.discount && payload.discount < -3.4e+38) {
            invalid_fields.push({
                field: ErrorField.DISCOUNT,
                message: ErrorMessage.DISCOUNT_MIN_VALUE
            });
        }
        if (payload.discount && payload.discount > 3.4e+38) {
            invalid_fields.push({
                field: ErrorField.DISCOUNT,
                message: ErrorMessage.DISCOUNT_MAX_VALUE
            });
        }
        if (payload.unit_price && payload.unit_price < -3.4e+38) {
            invalid_fields.push({
                field: ErrorField.UNIT_PRICE,
                message: ErrorMessage.UNIT_PRICE_MIN_VALUE
            });
        }
        if (payload.unit_price && payload.unit_price > 3.4e+38) {
            invalid_fields.push({
                field: ErrorField.UNIT_PRICE,
                message: ErrorMessage.UNIT_PRICE_MAX_VALUE
            });
        }
        });
        if (invalid_fields.length > 0) {
            console.error("[Controller] Validation errors found in purchaseorder creation payload:", invalid_fields);
            return reply.code(HttpStatusCode.UNPROCESSABLE_CONTENT).send(<Reply>
                reply_result(module_name, HttpStatusCode.UNPROCESSABLE_CONTENT, invalid_fields)
            );
        }
        const conditions: Condition = {
            sql: '', 
            params: []
        };
        if (Array.isArray(payload) && payload.length > 0) {
            const sql_mainpart: string[] = [];
            payload.map((item, index) => {
                const sql_subpart: string[] = [];
                conditions.params.push(item.id);
                sql_subpart.push(`$${conditions.params.length}`);
                conditions.params.push(emp_id);
                sql_subpart.push(`$${conditions.params.length}`);
                conditions.params.push(item.department);
                sql_subpart.push(`$${conditions.params.length}`);
                conditions.params.push(item.type);
                sql_subpart.push(`$${conditions.params.length}`);
                conditions.params.push(item.description);
                sql_subpart.push(`$${conditions.params.length}`);
                conditions.params.push(item.qty);
                sql_subpart.push(`$${conditions.params.length}`);
                conditions.params.push(item.discount);
                sql_subpart.push(`$${conditions.params.length}`);
                conditions.params.push(item.unit_price);
                sql_subpart.push(`$${conditions.params.length}`);
                sql_mainpart.push(`(${sql_subpart.join(', ')})`);
            });
            conditions.sql = sql_mainpart.join(', ');
        }        
        const result = await service.update(conditions);
        reply.code(result.statuscode).send(<Reply>
            reply_result(module_name, result.statuscode, null, result.data)
        );
    } catch (error) {
        console.error("[Controller] An error occurred during updating purchaseorder:", error);
        return reply.code(HttpStatusCode.INTERNAL_SERVER_ERROR).send(<Reply>
            reply_result(module_name, HttpStatusCode.INTERNAL_SERVER_ERROR)
        );
    }
}


export default {
    create,
    soft_delete,
    update
    
};