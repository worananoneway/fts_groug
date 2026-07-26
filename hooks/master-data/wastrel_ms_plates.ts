import api_handler from "@/hooks/api_handler";

// endpoint จริงตาม server.ts: /api/v1/wastrel-ms-plates (ไม่มี route ลบ)
const BASE_URL = "/wastrel-ms-plates";

async function create(data: Record<string, any>) {
    try {
        const response = await api_handler.post(BASE_URL, undefined, data);
        return response.data;
    } catch (error) {
        console.error("[Hook] An error occurred while creating wastrel_ms_plate:", error);
        throw error;
    }
}

async function get(query?: Record<string, any>) {
    try {
        const response = await api_handler.get(BASE_URL, undefined, undefined, query);
        return response.data;
    } catch (error) {
        console.error("[Hook] An error occurred while fetching wastrel_ms_plates:", error);
        throw error;
    }
}

async function getById(wmsp_id: string) {
    try {
        const response = await api_handler.get(`${BASE_URL}/${wmsp_id}`);
        return response.data;
    } catch (error) {
        console.error("[Hook] An error occurred while fetching wastrel_ms_plate by id:", error);
        throw error;
    }
}

async function updated(wmsp_id: string, data: Record<string, any>) {
    try {
        const response = await api_handler.put(`${BASE_URL}/${wmsp_id}`, undefined, undefined, data);
        return response.data;
    } catch (error) {
        console.error("[Hook] An error occurred while updating wastrel_ms_plate:", error);
        throw error;
    }
}

async function updateStatus(wmsp_id: string, data: Record<string, any>) {
    try {
        const response = await api_handler.patch(`${BASE_URL}/status/${wmsp_id}`, undefined, undefined, data);
        return response.data;
    } catch (error) {
        console.error("[Hook] An error occurred while updating wastrel_ms_plate status:", error);
        throw error;
    }
}

async function updateLocation(ids: string[], location: string | null) {
    try {
        const response = await api_handler.patch(`${BASE_URL}/location`, undefined, undefined, { ids, location });
        return response.data;
    } catch (error) {
        console.error("[Hook] An error occurred while updating wastrel_ms_plate location:", error);
        throw error;
    }
}

export default function useWastrelMsPlatesApi() {
    return { create, get, getById, updated, updateStatus, updateLocation };
}
