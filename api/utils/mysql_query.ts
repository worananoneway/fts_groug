import mysql, { Pool, PoolConnection, RowDataPacket } from "mysql2/promise";
import dotenv from "dotenv";

// override: true = ยึดค่าในไฟล์เสมอ ไม่ให้ค่าที่ค้างอยู่ใน process.env มาทับ
dotenv.config({ path: `${__dirname}/../config/legacy_db.env`, override: true });

// trim กันค่ามีช่องว่างต่อท้ายในไฟล์ .env (เช่น host มี space แล้วต่อไม่ติด)
const env = (key: string): string | undefined => process.env[key]?.trim();

// รองรับหลายโฮสต์: ZeroTier ก่อน แล้วค่อย LAN ในออฟฟิศ (คั่นด้วย comma ใน LEGACY_DB_HOSTS)
// ถ้าโฮสต์แรกต่อไม่ติด จะสลับไปตัวถัดไปให้เอง แล้วจำไว้ใช้ต่อ
const hosts = (env("LEGACY_DB_HOSTS") || env("LEGACY_DB_HOST") || "")
    .split(",")
    .map((host) => host.trim())
    .filter(Boolean);

const base_config = {
    port: Number(env("LEGACY_DB_PORT")) || 3306,
    user: env("LEGACY_DB_USER"),
    password: env("LEGACY_DB_PASSWORD"),
    database: env("LEGACY_DB_DATABASE"),
    // ต่อไม่ติดให้รู้ผลเร็ว ๆ ดีกว่าให้หน้าเว็บค้าง
    connectTimeout: 5000,
    charset: "utf8mb4",
    // คืนค่า DATE/TIMESTAMP เป็น string ตรง ๆ (เช่น "2026-07-20") ป้องกันวันเพี้ยนจาก timezone
    dateStrings: true,
    waitForConnections: true,
    connectionLimit: 5,
    queueLimit: 0,
    // เน็ตหลุด (ZeroTier/VPN) แล้วกลับมา — keepalive ช่วยให้ socket ที่ตายถูกทิ้งเร็วขึ้น
    enableKeepAlive: true,
    keepAliveInitialDelay: 10_000,
};

let active_host_index = 0;
let pool: Pool = mysql.createPool({ ...base_config, host: hosts[0] });

// error ที่แปลว่า "ต่อไม่ถึงเครื่อง" (คนละเรื่องกับ SQL ผิด) — พวกนี้ค่อยลองโฮสต์อื่น
const connection_error_codes = new Set([
    "ETIMEDOUT",
    "ECONNREFUSED",
    "ECONNRESET",
    "EHOSTUNREACH",
    "ENETUNREACH",
    "EPIPE",
    "PROTOCOL_CONNECTION_LOST",
    "POOL_CLOSED",
]);

function is_connection_error(error: unknown): boolean {
    const code = (error as { code?: string })?.code;
    return Boolean(code && connection_error_codes.has(code));
}

function switch_host() {
    if (hosts.length > 1) {
        active_host_index = (active_host_index + 1) % hosts.length;
    }
    const old_pool = pool;
    pool = mysql.createPool({ ...base_config, host: hosts[active_host_index] });
    void old_pool.end().catch(() => undefined);
    console.warn(`[mysql_query] สลับไปใช้โฮสต์คลังเดิม: ${hosts[active_host_index]}`);
}

async function with_connection<T>(fn: (connection: PoolConnection) => Promise<T>): Promise<T> {
    let last_error: unknown = null;
    // ลองได้เท่าจำนวนโฮสต์ +1 (เผื่อ socket ใน pool ตายค้างหลังเน็ตหลุด)
    for (let attempt = 0; attempt <= hosts.length; attempt += 1) {
        let connection: PoolConnection | null = null;
        try {
            connection = await pool.getConnection();
            return await fn(connection);
        } catch (error) {
            last_error = error;
            if (!is_connection_error(error)) throw error;
            switch_host();
        } finally {
            connection?.release();
        }
    }
    const code = (last_error as { code?: string })?.code ?? "UNKNOWN";
    throw new Error(
        `ต่อฐานข้อมูลคลังเดิม (Express) ไม่ได้ [${code}] — ลองแล้วที่ ${hosts.join(", ")}`,
    );
}

export default async function mysql_query(query: string, params: any[] = []): Promise<any> {
    return with_connection(async (connection) => {
        const [rows] = await connection.query<RowDataPacket[]>(query, params);
        return rows;
    });
}
