import {
    HttpStatus,
    HttpStatusCode,
    Reply,
    ReplyErrorField,
    ReplyErrorMessage,
    ReplySuccessMessage,
    ValidationError
} from "@/api/utils/shared_types";

export function reply_result(module_name: string, statuscode: HttpStatusCode, result: any , missing_fields: string[] , format: any ){

    switch (statuscode) {
        case HttpStatusCode.OK:
            console.log(`[Controller] ${module_name} get successful with data`);
            return {
                status: HttpStatus.OK,
                statuscode: HttpStatusCode.OK,
                details: result?.data
            }
        case HttpStatusCode.CREATED:
            console.log(`[Controller] ${module_name} created successfully with ID:`, result?.data?.[0]?.po_id);
            return {
                status: HttpStatus.CREATED,
                statuscode: HttpStatusCode.CREATED,
                details: result?.data?.[0]
            }
        case HttpStatusCode.ACCEPTED:
            console.log(`[Controller] ${module_name} request accepted with ID:`, result?.data?.[0]?.po_id);
            return {
                status: HttpStatus.ACCEPTED,
                statuscode: HttpStatusCode.ACCEPTED,
                details: result?.data?.[0]
            }
        case HttpStatusCode.NO_CONTENT:
            console.log(`[Controller] ${module_name} has no content to return.`);
            return {
                status: HttpStatus.NO_CONTENT,
                statuscode: HttpStatusCode.NO_CONTENT,
                details: {
                    message: ReplySuccessMessage.UPDATED
                }
            }
        case HttpStatusCode.BAD_REQUEST:
            console.error(`[Controller] Missing required fields for ${module_name} creation:`, missing_fields);
            return {
                status: HttpStatus.BAD_REQUEST,
                statuscode: HttpStatusCode.BAD_REQUEST,
                details: {
                    error: ReplyErrorField.VALIDATION_ERROR,
                    message: ReplyErrorMessage.VALIDATION_ERROR,
                    errors: missing_fields?.map(field => {
                        let message = ReplyErrorMessage[field.toUpperCase() + '_REQUIRED' as keyof typeof ReplyErrorMessage];
                        return {
                            field: field.toUpperCase() as ValidationError['field'],
                            message: message as ValidationError['message']
                        };
                    })
                }
            };
        case HttpStatusCode.UNAUTHORIZED:
            console.error(`[Controller] Unauthorized access attempt for ${module_name}.`);
            return {
                status: HttpStatus.UNAUTHORIZED,
                statuscode: HttpStatusCode.UNAUTHORIZED,
                details: {
                    error: ReplyErrorField.UNAUTHORIZED,
                    message: ReplyErrorMessage.UNAUTHORIZED
                }
            }
        case HttpStatusCode.FORBIDDEN:
            console.error(`[Controller] Forbidden access attempt for ${module_name}.`);
            return {
                status: HttpStatus.FORBIDDEN,
                statuscode: HttpStatusCode.FORBIDDEN,
                details: {
                    error: ReplyErrorField.FORBIDDEN,
                    message: ReplyErrorMessage.FORBIDDEN
                }
            }
        case HttpStatusCode.NOT_FOUND:
            console.error(`[Controller] ${module_name} not found.`);
            return {
                status: HttpStatus.NOT_FOUND,
                statuscode: HttpStatusCode.NOT_FOUND,
                details: {
                    error: ReplyErrorField.NOT_FOUND,
                    message: ReplyErrorMessage.NOT_FOUND
                }
            }
        case HttpStatusCode.METHOD_NOT_ALLOWED:
            console.error(`[Controller] Method not allowed for ${module_name}.`);
            return {
                status: HttpStatus.METHOD_NOT_ALLOWED,
                statuscode: HttpStatusCode.METHOD_NOT_ALLOWED,
                details: {
                    error: ReplyErrorField.METHOD_NOT_ALLOWED,
                    message: ReplyErrorMessage.METHOD_NOT_ALLOWED
                }
            }
        case HttpStatusCode.CONFLICT:
            console.error(`[Controller] Validation errors found in ${module_name} creation payload:`, missing_fields);
            return {
                status: HttpStatus.UNPROCESSABLE_CONTENT,
                statuscode: HttpStatusCode.UNPROCESSABLE_CONTENT,
                details: {
                    error: ReplyErrorField.VALIDATION_ERROR,
                    message: ReplyErrorMessage.VALIDATION_ERROR,
                    errors: missing_fields?.map(field => {
                        let message = ReplyErrorMessage[field.toUpperCase() + '_INVALID' as keyof typeof ReplyErrorMessage];
                        return {
                            field: field.toUpperCase() as ValidationError['field'],
                            message: message as ValidationError['message']
                        };
                    })
                }
            };
        case HttpStatusCode.UNSUPPORTED_MEDIA_TYPE:
            console.error(`[Controller] Unsupported media type for ${module_name}.`);
            return {
                status: HttpStatus.UNSUPPORTED_MEDIA_TYPE,
                statuscode: HttpStatusCode.UNSUPPORTED_MEDIA_TYPE,
                details: {
                    error: ReplyErrorField.UNSUPPORTED_MEDIA_TYPE,
                    message: ReplyErrorMessage.UNSUPPORTED_MEDIA_TYPE
                }
            }
        case HttpStatusCode.UNPROCESSABLE_CONTENT:
            console.error(`[Controller] Validation errors found in ${module_name} creation payload:`, missing_fields);
            return {
                status: HttpStatus.UNPROCESSABLE_CONTENT,
                statuscode: HttpStatusCode.UNPROCESSABLE_CONTENT,
                details: {
                    error: ReplyErrorField.VALIDATION_ERROR,
                    message: ReplyErrorMessage.VALIDATION_ERROR
                }
            }
        case HttpStatusCode.INTERNAL_SERVER_ERROR:
            console.error(`[Controller] An internal server error occurred while processing ${module_name}.`);
            return {
                status: HttpStatus.INTERNAL_SERVER_ERROR,
                statuscode: HttpStatusCode.INTERNAL_SERVER_ERROR,
                details: {
                    error: ReplyErrorField.INTERNAL_SERVER_ERROR,
                    message: ReplyErrorMessage.INTERNAL_SERVER_ERROR
                }
            }
        default:
            console.error(`[Controller] An unrecognized status code was encountered while processing ${module_name}:`, statuscode);
            return {
                status: HttpStatus.INTERNAL_SERVER_ERROR,
                statuscode: HttpStatusCode.INTERNAL_SERVER_ERROR,
                details: {
                    error: ReplyErrorField.INTERNAL_SERVER_ERROR,
                    message: ReplyErrorMessage.INTERNAL_SERVER_ERROR
                }
            };
    }
}
