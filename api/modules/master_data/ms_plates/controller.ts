import {
    MSPlate,
    Employee,
    Material
} from './model';
import service from './service';
import {
    ErrorField,
    ErrorMessage,
    Payload,
    ValidationError
} from './type';

import { get_enum_keys, is_enum_key } from '@/api/utils/enum_checker';
import { sanitize_input, sanitize_payload, sanitize_string } from '@/api/utils/input_sanitizer';
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
    TaxType,
} from '@/api/utils/shared_types';
import field_validator from '@/api/utils/field_validator';

const branch_type_enum = get_enum_keys(BranchType);
const status_enum = get_enum_keys(Status);
const tax_type_enum = get_enum_keys(TaxType);

const module_name = 'ms_plates';

async function create(request: any, reply: any) {
    try {
        const lang = request.headers['accept-language'] || 'en-US';
        const emp_id = null;
        const payload: Payload = sanitize_payload(request.body);
        console.log("[Controller] Creating customer with payload:", payload);
        const invalid_fields: ValidationError[] = [];
        // if (!payload.mm_id) {
        //     invalid_fields.push({
        //         field: ErrorField.MM_ID,
        //         message: ErrorMessage.MM_ID_REQUIRED
        //     });
        // }
        if (!payload.code) {
            invalid_fields.push({
                field: ErrorField.CODE,
                message: ErrorMessage.CODE_REQUIRED
            });
        }
        if (!payload.code) {
            invalid_fields.push({
                field: ErrorField.CODE,
                message: ErrorMessage.CODE_REQUIRED
            });
        }
        if (!payload.length) {
            invalid_fields.push({
                field: ErrorField.LENGTH,
                message: ErrorMessage.LENGTH_REQUIRED
            });
        }
        if (!payload.width) {
            invalid_fields.push({
                field: ErrorField.WIDTH,
                message: ErrorMessage.WIDTH_REQUIRED
            });
        }
        if (!payload. thickness) {
            invalid_fields.push({
                field: ErrorField.THICKNESS,
                message: ErrorMessage.THICKNESS_REQUIRED
            });
        }
        if (!payload.quantity) {
            invalid_fields.push({
                field: ErrorField.QUANTITY,
                message: ErrorMessage.QUANTITY_REQUIRED
            });
        }
        if (!payload.available_quantity) {
            invalid_fields.push({
                field: ErrorField.AVAILABLE_QUANTITY,
                message: ErrorMessage.AVAILABLE_QUANTITY_REQUIRED
            });
        }
        // if (!payload.loc_id) {
        //     invalid_fields.push({
        //         field: ErrorField.LOC_ID,
        //         message: ErrorMessage.LOC_ID_REQUIRED
        //     });
        // }
        
        // if (!payload.location) {
        //     invalid_fields.push({
        //         field: ErrorField.LOCATION,
        //         message: ErrorMessage.LOCATION_REQUIRED
        //     });
        // }
        if (!payload.status) {
            invalid_fields.push({
                field: ErrorField.STATUS,
                message: ErrorMessage.STATUS_REQUIRED
            });
        }
        if (!payload.received_date) {
            invalid_fields.push({
                field: ErrorField.RECEIVED_DATE,
                message: ErrorMessage.RECEIVED_DATE_REQUIRED
            });
        }
        if (!payload.remark) {
            invalid_fields.push({
                field: ErrorField.REMARK,
                message: ErrorMessage.REMARK_REQUIRED
            });
        }
        if (!payload.created_at) {
            invalid_fields.push({
                field: ErrorField.CREATED_AT,
                message: ErrorMessage.CREATED_AT_REQUIRED
            });
        }
        if (!payload.updated_at) {
            invalid_fields.push({
                field: ErrorField.UPDATED_AT,
                message: ErrorMessage.UPDATED_AT_REQUIRED
            });
        }

        if (invalid_fields.length > 0) {
            console.error("[Controller] Validation errors found:", invalid_fields);
            return reply.code(HttpStatusCode.BAD_REQUEST).send(<Reply>{
                status: HttpStatus.BAD_REQUEST,
                statuscode: HttpStatusCode.BAD_REQUEST,
                details: {
                    error: ReplyErrorField.VALIDATION_ERROR,
                    message: ReplyErrorMessage.VALIDATION_ERROR,
                    invalid_fields
                }
            });
        }

        const result = await service.create(payload, emp_id);
        switch (result.statuscode) {
            case HttpStatusCode.CREATED:
                const data = result.data![0];
                console.log("[Controller] msp created successfully with ID:", data.msp_id);
                return reply.code(HttpStatusCode.CREATED).send(<Reply>{
                    status: HttpStatus.CREATED,
                    statuscode: HttpStatusCode.CREATED,
                    details: {
                        message: module_name.concat(' ', ReplySuccessMessage.CREATED),
                        id: data.msp_id,
                        msp_mm_id: data.msp_mm_id,
                        msp_code: data.msp_code,
                        msp_length: data.msp_length,
                        msp_width: data.msp_width,
                        msp_thickness: data.msp_thickness,
                        msp_quantity: data.msp_quantity,
                        msp_available_quantity: data.msp_available_quantity,
                        msp_loc_id: data.msp_loc_id,
                        msp_status: data.msp_status,
                        msp_received_date: data.msp_received_date,
                        msp_remark: data.msp_remark,
                        msp_created_at: data.msp_created_at,
                        msp_updated_at: data.msp_updated_at,
                        msp_emp_id: data.msp_emp_id

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
                console.error("[Controller] An unrecognized status code was returned from creating customer:", result.statuscode);
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
        console.error("[Controller] An error occurred during creating customer:", error);
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
        const fields: string = request.reply_fields; 
        const conditions: Condition = { sql: '', params: [] };

        const invalid_fields: ValidationError[] = [];
        if (request.params.msp_id) {
            conditions.params.push(request.params.msp_id);
            conditions.sql += ` AND msp_id = $${conditions.params.length} `;
        }
        if (request.query.status && is_enum_key(status_enum, request.query.status)) {
            conditions.params.push(Status[request.query.status.toUpperCase() as keyof typeof Status]);
            conditions.sql += ` AND msp_status = $${conditions.params.length} `;
        } else if (request.query.status) {
            console.error("[Controller] Invalid Type enum of status value provided for customer: ", request.query.status);
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
        
        const results = await service.get(conditions, fields);
        switch (results.statuscode) {
            case HttpStatusCode.OK:
                console.log(`[Controller] Successfully retrieved ${results.data?.length || 0} customers.`);
                return reply.code(HttpStatusCode.OK).send(<Reply>{
                    status: HttpStatus.OK,
                    statuscode: HttpStatusCode.OK,
                    details: {
                        tax_type: request.query.tax_type,
                        branch_type: request.query.branch_type,
                        status: request.query.status,
                        ms_plates: results.data?.map(msp => new MSPlate(
                            msp.msp_id,
                            msp.msp_mm_id,
                            msp.msp_code,
                            msp.msp_length,
                            msp.msp_width,
                            msp.msp_thickness,
                            msp.msp_quantity,
                            msp.msp_available_quantity,
                            msp.msp_loc_id,
                            msp.msp_location_type,
                            msp.msp_location,
                            msp.msp_status,
                            msp.msp_received_date,
                            msp.msp_remark,
                            msp.msp_created_at,
                            msp.msp_updated_at,
                            new Employee(
                                msp.msp_emp_id,
                                msp.msp_emp_prefix,
                                lang === "en-US"
                                    ? msp.msp_emp_firstname_en + " " + msp.msp_emp_lastname_en
                                    : msp.msp_emp_firstname_th + " " + msp.msp_emp_lastname_th
                            ),
                           new Material(
                               msp.msp_material_id,
                               msp.msp_material_name,
                               msp.msp_material_type
                           )
                       )
                    )
        }});
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
                console.error("[Controller] An unrecognized status code was returned from getting customers:", results.statuscode);
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
        console.error("[Controller] An error occurred during getting customers:", error);
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
async function soft_delete(request: any, reply: any) {
    try {
        const lang = request.headers['accept-language'] || 'en-US';
        // const user = request.user;
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
        // const emp_id: string = user.id;
        const emp_id = null;
        if (!request.params.ms_plate_id) {
            console.error("[Controller] Missing ID for deletion.");
            return reply.code(HttpStatusCode.BAD_REQUEST).send(<Reply>{
                status: HttpStatus.BAD_REQUEST,
                statuscode: HttpStatusCode.BAD_REQUEST,
                details: {
                    error: ReplyErrorField.VALIDATION_ERROR,
                    message: ReplyErrorMessage.VALIDATION_ERROR,
                    errors: [{
                        field: ErrorField.ID,
                        message: ErrorMessage.ID_REQUIRED
                    }]
                }
            });
        }
        const ms_plate_id: string = sanitize_string(request.params.ms_plate_id);
        const ms_plate_data = await service.get({ sql: " AND msp_id = $1", params: [ms_plate_id] });
        if (ms_plate_data.statuscode === HttpStatusCode.NOT_FOUND) {
            return reply.code(HttpStatusCode.NOT_FOUND).send(<Reply>{
                status: HttpStatus.NOT_FOUND,
                statuscode: HttpStatusCode.NOT_FOUND,
                details: {
                    error: ReplyErrorField.NOT_FOUND,
                    message: ReplyErrorMessage.NOT_FOUND
                }
            });
        } else if (ms_plate_data.statuscode === HttpStatusCode.INTERNAL_SERVER_ERROR) {
            return reply.code(HttpStatusCode.INTERNAL_SERVER_ERROR).send(<Reply>{
                status: HttpStatus.INTERNAL_SERVER_ERROR,
                statuscode: HttpStatusCode.INTERNAL_SERVER_ERROR,
                details: {
                    error: ReplyErrorField.INTERNAL_SERVER_ERROR,
                    message: ReplyErrorMessage.INTERNAL_SERVER_ERROR
                }
            });
        }
        const current_data = ms_plate_data.data![0];
     
        const result = await service.soft_delete(ms_plate_id, emp_id);
        switch (result.statuscode) {
            case HttpStatusCode.NO_CONTENT:
                console.error(`[Controller] MS Plate with ID ${ms_plate_id} successfully deleted`);
                return reply.code(HttpStatusCode.NO_CONTENT).send(<Reply>{
                    status: HttpStatus.NO_CONTENT,
                    statuscode: HttpStatusCode.NO_CONTENT,
                    details: {
                        message: module_name.concat(' ', ReplySuccessMessage.DELETED)
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
                console.error("[Controller] An unrecognized status code was returned from deleting MS Plate:", result.statuscode);
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
        console.error("[Controller] An error occurred during deleting MS Plate:", error);
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
        // const user = request.user;
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
        // const emp_id: string = user.id;
        const emp_id = null;
        const payload: Payload = sanitize_payload(request.body);
        const ms_plate_id: string = sanitize_string(request.params.ms_plate_id);
        const ms_plate_data = await service.get({ sql: ' AND msp_id = $1 ', params: [ms_plate_id] });
        if (ms_plate_data.statuscode === HttpStatusCode.NOT_FOUND) {
            return reply.code(HttpStatusCode.NOT_FOUND).send(<Reply>{
                status: HttpStatus.NOT_FOUND,
                statuscode: HttpStatusCode.NOT_FOUND,
                details: {
                    error: ReplyErrorField.NOT_FOUND,
                    message: ReplyErrorMessage.NOT_FOUND
                }
            });
        } else if (ms_plate_data.statuscode === HttpStatusCode.INTERNAL_SERVER_ERROR) {
            return reply.code(HttpStatusCode.INTERNAL_SERVER_ERROR).send(<Reply>{
                status: HttpStatus.INTERNAL_SERVER_ERROR,
                statuscode: HttpStatusCode.INTERNAL_SERVER_ERROR,
                details: {
                    error: ReplyErrorField.INTERNAL_SERVER_ERROR,
                    message: ReplyErrorMessage.INTERNAL_SERVER_ERROR
                }
            });
        }
        const invalid_fields: ValidationError[] = [];
         if (!payload.mm_id) {
            invalid_fields.push({
                field: ErrorField.MM_ID,
                message: ErrorMessage.MM_ID_REQUIRED
            });
        }
        if (!payload.code) {
            invalid_fields.push({
                field: ErrorField.CODE,
                message: ErrorMessage.CODE_REQUIRED
            });
        }
        if (!payload.code) {
            invalid_fields.push({
                field: ErrorField.CODE,
                message: ErrorMessage.CODE_REQUIRED
            });
        }
        if (!payload.length) {
            invalid_fields.push({
                field: ErrorField.LENGTH,
                message: ErrorMessage.LENGTH_REQUIRED
            });
        }
        if (!payload.width) {
            invalid_fields.push({
                field: ErrorField.WIDTH,
                message: ErrorMessage.WIDTH_REQUIRED
            });
        }
        if (!payload. thickness) {
            invalid_fields.push({
                field: ErrorField.THICKNESS,
                message: ErrorMessage.THICKNESS_REQUIRED
            });
        }
        if (!payload.quantity) {
            invalid_fields.push({
                field: ErrorField.QUANTITY,
                message: ErrorMessage.QUANTITY_REQUIRED
            });
        }
        if (!payload.available_quantity) {
            invalid_fields.push({
                field: ErrorField.AVAILABLE_QUANTITY,
                message: ErrorMessage.AVAILABLE_QUANTITY_REQUIRED
            });
        }
        if (!payload.loc_id) {
            invalid_fields.push({
                field: ErrorField.LOC_ID,
                message: ErrorMessage.LOC_ID_REQUIRED
            });
        }
        if (!payload.location_type) {
            invalid_fields.push({
                field: ErrorField.LOCATION_TYPE,
                message: ErrorMessage.LOCATION_TYPE_REQUIRED
            });
        }
        if (!payload.location) {
            invalid_fields.push({
                field: ErrorField.LOCATION,
                message: ErrorMessage.LOCATION_REQUIRED
            });
        }
        if (!payload.status) {
            invalid_fields.push({
                field: ErrorField.STATUS,
                message: ErrorMessage.STATUS_REQUIRED
            });
        }
        if (!payload.received_date) {
            invalid_fields.push({
                field: ErrorField.RECEIVED_DATE,
                message: ErrorMessage.RECEIVED_DATE_REQUIRED
            });
        }
        if (!payload.remark) {
            invalid_fields.push({
                field: ErrorField.REMARK,
                message: ErrorMessage.REMARK_REQUIRED
            });
        }
        if (!payload.created_at) {
            invalid_fields.push({
                field: ErrorField.CREATED_AT,
                message: ErrorMessage.CREATED_AT_REQUIRED
            });
        }
        if (!payload.updated_at) {
            invalid_fields.push({
                field: ErrorField.UPDATED_AT,
                message: ErrorMessage.UPDATED_AT_REQUIRED
            });
        }
       
        const result = await service.update(ms_plate_id, payload, emp_id);
        switch (result.statuscode) {
            case HttpStatusCode.NO_CONTENT:
                console.log(`[Controller] MS Plate with ID ${ms_plate_id} has been updated successfully`);
                return reply.code(HttpStatusCode.NO_CONTENT).send(<Reply>{
                    status: HttpStatus.NO_CONTENT,
                    statuscode: HttpStatusCode.NO_CONTENT,
                    details: {
                        message: module_name.concat(' ', ReplySuccessMessage.UPDATED)
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
                console.error("[Controller] An unrecognized status code was returned from updating ms_plate:", result.statuscode);
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
        console.error("[Controller] An error occurred during updating customer:", error);
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
        // const user = request.user;
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
        // const emp_id: string = user.id;
        const emp_id = null;
        const missing_fields: string[] = field_validator(request.body, [
            'status'
        ]);
        if (!request.params.ms_plate_id) {
            missing_fields.unshift('ms_plate_id');
        }
        if (missing_fields.length > 0) {
            console.error("[Controller] Missing required fields for updating MS Plate status:", missing_fields);
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
        let status: string = sanitize_input(request.body.status);
        const invalid_fields: ValidationError[] = [];
        if (!is_enum_key(status_enum, status)) {
            invalid_fields.push({
                field: ErrorField.STATUS,
                message: ErrorMessage.STATUS_INVALID
            });
        } else {
            status = Status[status.toUpperCase() as keyof typeof Status];
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
        const ms_plate_id: string = request.params.ms_plate_id;
        const ms_plate_data = await service.get({ sql: " AND ms_plate_id = $1", params: [ms_plate_id] });
        if (ms_plate_data.statuscode === HttpStatusCode.NOT_FOUND) {
            return reply.code(HttpStatusCode.NOT_FOUND).send(<Reply>{
                status: HttpStatus.NOT_FOUND,
                statuscode: HttpStatusCode.NOT_FOUND,
                details: {
                    error: ReplyErrorField.NOT_FOUND,
                    message: ReplyErrorMessage.NOT_FOUND
                }
            });
        } else if (ms_plate_data.statuscode === HttpStatusCode.INTERNAL_SERVER_ERROR) {
            return reply.code(HttpStatusCode.INTERNAL_SERVER_ERROR).send(<Reply>{
                status: HttpStatus.INTERNAL_SERVER_ERROR,
                statuscode: HttpStatusCode.INTERNAL_SERVER_ERROR,
                details: {
                    error: ReplyErrorField.INTERNAL_SERVER_ERROR,
                    message: ReplyErrorMessage.INTERNAL_SERVER_ERROR
                }
            });
        }
        const result = await service.update_status(ms_plate_id, status, emp_id);
        switch (result.statuscode) {
            case HttpStatusCode.NO_CONTENT:
                console.log(`[Controller] MS Plate with ID ${ms_plate_id} status updated successfully`);
                return reply.code(HttpStatusCode.NO_CONTENT).send(<Reply>{
                    status: HttpStatus.NO_CONTENT,
                    statuscode: HttpStatusCode.NO_CONTENT,
                    details: {
                        message: module_name.concat(' ', ReplySuccessMessage.STATUS_UPDATED)
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
                console.error("[Controller] An unrecognized status code was returned from updating customer status:", result.statuscode);
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
        console.error("[Controller] An error occurred during updating customer status:", error);
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
    soft_delete,
    update,
    update_status
};