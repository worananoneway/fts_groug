import api_handler from "@/hooks/api_handler";

// endpoint จริงตาม server.ts: /api/v1/customers
const BASE_URL = "/customers";

async function create(data: Record<string, any>) {
    try {
        const response = await api_handler.post(BASE_URL, undefined, data);
        return response.data;
    } catch (error) {
        console.error("[Hook] An error occurred while creating customer:", error);

        throw error;
    }
}

async function softDelete(customer_id: string) {
    try {
        const response = await api_handler.softDelete(`${BASE_URL}/${customer_id}`);
        return response.data;
    } catch (error) {
        console.error("[Hook] An error occurred while deleting customer:", error);

        throw error;
    }
}

async function get(query?: Record<string, any>) {
    try {
        const response = await api_handler.get(BASE_URL, undefined, undefined, query);
        return response.data;
    } catch (error) {
        console.error("[Hook] An error occurred while fetching customers:", error);

        throw error;
    }
};

async function getById(customer_id: string) {
    try {
        const response = await api_handler.get(`${BASE_URL}/${customer_id}`, undefined, undefined);
        return response.data;
    } catch (error) {
        console.error("[Hook] An error occurred while fetching customer:", error);

        throw error;
    }
}

async function updated(customer_id: string, data: Record<string, any>) {
    try {
        const response = await api_handler.put(`${BASE_URL}/${customer_id}`, undefined, undefined, data);
        return response.data;
    } catch (error) {
        console.error("[Hook] An error occurred while updating customer:", error);
        throw error;
    }
}

async function updateStatus(customer_id: string, data: Record<string, any>) {
    try {
        const response = await api_handler.patch(`${BASE_URL}/status/${customer_id}`, undefined, undefined, data);
        return response.data;
    } catch (error) {
        console.error("[Hook] An error occurred while updating customer status:", error);

        throw error;
    }
}

export default function useCustomerApi() {
    return { create, get, softDelete, getById, updated, updateStatus };
}
