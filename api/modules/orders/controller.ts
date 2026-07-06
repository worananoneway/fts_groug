import service from './service';
import {
    Condition,
    HttpStatus,
    HttpStatusCode,
    Reply,
    ReplyErrorField,
    ReplyErrorMessage
} from '@/api/utils/shared_types';

const module_name = 'Orders';

async function get(request: any, reply: any) {
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

        console.log(`[Controller] Successfully retrieved ${orders.data!.length || 0} orders with ${details.data!.length || 0} details.`);
        return reply.code(HttpStatusCode.OK).send(<Reply>{
            status: HttpStatus.OK,
            statuscode: HttpStatusCode.OK,
            details: {
                orders: orders.data?.map((order: any) => ({
                    id: order.ord_id,
                    no: order.ord_no,
                    customer: order.customer_name_th,
                    date: order.ord_date,
                    due: order.ord_due_date,
                    status: order.ord_status,
                    total_items: order.ord_total_items,
                    remark: order.ord_remark
                })),
                order_details: details.data?.map((detail: any) => ({
                    id: detail.odd_id,
                    ord_id: detail.odd_ord_id,
                    shape: detail.odd_shape_type === 'Round_bar' ? 'ROUND' : 'PLATE',
                    material: detail.mm_name,
                    diameter: detail.odd_required_diameter_mm,
                    length: detail.odd_required_length_mm,
                    width: detail.odd_required_width_mm,
                    thickness: detail.odd_required_thickness_mm,
                    qty: detail.odd_quantity,
                    remaining: detail.odd_remaining_quantity,
                    status: detail.odd_status
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

export default {
    get
};
