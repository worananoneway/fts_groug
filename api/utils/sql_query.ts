import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config({ path: `${__dirname}/../config/db.env` });
const db_config = process.env.DB_MODE === "prod" ? {
    host: process.env.DB_HOST_PROD,
    user: process.env.DB_USER_PROD,
    password: process.env.DB_PASSWORD_PROD,
    database: process.env.DB_DATABASE_PROD,
} : {
    host: process.env.DB_HOST_DEV,
    user: process.env.DB_USER_DEV,
    password: process.env.DB_PASSWORD_DEV,
    database: process.env.DB_DATABASE_DEV,
};

const pool = new Pool(db_config);
pool.on("error", (error: Error) => {
    console.error("Unexpected error on idle client", error);
    process.exit(-1);
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
