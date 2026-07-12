import {
    HttpStatus,
    HttpStatusCode,
    ReplyErrorField,
    ReplyErrorMessage,
    ReplySuccessMessage,
    ValidationError
} from "@/api/utils/shared_types";

type ReplySource = string | readonly string[];

type ValidationErrorInput = {
    field: unknown;
    message: unknown;
};

type ReplyFromRule = {
    $from: ReplySource;
    $default?: unknown;
};

type ReplyJoinRule = {
    $join: readonly string[];
    $separator?: string;
    $default?: unknown;
};

type ReplyLocaleRule = {
    $locale: {
        th: string | ReplyJoinRule;
        en: string | ReplyJoinRule;
    };
    $default?: unknown;
};

type NonNullish<T> = Exclude<T, null | undefined>;

export type ReplyFormatRule<T> =
    NonNullish<T> extends readonly (infer Item)[]
        ? {
            $from: ReplySource;
            $each: ReplyFormatFields<NonNullish<Item> & object>;
            $default?: unknown;
        }
        : NonNullish<T> extends object
            ? {
                $fields: ReplyFormatFields<NonNullish<T>>;
                $from?: ReplySource;
                $nullableBy?: ReplySource;
            }
            : string | ReplyFromRule | ReplyJoinRule | ReplyLocaleRule;

export type ReplyFormatFields<T extends object> = {
    [K in keyof T]-?: ReplyFormatRule<T[K]>;
};

export interface ReplyFormat<T extends object = Record<string, unknown>> {
    fields: ReplyFormatFields<T>;
    language?: string;
}

type RuntimeReplyFormatRule =
    | string
    | ReplyFromRule
    | ReplyJoinRule
    | ReplyLocaleRule
    | {
        $fields: Record<string, RuntimeReplyFormatRule>;
        $from?: ReplySource;
        $nullableBy?: ReplySource;
    }
    | {
        $from: ReplySource;
        $each: Record<string, RuntimeReplyFormatRule>;
        $default?: unknown;
    };

export function map_fields(
    row: unknown,
    format: ReplyFormat<object>
): Record<string, unknown> {
    const source = typeof row === 'object' && row !== null && !Array.isArray(row)
        ? row as Record<string, unknown>
        : {};
    const mapped: Record<string, unknown> = {};
    const language = format.language?.toLowerCase().startsWith('th') ? 'th' : 'en';
    const fields = format.fields as Record<string, RuntimeReplyFormatRule>;

    for (const [reply_field, rule] of Object.entries(fields)) {
        let value: unknown;
        let resolved = false;

        if (typeof rule === 'string') {
            if (Object.prototype.hasOwnProperty.call(source, rule) && source[rule] !== undefined) {
                value = source[rule];
                resolved = true;
            }
        } else if (rule && typeof rule === 'object') {
            if ('$each' in rule && '$from' in rule) {
                const source_fields = Array.isArray(rule.$from) ? rule.$from : [rule.$from];
                let items: unknown;
                for (const source_field of source_fields) {
                    if (Object.prototype.hasOwnProperty.call(source, source_field) && source[source_field] !== undefined) {
                        items = source[source_field];
                        break;
                    }
                }
                if (Array.isArray(items)) {
                    value = items.map(item => map_fields(item, {
                        fields: rule.$each,
                        language: format.language
                    }));
                } else {
                    value = '$default' in rule ? rule.$default : [];
                }
                resolved = true;
            } else if ('$fields' in rule) {
                if ('$nullableBy' in rule && rule.$nullableBy !== undefined) {
                    const nullable_fields = Array.isArray(rule.$nullableBy)
                        ? rule.$nullableBy
                        : [rule.$nullableBy];
                    let identifier: unknown;
                    for (const nullable_field of nullable_fields) {
                        if (
                            Object.prototype.hasOwnProperty.call(source, nullable_field)
                            && source[nullable_field] !== undefined
                        ) {
                            identifier = source[nullable_field];
                            break;
                        }
                    }
                    if (identifier === null || identifier === undefined) {
                        value = null;
                        resolved = true;
                    }
                }

                if (!resolved) {
                    let nested_source: unknown = source;
                    if ('$from' in rule && rule.$from !== undefined) {
                        const source_fields = Array.isArray(rule.$from) ? rule.$from : [rule.$from];
                        nested_source = undefined;
                        for (const source_field of source_fields) {
                            if (
                                Object.prototype.hasOwnProperty.call(source, source_field)
                                && source[source_field] !== undefined
                            ) {
                                nested_source = source[source_field];
                                break;
                            }
                        }
                    }
                    value = map_fields(nested_source, {
                        fields: rule.$fields,
                        language: format.language
                    });
                    resolved = true;
                }
            } else if ('$locale' in rule) {
                const localized_rule = rule.$locale[language];
                if (typeof localized_rule === 'string') {
                    if (
                        Object.prototype.hasOwnProperty.call(source, localized_rule)
                        && source[localized_rule] !== undefined
                    ) {
                        value = source[localized_rule];
                        resolved = true;
                    }
                } else {
                    const parts: string[] = [];
                    for (const source_field of localized_rule.$join) {
                        const part = source[source_field];
                        if (part !== null && part !== undefined && String(part).trim() !== '') {
                            parts.push(String(part).trim());
                        }
                    }
                    if (parts.length > 0) {
                        value = parts.join(localized_rule.$separator ?? ' ');
                        resolved = true;
                    } else if ('$default' in localized_rule) {
                        value = localized_rule.$default;
                        resolved = true;
                    }
                }
            } else if ('$join' in rule) {
                const parts: string[] = [];
                for (const source_field of rule.$join) {
                    const part = source[source_field];
                    if (part !== null && part !== undefined && String(part).trim() !== '') {
                        parts.push(String(part).trim());
                    }
                }
                if (parts.length > 0) {
                    value = parts.join(rule.$separator ?? ' ');
                    resolved = true;
                }
            } else if ('$from' in rule) {
                const source_fields = Array.isArray(rule.$from) ? rule.$from : [rule.$from];
                for (const source_field of source_fields) {
                    if (Object.prototype.hasOwnProperty.call(source, source_field) && source[source_field] !== undefined) {
                        value = source[source_field];
                        resolved = true;
                        break;
                    }
                }
            }

            if (!resolved && '$default' in rule) {
                value = rule.$default;
                resolved = true;
            }
        }

        mapped[reply_field] = resolved ? value : null;
    }

    return mapped;
}


export function reply_result(
    module_name: string,
    statuscode: HttpStatusCode,
    missing_fields: ValidationErrorInput[] | string[] | null = null,
    data: any = {},
    format: unknown = null
){

    switch (statuscode) {
        case HttpStatusCode.OK: {
            console.log(`[Controller] ${module_name} get successful with data`);
            const rows = Array.isArray(data) ? data : [];
            const reply_format = format
                && typeof format === 'object'
                && 'fields' in format
                && typeof format.fields === 'object'
                && format.fields !== null
                ? format as ReplyFormat<object>
                : null;
            return {
                status: HttpStatus.OK,
                statuscode: HttpStatusCode.OK,
                details: reply_format
                    ? rows.map(row => map_fields(row, reply_format))
                    : rows
            }
        }
        case HttpStatusCode.CREATED: {
            const row = Array.isArray(data) ? data[0] : undefined;
            const reply_format = format
                && typeof format === 'object'
                && 'fields' in format
                && typeof format.fields === 'object'
                && format.fields !== null
                ? format as ReplyFormat<object>
                : null;
            const mapped = row !== undefined && reply_format
                ? map_fields(row, reply_format)
                : typeof row === 'object' && row !== null && !Array.isArray(row)
                    ? row as Record<string, unknown>
                    : {};
            const message = module_name.concat(' ', ReplySuccessMessage.CREATED);
            if (mapped.id !== undefined && mapped.id !== null) {
                console.log(`[Controller] ${module_name} created successfully with ID:`, mapped.id);
            } else {
                console.log(`[Controller] ${module_name} created successfully.`);
            }
            return {
                status: HttpStatus.CREATED,
                statuscode: HttpStatusCode.CREATED,
                details: {
                    ...mapped,
                    message
                }
            }
        }
        case HttpStatusCode.ACCEPTED: {
            if (data.id !== undefined) {
                console.log(`[Controller] ${module_name} request accepted with ID:`, data.id);
            } else {
                console.log(`[Controller] ${module_name} request accepted.`);
            }
            return {
                status: HttpStatus.ACCEPTED,
                statuscode: HttpStatusCode.ACCEPTED,
            }
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
                        if (typeof field !== 'string') {
                            return field;
                        }
                        const message = ReplyErrorMessage[field.toUpperCase() + '_REQUIRED' as keyof typeof ReplyErrorMessage];
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
                        if (typeof field !== 'string') {
                            return field;
                        }
                        const message = ReplyErrorMessage[field.toUpperCase() + '_INVALID' as keyof typeof ReplyErrorMessage];
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
                    message: ReplyErrorMessage.VALIDATION_ERROR,
                    errors: missing_fields?.map(field => {
                        if (typeof field !== 'string') {
                            return field;
                        }
                        const message = ReplyErrorMessage[field.toUpperCase() + '_INVALID' as keyof typeof ReplyErrorMessage];
                        return {
                            field: field.toUpperCase() as ValidationError['field'],
                            message: message as ValidationError['message']
                        };
                    })
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
