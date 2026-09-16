import api_handler from "@/hooks/api_handler";

// endpoint จริงตาม server.ts: /api/v1/wastrel-steel-round-bars (ไม่มี route ลบ)
const BASE_URL = "/wastrel-steel-round-bars";

async function create(data: Record<string, any>) {
    try {
        const response = await api_handler.post(BASE_URL, undefined, data);
        return response.data;
    } catch (error) {
        console.error("[Hook] An error occurred while creating wastrel_steel_round_bar:", error);
        throw error;
    }
}

async function get(query?: Record<string, any>) {
    try {
        const response = await api_handler.get(BASE_URL, undefined, undefined, query);
        return response.data;
    } catch (error) {
        console.error("[Hook] An error occurred while fetching wastrel_steel_round_bars:", error);
        throw error;
    }
}

async function getById(wsrb_id: string) {
    try {
        const response = await api_handler.get(`${BASE_URL}/${wsrb_id}`);
        return response.data;
    } catch (error) {
        console.error("[Hook] An error occurred while fetching wastrel_steel_round_bar by id:", error);
        throw error;
    }
}

async function updated(wsrb_id: string, data: Record<string, any>) {
    try {
        const response = await api_handler.put(`${BASE_URL}/${wsrb_id}`, undefined, undefined, data);
        return response.data;
    } catch (error) {
        console.error("[Hook] An error occurred while updating wastrel_steel_round_bar:", error);
        throw error;
    }
}

async function updateStatus(wsrb_id: string, data: Record<string, any>) {
    try {
        const response = await api_handler.patch(`${BASE_URL}/status/${wsrb_id}`, undefined, undefined, data);
        return response.data;
    } catch (error) {
        console.error("[Hook] An error occurred while updating wastrel_steel_round_bar status:", error);
        throw error;
    }
}

async function updateLocation(ids: string[], location: string | null) {
    try {
        const response = await api_handler.patch(`${BASE_URL}/location`, undefined, undefined, { ids, location });
        return response.data;
    } catch (error) {
        console.error("[Hook] An error occurred while updating wastrel_steel_round_bar location:", error);
        throw error;
    }
}

async function updateSchedule(ids: string[], scheduled_at: string | null) {
    try {
        const response = await api_handler.patch(`${BASE_URL}/schedule`, undefined, undefined, { ids, scheduled_at });
        return response.data;
    } catch (error) {
        console.error("[Hook] An error occurred while updating wastrel_steel_round_bar schedule:", error);
        throw error;
    }
}

export default function useWastrelSteelRoundBarsApi() {
    return { create, get, getById, updated, updateStatus, updateLocation, updateSchedule };
}
