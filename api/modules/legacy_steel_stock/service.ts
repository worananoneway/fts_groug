import mysql_query from "@/api/utils/mysql_query";
import { HttpStatusCode } from "@/api/utils/shared_types";

const module_name = "legacy_steel_stock";

type Response = { statuscode: HttpStatusCode; error: any; data: any[] | null };

// สต็อกเหล็กจริงจาก Express = ยอดคงเหลือสุทธิ (SUM ของ xtrnqty เข้า-ออก) ต่อรหัสสินค้า
async function get_by_name_prefix(likeClauses: string[]): Promise<Response> {
    const where = likeClauses.map(() => `stkdes LIKE ?`).join(" OR ");
    const sql = `
        SELECT stkcod, stkdes, SUM(xtrnqty) AS balance, MAX(tqucod) AS unit
        FROM stcrd
        WHERE ${where}
        GROUP BY stkcod, stkdes
        HAVING SUM(xtrnqty) > 0
        ORDER BY balance DESC
    `;
    try {
        const rows = await mysql_query(sql, likeClauses);
        return { statuscode: HttpStatusCode.OK, error: null, data: rows };
    } catch (error) {
        console.error(`[Service] An error occurred during getting ${module_name}:`, error);
        return { statuscode: HttpStatusCode.INTERNAL_SERVER_ERROR, error, data: null };
    }
}

// เพลาเหล็กกลม: ชื่อขึ้นต้น "เหล็กเพลา"
function get_round_bars(): Promise<Response> {
    return get_by_name_prefix(["เหล็กเพลา%"]);
}

// เหล็กแผ่น: ชื่อขึ้นต้น PLATE / แผ่นเพลท / เหล็กแผ่น
function get_plates(): Promise<Response> {
    return get_by_name_prefix(["PLATE%", "แผ่นเพลท%", "เหล็กแผ่น%"]);
}

export default { get_round_bars, get_plates };
