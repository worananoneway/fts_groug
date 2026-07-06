import api_handler from "@/hooks/api_handler";

export async function getProvinces(query?: Record<string, any>) {
    try {
        const response = await api_handler.get("/addresses/province", undefined, undefined, query);
        return response;
    } catch (error) {
        console.error("[Hook] An error occurred while fetching provinces:", error);
        throw error;
    }
}

export async function getDistricts(query?: Record<string, any>) {
    try {
        const response = await api_handler.get("/addresses/district", undefined, undefined, query);
        return response;
    } catch (error) {
        console.error("[Hook] An error occurred while fetching districts:", error);
        throw error;
    }
}

export async function getSubdistricts(query?: Record<string, any>) {
    try {
        const response = await api_handler.get("/addresses/subdistrict", undefined, undefined, query);
        return response;
    } catch (error) {
        console.error("[Hook] An error occurred while fetching subdistricts:", error);
        throw error;
    }
}
