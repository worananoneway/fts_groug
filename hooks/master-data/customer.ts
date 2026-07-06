import api_handler from "@/hooks/api_handler";

async function create(data: Record<string, any>) {
    try {
        const response = await api_handler.post("/master-data/customer", undefined, data);
        return response.data;
    } catch (error) {
        console.error("[Hook] An error occurred while creating customer:", error);

        throw error;
    }
}

async function softDelete(customer_id: string) {
    try {
        const response = await api_handler.get(`/master-data/customer/${customer_id}`, undefined, undefined);
        return response.data;
    } catch (error) {
        console.error("[Hook] An error occurred while fetching customer:", error);

        throw error;
    }
}

async function get(query?: Record<string, any>) {
    try {
        const response = await api_handler.get("/master-data/customer", undefined, undefined, query);
        return response.data;
    } catch (error) {
        console.error("[Hook] An error occurred while fetching customers:", error);

        throw error;
    }
};

async function getById(customer_id: string) {
    try {
        const response = await api_handler.get(`/master-data/customer/${customer_id}`, undefined, undefined);
        return response.data;
    } catch (error) {
        console.error("[Hook] An error occurred while fetching customer:", error);

        throw error;
    }
}

async function updated(customer_id: string, data: Record<string, any>) {
    try {
        const response = await api_handler.put(`/master-data/customer/${customer_id}`, undefined);
        return response.data;
    } catch (error) {
        console.error("[Hook] An error occurred while updating customer:", error);
        throw error;
    }
}

async function updateStatus(customer_id: string, data: Record<string, any>) {
    try {
        const response = await api_handler.patch(`/master-data/customer/status/${customer_id}`, undefined);
        return response.data;
    } catch (error) {
        console.error("[Hook] An error occurred while updating customer status:", error);

        throw error;
    }
}

export default function useEmployeeApi() {
    return { create, get, softDelete, getById, updated, updateStatus };
}