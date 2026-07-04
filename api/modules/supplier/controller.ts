import {
    Address,
    Contact,
    District,
    Emp,
    Province,
    Subdistrict,
    Supplier
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
    TaxType,
} from '@/api/utils/shared_types';
import field_validator from '@/api/utils/field_validator';

const branch_type_enum = get_enum_keys(BranchType);
const status_enum = get_enum_keys(Status);
const tax_type_enum = get_enum_keys(TaxType);

const module_name = 'Supplier';

async function create(request: any, reply: any) {
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
        const payload: Payload = request.body;
        const invalid_fields: ValidationError[] = [];
        // check name_th 
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
        if (payload.name_th && payload.name_th.length < 3) {
            invalid_fields.push({
                field: ErrorField.NAME_TH,
                message: ErrorMessage.NAME_TH_MIN_LENGTH
            });
        }
        if (payload.name_th && payload.name_th.length > 100) {
            invalid_fields.push({
                field: ErrorField.NAME_TH,
                message: ErrorMessage.NAME_TH_MAX_LENGTH
            });
        }
        // check name_en
        if (payload.name_en && payload.name_en.length < 3) {
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
        // check formath tax_id
        if (payload.tax_id && !/^[0-9]{13}$/.test(payload.tax_id)) {
            invalid_fields.push({
                field: ErrorField.TAX_ID,
                message: ErrorMessage.TAX_ID_INVALID
            });
        }
        // check tax_type enum value by send 2 against list 
        if (payload.tax_type && !is_enum_key(tax_type_enum, payload.tax_type)) {
            invalid_fields.push({
                field: ErrorField.TAX_TYPE,
                message: ErrorMessage.TAX_TYPE_INVALID
            });
        } else {
            payload.tax_type = TaxType[payload.tax_type.toUpperCase() as keyof typeof TaxType];
        }
        // check contect_name max length 100
        if (payload.contact_name && payload.contact_name.length > 100) {
            invalid_fields.push({
                field: ErrorField.CONTACT_NAME,
                message: ErrorMessage.CONTACT_NAME_MAX_LENGTH
            });
        }
        // check contact_phone max length 20
        if (payload.contact_phone && payload.contact_phone.length > 20) {
            invalid_fields.push({
                field: ErrorField.CONTACT_PHONE,
                message: ErrorMessage.CONTACT_PHONE_MAX_LENGTH
            });
        }
        // check contact_fax max length 20
        if (payload.contact_fax && payload.contact_fax.length > 20) {
            invalid_fields.push({
                field: ErrorField.CONTACT_FAX,
                message: ErrorMessage.CONTACT_FAX_MAX_LENGTH
            });
        }
        // check contact_email format and max length 150
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
        // check address max length 268435455
        if (payload.address && payload.address.length > 268435455) {
            invalid_fields.push({
                field: ErrorField.ADDRESS,
                message: ErrorMessage.ADDRESS_MAX_LENGTH
            });
        }

        //Postcode check length of input postcode
        if (payload.postcode && payload.postcode.length > 10) {
            invalid_fields.push({
                field: ErrorField.ADDRESS,
                message: ErrorMessage.ADDRESS_MAX_LENGTH
            });
        }
        if (payload.postcode && payload.postcode.length < 5) {
            invalid_fields.push({
                field: ErrorField.ADDRESS,
                message: ErrorMessage.ADDRESS_MAX_LENGTH
            });
        }
        // check branch_type enum value
        if (payload.branch_type && !is_enum_key(branch_type_enum, payload.branch_type)) {
            invalid_fields.push({
                field: ErrorField.BRANCH_TYPE,
                message: ErrorMessage.BRANCH_TYPE_INVALID
            });
        } else {
            payload.branch_type = BranchType[payload.branch_type.toUpperCase() as keyof typeof BranchType];
        }
        // check branch_number max length 20
        if (payload.branch_number && (payload.branch_number.length > 20)) {
            invalid_fields.push({
                field: ErrorField.BRANCH_NUMBER,
                message: ErrorMessage.BRANCH_NUMBER_MAX_LENGTH
            });
        }
        if (invalid_fields.length > 0) {
            console.error("[Controller] Validation errors found in supplier creation payload:", invalid_fields);
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
        const conditions: Condition = { sql: '', params: [payload.tax_id, payload.name_th, payload.name_en] };
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
            console.error("[Controller] Duplicate errors found in supplier creation:", duplicate_errors);
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
                console.log("[Controller] Supplier created successfully with ID:", data.supplier_id);
                return reply.code(HttpStatusCode.CREATED).send(<Reply>{
                    status: HttpStatus.CREATED,
                    statuscode: HttpStatusCode.CREATED,
                    details: {
                        message: ReplySuccessMessage.CREATED,
                        id: data.supplier_id,
                        display_id: data.supplier_display_id,
                        name: lang === "th-TH" ? request.query.supplier_name_th : request.query.supplier_name_en,
                        tax_id: data.supplier_tax_id,
                        tax_type: data.supplier_tax_type,
                        contact: new Contact(
                            data.supplier_contact_name,
                            data.supplier_contact_phone,
                            data.supplier_contact_fax,
                            data.supplier_contact_email
                        ),
                        address: data.supplier_address,
                        subdistrict_id: data.supplier_subdistrict_id,
                        district_id: data.supplier_district_id,
                        province_id: data.supplier_province_id,
                        postcode: data.supplier_postcode,
                        branch_type: data.supplier_branch_type,
                        branch_number: data.supplier_branch_number,
                        pp20_file: data.supplier_pp20_file,
                        created_at: data.supplier_created_at,
                        updated_at: data.supplier_updated_at,
                        emp_id: data.supplier_emp_id,
                        status: data.supplier_status,
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
                console.error("[Controller] An unrecognized status code was returned from creating supplier:", result.statuscode);
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
        console.error("[Controller] An error occurred during creating supplier:", error);
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

        if (request.params.supplier_id) {
            conditions.params.push(request.params.supplier_id);
            conditions.sql += ` AND supplier_id = $${conditions.params.length} `;
        }
        if (request.query.branch_type && is_enum_key(branch_type_enum, request.query.branch_type)) {
            conditions.params.push(BranchType[request.query.branch_type.toUpperCase() as keyof typeof BranchType]);
            conditions.sql += ` AND supplier_branch_type = $${conditions.params.length} `;
        } else if (request.query.branch_type) {
            console.error("[Controller] Invalid branch_type enum value provided for supplier: ", request.query.branch_type);
            invalid_fields.push({
                field: ErrorField.BRANCH_TYPE,
                message: ErrorMessage.BRANCH_TYPE_INVALID
            });

        }
        if (request.query.status && is_enum_key(status_enum, request.query.status)) {
            conditions.params.push(Status[request.query.status.toUpperCase() as keyof typeof Status]);
            conditions.sql += ` AND supplier_status = $${conditions.params.length} `;
        } else if (request.query.status) {
            console.error("[Controller] Invalid status enum value provided for supplier: ", request.query.status);
            invalid_fields.push({
                field: ErrorField.STATUS,
                message: ErrorMessage.STATUS_INVALID
            });
        }
        if (request.query.tax_type && is_enum_key(tax_type_enum, request.query.tax_type)) {
            conditions.params.push(TaxType[request.query.tax_type.toUpperCase() as keyof typeof TaxType]);
            conditions.sql += ` AND supplier_tax_type = $${conditions.params.length} `;
        } else if (request.query.tax_type) {
            console.error("[Controller] Invalid tax_type enum value provided for supplier: ", request.query.tax_type);
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

        const results = await service.get(conditions);
        switch (results.statuscode) {
            case HttpStatusCode.OK:
                console.log(`[Controller] Successfully retrieved ${results.data!.length || 0} suppliers.`);
                return reply.code(HttpStatusCode.OK).send(<Reply>{
                    status: HttpStatus.OK,
                    statuscode: HttpStatusCode.OK,
                    details: {
                        tax_type: request.query.tax_type || null,
                        branch_type: request.query.branch_type || null,
                        status: request.query.status || null,
                        suppliers: results.data?.map(supplier => new Supplier(
                            supplier.supplier_id,
                            supplier.supplier_display_id,
                            supplier.supplier_name_th,
                            supplier.supplier_name_en,
                            supplier.supplier_tax_id,
                            supplier.supplier_tax_type,
                            new Contact(
                                supplier.supplier_contact_name,
                                supplier.supplier_contact_phone,
                                supplier.supplier_contact_fax,
                                supplier.supplier_contact_email
                            ),
                            new Address(
                                supplier.supplier_address,
                                new Subdistrict(
                                    supplier.supplier_subdistrict_id,
                                    lang === "th-TH" ? supplier.supplier_subdistrict_name_th : supplier.supplier_subdistrict_name_en
                                ),
                                new District(
                                    supplier.supplier_district_id,
                                    lang === "th-TH" ? supplier.supplier_district_name_th : supplier.supplier_district_name_en
                                ),
                                new Province(
                                    supplier.supplier_province_id,
                                    lang === "th-TH" ? supplier.supplier_province_name_th : supplier.supplier_province_name_en
                                ),
                                supplier.supplier_postcode
                            ),
                            supplier.supplier_branch_type,
                            supplier.supplier_branch_number,
                            supplier.supplier_pp20_file,
                            supplier.supplier_created_at,
                            supplier.supplier_updated_at,
                            new Emp(
                                supplier.supplier_emp_id,
                                supplier.emp_prefix,
                                lang === "th-TH" ? supplier.supplier_emp_fname_th + " " + supplier.supplier_emp_lname_th : supplier.supplier_emp_fname_en + " " + supplier.supplier_emp_lname_en
                            ),
                            supplier.supplier_status
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
                console.error("[Controller] An unrecognized status code was returned from getting supplier:", results.statuscode);
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
        console.error("[Controller] An error occurred during deleting supplier:", error);
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
        if (!request.params.supplier_id) {
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
        const supplier_id: string = request.params.supplier_id;
        const supplier_data = await service.get({ sql: " AND supplier_id = $1", params: [supplier_id] });
        if (supplier_data.statuscode === HttpStatusCode.NOT_FOUND) {
            return reply.code(HttpStatusCode.NOT_FOUND).send(<Reply>{
                status: HttpStatus.NOT_FOUND,
                statuscode: HttpStatusCode.NOT_FOUND,
                details: {
                    error: ReplyErrorField.NOT_FOUND,
                    message: ReplyErrorMessage.NOT_FOUND
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
        const current_data = supplier_data.data![0];
        if (current_data.supplier_status === Status.INACTIVE) {
            console.error(`[Controller] supplier with ID ${supplier_id} is already inactive`);
            return reply.code(HttpStatusCode.CONFLICT).send({
                status: HttpStatus.CONFLICT,
                statuscode: HttpStatusCode.CONFLICT,
                details: {
                    error: ErrorField.STATUS,
                    message: ErrorMessage.STATUS_CONFLICT,
                }
            });
        }
        const result = await service.soft_delete(supplier_id, emp_id);
        switch (result.statuscode) {
            case HttpStatusCode.NO_CONTENT:
                console.log(`[Controller] Supplier with ID ${supplier_id} successfully deleted`);
                return reply.code(HttpStatusCode.NO_CONTENT).send(<Reply>{
                    status: HttpStatus.NO_CONTENT,
                    statuscode: HttpStatusCode.NO_CONTENT,
                    details: {
                        message: ReplySuccessMessage.DELETED
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
                return reply.code(HttpStatusCode.NO_CONTENT).send(<Reply>{
                    status: HttpStatus.NO_CONTENT,
                    statuscode: HttpStatusCode.NO_CONTENT,
                    details: {
                        error: ReplyErrorField.INTERNAL_SERVER_ERROR,
                        message: ReplyErrorMessage.INTERNAL_SERVER_ERROR
                    }
                });
            default:
                console.error("[Controller] An unrecognized status code was returned from deleting supplier:", result.statuscode);
                return reply.code(HttpStatusCode.INTERNAL_SERVER_ERROR).send(<Reply>{
                    status: HttpStatus.INTERNAL_SERVER_ERROR,
                    statuscode: HttpStatusCode.INTERNAL_SERVER_ERROR,
                    details: {
                        error: ReplyErrorField.INTERNAL_SERVER_ERROR,
                        message: ReplyErrorMessage.INTERNAL_SERVER_ERROR
                    }
                });
        }
    } catch (error) {
        console.error("[Controller] An error occurred during deleting supplier:", error);
        return reply.code(HttpStatusCode.INTERNAL_SERVER_ERROR).send(<Reply>{
            status: HttpStatus.INTERNAL_SERVER_ERROR,
            statuscode: HttpStatusCode.INTERNAL_SERVER_ERROR,
            details: {
                error: ReplyErrorField.INTERNAL_SERVER_ERROR,
                message: ReplyErrorMessage.INTERNAL_SERVER_ERROR
            }
        })
    }
}
async function update(request: any, reply: any) {
    try {
        const lang = request.headers['accept-language'] || 'en-US';
        const user = request.user;
        console.log("request.body ",request.body);
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
        const payload: Payload = sanitize_payload(request.body);
        const supplier_id: string = request.params.supplier_id;
        const supplier_data = await service.get({ sql: ' AND supplier_id = $1 ', params: [supplier_id] });
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
        if (payload.name_th && payload.name_th.length < 3) {
            invalid_fields.push({
                field: ErrorField.NAME_TH,
                message: ErrorMessage.NAME_TH_MIN_LENGTH
            })
        }
        if (payload.name_th && payload.name_th.length > 100) {
            invalid_fields.push({
                field: ErrorField.NAME_TH,
                message: ErrorMessage.NAME_TH_MAX_LENGTH
            })
        }
        if (payload.name_en && payload.name_en.length < 3) {
            invalid_fields.push({
                field: ErrorField.NAME_EN,
                message: ErrorMessage.NAME_EN_MIN_LENGTH
            })
        }
        if (payload.name_en && payload.name_en.length > 100) {
            invalid_fields.push({
                field: ErrorField.NAME_EN,
                message: ErrorMessage.NAME_EN_MAX_LENGTH
            })
        }
        if (payload.tax_id && !/^[0-9]{13}$/.test(payload.tax_id)) {
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
                message: ErrorMessage.SUBDISTRICT_ID_NAN
            });
        }
        if (payload.district_id && !validate_digit(payload.district_id)) {
            invalid_fields.push({
                field: ErrorField.DISTRICT_ID,
                message: ErrorMessage.DISTRICT_ID_NAN
            });
        }
        if (payload.province_id && !validate_digit(payload.province_id)) {
            invalid_fields.push({
                field: ErrorField.PROVINCE_ID,
                message: ErrorMessage.PROVINCE_ID_NAN
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
        if (payload.branch_number && (payload.branch_number.length > 20)) {
            invalid_fields.push({
                field: ErrorField.BRANCH_NUMBER,
                message: ErrorMessage.BRANCH_NUMBER_MAX_LENGTH
            });
        }
        const conditions: Condition = { sql: ' AND supplier_id != $4', params: [payload.tax_id, payload.name_th, payload.name_en, supplier_id] };
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
            console.error("[Controller] Duplicate errors found in supplier creation:", duplicate_errors);
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
        const result = await service.update(supplier_id, payload, emp_id);
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
                console.error("[Controller] An unrecognized status code was returned from updating supplier:", result.statuscode)
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
        console.error("[Controller] An error occurred during updating supplier:", error);
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
        const missing_fields: string[] = field_validator(request.body, [
            'status'
        ]);
        if (!request.params.supplier_id) {
            missing_fields.unshift('supplier_id');
        }
        if (missing_fields.length > 0) {
            console.error("[Controller] Missing required fields for updating supplier status:", missing_fields);
            return reply.code(HttpStatusCode.BAD_REQUEST).send(<Reply>{
                status: HttpStatus.BAD_REQUEST,
                statuscode: HttpStatusCode.BAD_REQUEST,
                details: {
                    error: ReplyErrorField.VALIDATION_ERROR,
                    message: ReplyErrorMessage.VALIDATION_ERROR,
                    errors: missing_fields.map(field => {
                        let message = ErrorMessage[field.toUpperCase() + '_REQUIRED' as keyof typeof ErrorMessage]
                        return {
                            field: field.toUpperCase() as ValidationError['field'],
                            message: message as ValidationError['message']
                        }
                    })
                }
            });
        }
        const invalid_fields: ValidationError[] = [];
        const payload: Payload = sanitize_payload(request.body);
        if (!is_enum_key(status_enum, payload.status)) {
            invalid_fields.push({
                field: ErrorField.STATUS,
                message: ErrorMessage.STATUS_INVALID
            });
        } else {
            payload.status = Status[payload.status.toUpperCase() as keyof typeof Status];
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
        const supplier_id: string = request.params.supplier_id;
        const supplier_data = await service.get({ sql: ' AND supplier_id = $1 ', params: [supplier_id] });
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
        const result = await service.update_status(supplier_id, payload.status!, emp_id);
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
                console.error("[Controller] An unrecognized status code was returned from updating supplier status:", result.statuscode);
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
        console.error("[Controller] An error occurred during updating supplier status:", error);
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