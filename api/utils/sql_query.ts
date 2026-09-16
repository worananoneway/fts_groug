import { Pool } from "pg";
import dotenv from "dotenv";

// override: true = ยึดค่าในไฟล์เสมอ ไม่ให้ค่าที่ค้างอยู่ใน process.env มาทับ
dotenv.config({ path: `${__dirname}/../config/db.env`, override: true });

// trim กันค่ามีช่องว่างต่อท้ายในไฟล์ .env (เช่น host มี space แล้วต่อไม่ติด)
const env = (key: string): string | undefined => process.env[key]?.trim();

const prod = env("DB_MODE") === "prod";

// ถ้ามี DATABASE_URL ใน db.env ให้ใช้ตัวนี้ก่อน (คัดลอกจาก Railway ได้ตรง ๆ)
// ไม่มีก็ประกอบจาก DB_HOST/PORT/USER/PASSWORD/DATABASE เหมือนเดิม
const connectionString = env("DATABASE_URL");
const db_config = connectionString
    ? {
        connectionString,
        // Railway/cloud ที่บังคับ TLS แต่ใช้ใบรับรองของตัวเอง
        ssl: /sslmode=require/.test(connectionString) ? { rejectUnauthorized: false } : undefined,
        connectionTimeoutMillis: 8_000,
        idleTimeoutMillis: 30_000,
        max: 5,
    }
    : {
        host: prod ? env("DB_HOST_PROD") : env("DB_HOST_DEV"),
        // ต้องส่ง port ด้วย ไม่งั้น pg จะไปที่ 5432 เสมอ แล้วค้างรอจนหมดเวลา
        port: Number(prod ? env("DB_PORT_PROD") : env("DB_PORT_DEV")) || 5432,
        user: prod ? env("DB_USER_PROD") : env("DB_USER_DEV"),
        // ไม่มีรหัส (เช่น postgres ในเครื่องที่ตั้ง trust) ให้ส่ง undefined ไม่ใช่สตริงว่าง
        password: (prod ? env("DB_PASSWORD_PROD") : env("DB_PASSWORD_DEV")) || undefined,
        database: prod ? env("DB_DATABASE_PROD") : env("DB_DATABASE_DEV"),
        // ต่อไม่ติด/ค้าง ให้ error ออกมาเลยภายใน 8 วิ ดีกว่าให้หน้าเว็บหมุนค้าง
        connectionTimeoutMillis: 8_000,
        idleTimeoutMillis: 30_000,
        max: 5,
    };

const pool = new Pool(db_config);
// อย่า process.exit ที่นี่ — client ใน pool พังหนึ่งตัวไม่ควรทำให้ dev server ตายทั้งตัว
pool.on("error", (error: Error) => {
    console.error("[sql_query] Unexpected error on idle client:", error.message);
});

export default async function sql_query(query: string, params: any[] = []): Promise<any> {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        const result = await client.query(query, params);
        await client.query("COMMIT");
        return result.rows;
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
}
