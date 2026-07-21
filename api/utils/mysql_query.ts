import mysql, { Pool, RowDataPacket } from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config({ path: `${__dirname}/../config/legacy_db.env` });

const legacy_db_config = {
    host: process.env.LEGACY_DB_HOST,
    port: Number(process.env.LEGACY_DB_PORT) || 3306,
    user: process.env.LEGACY_DB_USER,
    password: process.env.LEGACY_DB_PASSWORD,
    database: process.env.LEGACY_DB_DATABASE,
    charset: "utf8mb4",
    // คืนค่า DATE/TIMESTAMP เป็น string ตรง ๆ (เช่น "2026-07-20") ป้องกันวันเพี้ยนจาก timezone
    dateStrings: true,
    waitForConnections: true,
    connectionLimit: 5,
    queueLimit: 0
};

const pool: Pool = mysql.createPool(legacy_db_config);

/**
 * Read-only query helper for the legacy ftsgroupstore MySQL database.
 * The connected user (fts_web_reader) only has SELECT privileges, so this
 * should only ever be used for reads.
 */
export default async function mysql_query(query: string, params: any[] = []): Promise<any> {
    const connection = await pool.getConnection();
    try {
        const [rows] = await connection.query<RowDataPacket[]>(query, params);
        return rows;
    } finally {
        connection.release();
    }
}
