/**
 * Client-side API layer for the ms_plates backend module
 * (Fastify route: /api/:version/accounting/ms-plates)
 */

export type MsPlate = {
    id: string;
    mm_id: string | null;
    code: string;
    length: number;
    width: number;
    thickness: number;
    quantity: number;
    available_quantity: number;
    loc_id: string | null;
    location_type: string | null;
    location: string | null;
    status: string;
    received_date: string | null;
    remark: string | null;
    created_at: string;
    updated_at: string;
};

export type CreateMsPlateInput = {
    code: string;
    length: number;
    width: number;
    thickness: number;
    quantity: number;
    available_quantity: number;
    remark: string;
};

export const SCRAP_CODE_PREFIX = "SCRAP-";

const API_BASE = "/api/v1/accounting/ms-plates";

const HEADERS = {
    "accept-language": "th-TH",
    "content-type": "application/json",
};

async function parse_json(res: Response): Promise<any | null> {
    try {
        return await res.json();
    } catch {
        return null;
    }
}

function error_message(json: any, res: Response): string {
    return (
        json?.details?.message ??
        `เรียกหลังบ้านไม่สำเร็จ (HTTP ${res.status})`
    );
}

/** pg returns NUMERIC columns as strings — normalize once here */
function to_ms_plate(raw: any): MsPlate {
    return {
        ...raw,
        length: Number(raw.length),
        width: Number(raw.width),
        thickness: Number(raw.thickness),
        quantity: Number(raw.quantity),
        available_quantity: Number(raw.available_quantity),
    };
}

export async function list_ms_plates(): Promise<MsPlate[]> {
    const res = await fetch(API_BASE, { headers: HEADERS });
    // backend replies NOT_FOUND when the table has no rows — treat as empty
    if (res.status === 404) return [];
    const json = await parse_json(res);
    if (!res.ok) throw new Error(error_message(json, res));
    return (json?.details?.ms_plates ?? []).map(to_ms_plate);
}

export async function create_ms_plate(input: CreateMsPlateInput): Promise<void> {
    const now = new Date().toISOString();
    const res = await fetch(API_BASE, {
        method: "POST",
        headers: HEADERS,
        body: JSON.stringify({
            mm_id: null,
            code: input.code,
            length: input.length,
            width: input.width,
            thickness: input.thickness,
            quantity: input.quantity,
            available_quantity: input.available_quantity,
            loc_id: null,
            status: "AVAILABLE",
            received_date: now,
            remark: input.remark,
            created_at: now,
            updated_at: now,
        }),
    });
    if (!res.ok) {
        const json = await parse_json(res);
        throw new Error(error_message(json, res));
    }
}

export async function delete_ms_plate(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: HEADERS,
    });
    if (!res.ok) {
        const json = await parse_json(res);
        throw new Error(error_message(json, res));
    }
}
