import mysql, { Pool, RowDataPacket } from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config({ path: `${__dirname}/../config/legacy_db.env` });

// trim กันค่ามีช่องว่างต่อท้ายในไฟล์ .env (เช่น host มี space แล้วต่อไม่ติด)
const env = (key: string): string | undefined => process.env[key]?.trim();

const legacy_db_config = {
    host: env("LEGACY_DB_HOST"),
    port: Number(env("LEGACY_DB_PORT")) || 3306,
    user: env("LEGACY_DB_USER"),
    password: env("LEGACY_DB_PASSWORD"),
    database: env("LEGACY_DB_DATABASE"),
    connectTimeout: 8000,
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
