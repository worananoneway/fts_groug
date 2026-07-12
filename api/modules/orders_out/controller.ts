import service from './service';
import type { FastifyReply, FastifyRequest } from 'fastify';
import {
    Condition,
    HttpStatus,
    HttpStatusCode,
    Reply,
    ReplyErrorField,
    ReplyErrorMessage
} from '@/api/utils/shared_types';

const order_statuses = new Map([
    ["DRAFT", "Draft"],
    ["REVISED", "Revised"],
    ["PENDING", "Pending"],
    ["IN_PROCESS", "In Process"],
    ["PROCESSING", "In Process"],
    ["COMPLETED", "Completed"],
    ["DONE", "Completed"],
    ["REJECTED", "Rejected"],
    ["CANCELLED", "Cancelled"],
    ["CANCELED", "Cancelled"]
]);

function normalize_status(value: unknown): string | null {
    if (value === null || value === undefined) return null;
    const key = String(value).trim().replace(/\s+/g, "_").toUpperCase();
    return order_statuses.get(key) ?? null;
}

type OrdersRequest = FastifyRequest<{
    Body: {
        diameter?: unknown;
        length?: unknown;
        material_id?: unknown;
        mm_id?: unknown;
        quantity?: unknown;
        remaining?: unknown;
        remaining_quantity?: unknown;
        shape?: unknown;
        shape_type?: unknown;
        status?: unknown;
        thickness?: unknown;
        width?: unknown;
    };
    Params: {
        ord_id?: string;
        odd_id?: string;
    };
    Querystring: {
        customer_id?: string;
    };
}>;

interface OrderRow {
    ord_id: string;
    ord_no: string;
    customer_name_th: string | null;
    ord_date: string | Date | null;
    ord_due_date: string | Date | null;
    ord_status: string;
    ord_total_items: number;
    ord_remark: string | null;
}

interface OrderDetailRow {
    odd_id: string;
    odd_ord_id: string;
    odd_mm_id: string;
    odd_shape_type: string;
    mm_name: string | null;
    odd_required_diameter_mm: number | null;
    odd_required_length_mm: number;
    odd_required_width_mm: number | null;
    odd_required_thickness_mm: number | null;
    odd_quantity: number;
    odd_remaining_quantity: number;
    odd_status: string;
}

interface MaterialMasterRow {
    mm_id: string;
    mm_name: string;
    mm_shape_type: string;
    mm_status: string;
}

interface OrderDetailCreatedRow {
    odd_id: string;
}

interface NormalizedOrderDetailPayload {
    mm_id: string;
    shape_type: "Ms_plate" | "Round_bar";
    length: number;
    width: number | null;
    thickness: number | null;
    diameter: number | null;
    quantity: number;
    remaining_quantity: number;
}

async function get(request: OrdersRequest, reply: FastifyReply) {
    try {
        const conditions: Condition = { sql: '', params: [] };
        if (request.params.ord_id) {
            conditions.params.push(request.params.ord_id);
            conditions.sql += ` AND o.ord_id = $${conditions.params.length} `;
        }
        if (request.query.customer_id) {
            conditions.params.push(request.query.customer_id);
            conditions.sql += ` AND o.ord_cus_id = $${conditions.params.length} `;
        }
        const orders = await service.get_orders(conditions);
        if (orders.statuscode !== HttpStatusCode.OK) {
            return reply.code(HttpStatusCode.INTERNAL_SERVER_ERROR).send(<Reply>{
                status: HttpStatus.INTERNAL_SERVER_ERROR,
                statuscode: HttpStatusCode.INTERNAL_SERVER_ERROR,
                details: {
                    error: ReplyErrorField.INTERNAL_SERVER_ERROR,
                    message: ReplyErrorMessage.INTERNAL_SERVER_ERROR
                }
            });
        }

        const detail_conditions: Condition = { sql: '', params: [] };
        if (request.params.ord_id) {
            detail_conditions.params.push(request.params.ord_id);
            detail_conditions.sql += ` AND d.odd_ord_id = $${detail_conditions.params.length} `;
        }
        const details = await service.get_order_details(detail_conditions);
        if (details.statuscode !== HttpStatusCode.OK) {
            return reply.code(HttpStatusCode.INTERNAL_SERVER_ERROR).send(<Reply>{
                status: HttpStatus.INTERNAL_SERVER_ERROR,
                statuscode: HttpStatusCode.INTERNAL_SERVER_ERROR,
                details: {
                    error: ReplyErrorField.INTERNAL_SERVER_ERROR,
                    message: ReplyErrorMessage.INTERNAL_SERVER_ERROR
                }
            });
        }

        const materials = await service.get_material_masters();
        if (materials.statuscode !== HttpStatusCode.OK) {
            return reply.code(HttpStatusCode.INTERNAL_SERVER_ERROR).send(<Reply>{
                status: HttpStatus.INTERNAL_SERVER_ERROR,
                statuscode: HttpStatusCode.INTERNAL_SERVER_ERROR,
                details: {
                    error: ReplyErrorField.INTERNAL_SERVER_ERROR,
                    message: ReplyErrorMessage.INTERNAL_SERVER_ERROR
                }
            });
        }

        console.log(`[Controller] Successfully retrieved ${orders.data!.length || 0} orders with ${details.data!.length || 0} details.`);
        return reply.code(HttpStatusCode.OK).send(<Reply>{
            status: HttpStatus.OK,
            statuscode: HttpStatusCode.OK,
            details: {
                orders: (orders.data as OrderRow[] | null)?.map((order) => ({
                    id: order.ord_id,
                    no: order.ord_no,
                    customer: order.customer_name_th,
                    date: order.ord_date,
                    due: order.ord_due_date,
                    status: order.ord_status,
                    total_items: order.ord_total_items,
                    remark: order.ord_remark
                })),
                order_details: (details.data as OrderDetailRow[] | null)?.map((detail) => ({
                    id: detail.odd_id,
                    ord_id: detail.odd_ord_id,
                    mm_id: detail.odd_mm_id,
                    shape: detail.odd_shape_type === 'Round_bar' ? 'ROUND' : 'PLATE',
                    material: detail.mm_name,
                    diameter: detail.odd_required_diameter_mm,
                    length: detail.odd_required_length_mm,
                    width: detail.odd_required_width_mm,
                    thickness: detail.odd_required_thickness_mm,
                    qty: detail.odd_quantity,
                    remaining: detail.odd_remaining_quantity,
                    status: detail.odd_status
                })),
                material_masters: (materials.data as MaterialMasterRow[] | null)?.map((material) => ({
                    id: material.mm_id,
                    name: material.mm_name,
                    shape: material.mm_shape_type === 'Round_bar' ? 'ROUND' : 'PLATE',
                    status: material.mm_status
                }))
            }
        });
    } catch (error) {
        console.error("[Controller] An error occurred during getting orders:", error);
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

async function create_order_detail(request: OrdersRequest, reply: FastifyReply) {
    try {
        if (!request.params.ord_id) {
            return send_bad_request(reply);
        }

        const payload = normalize_order_detail_payload(request.body);
        if (!payload) {
            return send_bad_request(reply);
        }

        const result = await service.create_order_detail({
            ord_id: request.params.ord_id,
            ...payload
        });
        if (result.statuscode !== HttpStatusCode.CREATED) {
            return send_internal_error(reply);
        }

        const created = (result.data as OrderDetailCreatedRow[] | null)?.[0];
        return reply.code(HttpStatusCode.CREATED).send(<Reply>{
            status: HttpStatus.CREATED,
            statuscode: HttpStatusCode.CREATED,
            details: {
                id: created?.odd_id
            }
        });
    } catch (error) {
        console.error("[Controller] An error occurred during creating order detail:", error);
        return send_internal_error(reply);
    }
}

async function update_order_detail(request: OrdersRequest, reply: FastifyReply) {
    try {
        if (!request.params.odd_id) {
            return send_bad_request(reply);
        }

        const payload = normalize_order_detail_payload(request.body);
        if (!payload) {
            return send_bad_request(reply);
        }

        const result = await service.update_order_detail(request.params.odd_id, payload);
        if (result.statuscode === HttpStatusCode.NOT_FOUND) {
            return reply.code(HttpStatusCode.NOT_FOUND).send(<Reply>{
                status: HttpStatus.NOT_FOUND,
                statuscode: HttpStatusCode.NOT_FOUND,
                details: {
                    error: ReplyErrorField.NOT_FOUND,
                    message: ReplyErrorMessage.NOT_FOUND
                }
            });
        }
        if (result.statuscode !== HttpStatusCode.NO_CONTENT) {
            return send_internal_error(reply);
        }

        return reply.code(HttpStatusCode.NO_CONTENT).send();
    } catch (error) {
        console.error("[Controller] An error occurred during updating order detail:", error);
        return send_internal_error(reply);
    }
}

async function update_order_status(request: OrdersRequest, reply: FastifyReply) {
    try {
        const status = normalize_status(request.body?.status);
        if (!request.params.ord_id || !status) {
            return reply.code(HttpStatusCode.BAD_REQUEST).send(<Reply>{
                status: HttpStatus.BAD_REQUEST,
                statuscode: HttpStatusCode.BAD_REQUEST,
                details: {
                    error: ReplyErrorField.VALIDATION_ERROR,
                    message: ReplyErrorMessage.VALIDATION_ERROR
                }
            });
        }

        const result = await service.update_order_status(request.params.ord_id, status);
        if (result.statuscode === HttpStatusCode.NOT_FOUND) {
            return reply.code(HttpStatusCode.NOT_FOUND).send(<Reply>{
                status: HttpStatus.NOT_FOUND,
                statuscode: HttpStatusCode.NOT_FOUND,
                details: {
                    error: ReplyErrorField.NOT_FOUND,
                    message: ReplyErrorMessage.NOT_FOUND
                }
            });
        }
        if (result.statuscode !== HttpStatusCode.NO_CONTENT) {
            return reply.code(HttpStatusCode.INTERNAL_SERVER_ERROR).send(<Reply>{
                status: HttpStatus.INTERNAL_SERVER_ERROR,
                statuscode: HttpStatusCode.INTERNAL_SERVER_ERROR,
                details: {
                    error: ReplyErrorField.INTERNAL_SERVER_ERROR,
                    message: ReplyErrorMessage.INTERNAL_SERVER_ERROR
                }
            });
        }

        return reply.code(HttpStatusCode.NO_CONTENT).send();
    } catch (error) {
        console.error("[Controller] An error occurred during updating order status:", error);
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

async function update_order_detail_status(request: OrdersRequest, reply: FastifyReply) {
    try {
        const status = normalize_status(request.body?.status);
        if (!request.params.odd_id || !status) {
            return reply.code(HttpStatusCode.BAD_REQUEST).send(<Reply>{
                status: HttpStatus.BAD_REQUEST,
                statuscode: HttpStatusCode.BAD_REQUEST,
                details: {
                    error: ReplyErrorField.VALIDATION_ERROR,
                    message: ReplyErrorMessage.VALIDATION_ERROR
                }
            });
        }

        const result = await service.update_order_detail_status(request.params.odd_id, status);
        if (result.statuscode === HttpStatusCode.NOT_FOUND) {
            return reply.code(HttpStatusCode.NOT_FOUND).send(<Reply>{
                status: HttpStatus.NOT_FOUND,
                statuscode: HttpStatusCode.NOT_FOUND,
                details: {
                    error: ReplyErrorField.NOT_FOUND,
                    message: ReplyErrorMessage.NOT_FOUND
                }
            });
        }
        if (result.statuscode !== HttpStatusCode.NO_CONTENT) {
            return reply.code(HttpStatusCode.INTERNAL_SERVER_ERROR).send(<Reply>{
                status: HttpStatus.INTERNAL_SERVER_ERROR,
                statuscode: HttpStatusCode.INTERNAL_SERVER_ERROR,
                details: {
                    error: ReplyErrorField.INTERNAL_SERVER_ERROR,
                    message: ReplyErrorMessage.INTERNAL_SERVER_ERROR
                }
            });
        }

        return reply.code(HttpStatusCode.NO_CONTENT).send();
    } catch (error) {
        console.error("[Controller] An error occurred during updating order detail status:", error);
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

function normalize_order_detail_payload(body: OrdersRequest["body"]): NormalizedOrderDetailPayload | null {
    const mm_id = string_value(body.mm_id ?? body.material_id);
    const shape = normalize_shape(body.shape ?? body.shape_type);
    const length = positive_integer(body.length);
    const quantity = positive_integer(body.quantity);
    const remaining_quantity = non_negative_integer(body.remaining_quantity ?? body.remaining ?? quantity);

    if (!mm_id || !shape || !length || !quantity || remaining_quantity === null) {
        return null;
    }

    const width = shape === "Ms_plate" ? positive_integer(body.width) : null;
    const thickness = shape === "Ms_plate" ? positive_integer(body.thickness) : null;
    const diameter = shape === "Round_bar" ? positive_integer(body.diameter) : null;

    if (shape === "Ms_plate" && (!width || !thickness)) return null;
    if (shape === "Round_bar" && !diameter) return null;

    return {
        mm_id,
        shape_type: shape,
        length,
        width,
        thickness,
        diameter,
        quantity,
        remaining_quantity
    };
}

function normalize_shape(value: unknown): "Ms_plate" | "Round_bar" | null {
    const normalized = string_value(value).trim().replace(/\s+/g, "_").toUpperCase();
    if (normalized === "PLATE" || normalized === "MS_PLATE") return "Ms_plate";
    if (normalized === "ROUND" || normalized === "ROUND_BAR") return "Round_bar";
    return null;
}

function positive_integer(value: unknown): number | null {
    const numeric = Math.floor(Number(value));
    return Number.isFinite(numeric) && numeric > 0 ? numeric : null;
}

function non_negative_integer(value: unknown): number | null {
    const numeric = Math.floor(Number(value));
    return Number.isFinite(numeric) && numeric >= 0 ? numeric : null;
}

function string_value(value: unknown): string {
    if (value === null || value === undefined || typeof value === "object") return "";
    return String(value).trim();
}

function send_bad_request(reply: FastifyReply) {
    return reply.code(HttpStatusCode.BAD_REQUEST).send(<Reply>{
        status: HttpStatus.BAD_REQUEST,
        statuscode: HttpStatusCode.BAD_REQUEST,
        details: {
            error: ReplyErrorField.VALIDATION_ERROR,
            message: ReplyErrorMessage.VALIDATION_ERROR
        }
    });
}

function send_internal_error(reply: FastifyReply) {
    return reply.code(HttpStatusCode.INTERNAL_SERVER_ERROR).send(<Reply>{
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        statuscode: HttpStatusCode.INTERNAL_SERVER_ERROR,
        details: {
            error: ReplyErrorField.INTERNAL_SERVER_ERROR,
            message: ReplyErrorMessage.INTERNAL_SERVER_ERROR
        }
    });
}

const ordersController = {
    get,
    create_order_detail,
    update_order_detail,
    update_order_status,
    update_order_detail_status
};

export default ordersController;
