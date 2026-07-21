import { header_reply_options, item_reply_options } from './model';
import service from './service';
import { Condition } from './type';

import { sanitize_string } from '@/api/utils/input_sanitizer';
import { HttpStatus, HttpStatusCode, Reply } from '@/api/utils/shared_types';
import { reply_result, map_fields } from '@/api/utils/controller_replys';

const module_name = 'Legacy Sales Order';

async function get(request: any, reply: any) {
    try {
        const conditions: Condition = { sql: '', params: [] };

        // prefix = กรองเลขเอกสารตามตัวขึ้นต้น (เช่น JP = ใบสั่งตัด)
        if (request.query.prefix) {
            conditions.params.push(`${sanitize_string(String(request.query.prefix))}%`);
            conditions.sql += ` AND docnum LIKE ? `;
        }
        if (request.query.docnum) {
            conditions.params.push(`%${sanitize_string(String(request.query.docnum))}%`);
            conditions.sql += ` AND docnum LIKE ? `;
        }
        if (request.query.cusnam) {
            conditions.params.push(`%${sanitize_string(String(request.query.cusnam))}%`);
            conditions.sql += ` AND cusnam LIKE ? `;
        }
        if (request.query.type) {
            conditions.params.push(sanitize_string(String(request.query.type)));
            conditions.sql += ` AND type = ? `;
        }
        if (request.query.date_from) {
            conditions.params.push(sanitize_string(String(request.query.date_from)));
            conditions.sql += ` AND docdat >= ? `;
        }
        if (request.query.date_to) {
            conditions.params.push(sanitize_string(String(request.query.date_to)));
            conditions.sql += ` AND docdat <= ? `;
        }

        const limit = Math.min(Number(request.query.limit) || 50, 200);
        const offset = Number(request.query.offset) || 0;

        const results = await service.get_headers(conditions, limit, offset);
        return reply.code(results.statuscode).send(<Reply>
            reply_result(module_name, results.statuscode, null, results?.data, header_reply_options)
        );
    } catch (error) {
        console.error(`[Controller] An error occurred during getting ${module_name}:`, error);
        return reply.code(HttpStatusCode.INTERNAL_SERVER_ERROR).send(<Reply>
            reply_result(module_name, HttpStatusCode.INTERNAL_SERVER_ERROR)
        );
    }
}

async function get_detail(request: any, reply: any) {
    try {
        const doc_id: string = sanitize_string(String(request.params.doc_id));

        const header_result = await service.get_header_by_id(doc_id);
        if (header_result.statuscode !== HttpStatusCode.OK) {
            return reply.code(header_result.statuscode).send(<Reply>
                reply_result(module_name, header_result.statuscode)
            );
        }

        const items_result = await service.get_items_by_doc(doc_id);
        if (items_result.statuscode !== HttpStatusCode.OK) {
            return reply.code(items_result.statuscode).send(<Reply>
                reply_result(module_name, items_result.statuscode)
            );
        }

        const header = map_fields(header_result.data![0], header_reply_options);
        const items = (items_result.data || []).map((row: any) => map_fields(row, item_reply_options));

        return reply.code(HttpStatusCode.OK).send(<Reply>{
            status: HttpStatus.OK,
            statuscode: HttpStatusCode.OK,
            details: {
                ...header,
                items
            }
        });
    } catch (error) {
        console.error(`[Controller] An error occurred during getting ${module_name} detail:`, error);
        return reply.code(HttpStatusCode.INTERNAL_SERVER_ERROR).send(<Reply>
            reply_result(module_name, HttpStatusCode.INTERNAL_SERVER_ERROR)
        );
    }
}

export default {
    get,
    get_detail
};
