import mysql_query from "@/api/utils/mysql_query";
import { Condition } from "./type";
import { HttpStatusCode } from "@/api/utils/shared_types";

const module_name = 'legacy_sales_orders';

type Response = {
    statuscode: HttpStatusCode;
    error: any;
    data: any[] | null;
};

// ใบสั่งตัด (JP) เก็บ cusnam เป็นเลขอ้างอิง SI (เช่น "SI2607245-ส0038")
// ชื่อลูกค้าจริงอยู่ในใบ SI ต้นทาง — resolve ด้วย subquery ตามเลข SI ก่อนเครื่องหมาย "-"
const CUSTOMER_SUBQUERY = `
    (SELECT s.cusnam FROM sthead s
     WHERE s.docnum = SUBSTRING_INDEX(h.cusnam, '-', 1)
       AND s.cusnam NOT LIKE 'SI%'
     LIMIT 1) AS resolved_customer
`;

async function get_headers(conditions: Condition, limit: number, offset: number): Promise<Response> {
    const sql = `
        SELECT h.docloc, h.docnum, h.loccod, h.areaid, h.people, h.docdat,
               h.emp_id, h.remark, h.type, h.cusnam,
               ${CUSTOMER_SUBQUERY}
        FROM sthead h
        WHERE 1=1 ${conditions.sql}
        ORDER BY h.docdat DESC
        LIMIT ? OFFSET ?
    `;
    try {
        const result = await mysql_query(sql, [...conditions.params, limit, offset]);
        return {
            statuscode: HttpStatusCode.OK,
            error: null,
            data: result
        };
    } catch (error) {
        console.error(`[Service] An error occurred during getting ${module_name}:`, error);
        return {
            statuscode: HttpStatusCode.INTERNAL_SERVER_ERROR,
            error: error,
            data: null
        };
    }
}

async function get_header_by_id(docloc: string): Promise<Response> {
    const sql = `
        SELECT h.docloc, h.docnum, h.loccod, h.areaid, h.people, h.docdat,
               h.emp_id, h.remark, h.type, h.cusnam,
               ${CUSTOMER_SUBQUERY}
        FROM sthead h
        WHERE h.docloc = ?
    `;
    try {
        const result = await mysql_query(sql, [docloc]);
        if (result.length === 0) {
            return {
                statuscode: HttpStatusCode.NOT_FOUND,
                error: `${module_name} not found.`,
                data: null
            };
        }
        return {
            statuscode: HttpStatusCode.OK,
            error: null,
            data: result
        };
    } catch (error) {
        console.error(`[Service] An error occurred during getting ${module_name} by id:`, error);
        return {
            statuscode: HttpStatusCode.INTERNAL_SERVER_ERROR,
            error: error,
            data: null
        };
    }
}

async function get_items_by_doc(docloc: string): Promise<Response> {
    const sql = `
        SELECT autorun, docloc, docnum, stkcod, stkdes, trnqty, tqucod, tfactor,
               xtrnqty, pstkcod, youref, kg, xkg, lot, docdat, doctim
        FROM stcrd
        WHERE docloc = ?
        ORDER BY autorun ASC
    `;
    try {
        const result = await mysql_query(sql, [docloc]);
        return {
            statuscode: HttpStatusCode.OK,
            error: null,
            data: result
        };
    } catch (error) {
        console.error(`[Service] An error occurred during getting ${module_name} items:`, error);
        return {
            statuscode: HttpStatusCode.INTERNAL_SERVER_ERROR,
            error: error,
            data: null
        };
    }
}

export default {
    get_headers,
    get_header_by_id,
    get_items_by_doc
};
