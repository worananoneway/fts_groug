import {
    PurchaseOrder,
    Contact,
    Address,
    Subdistrict,
    District,
    Province,
    Recipient,
    Department,
    Position,
    StatusDate,
    PriceSummary,
    Detail,
    Emp,
    Project
} from './model';
import service from './service';
import {
    ErrorField,
    ErrorMessage,
    Payload,
    PVPayload,
    StatusPayload,
    ValidationError
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

const po_status_enum = get_enum_keys(POStatus);

const module_name = 'PurchaseOrders';

async function create(request: any, reply: any) {
    try {
        const lang = request.headers['accept-language'] || 'en-US';
        const user = request.user;
        if (!user || !user.id) {
            console.error(`[Controller] Missing user ID from authenticated request for ${module_name}.`);
            return reply.code(HttpStatusCode.UNAUTHORIZED).send(<Reply>
                reply_result(module_name, HttpStatusCode.UNAUTHORIZED, null, [], null)
            );
        }
        const emp_id = user.id;
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
                reply_result(module_name, HttpStatusCode.BAD_REQUEST, null, missing_fields, null)
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

        const result = await service.create(payload, emp_id);
        switch (result.statuscode) {
            case HttpStatusCode.CREATED:
                const data = result.data![0];
                console.log(`[Controller] ${module_name} created successfully with ID:`, data.po_id);
                return reply.code(HttpStatusCode.CREATED).send(<Reply>{
                    status: HttpStatus.CREATED,
                    statuscode: HttpStatusCode.CREATED,
                    details: {
                        message: ReplySuccessMessage.CREATED,
                        id: data.po_id,
                        number: data.po_number,
                        issue_date: data.po_issue_date,
                        supplier_id: data.po_supplier_id,
                        ship_via: data.po_ship_via,
                        qt_on: data.po_qt_on,
                        shipping_terms: data.po_shipping_terms,
                        tax_rate: data.po_tax_rate,
                        recipient_id: data.po_recipient_id,
                        comment: data.po_comment,
                        created_at: data.po_created_at,
                        updated_at: data.po_updated_at,
                        emp_id: data.po_emp_id,
                        status: data.po_status
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
                console.error(`[Controller] An unrecognized status code was returned from creating ${module_name}:`, result.statuscode);
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
        console.error(`[Controller] An error occurred during creating ${module_name}:`, error);
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
async function create_rev(request: any, reply: any) {
    try {
        const lang = request.headers['accept-language'] || 'en-US';
        const user = request.user;
        if (!user || !user.id) {
            console.error("[Controller] Missing user ID from authenticated request.");
            return reply.code(HttpStatusCode.UNAUTHORIZED).send(<Reply>{
                status: HttpStatus.UNAUTHORIZED,
                statuscode: HttpStatusCode.UNAUTHORIZED,
                details: {
                    error: ReplyErrorField.UNAUTHORIZED,
                    message: ReplyErrorMessage.UNAUTHORIZED
                }
            });
        }
        const emp_id = user.id;
        // const requiredKeys = [
        //     'number',
        //     'issue_date',
        //     'supplier_id',
        //     'ship_via',
        //     'qt_on',
        //     'shipping_terms',
        //     'tax_rate',
        //     'recipient_id',
        //     'comment',
        //     'project_id'
        // ];
        // const missing_fields: string[] = field_validator(request.body, requiredKeys);
        // if (missing_fields.length > 0) {
        //     console.error("[Controller] Missing required fields for purchaseorder creation REV:", missing_fields);
        //     return reply.code(HttpStatusCode.BAD_REQUEST).send(<Reply>{
        //         status: HttpStatus.BAD_REQUEST,
        //         statuscode: HttpStatusCode.BAD_REQUEST,
        //         details: {
        //             error: ReplyErrorField.VALIDATION_ERROR,
        //             message: ReplyErrorMessage.VALIDATION_ERROR,
        //             errors: missing_fields.map(field => {
        //                 let message = ErrorMessage[field.toUpperCase() + '_REQUIRED' as keyof typeof ErrorMessage];
        //                 return {
        //                     field: field.toUpperCase() as ValidationError['field'],
        //                     message: message as ValidationError['message']
        //                 };
        //             })
        //         }
        //     });
        // }
        const payload: Payload = request.body;
        const invalid_fields: ValidationError[] = [];
        const condition: Condition = { sql: '', params: [] };
        const key_number: string = payload.number;
        const sub_number: string = key_number.substring(0, 12);
        condition.params.push(`${key_number}%`);
        const check_number = await service.count_duplicate(condition);
        const rev_number = check_number.data![0];

        if (rev_number.duplicate_number > 0) {
            condition.params.pop();
            condition.params.push(`${sub_number}%`);
            const re_rev_number = await service.count_duplicate(condition);
            payload.number = `${sub_number}-REV-${re_rev_number.data![0].duplicate_number}`;
        }
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
            console.error("[Controller] Validation errors found in purchaseorder REV creation payload:", invalid_fields);
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
        const result = await service.create_rev(payload, emp_id);
        switch (result.statuscode) {
            case HttpStatusCode.CREATED:
                const data = result.data![0];
                console.log("[Controller] PurchaseOrders REV created successfully with ID:", data.po_id);
                return reply.code(HttpStatusCode.CREATED).send(<Reply>{
                    status: HttpStatus.CREATED,
                    statuscode: HttpStatusCode.CREATED,
                    details: {
                        message: ReplySuccessMessage.CREATED,
                        id: data.po_id,
                        number: data.po_number,
                        issue_date: data.po_issue_date,
                        supplier_id: data.po_supplier_id,
                        ship_via: data.po_ship_via,
                        qt_on: data.po_qt_on,
                        shipping_terms: data.po_shipping_terms,
                        tax_rate: data.po_tax_rate,
                        recipient_id: data.po_recipient_id,
                        comment: data.po_comment,
                        created_at: data.po_created_at,
                        updated_at: data.po_updated_at,
                        emp_id: data.po_emp_id,
                        status: data.po_status
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
                console.error("[Controller] An unrecognized status code was returned from creating purchaseorder REV:", result.statuscode);
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
        console.error("[Controller] An error occurred during creating purchaseorder REV:", error);
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
        if (!user || !user.id) {
            console.error("[Controller] Missing user ID from authenticated request.");
            return reply.code(HttpStatusCode.UNAUTHORIZED).send(<Reply>{
                status: HttpStatus.UNAUTHORIZED,
                statuscode: HttpStatusCode.UNAUTHORIZED,
                details: {
                    error: ReplyErrorField.UNAUTHORIZED,
                    message: ReplyErrorMessage.UNAUTHORIZED
                }
            });
        }
        const emp_id = user.id;
        const conditions: Condition = { sql: '', params: [] };
        const invalid_fields: ValidationError[] = [];
        if (request.params.po_id) {
            conditions.params.push(request.params.po_id || request.query.po_id);
            conditions.sql += ` AND po.po_id = $${conditions.params.length} `;
        }
        if (request.query.supplier_id) {
            conditions.params.push(request.query.supplier_id);
            conditions.sql += ` AND po.po_supplier_id = $${conditions.params.length} `;
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
            console.error("[Controller] Invalid OP Status enum value provided for purchaseorder: ", request.query.status);
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
                console.log(`[Controller] Successfully retrieved ${results.data!.length || 0} purchase orders.`);
                return reply.code(HttpStatusCode.OK).send(<Reply>{
                    status: HttpStatus.OK,
                    statuscode: HttpStatusCode.OK,
                    details: {
                        supplier_id: request.query.supplier_id,
                        project_id: request.query.project_id,
                        qt_on: request.query.qt_on,
                        recipient_id: request.query.recipient_id,
                        status: request.query.status,
                        purchase_orders: results.data?.map(purchaseorder => new PurchaseOrder(
                            purchaseorder.po_id,
                            purchaseorder.po_number,
                            purchaseorder.po_issue_date,
                            new Supplier(
                                purchaseorder.po_supplier_id,
                                purchaseorder.po_supplier_display_id,
                                purchaseorder.po_supplier_name_th,
                                purchaseorder.po_supplier_name_en,
                                purchaseorder.po_supplier_tax_id,
                                purchaseorder.po_supplier_tax_type,
                                new Contact(
                                    purchaseorder.po_supplier_contact_name,
                                    purchaseorder.po_supplier_contact_phone,
                                    purchaseorder.po_supplier_contact_fax,
                                    purchaseorder.po_supplier_contact_email
                                ),
                                new Address(
                                    purchaseorder.po_supplier_address,
                                    new Subdistrict(
                                        purchaseorder.po_supplier_subdistrict_id,
                                        lang === "th-TH" ? purchaseorder.supplier_subdistrict_name_th : purchaseorder.supplier_subdistrict_name_en
                                    ),
                                    new District(
                                        purchaseorder.po_supplier_district_id,
                                        lang === "th-TH" ? purchaseorder.po_district_name_th : purchaseorder.po_district_name_en
                                    ),
                                    new Province(
                                        purchaseorder.po_supplier_province_id,
                                        lang === "th-TH" ? purchaseorder.po_supplier_province_name_th : purchaseorder.po_supplier_province_name_en
                                    ),
                                    purchaseorder.po_supplier_postcode
                                ),
                                purchaseorder.po_supplier_branch_type,
                                purchaseorder.po_supplier_branch_number,
                            ),
                            purchaseorder.po_ship_via,
                            purchaseorder.po_qt_on,
                            purchaseorder.po_shipping_terms,
                            purchaseorder.po_tax_rate,
                            new Recipient(
                                purchaseorder.po_recipient_id,
                                purchaseorder.po_recipient_display_id,
                                purchaseorder.po_recipient_prefix,
                                purchaseorder.po_recipient_firstname_th,
                                purchaseorder.po_recipient_lastname_th,
                                purchaseorder.po_recipient_firstname_en,
                                purchaseorder.po_recipient_lastname_en,
                                purchaseorder.po_recipient_number_id,
                                new Department(
                                    purchaseorder.po_recipient_department_id,
                                    lang === "th-TH" ? purchaseorder.po_recipient_department_name_th : purchaseorder.po_recipient_department_name_en
                                ),
                                new Position(
                                    purchaseorder.po_recipient_position_id,
                                    lang === "th-TH" ? purchaseorder.po_recipient_position_name_th : purchaseorder.po_recipient_position_name_en
                                ),
                                purchaseorder.po_recipient_email,
                                purchaseorder.po_recipient_phone,
                            ),
                            purchaseorder.po_comment,
                            new StatusDate(
                                purchaseorder.po_status_sent_date,
                                purchaseorder.po_status_goods_received_date,
                                purchaseorder.po_status_paid_date,
                            ),
                            purchaseorder.po_status_note,
                            // เปลี่ยนตรงนี้: details เป็น array จริง
                            Array.isArray(purchaseorder.details)
                                ? purchaseorder.details.map((d: any) =>
                                    new Detail(
                                        d.id,
                                        d.on,
                                        d.department,
                                        d.type,
                                        d.description,
                                        d.qty,
                                        d.discount,
                                        d.unit_price,
                                        d.total,
                                        d.created_at,
                                        d.updated_at,
                                        new Emp(
                                            d.emp.id,
                                            d.emp.prefix,
                                            d.emp.name
                                        )
                                    )
                                )
                                : [],
                            // เปลี่ยนตรงนี้: priceSummary จาก lateral join
                            new PriceSummary(
                                purchaseorder.po_subtotal,
                                purchaseorder.po_tax_rate_calc,
                                purchaseorder.po_tax_amount,
                                purchaseorder.po_total_amount
                            ),
                            purchaseorder.po_created_at,
                            purchaseorder.po_updated_at,
                            new Emp(
                                purchaseorder.po_emp_id,
                                purchaseorder.emp_prefix,
                                lang === "th-TH"
                                    ? purchaseorder.po_emp_fname_th + ' ' + purchaseorder.po_emp_lname_th
                                    : purchaseorder.po_emp_fname_en + ' ' + purchaseorder.po_emp_lname_en
                            ),
                            purchaseorder.po_status,
                            new Project(
                                purchaseorder.po_project_id,
                                purchaseorder.po_project_display_id,
                                purchaseorder.po_project_name_en,
                                purchaseorder.po_project_name_th,
                        )
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
                console.error("[Controller] An unrecognized status code was returned from getting purchaseorder:", results.statuscode);
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
        console.error("[Controller] An error occurred during deleting purchaseorder:", error);
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
        if (!user || !user.id) {
            console.error("[Controller] Missing user ID from authenticated request.");
            return reply.code(HttpStatusCode.UNAUTHORIZED).send(<Reply>{
                status: HttpStatus.UNAUTHORIZED,
                statuscode: HttpStatusCode.UNAUTHORIZED,
                details: {
                    error: ReplyErrorField.UNAUTHORIZED,
                    message: ReplyErrorMessage.UNAUTHORIZED
                }
            });
        }
        const emp_id = user.id;
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
            console.error("[Controller] Missing required fields for updating purchaseorder:", missing_fields);
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
        const id: string = request.params.po_id;
        const supplier_data = await service.get({ sql: ' AND po.po_id = $1 ', params: [id] });
        if (supplier_data.statuscode === HttpStatusCode.NOT_FOUND) {
            return reply.code(HttpStatusCode.NOT_FOUND).send(<Reply>{
                status: HttpStatus.NOT_FOUND,
                statuscode: HttpStatusCode.NOT_FOUND,
                details: {
                    error: ReplyErrorField.NOT_FOUND,
                    message: ReplyErrorMessage.NOT_FOUND,
                }
            })
        } else if (supplier_data.statuscode === HttpStatusCode.INTERNAL_SERVER_ERROR) {
            return reply.code(HttpStatusCode.INTERNAL_SERVER_ERROR).send(<Reply>{
                status: HttpStatus.INTERNAL_SERVER_ERROR,
                statuscode: HttpStatusCode.INTERNAL_SERVER_ERROR,
                details: {
                    error: ReplyErrorField.INTERNAL_SERVER_ERROR,
                    message: ReplyErrorMessage.INTERNAL_SERVER_ERROR,
                }
            });
        }
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
            console.error("[Controller] Validation errors found in purchaseorder creation payload:", invalid_fields);
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
        const result = await service.update(id, payload, emp_id);
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
                console.error("[Controller] An unrecognized status code was returned from updating purchaseorder:", result.statuscode)
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
        console.error("[Controller] An error occurred during updating purchaseorder:", error);
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
async function update_status(request: any, reply: any) {
    try {
        const lang = request.headers['accept-language'] || 'en-US';
        const user = request.user;
        if (!user || !user.id) {
            console.error("[Controller] Missing user ID from authenticated request.");
            return reply.code(HttpStatusCode.UNAUTHORIZED).send(<Reply>{
                status: HttpStatus.UNAUTHORIZED,
                statuscode: HttpStatusCode.UNAUTHORIZED,
                details: {
                    error: ReplyErrorField.UNAUTHORIZED,
                    message: ReplyErrorMessage.UNAUTHORIZED
                }
            });
        }
        const emp_id = user.id;
        // const missing_fields: string[] = field_validator(request.body, [
        //     'status'
        // ]);
        // if (!request.params.po_id) {
        //     missing_fields.unshift('po_id');
        // }
        // if (missing_fields.length > 0) {
        //     console.error("[Controller] Missing required fields for updating purchaseorder status:", missing_fields);
        //     return reply.code(HttpStatusCode.BAD_REQUEST).send(<Reply>{
        //         status: HttpStatus.BAD_REQUEST,
        //         statuscode: HttpStatusCode.BAD_REQUEST,
        //         details: {
        //             error: ReplyErrorField.VALIDATION_ERROR,
        //             message: ReplyErrorMessage.VALIDATION_ERROR,
        //             errors: missing_fields.map(field => {
        //                 let message = ErrorMessage[field.toUpperCase() + '_REQUIRED' as keyof typeof ErrorMessage]
        //                 return {
        //                     field: field.toUpperCase() as ValidationError['field'],
        //                     message: message as ValidationError['message']
        //                 }
        //             })
        //         }
        //     });
        // }
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
            console.error("[Controller] Validation errors found in customer creation payload:", invalid_fields);
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
        const id: string = request.params.po_id;
        const purchase_orders_data = await service.get({ sql: ' AND po.po_id = $1 ', params: [id] });
        const purchase_orders = purchase_orders_data.data ? purchase_orders_data.data[0] : null;
        if (purchase_orders_data.statuscode === HttpStatusCode.NOT_FOUND) {
            return reply.code(HttpStatusCode.NOT_FOUND).send(<Reply>{
                status: HttpStatus.NOT_FOUND,
                statuscode: HttpStatusCode.NOT_FOUND,
                details: {
                    error: ReplyErrorField.NOT_FOUND,
                    message: ReplyErrorMessage.NOT_FOUND,
                }
            })
        } else if (purchase_orders_data.statuscode === HttpStatusCode.INTERNAL_SERVER_ERROR) {
            return reply.code(HttpStatusCode.INTERNAL_SERVER_ERROR).send(<Reply>{
                status: HttpStatus.INTERNAL_SERVER_ERROR,
                statuscode: HttpStatusCode.INTERNAL_SERVER_ERROR,
                details: {
                    error: ReplyErrorField.INTERNAL_SERVER_ERROR,
                    message: ReplyErrorMessage.INTERNAL_SERVER_ERROR,
                }
            });
        }
        const result = await service.update_status(id, payload, emp_id);
        if (payload.status === "Paid" && result.statuscode === HttpStatusCode.NO_CONTENT && purchase_orders.po_status !== "Paid"){
            const pv_payload: PVPayload = request.body;
            pv_payload.date = new Date().toISOString().split('T')[0];
            const set_pv = await service.create_pv(pv_payload, emp_id);
            switch (set_pv.statuscode) {
                case HttpStatusCode.CREATED:
                    const data = set_pv.data![0];
                    console.log("[Controller] PurchaseOrders created successfully with ID:", data.payment_id);
                    return reply.code(HttpStatusCode.CREATED).send(<Reply>{
                        status: HttpStatus.CREATED,
                        statuscode: HttpStatusCode.CREATED,
                        details: {
                            message: ReplySuccessMessage.CREATED,
                            id: data.payment_id,
                            number: data.payment_number,
                            date: data.payment_date,
                            supplier_id: data.payment_supplier_id,
                            approved_id: data.payment_approved_id,
                            received_by: data.payment_received_by,
                            issued_id: data.payment_issued_id,
                            recorded_id: data.payment_recorded_id,
                            verified_id: data.payment_verified_id,
                            identification_number: data.payment_identification_number,
                            position: data.payment_position,
                            agency: data.payment_agency,
                            sector: data.payment_sector,
                            phone: data.payment_phone,
                            po_id: data.payment_po_id,
                            project_id: data.payment_project_id,
                            created_at: data.payment_created_at,
                            updated_at: data.payment_updated_at,
                            emp_id: data.payment_emp_id,
                            status: data.payment_status
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
                    console.error("[Controller] An unrecognized status code was returned from creating purchaseorder:", result.statuscode);
                    return reply.code(HttpStatusCode.INTERNAL_SERVER_ERROR).send(<Reply>{
                        status: HttpStatus.INTERNAL_SERVER_ERROR,
                        statuscode: HttpStatusCode.INTERNAL_SERVER_ERROR,
                        details: {
                            error: ReplyErrorField.UNRECOGNIZED_STATUSCODE,
                            message: ReplyErrorMessage.UNRECOGNIZED_STATUSCODE
                        }
                    });

            }
        }
        if (payload.status !== "Paid" && result.statuscode === HttpStatusCode.NO_CONTENT && purchase_orders.po_status === "Paid"){
            const result_delete_pv = await service.hard_delete(purchase_orders.po_id);
                        switch (result_delete_pv.statuscode) {
                case HttpStatusCode.NO_CONTENT:
                    return reply.code(HttpStatusCode.NO_CONTENT).send(<Reply>{
                        status: HttpStatus.NO_CONTENT,
                        statuscode: HttpStatusCode.NO_CONTENT,
                        details: {}
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
                    console.error("[Controller] An unrecognized status code was returned from creating purchaseorder:", result_delete_pv.statuscode);
                    return reply.code(HttpStatusCode.INTERNAL_SERVER_ERROR).send(<Reply>{
                        status: HttpStatus.INTERNAL_SERVER_ERROR,
                        statuscode: HttpStatusCode.INTERNAL_SERVER_ERROR,
                        details: {
                            error: ReplyErrorField.UNRECOGNIZED_STATUSCODE,
                            message: ReplyErrorMessage.UNRECOGNIZED_STATUSCODE
                        }
                    });

            }
        }

        switch (result.statuscode) {
            case HttpStatusCode.NO_CONTENT:
                return reply.code(HttpStatusCode.NO_CONTENT).send(<Reply>{
                    status: HttpStatus.NO_CONTENT,
                    statuscode: HttpStatusCode.NO_CONTENT,
                    details: {
                        message: ReplySuccessMessage.STATUS_UPDATED
                    }
                });
            case HttpStatusCode.NOT_FOUND:
                return reply.code(HttpStatusCode.NOT_FOUND).send(<Reply>{
                    status: HttpStatus.NOT_FOUND,
                    statuscode: HttpStatusCode.NOT_FOUND,
                    details: {
                        error: ReplyErrorField.NOT_FOUND,
                        message: ReplyErrorMessage.INTERNAL_SERVER_ERROR
                    }
                });
            case HttpStatusCode.INTERNAL_SERVER_ERROR:
                return reply.code().send(<Reply>{
                    status: HttpStatus.INTERNAL_SERVER_ERROR,
                    statuscode: HttpStatusCode.INTERNAL_SERVER_ERROR,
                    details: {
                        error: ReplyErrorField.INTERNAL_SERVER_ERROR,
                        message: ReplyErrorMessage.INTERNAL_SERVER_ERROR
                    }
                });

            default:
                console.error("[Controller] An unrecognized status code was returned from updating purchaseorder status:", result.statuscode);
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
        console.error("[Controller] An error occurred during updating purchaseorder status:", error);
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
    create_rev,
    get,
    update,
    update_status
};
