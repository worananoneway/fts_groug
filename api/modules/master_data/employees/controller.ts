import { reply_options } from './model';
import { reply_result } from '@/api/utils/controller_replys';
import { emp_authentication } from '@/api/utils/controller_auth';
import service from './service';
import { ErrorField, ErrorMessage, ValidationError } from './type';
import { get_enum_keys, is_enum_key } from '@/api/utils/enum_checker';
import {
    Condition,
    HttpStatusCode,
    Reply,
    Status,
} from '@/api/utils/shared_types';

const status_enum = get_enum_keys(Status);
const module_name = 'Employees';

// อ่านอย่างเดียว ใช้สำหรับ dropdown เลือกพนักงาน (ผู้รับ/ผู้อนุมัติ PO ฯลฯ) — ยังไม่มี create/update
async function get(request: any, reply: any) {
    try {
        const user = request?.user;
        emp_authentication(module_name, user, reply);

        const conditions: Condition = { sql: '', params: [] };
        const invalid_fields: ValidationError[] = [];

        if (request.params.emp_id) {
            conditions.params.push(request.params.emp_id);
            conditions.sql += ` AND emp_id = $${conditions.params.length} `;
        }
        if (request.query.status && is_enum_key(status_enum, request.query.status)) {
            conditions.params.push(Status[request.query.status.trim().replace(/\s+/g, '_').toUpperCase() as keyof typeof Status]);
            conditions.sql += ` AND emp_status = $${conditions.params.length} `;
        } else if (request.query.status) {
            invalid_fields.push({
                field: ErrorField.STATUS,
                message: ErrorMessage.STATUS_INVALID
            });
        }
        if (invalid_fields.length > 0) {
            return reply.code(HttpStatusCode.UNPROCESSABLE_CONTENT).send(<Reply>
                reply_result(module_name, HttpStatusCode.UNPROCESSABLE_CONTENT, invalid_fields)
            );
        }

        const results = await service.get(conditions);
        return reply.code(results.statuscode).send(<Reply>
            reply_result(module_name, results.statuscode, null, results.data, reply_options)
        );
    } catch (error) {
        console.error(`[Controller] An error occurred during getting employees:`, error);
        return reply.code(HttpStatusCode.INTERNAL_SERVER_ERROR).send(<Reply>
            reply_result(module_name, HttpStatusCode.INTERNAL_SERVER_ERROR)
        );
    }
}

export default {
    get
};
