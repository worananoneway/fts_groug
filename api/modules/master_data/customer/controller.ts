import {
    Address,
    Contact,
    Customer,
    District,
    Employee,
    Province,
    Subdistrict
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
import { reply_result } from '@/api/utils/controller_replys';
import { emp_authentication } from '@/api/utils/controller_auth';

const branch_type_enum = get_enum_keys(BranchType);
const status_enum = get_enum_keys(Status);
const tax_type_enum = get_enum_keys(TaxType);

const module_name = 'Customer';

async function create(request: any, reply: any) {
    try {
        const lang = request.headers['accept-language'] || 'en-US';
        const user = request.user;

        emp_authentication(module_name, user, reply);

        const emp_id: string = user.id;
        const payload: Payload = sanitize_payload(request.body);
        console.log("[Controller] Creating customer with payload:", payload);
        const invalid_fields: ValidationError[] = [];
        if (!payload.name_th) {
           invalid_fields.push({
                field: ErrorField.NAME_TH,
                message: ErrorMessage.NAME_TH_REQUIRED
           }); 
        }
        if (!payload.tax_id) {
            invalid_fields.push({
                field: ErrorField.TAX_ID,
                message: ErrorMessage.TAX_ID_REQUIRED
            });
        }
        if (!payload.subdistrict_id) {
            invalid_fields.push({
                field: ErrorField.SUBDISTRICT_ID,
                message: ErrorMessage.SUBDISTRICT_ID_REQUIRED
            });
        }
        if (!payload.district_id) {
            invalid_fields.push({
                field: ErrorField.DISTRICT_ID,
                message: ErrorMessage.DISTRICT_ID_REQUIRED
            });
        }
        if (!payload.province_id) {
            invalid_fields.push({
                field: ErrorField.PROVINCE_ID,
                message: ErrorMessage.PROVINCE_ID_REQUIRED
            });
        }
        if (!payload.postcode) {
            invalid_fields.push({
                field: ErrorField.POSTCODE,
                message: ErrorMessage.POSTCODE_REQUIRED
            });
        }
        if (payload.name_th && payload.name_th.length > 100) {
            invalid_fields.push({
                field: ErrorField.NAME_TH,
                message: ErrorMessage.NAME_TH_MAX_LENGTH
            });
        }
        if (payload.name_th && payload.name_th.length < 5) {
            invalid_fields.push({
                field: ErrorField.NAME_TH,
                message: ErrorMessage.NAME_TH_MIN_LENGTH
            });
        }
        if (payload.name_en && payload.name_en.length > 100) {
            invalid_fields.push({
                field: ErrorField.NAME_EN,
                message: ErrorMessage.NAME_EN_MAX_LENGTH
            });
        }
        if (payload.name_en && payload.name_en.length < 5) {
            invalid_fields.push({
                field: ErrorField.NAME_EN,
                message: ErrorMessage.NAME_EN_MIN_LENGTH
            });
        }
        if (!/^[0-9]{13}$/.test(payload.tax_id)) {
            invalid_fields.push({
                field: ErrorField.TAX_ID,
                message: ErrorMessage.TAX_ID_INVALID
            });
        }
        if (!is_enum_key(tax_type_enum, payload.tax_type)) {
            invalid_fields.push({
                field: ErrorField.TAX_TYPE,
                message: ErrorMessage.TAX_TYPE_INVALID
            });
        } else {
            payload.tax_type = TaxType[payload.tax_type.toUpperCase() as keyof typeof TaxType];
        }
        if (payload.contact_name && payload.contact_name.length > 100) {
            invalid_fields.push({
                field: ErrorField.CONTACT_NAME,
                message: ErrorMessage.CONTACT_NAME_MAX_LENGTH
            });
        }
        if (payload.contact_phone && payload.contact_phone.length > 20) {
            invalid_fields.push({
                field: ErrorField.CONTACT_PHONE,
                message: ErrorMessage.CONTACT_PHONE_MAX_LENGTH
            });
        }
        if (payload.contact_fax && payload.contact_fax.length > 20) {
            invalid_fields.push({
                field: ErrorField.CONTACT_FAX,
                message: ErrorMessage.CONTACT_FAX_MAX_LENGTH
            });
        }
        if (payload.contact_email && !validate_email(payload.contact_email)) {
            invalid_fields.push({
                field: ErrorField.CONTACT_EMAIL,
                message: ErrorMessage.CONTACT_EMAIL_INVALID
            });
        }
        if (payload.contact_email && payload.contact_email.length > 150) {
            invalid_fields.push({
                field: ErrorField.CONTACT_EMAIL,
                message: ErrorMessage.CONTACT_EMAIL_MAX_LENGTH
            });
        }
        if (payload.address && payload.address.length > 268435455) {
            invalid_fields.push({
                field: ErrorField.ADDRESS,
                message: ErrorMessage.ADDRESS_MAX_LENGTH
            });
        }
        if (payload.subdistrict_id && !validate_digit(payload.subdistrict_id)) {
            invalid_fields.push({
                field: ErrorField.SUBDISTRICT_ID,
                message: ErrorMessage.SUBDISTRICT_ID_INVALID
            });
        }
        if (payload.district_id && !validate_digit(payload.district_id)) {
            invalid_fields.push({
                field: ErrorField.DISTRICT_ID,
                message: ErrorMessage.DISTRICT_ID_INVALID
            });
        }
        if (payload.province_id && !validate_digit(payload.province_id)) {
            invalid_fields.push({
                field: ErrorField.PROVINCE_ID,
                message: ErrorMessage.PROVINCE_ID_INVALID
            });
        }
        if (payload.branch_type && !is_enum_key(branch_type_enum, payload.branch_type)) {
            invalid_fields.push({
                field: ErrorField.BRANCH_TYPE,
                message: ErrorMessage.BRANCH_TYPE_INVALID
            });
        } else {
            payload.branch_type = BranchType[payload.branch_type.toUpperCase() as keyof typeof BranchType];
        }
        if (payload.branch_number && payload.branch_number.length > 20) {
            invalid_fields.push({
                field: ErrorField.BRANCH_NUMBER,
                message: ErrorMessage.BRANCH_NUMBER_MAX_LENGTH
            });
        }
        if (invalid_fields.length > 0) {
            console.error("[Controller] Validation errors found in customer creation payload:", invalid_fields);
            return reply.code(HttpStatusCode.UNPROCESSABLE_CONTENT).send(<Reply>
                reply_result(module_name, HttpStatusCode.UNPROCESSABLE_CONTENT, invalid_fields, "Validation errors found in customer creation payload.")
            );
        }
        const conditions: Condition = { sql: '', params: [payload.tax_id, payload.name_th, payload.name_en] };
        const duplicate_check = await service.count_duplicate(conditions);
        if (duplicate_check.statuscode !== HttpStatusCode.OK) {
            return reply.code(HttpStatusCode.INTERNAL_SERVER_ERROR).send(<Reply>
                reply_result(module_name, HttpStatusCode.INTERNAL_SERVER_ERROR)
            );
        }
        const duplicates = duplicate_check.data![0];
        const duplicate_errors: ValidationError[] = [];
        if (duplicates.duplicate_tax_id > 0) {
            duplicate_errors.push({
                field: ErrorField.TAX_ID,
                message: ErrorMessage.TAX_ID_DUPLICATE
            });
        }
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
            console.error("[Controller] Duplicate errors found in customer creation:", duplicate_errors);
            return reply.code(HttpStatusCode.CONFLICT).send(<Reply>
                reply_result(module_name, HttpStatusCode.CONFLICT, duplicate_errors)
            )
        }
        const result = await service.create(payload, emp_id);
        switch (result.statuscode) {
            case HttpStatusCode.CREATED:
                const data = result.data![0];
                console.log("[Controller] Customer created successfully with ID:", data.customer_id);
                return reply.code(HttpStatusCode.CREATED).send(<Reply>{
                    status: HttpStatus.CREATED,
                    statuscode: HttpStatusCode.CREATED,
                    details: {
                        message: module_name.concat(' ', ReplySuccessMessage.CREATED),
                        id: data.customer_id,
                        display_id: data.customer_display_id,
                        name_th: data.customer_name_th,
                        name_en: data.customer_name_en,
                        tax_id: data.customer_tax_id,
                        tax_type: data.customer_tax_type,
                        contact_name: data.customer_contact_name,
                        contact_phone: data.customer_contact_phone,
                        contact_fax: data.customer_contact_fax,
                        contact_email: data.customer_contact_email,
                        address: data.customer_address,
                        subdistrict_id: data.customer_subdistrict_id,
                        district_id: data.customer_district_id,
                        province_id: data.customer_province_id,
                        postcode: data.customer_postcode,
                        branch_type: data.customer_branch_type,
                        branch_number: data.customer_branch_number,
                        created_at: data.customer_created_at,
                        updated_at: data.customer_updated_at,
                        emp_id: data.customer_emp_id,
                        status: data.customer_status
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
        if (request.params.customer_id) {
            conditions.params.push(request.params.customer_id);
            conditions.sql += ` AND customer_id = $${conditions.params.length} `;
        }
        if (request.query.branch_type && is_enum_key(branch_type_enum, request.query.branch_type)) {
            conditions.params.push(BranchType[request.query.branch_type.toUpperCase() as keyof typeof BranchType]);
            conditions.sql += ` AND customer_branch_type = $${conditions.params.length} `;
        } else if (request.query.branch_type) {
            console.error("[Controller] Invalid Type enum of status value provided for supplier: ", request.query.status);
            invalid_fields.push({
                field: ErrorField.BRANCH_TYPE,
                message: ErrorMessage.BRANCH_TYPE_INVALID
            });
        }
        if (request.query.status && is_enum_key(status_enum, request.query.status)) {
            conditions.params.push(Status[request.query.status.toUpperCase() as keyof typeof Status]);
            conditions.sql += ` AND customer_status = $${conditions.params.length} `;
        } else if (request.query.status) {
            console.error("[Controller] Invalid Type enum of status value provided for customer: ", request.query.status);
            invalid_fields.push({
                field: ErrorField.STATUS,
                message: ErrorMessage.STATUS_INVALID
            });
        }
        if (request.query.tax_type && is_enum_key(tax_type_enum, request.query.tax_type)) {
            conditions.params.push(TaxType[request.query.tax_type.toUpperCase() as keyof typeof TaxType]);
            conditions.sql += ` AND customer_tax_type = $${conditions.params.length} `;
        } else if (request.query.tax_type) {
            console.error("[Controller] Invalid Type enum of tax_type value provided for customer: ", request.query.tax_type);
            invalid_fields.push({
                field: ErrorField.TAX_TYPE,
                message: ErrorMessage.TAX_TYPE_INVALID
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
                        customers: results.data?.map(customer => new Customer(
                            customer.customer_id,
                            customer.customer_display_id,
                            customer.customer_name_th,
                            customer.customer_name_en,
                            customer.customer_tax_id,
                            customer.customer_tax_type,
                            new Contact(
                                customer.customer_contact_name,
                                customer.customer_contact_phone,
                                customer.customer_contact_fax,
                                customer.customer_contact_email
                            ),
                            new Address(
                                customer.customer_address,
                                new Subdistrict(
                                    customer.customer_subdistrict_id,
                                    lang === "en-US" ? customer.customer_subdistrict_name_en : customer.customer_subdistrict_name_th
                                ),
                                new District(
                                    customer.customer_district_id,
                                    lang === "en-US" ? customer.customer_district_name_en : customer.customer_district_name_th
                                ),
                                new Province(
                                    customer.customer_province_id,
                                    lang === "en-US" ? customer.customer_province_name_en : customer.customer_province_name_th
                                ),
                                customer.customer_postcode
                            ),
                            customer.customer_branch_type,
                            customer.customer_branch_number,
                            customer.customer_pp20_file,
                            customer.customer_certificate_file,
                            customer.customer_created_at,
                            customer.customer_updated_at,
                            new Employee(
                                customer.customer_emp_id,
                                customer.customer_emp_prefix,
                                lang === "en-US"
                                    ? customer.customer_emp_firstname_en + " " + customer.customer_emp_lastname_en
                                    : customer.customer_emp_firstname_th + " " + customer.customer_emp_lastname_th
                            ),
                            customer.customer_status
                        ))
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
        if (!request.params.customer_id) {
            console.error("[Controller] Missing customer ID for customer deletion.");
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
        const customer_id: string = sanitize_string(request.params.customer_id);
        const customer_data = await service.get({ sql: " AND customer_id = $1", params: [customer_id] });
        if (customer_data.statuscode === HttpStatusCode.NOT_FOUND) {
            return reply.code(HttpStatusCode.NOT_FOUND).send(<Reply>{
                status: HttpStatus.NOT_FOUND,
                statuscode: HttpStatusCode.NOT_FOUND,
                details: {
                    error: ReplyErrorField.NOT_FOUND,
                    message: ReplyErrorMessage.NOT_FOUND
                }
            });
        } else if (customer_data.statuscode === HttpStatusCode.INTERNAL_SERVER_ERROR) {
            return reply.code(HttpStatusCode.INTERNAL_SERVER_ERROR).send(<Reply>{
                status: HttpStatus.INTERNAL_SERVER_ERROR,
                statuscode: HttpStatusCode.INTERNAL_SERVER_ERROR,
                details: {
                    error: ReplyErrorField.INTERNAL_SERVER_ERROR,
                    message: ReplyErrorMessage.INTERNAL_SERVER_ERROR
                }
            });
        }
        const current_data = customer_data.data![0];
        if (current_data.customer_status === Status.INACTIVE) {
            console.error(`[Controller] Customer with ID ${customer_id} is already inactive`);
            return reply.code(HttpStatusCode.CONFLICT).send(<Reply>{
                status: HttpStatus.CONFLICT,
                statuscode: HttpStatusCode.CONFLICT,
                details: {
                    error: ErrorField.STATUS,
                    message: ErrorMessage.STATUS_CONFLICT
                }
            });
        }
        const result = await service.soft_delete(customer_id, emp_id);
        switch (result.statuscode) {
            case HttpStatusCode.NO_CONTENT:
                console.error(`[Controller] Customer with ID ${customer_id} successfully deleted`);
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
                console.error("[Controller] An unrecognized status code was returned from deleting customer:", result.statuscode);
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
        console.error("[Controller] An error occurred during deleting customer:", error);
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
        const customer_id: string = sanitize_string(request.params.customer_id);
        const customer_data = await service.get({ sql: ' AND customer_id = $1 ', params: [customer_id] });
        if (customer_data.statuscode === HttpStatusCode.NOT_FOUND) {
            return reply.code(HttpStatusCode.NOT_FOUND).send(<Reply>{
                status: HttpStatus.NOT_FOUND,
                statuscode: HttpStatusCode.NOT_FOUND,
                details: {
                    error: ReplyErrorField.NOT_FOUND,
                    message: ReplyErrorMessage.NOT_FOUND
                }
            });
        } else if (customer_data.statuscode === HttpStatusCode.INTERNAL_SERVER_ERROR) {
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
        if (!payload.name_th) {
           invalid_fields.push({
                field: ErrorField.NAME_TH,
                message: ErrorMessage.NAME_TH_REQUIRED
           }); 
        }
        if (!payload.tax_id) {
            invalid_fields.push({
                field: ErrorField.TAX_ID,
                message: ErrorMessage.TAX_ID_REQUIRED
            });
        }
        if (!payload.subdistrict_id) {
            invalid_fields.push({
                field: ErrorField.SUBDISTRICT_ID,
                message: ErrorMessage.SUBDISTRICT_ID_REQUIRED
            });
        }
        if (!payload.district_id) {
            invalid_fields.push({
                field: ErrorField.DISTRICT_ID,
                message: ErrorMessage.DISTRICT_ID_REQUIRED
            });
        }
        if (!payload.province_id) {
            invalid_fields.push({
                field: ErrorField.PROVINCE_ID,
                message: ErrorMessage.PROVINCE_ID_REQUIRED
            });
        }
        if (!payload.postcode) {
            invalid_fields.push({
                field: ErrorField.POSTCODE,
                message: ErrorMessage.POSTCODE_REQUIRED
            });
        }
        if (payload.name_th && payload.name_th.length > 100) {
            invalid_fields.push({
                field: ErrorField.NAME_TH,
                message: ErrorMessage.NAME_TH_MAX_LENGTH
            });
        }
        if (payload.name_th && payload.name_th.length < 5) {
            invalid_fields.push({
                field: ErrorField.NAME_TH,
                message: ErrorMessage.NAME_TH_MIN_LENGTH
            });
        }
        if (payload.name_en && payload.name_en.length < 5) {
            invalid_fields.push({
                field: ErrorField.NAME_EN,
                message: ErrorMessage.NAME_EN_MIN_LENGTH
            });
        }
        if (payload.name_en && payload.name_en.length > 100) {
            invalid_fields.push({
                field: ErrorField.NAME_EN,
                message: ErrorMessage.NAME_EN_MAX_LENGTH
            });
        }
        if (!/^[0-9]{13}$/.test(payload.tax_id)) {
            invalid_fields.push({
                field: ErrorField.TAX_ID,
                message: ErrorMessage.TAX_ID_INVALID
            });
        }
        if (payload.tax_type && !is_enum_key(tax_type_enum, payload.tax_type)) {
            invalid_fields.push({
                field: ErrorField.TAX_TYPE,
                message: ErrorMessage.TAX_TYPE_INVALID
            });
        } else {
            payload.tax_type = TaxType[payload.tax_type.toUpperCase() as keyof typeof TaxType];
        }
        if (payload.contact_name && payload.contact_name.length > 100) {
            invalid_fields.push({
                field: ErrorField.CONTACT_NAME,
                message: ErrorMessage.CONTACT_NAME_MAX_LENGTH
            });
        }
        if (payload.contact_phone && payload.contact_phone.length > 20) {
            invalid_fields.push({
                field: ErrorField.CONTACT_PHONE,
                message: ErrorMessage.CONTACT_PHONE_MAX_LENGTH
            });
        }
        if (payload.contact_fax && payload.contact_fax.length > 20) {
            invalid_fields.push({
                field: ErrorField.CONTACT_FAX,
                message: ErrorMessage.CONTACT_FAX_MAX_LENGTH
            });
        }
        if (payload.contact_email && !validate_email(payload.contact_email)) {
            invalid_fields.push({
                field: ErrorField.CONTACT_EMAIL,
                message: ErrorMessage.CONTACT_EMAIL_INVALID
            });
        }
        if (payload.contact_email && payload.contact_email.length > 150) {
            invalid_fields.push({
                field: ErrorField.CONTACT_EMAIL,
                message: ErrorMessage.CONTACT_EMAIL_MAX_LENGTH
            });
        }
        if (payload.address && payload.address.length > 268435455) {
            invalid_fields.push({
                field: ErrorField.ADDRESS,
                message: ErrorMessage.ADDRESS_MAX_LENGTH
            });
        }
        if (payload.subdistrict_id && !validate_digit(payload.subdistrict_id)) {
            invalid_fields.push({
                field: ErrorField.SUBDISTRICT_ID,
                message: ErrorMessage.SUBDISTRICT_ID_INVALID
            });
        }
        if (payload.district_id && !validate_digit(payload.district_id)) {
            invalid_fields.push({
                field: ErrorField.DISTRICT_ID,
                message: ErrorMessage.DISTRICT_ID_INVALID
            });
        }
        if (payload.province_id && !validate_digit(payload.province_id)) {
            invalid_fields.push({
                field: ErrorField.PROVINCE_ID,
                message: ErrorMessage.PROVINCE_ID_INVALID
            });
        }
        if (payload.branch_type && !is_enum_key(branch_type_enum, payload.branch_type)) {
            invalid_fields.push({
                field: ErrorField.BRANCH_TYPE,
                message: ErrorMessage.BRANCH_TYPE_INVALID
            });
        } else {
            payload.branch_type = BranchType[payload.branch_type.toUpperCase() as keyof typeof BranchType];
        }
        if (payload.branch_number && payload.branch_number.length > 20) {
            invalid_fields.push({
                field: ErrorField.BRANCH_NUMBER,
                message: ErrorMessage.BRANCH_NUMBER_MAX_LENGTH
            });
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
        const conditions: Condition = { sql: ' AND customer_id != $4', params: [payload.tax_id, payload.name_th, payload.name_en, customer_id] };
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
        if (duplicates.duplicate_tax_id > 0) {
            duplicate_errors.push({
                field: ErrorField.TAX_ID,
                message: ErrorMessage.TAX_ID_DUPLICATE
            });
        }
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
            console.error("[Controller] Duplicate errors found in customer creation:", duplicate_errors);
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
        const result = await service.update(customer_id, payload, emp_id);
        switch (result.statuscode) {
            case HttpStatusCode.NO_CONTENT:
                console.log(`[Controller] Customer with ID ${customer_id} has been updated successfully`);
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
                console.error("[Controller] An unrecognized status code was returned from updating customer:", result.statuscode);
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
        if (!request.params.customer_id) {
            missing_fields.unshift('customer_id');
        }
        if (missing_fields.length > 0) {
            console.error("[Controller] Missing required fields for updating customer status:", missing_fields);
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
        const customer_id: string = request.params.customer_id;
        const customer_data = await service.get({ sql: " AND customer_id = $1", params: [customer_id] });
        if (customer_data.statuscode === HttpStatusCode.NOT_FOUND) {
            return reply.code(HttpStatusCode.NOT_FOUND).send(<Reply>{
                status: HttpStatus.NOT_FOUND,
                statuscode: HttpStatusCode.NOT_FOUND,
                details: {
                    error: ReplyErrorField.NOT_FOUND,
                    message: ReplyErrorMessage.NOT_FOUND
                }
            });
        } else if (customer_data.statuscode === HttpStatusCode.INTERNAL_SERVER_ERROR) {
            return reply.code(HttpStatusCode.INTERNAL_SERVER_ERROR).send(<Reply>{
                status: HttpStatus.INTERNAL_SERVER_ERROR,
                statuscode: HttpStatusCode.INTERNAL_SERVER_ERROR,
                details: {
                    error: ReplyErrorField.INTERNAL_SERVER_ERROR,
                    message: ReplyErrorMessage.INTERNAL_SERVER_ERROR
                }
            });
        }
        const result = await service.update_status(customer_id, status, emp_id);
        switch (result.statuscode) {
            case HttpStatusCode.NO_CONTENT:
                console.log(`[Controller] Customer with ID ${customer_id} status updated successfully`);
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