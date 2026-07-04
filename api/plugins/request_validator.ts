import { RouteInfo } from "@/api/plugins/types";
import { sanitize_payload } from "@/api/utils/input_sanitizer";
import { HttpStatus, HttpStatusCode, Reply, ReplyErrorField, ReplyErrorMessage } from "@/api/utils/shared_types";

const general_params = ['version'];

export function validate_request(request: any, reply: any, route_info: RouteInfo): void {
    // Skip body validation for multipart/form-data (file uploads)
    const contentType = request.headers['content-type'] || '';
    const isMultipart = contentType.includes('multipart/form-data');
    
    // Return Bad Request if body is required but missing (skip for multipart)
    if (!isMultipart && 
        route_info.request && route_info.request.body && route_info.request.body.length > 0 &&
        (!request.body || Object.keys(request.body).length === 0)) {
        console.error("[Middleware] Missing request body");
        return reply.code(HttpStatusCode.BAD_REQUEST).send(<Reply>{
            status: HttpStatus.BAD_REQUEST,
            statuscode: HttpStatusCode.BAD_REQUEST,
            details: {
                error: ReplyErrorField.MISSING_REQUEST_BODY,
                message: ReplyErrorMessage.MISSING_REQUEST_BODY
            }
        });
    }
    // Validate request body (skip for multipart)
    if (!isMultipart && route_info.request && route_info.request.body && route_info.request.body.length > 0) {
        validate_request_body(request, reply, route_info);
    }
    // Validate request params if there are extra params beyond general params
    if (route_info.request && route_info.request.params && request.params &&
        Object.keys(request.params).length > general_params.length) {
        validate_request_params(request, reply, route_info);
    }
    // Validate request query if provided
    if (route_info.request && route_info.request.query && request.query &&
        Object.keys(request.query).length > 0) {
        validate_request_query(request, reply, route_info);
    }
    // Validate request reply fields
    if (route_info.reply && route_info.reply.data && route_info.reply.data.length > 0) {
        validate_request_reply(request, reply, route_info);
    }
}
export function validate_request_body(request: any, reply: any, route_info: RouteInfo): void {
    const clearance_level = request.user?.clearance_level || 0;
    const allowed_fields = new Set(route_info.request!.body!.find((obj: any) =>
        // Find the schema matching the user's clearance level
        // or return the first schema if clearance level is not required
        (obj.hasOwnProperty('clearance_level') && obj.clearance_level <= clearance_level) ||
        (!obj.hasOwnProperty('clearance_level') && clearance_level >= 0)
    )?.fields || []);
    const request_body_fields = new Set(Object.keys(request.body));
    const invalid_fields = Array.from(request_body_fields).filter((field) => !allowed_fields.has(field));
    if (invalid_fields.length > 0) {
        console.log("[Middleware] request body:", request.body);
        console.error("[Middleware] Invalid fields in request body:", invalid_fields);
        return reply.code(HttpStatusCode.BAD_REQUEST).send(<Reply>{
            status: HttpStatus.BAD_REQUEST,
            statuscode: HttpStatusCode.BAD_REQUEST,
            details: {
                error: ReplyErrorField.INVALID_REQUEST_FIELDS,
                message: ReplyErrorMessage.INVALID_REQUEST_FIELDS
            }
        });
    }
    if (allowed_fields.size != request_body_fields.size) {
        console.error("[Middleware] Missing required fields in request body");
        return reply.code(HttpStatusCode.BAD_REQUEST).send(<Reply>{
            status: HttpStatus.BAD_REQUEST,
            statuscode: HttpStatusCode.BAD_REQUEST,
            details: {
                error: ReplyErrorField.MISSING_REQUEST_FIELDS,
                message: ReplyErrorMessage.MISSING_REQUEST_FIELDS
            }
        });
    }
    if (request_body_fields.size != Object.keys(request.body).length) {
        console.error("[Middleware] Duplicate fields in request body");
        return reply.code(HttpStatusCode.BAD_REQUEST).send(<Reply>{
            status: HttpStatus.BAD_REQUEST,
            statuscode: HttpStatusCode.BAD_REQUEST,
            details: {
                error: ReplyErrorField.DUPLICATE_REQUEST_FIELDS,
                message: ReplyErrorMessage.DUPLICATE_REQUEST_FIELDS
            }
        });
    }

    try {
        if (allowed_fields.size > 0) {
            const sanitized_body: any = sanitize_payload(request.body);
            request.body = sanitized_body;
        }
    } catch (error) {
        console.error("[Middleware] Input sanitization failed:", error);
        return reply.code(HttpStatusCode.UNPROCESSABLE_CONTENT).send(<Reply>{
            status: HttpStatus.UNPROCESSABLE_CONTENT,
            statuscode: HttpStatusCode.UNPROCESSABLE_CONTENT,
            details: {
                error: ReplyErrorField.SANITIZATION_FAILED,
                message: ReplyErrorMessage.SANITIZATION_FAILED
            }
        });
    }
}
export function validate_request_params(request: any, reply: any, route_info: RouteInfo): void {
    const allowed_params = new Set([...general_params, route_info.request!.params]);
    const request_params = new Set(Object.keys(request.params));
    const invalid_params = Array.from(request_params).filter((param) => !allowed_params.has(param));
    if (invalid_params.length > 0) {
        console.error("[Middleware] Invalid request parameters:", invalid_params);
        return reply.code(HttpStatusCode.BAD_REQUEST).send(<Reply>{
            status: HttpStatus.BAD_REQUEST,
            statuscode: HttpStatusCode.BAD_REQUEST,
            details: {
                error: ReplyErrorField.INVALID_REQUEST_PARAMS,
                message: ReplyErrorMessage.INVALID_REQUEST_PARAMS
            }
        });
    }
}
export function validate_request_query(request: any, reply: any, route_info: RouteInfo): void {
    const allowed_query = new Set(route_info.request!.query);
    const request_query = new Set(Object.keys(request.query));
    const invalid_query = Array.from(request_query).filter((query) => !allowed_query.has(query));
    if (invalid_query.length > 0) {
        console.error("[Middleware] Invalid request query parameters:", invalid_query);
        return reply.code(HttpStatusCode.BAD_REQUEST).send(<Reply>{
            status: HttpStatus.BAD_REQUEST,
            statuscode: HttpStatusCode.BAD_REQUEST,
            details: {
                error: ReplyErrorField.INVALID_REQUEST_QUERY,
                message: ReplyErrorMessage.INVALID_REQUEST_QUERY
            }
        });
    }
    if (request_query.size != Object.keys(request.query).length) {
        console.error("[Middleware] Duplicate query parameters in request");
        return reply.code(HttpStatusCode.BAD_REQUEST).send(<Reply>{
            status: HttpStatus.BAD_REQUEST,
            statuscode: HttpStatusCode.BAD_REQUEST,
            details: {
                error: ReplyErrorField.DUPLICATE_REQUEST_QUERY,
                message: ReplyErrorMessage.DUPLICATE_REQUEST_QUERY
            }
        });
    }
}
export function validate_request_reply(request: any, reply: any, route_info: RouteInfo): void {
    const clearance_level = request.user?.clearance_level || 0;
    if (route_info.reply && route_info.reply.data && route_info.reply.data.length > 0) {
        const reply_fields = new Set(route_info.reply.data.find((obj: any) =>
            // Find the schema matching the user's clearance level
            // or return the first schema if clearance level is not required
            (obj.hasOwnProperty('clearance_level') && obj.clearance_level <= clearance_level) ||
            (!obj.hasOwnProperty('clearance_level') && clearance_level >= 0)
        )?.fields || []);
        request.reply_fields = Array.from(reply_fields).join(", ");
    }
}