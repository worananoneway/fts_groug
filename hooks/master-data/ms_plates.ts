import api_handler from "@/hooks/api_handler";

async function create(data: Record<string, any>) {
    try {
        const response = await api_handler.post("/master-data/ms-plates", undefined, data);
        return response.data;
    } catch (error) {
        console.error("[Hook] An error occurred while creating ms_plate:", error);
        throw error;
    }
}

async function softDelete(ms_plate_id: string) {
    try {
        const response = await api_handler.delete(`/master-data/ms-plates/${ms_plate_id}`);
        return response.data;
    } catch (error) {
        console.error("[Hook] An error occurred while deleting ms_plate:", error);
        throw error;
    }
}

async function get(ms_plate_id?: string) {
    try {
        const response = await api_handler.get(`/master-data/ms-plates${ms_plate_id ? `/${ms_plate_id}` : ''}`);
        return response.data;
    } catch (error) {
        console.error("[Hook] An error occurred while fetching ms_plate:", error);
        throw error;
    }
}

async function getById(ms_plate_id: string) {
    try {
        const response = await api_handler.get(`/master-data/ms-plates/${ms_plate_id}`);
        return response.data;
    } catch (error) {
        console.error("[Hook] An error occurred while fetching ms_plate by id:", error);
        throw error;
    }
}

async function updated(ms_plate_id: string, data: Record<string, any>) {
    try {
        const response = await api_handler.put(`/master-data/ms-plates/${ms_plate_id}`, undefined, undefined, data);
        return response.data;
    } catch (error) {
        console.error("[Hook] An error occurred while updating ms_plate:", error);
        throw error;
    }
}

async function updateStatus(ms_plate_id: string, data: Record<string, any>) {
    try {
        const response = await api_handler.patch(`/master-data/ms-plates/status/${ms_plate_id}`, undefined, undefined, data);
        return response.data;
    } catch (error) {
        console.error("[Hook] An error occurred while updating ms_plate status:", error);
        throw error;
    }
}

export default function useMsPlatesApi() {
    return { create, get, softDelete, getById, updated, updateStatus };
}