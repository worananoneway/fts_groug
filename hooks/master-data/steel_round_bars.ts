import api_handler from "@/hooks/api_handler";

async function create(data: Record<string, any>) {
    try {
        const response = await api_handler.post("/steel-round-bars", undefined, data);
        return response.data;
    } catch (error) {
        console.error("[Hook] An error occurred while creating steel_round_bar:", error);
        throw error;
    }
}

async function softDelete(steel_round_bar_id: string) {
    try {
        const response = await api_handler.delete(`/steel-round-bars/${steel_round_bar_id}`);
        return response.data;
    } catch (error) {
        console.error("[Hook] An error occurred while soft deleting steel_round_bar:", error);
        throw error;
    }
}

async function get(query?: Record<string, any>) {
    try {
        const response = await api_handler.get("/steel-round-bars", undefined, undefined, query);
        return response.data;
    } catch (error) {
        console.error("[Hook] An error occurred while getting steel_round_bars:", error);
        throw error;
    }
}

async function getById(steel_round_bar_id: string) {
    try {
        const response = await api_handler.get(`/steel-round-bars/${steel_round_bar_id}`);
        return response.data;
    } catch (error) {
        console.error("[Hook] An error occurred while getting steel_round_bar by id:", error);
        throw error;
    }
}

async function update(steel_round_bar_id: string, data: Record<string, any>) {
    try {
        const response = await api_handler.put(`/steel-round-bars/${steel_round_bar_id}`, undefined, undefined, data);
        return response.data;
    } catch (error) {
        console.error("[Hook] An error occurred while updating steel_round_bar:", error);
        throw error;
    }
}

async function updateStatus(steel_round_bar_id: string, data: Record<string, any>) {
    try {
        const response = await api_handler.patch(`/steel-round-bars/status/${steel_round_bar_id}`, undefined, undefined, data);
        return response.data;
    } catch (error) {
        console.error("[Hook] An error occurred while updating steel_round_bar status:", error);
        throw error;
    }
}

export default {
    create,
    softDelete,
    get,
    getById,
    update,
    updateStatus
};