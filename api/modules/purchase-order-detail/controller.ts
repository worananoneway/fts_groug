import service from './service';
import purchase_order_service from '../purchase_orders/service';
import {
    ErrorField,
    ErrorMessage,
    Payload,
    PurchaseOrderDetailStatus,
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
    POStatus,
} from '@/api/utils/shared_types';
import field_validator from '@/api/utils/field_validator';
import { reply_result } from '@/api/utils/controller_replys';
import { emp_authentication } from '@/api/utils/controller_auth';
const podetail_status = get_enum_keys(PurchaseOrderDetailStatus);

const module_name = 'Purchase Order Detail';

async function create(request: any, reply: any) {
    try {
        const lang = request.headers['accept-language'] || 'en-US';
        if(!request.body.items || !Array.isArray(request.body.items) || request.body.items.length === 0) {
            return reply.code(HttpStatusCode.CREATED).send(<Reply>
                reply_result(module_name, HttpStatusCode.CREATED)
            );
        }
        const user = request.user;

        emp_authentication(module_name, user, reply);

        const emp_id = user?.id;
        const payload = Array.isArray(request.body) ? request.body : request.body.items || [];
        const requiredKeys = [
            'po_id',
            'mm_id',
            'required_length_mm',
            'required_width_mm',
            'required_thickness_mm',
            'required_diameter_mm',
            'cut_quantity',
            'remaining_quantity',
            'allow_wastrel',
            'allow_rotation',
            'status',
            'remark',
            'on',
            'unit',
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
        const invalid_fields: ValidationError[] = [];
        for (const check_value of payload) {
            // if (typeof check_value.po_id !== 'string' || check_value.po_id.length === 0 || check_value.po_id.length > 20) {
            //     invalid_fields.push({
            //         field: ErrorField.PO_ID,
            //         message: ErrorMessage.PO_ID_INVALID
            //     });
            // }
            // if (typeof check_value.mm_id !== 'string' || check_value.mm_id.length === 0 || check_value.mm_id.length > 20) {
            //     invalid_fields.push({
            //         field: ErrorField.MM_ID,
            //         message: ErrorMessage.MM_ID_INVALID
            //     });
            // }
            if (check_value.required_length_mm && check_value.required_length_mm <= 0 ) {
                invalid_fields.push({
                    field: ErrorField.REQUIRED_LENGTH_MM,
                    message: ErrorMessage.REQUIRED_LENGTH_MM_INVALID
                });
            }
            if (check_value.required_width_mm && check_value.required_width_mm <= 0) {
                invalid_fields.push({
                    field: ErrorField.REQUIRED_WIDTH_MM,
                    message: ErrorMessage.REQUIRED_WIDTH_MM_INVALID
                });
            }
            if (check_value.required_thickness_mm && check_value.required_thickness_mm <= 0) {
                invalid_fields.push({
                    field: ErrorField.REQUIRED_THICKNESS_MM,
                    message: ErrorMessage.REQUIRED_THICKNESS_MM_INVALID
                });
            }
            if (check_value.required_diameter_mm && check_value.required_diameter_mm <= 0) {
                invalid_fields.push({
                    field: ErrorField.REQUIRED_DIAMETER_MM,
                    message: ErrorMessage.REQUIRED_DIAMETER_MM_INVALID
                });
            }
            if (check_value.cut_quantity && check_value.cut_quantity <= 0) {
                invalid_fields.push({
                    field: ErrorField.CUT_QUANTITY,
                    message: ErrorMessage.CUT_QUANTITY_INVALID
                });
            }
            if (check_value.remaining_quantity && check_value.remaining_quantity <= 0) {
                invalid_fields.push({
                    field: ErrorField.REMAINING_QUANTITY,
                    message: ErrorMessage.REMAINING_QUANTITY_INVALID
                });
            }
            if (typeof check_value.allow_wastrel !== 'boolean') {
                invalid_fields.push({
                    field: ErrorField.ALLOW_WASTREL,
                    message: ErrorMessage.ALLOW_WASTREL_INVALID
                });
            }
            if (typeof check_value.allow_rotation !== 'boolean') {
                invalid_fields.push({
                    field: ErrorField.ALLOW_ROTATION,
                    message: ErrorMessage.ALLOW_ROTATION_INVALID
                });
            }
            const normalized_status = typeof check_value.status === 'string'
                ? check_value.status.trim().replace(/\s+/g, '_').toUpperCase()
                : '';
            if (is_enum_key(podetail_status, normalized_status)) {
                check_value.status = PurchaseOrderDetailStatus[normalized_status as keyof typeof PurchaseOrderDetailStatus];
            } else {
                invalid_fields.push({
                    field: ErrorField.STATUS,
                    message: ErrorMessage.STATUS_INVALID
                });
            }
            if (check_value.remark && typeof check_value.remark !== 'string') {
                invalid_fields.push({
                    field: ErrorField.REMARK,
                    message: ErrorMessage.REMARK_INVALID
                });
            }
            if (check_value.on && check_value.on <= 0) {
                invalid_fields.push({
                    field: ErrorField.ON,
                    message: ErrorMessage.ON_INVALID
                });
            }
            if (check_value.unit && (typeof check_value.unit !== 'string' || check_value.unit.length > 80)) {
                invalid_fields.push({
                    field: ErrorField.UNIT,
                    message: ErrorMessage.UNIT_INVALID
                });
            }
            if (check_value.description && (typeof check_value.description !== 'string' || check_value.description.length > 1000)) {
                invalid_fields.push({
                    field: ErrorField.DESCRIPTION,
                    message: ErrorMessage.DESCRIPTION_INVALID
                });
            }
            if (check_value.qty && check_value.qty <= 0) {
                invalid_fields.push({
                    field: ErrorField.QTY,
                    message: ErrorMessage.QTY_INVALID
                });
            }
            if (check_value.discount && check_value.discount <= 0) {
                invalid_fields.push({
                    field: ErrorField.DISCOUNT,
                    message: ErrorMessage.DISCOUNT_INVALID
                });
            }
            if (check_value.unit_price && check_value.unit_price <= 0) {
                invalid_fields.push({
                    field: ErrorField.UNIT_PRICE,
                    message: ErrorMessage.UNIT_PRICE_INVALID
                });
            }
        }
        if (invalid_fields.length > 0) {
            console.error("[Controller] Validation errors found in purchaseorder creation payload:", invalid_fields);
            return reply.code(HttpStatusCode.UNPROCESSABLE_CONTENT).send(<Reply>
                reply_result(module_name, HttpStatusCode.UNPROCESSABLE_CONTENT, invalid_fields)
            );
        }
        const po_ids = new Set(payload.map((item: Payload) => item.po_id));
        if (po_ids.size > 1) {
            console.error("[Controller] Multiple po IDs found in payload for creating purchase order details.");
            return reply.code(HttpStatusCode.UNPROCESSABLE_CONTENT).send(<Reply>
                reply_result(module_name, HttpStatusCode.UNPROCESSABLE_CONTENT, [{
                    field: ErrorField.PO_ID,
                    message: ErrorMessage.MULTIPLE_PO_IDS
                }])
            );
        }
        const conditions: Condition = {
            sql: '', 
            params: []
        };
        if (Array.isArray(payload) && payload.length > 0) {
            const sql_mainpart: string[] = [];
            payload.forEach((item) => {
                const sql_subpart: string[] = [];
                conditions.params.push(item.mm_id);
                sql_subpart.push(`$${conditions.params.length}`);
                conditions.params.push(item.required_length_mm);
                sql_subpart.push(`$${conditions.params.length}`);
                conditions.params.push(item.required_width_mm);
                sql_subpart.push(`$${conditions.params.length}`);
                conditions.params.push(item.required_thickness_mm);
                sql_subpart.push(`$${conditions.params.length}`);
                conditions.params.push(item.required_diameter_mm);
                sql_subpart.push(`$${conditions.params.length}`);
                conditions.params.push(item.cut_quantity);
                sql_subpart.push(`$${conditions.params.length}`);
                conditions.params.push(item.remaining_quantity);
                sql_subpart.push(`$${conditions.params.length}`);
                conditions.params.push(item.allow_wastrel);
                sql_subpart.push(`$${conditions.params.length}`);
                conditions.params.push(item.allow_rotation);
                sql_subpart.push(`$${conditions.params.length}`);
                conditions.params.push(item.status);
                sql_subpart.push(`$${conditions.params.length}`);
                conditions.params.push(item.remark);
                sql_subpart.push(`$${conditions.params.length}`);
                conditions.params.push(item.on);
                sql_subpart.push(`$${conditions.params.length}`);
                conditions.params.push(item.unit);
                sql_subpart.push(`$${conditions.params.length}`);
                conditions.params.push(item.description);
                sql_subpart.push(`$${conditions.params.length}`);
                conditions.params.push(item.qty);
                sql_subpart.push(`$${conditions.params.length}`);
                conditions.params.push(item.discount);
                sql_subpart.push(`$${conditions.params.length}`);
                conditions.params.push(item.unit_price);
                sql_subpart.push(`$${conditions.params.length}`);
                conditions.params.push(emp_id);
                sql_subpart.push(`$${conditions.params.length}`);
                conditions.params.push(item.po_id);
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

                emp_authentication(module_name, user, reply);
        
                if (!request.params.podetail_id) {
                    console.error("[Controller] Missing purchase order detail ID for deletion.");
                    return reply.code(HttpStatusCode.BAD_REQUEST).send(<Reply>
                        reply_result(module_name, HttpStatusCode.BAD_REQUEST)
                    );
                }
                const id: string = sanitize_string(request.params.podetail_id);
                const result = await service.hard_delete(id);
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

        emp_authentication(module_name, user, reply);

        console.log("[Controller] Incoming request body:", request.body);
        const emp_id = user?.id;
        const payload = Array.isArray(request.body) ? request.body : request.body.items || [];
        const requiredKeys = [
            'id',
            'po_id',
            'mm_id',
            'required_length_mm',
            'required_width_mm',
            'required_thickness_mm',
            'required_diameter_mm',
            'cut_quantity',
            'remaining_quantity',
            'allow_wastrel',
            'allow_rotation',
            'status',
            'remark',
            'on',
            'unit',
            'description',
            'qty',
            'discount',
            'unit_price'
        ];
        const missing_fields: string[] = field_validator(request.body, requiredKeys);
        if (missing_fields.length > 0) {
            console.error("[Controller] Missing required fields for purchaseorder update:", missing_fields);
            return reply.code(HttpStatusCode.BAD_REQUEST).send(<Reply>
                reply_result(module_name, HttpStatusCode.BAD_REQUEST, missing_fields)
            );
        }
        const invalid_fields: ValidationError[] = [];
        for (const check_value of payload) {
            // if (typeof check_value.id !== 'string' || check_value.id.length === 0 || check_value.id.length > 20) {
            //     invalid_fields.push({
            //         field: ErrorField.ID,
            //         message: ErrorMessage.ID_INVALID
            //     });
            // }
            // if (typeof check_value.po_id !== 'string' || check_value.po_id.length === 0 || check_value.po_id.length > 20) {
            //     invalid_fields.push({
            //         field: ErrorField.PO_ID,
            //         message: ErrorMessage.PO_ID_INVALID
            //     });
            // }
            // if (typeof check_value.mm_id !== 'string' || check_value.mm_id.length === 0 || check_value.mm_id.length > 20) {
            //     invalid_fields.push({
            //         field: ErrorField.MM_ID,
            //         message: ErrorMessage.MM_ID_INVALID
            //     });
            // }
            if (check_value.required_length_mm && check_value.required_length_mm <= 0) {
                invalid_fields.push({
                    field: ErrorField.REQUIRED_LENGTH_MM,
                    message: ErrorMessage.REQUIRED_LENGTH_MM_INVALID
                });
            }
            if (check_value.required_width_mm && check_value.required_width_mm <= 0) {
                invalid_fields.push({
                    field: ErrorField.REQUIRED_WIDTH_MM,
                    message: ErrorMessage.REQUIRED_WIDTH_MM_INVALID
                });
            }
            if (check_value.required_thickness_mm && check_value.required_thickness_mm <= 0) {
                invalid_fields.push({
                    field: ErrorField.REQUIRED_THICKNESS_MM,
                    message: ErrorMessage.REQUIRED_THICKNESS_MM_INVALID
                });
            }
            if (check_value.required_diameter_mm && check_value.required_diameter_mm <= 0) {
                invalid_fields.push({
                    field: ErrorField.REQUIRED_DIAMETER_MM,
                    message: ErrorMessage.REQUIRED_DIAMETER_MM_INVALID
                });
            }
            if (check_value.cut_quantity && check_value.cut_quantity <= 0) {
                invalid_fields.push({
                    field: ErrorField.CUT_QUANTITY,
                    message: ErrorMessage.CUT_QUANTITY_INVALID
                });
            }
            if (check_value.remaining_quantity && check_value.remaining_quantity <= 0) {
                invalid_fields.push({
                    field: ErrorField.REMAINING_QUANTITY,
                    message: ErrorMessage.REMAINING_QUANTITY_INVALID
                });
            }
            if (typeof check_value.allow_wastrel !== 'boolean') {
                invalid_fields.push({
                    field: ErrorField.ALLOW_WASTREL,
                    message: ErrorMessage.ALLOW_WASTREL_INVALID
                });
            }
            if (typeof check_value.allow_rotation !== 'boolean') {
                invalid_fields.push({
                    field: ErrorField.ALLOW_ROTATION,
                    message: ErrorMessage.ALLOW_ROTATION_INVALID
                });
            }
            const normalized_status = typeof check_value.status === 'string'
                ? check_value.status.trim().replace(/\s+/g, '_').toUpperCase()
                : '';
            if (is_enum_key(podetail_status, normalized_status)) {
                check_value.status = PurchaseOrderDetailStatus[normalized_status as keyof typeof PurchaseOrderDetailStatus];
            } else {
                invalid_fields.push({
                    field: ErrorField.STATUS,
                    message: ErrorMessage.STATUS_INVALID
                });
            }
            if (check_value.remark && typeof check_value.remark !== 'string') {
                invalid_fields.push({
                    field: ErrorField.REMARK,
                    message: ErrorMessage.REMARK_INVALID
                });
            }
            if (check_value.on && check_value.on <= 0) {
                invalid_fields.push({
                    field: ErrorField.ON,
                    message: ErrorMessage.ON_INVALID
                });
            }
            if (check_value.unit && (typeof check_value.unit !== 'string' || check_value.unit.length > 80)) {
                invalid_fields.push({
                    field: ErrorField.UNIT,
                    message: ErrorMessage.UNIT_INVALID
                });
            }
            if (check_value.description && (typeof check_value.description !== 'string' || check_value.description.length > 1000)) {
                invalid_fields.push({
                    field: ErrorField.DESCRIPTION,
                    message: ErrorMessage.DESCRIPTION_INVALID
                });
            }
            if (check_value.qty && check_value.qty <= 0) {
                invalid_fields.push({
                    field: ErrorField.QTY,
                    message: ErrorMessage.QTY_INVALID
                });
            }
            if (check_value.discount && check_value.discount <= 0) {
                invalid_fields.push({
                    field: ErrorField.DISCOUNT,
                    message: ErrorMessage.DISCOUNT_INVALID
                });
            }
            if (check_value.unit_price && check_value.unit_price <= 0) {
                invalid_fields.push({
                    field: ErrorField.UNIT_PRICE,
                    message: ErrorMessage.UNIT_PRICE_INVALID
                });
            }
        }
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
            payload.forEach((item) => {
                const sql_subpart: string[] = [];
                conditions.params.push(item.id);
                sql_subpart.push(`$${conditions.params.length}`);
                conditions.params.push(item.mm_id);
                sql_subpart.push(`$${conditions.params.length}`);
                conditions.params.push(item.required_length_mm);
                sql_subpart.push(`$${conditions.params.length}`);
                conditions.params.push(item.required_width_mm);
                sql_subpart.push(`$${conditions.params.length}`);
                conditions.params.push(item.required_thickness_mm);
                sql_subpart.push(`$${conditions.params.length}`);
                conditions.params.push(item.required_diameter_mm);
                sql_subpart.push(`$${conditions.params.length}`);
                conditions.params.push(item.cut_quantity);
                sql_subpart.push(`$${conditions.params.length}`);
                conditions.params.push(item.remaining_quantity);
                sql_subpart.push(`$${conditions.params.length}`);
                conditions.params.push(item.allow_wastrel);
                sql_subpart.push(`$${conditions.params.length}`);
                conditions.params.push(item.allow_rotation);
                sql_subpart.push(`$${conditions.params.length}`);
                conditions.params.push(item.status);
                sql_subpart.push(`$${conditions.params.length}`);
                conditions.params.push(item.remark);
                sql_subpart.push(`$${conditions.params.length}`);
                conditions.params.push(item.on);
                sql_subpart.push(`$${conditions.params.length}`);
                conditions.params.push(item.unit);
                sql_subpart.push(`$${conditions.params.length}`);
                conditions.params.push(item.description);
                sql_subpart.push(`$${conditions.params.length}`);
                conditions.params.push(item.qty);
                sql_subpart.push(`$${conditions.params.length}`);
                conditions.params.push(item.discount);
                sql_subpart.push(`$${conditions.params.length}`);
                conditions.params.push(item.unit_price);
                sql_subpart.push(`$${conditions.params.length}`);
                conditions.params.push(emp_id);
                sql_subpart.push(`$${conditions.params.length}`);
                conditions.params.push(item.po_id);
                sql_subpart.push(`$${conditions.params.length}`);
                sql_mainpart.push(`(${sql_subpart.join(', ')})`);
            });
            conditions.sql = sql_mainpart.join(', ');
        }        
        const result = await service.update(conditions);
        if (result.statuscode !== HttpStatusCode.NO_CONTENT) {
            return reply.code(result.statuscode).send(<Reply>
                reply_result(module_name, result.statuscode, null, result.data)
            );
        }

        conditions.params = [payload[0].po_id];
        conditions.sql = ' AND podetail_po_id = $1 ';
        const po_data = await service.get(conditions);
        if (po_data.statuscode !== HttpStatusCode.OK && po_data.statuscode !== HttpStatusCode.NOT_FOUND) {
            console.error("[Controller] Failed to retrieve purchase order details after update.");
            return reply.code(po_data.statuscode).send(<Reply>
                reply_result(module_name, po_data.statuscode)
            );
        }

        const active_po_details = po_data.statuscode === HttpStatusCode.OK
            ? (po_data.data as Array<{ podetail_status: string }>).filter(
                (item) => item.podetail_status !== 'Deleted'
            )
            : [];
        const all_cancelled = active_po_details.length > 0 && active_po_details.every(
            (item) => item.podetail_status === PurchaseOrderDetailStatus.CANCELLED
        );
        const has_pending_or_waiting = active_po_details.some(
            (item) => item.podetail_status === PurchaseOrderDetailStatus.PENDING
                || item.podetail_status === PurchaseOrderDetailStatus.IN_PROCESS
                || item.podetail_status === 'Waiting'
        );

        if (all_cancelled || (active_po_details.length > 0 && !has_pending_or_waiting)) {
            const purchase_order_data = await purchase_order_service.get(
                {
                    sql: ' AND po.po_id = $1 ',
                    params: [payload[0].po_id]
                },
                `
                    po_id,
                    po_status_sent_date,
                    po_status_goods_received_date,
                    po_status_paid_date,
                    po_status_note
                `
            );
            if (
                purchase_order_data.statuscode !== HttpStatusCode.OK
                || !Array.isArray(purchase_order_data.data)
                || purchase_order_data.data.length === 0
            ) {
                console.error("[Controller] Failed to retrieve purchase order before updating its status.");
                const statuscode = purchase_order_data.statuscode === HttpStatusCode.OK
                    ? HttpStatusCode.INTERNAL_SERVER_ERROR
                    : purchase_order_data.statuscode;
                return reply.code(statuscode).send(<Reply>
                    reply_result(module_name, statuscode)
                );
            }

            const purchase_order = purchase_order_data.data[0];
            const po_status_result = await purchase_order_service.update_status(
                payload[0].po_id,
                {
                    sent_date: purchase_order.po_status_sent_date,
                    goods_received_date: purchase_order.po_status_goods_received_date,
                    paid_date: purchase_order.po_status_paid_date,
                    status_note: purchase_order.po_status_note,
                    status: all_cancelled ? POStatus.CANCELLED : POStatus.GOODS_RECEIVED
                },
                emp_id
            );
            if (po_status_result.statuscode !== HttpStatusCode.NO_CONTENT) {
                console.error("[Controller] Failed to update purchase order status from its details.");
                return reply.code(po_status_result.statuscode).send(<Reply>
                    reply_result(module_name, po_status_result.statuscode)
                );
            }
        }

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
