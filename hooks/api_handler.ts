import axios, { Axios, AxiosError, AxiosHeaders, AxiosRequestConfig, AxiosResponse, Method } from "axios";
import { useCookies } from "@/utils/cookie_handler";
import { useCredentials } from "@/utils/localstorage_handler";
import { HttpStatus, HttpStatusCode, ReplyErrorField, ReplyErrorMessage } from "@/utils/shared_types";

const instance = axios.create({
    baseURL: "/api/v1",
});
const defaultHeaders = new AxiosHeaders({
    "Content-Type": "application/json",
    "Accept-Language": "th-TH",
});

async function apiCall(url: string, method: Method, headers?: AxiosHeaders, params?: string, data?: any, query?: Record<string, any>, config?: AxiosRequestConfig): Promise<AxiosResponse> {
    const combinedHeaders = headers ? defaultHeaders.concat(headers) : new AxiosHeaders(defaultHeaders);
    const accessToken = useCredentials.getCredential("access_token");
    if (accessToken) {
        combinedHeaders.set("Authorization", `Bearer ${accessToken}`);
    }
    // If data is FormData, remove Content-Type to let axios set it with boundary
    if (data instanceof FormData) {
        combinedHeaders.delete("Content-Type");
    }
    const urlExtension = params ? encodeURIComponent(params) : "";
    const requestConfig: AxiosRequestConfig = {
        url: url.concat("/", urlExtension),
        method: method,
        headers: combinedHeaders,
        params: query,
        data: data,
        validateStatus: function (status) {
            return (status >= 200 && status < 300) || (status === 404);
        },
    };
    if (config) {
        Object.assign(requestConfig, config);
    }

    try {
        const response = await instance.request(requestConfig);
        return response;
    } catch (error) {
        const axiosError = error as AxiosError;
        if (axiosError && axiosError.response && axiosError.response.status === HttpStatusCode.UNAUTHORIZED) {
            console.warn("[API Handler] Access token expired or invalid. Attempting to refresh token.");
            const refreshToken = useCredentials.getCredential("refresh_token");
            if (refreshToken) {
                try {
                    const refreshResponse = await instance.post("/auth/refresh-token", { refresh_token: refreshToken }, {
                        validateStatus: (status) => [
                            HttpStatusCode.OK,
                            HttpStatusCode.BAD_REQUEST,
                            HttpStatusCode.UNAUTHORIZED,
                            HttpStatusCode.INTERNAL_SERVER_ERROR
                        ].includes(status)
                    });
                    if (refreshResponse.status === HttpStatusCode.OK) {
                        const newAccessToken = refreshResponse.data.details.access_token;
                        const newRefreshToken = refreshResponse.data.details.refresh_token;
                        const expiresIn = refreshResponse.data.details.expires_in;
                        // Update session storage with new tokens
                        useCredentials.setCredential("access_token", newAccessToken);
                        useCredentials.setCredential("refresh_token", newRefreshToken);
                        useCredentials.setCredential("expires_in", expiresIn);
                        // Update cookies with new tokens
                        useCookies.setTokens(newAccessToken, newRefreshToken);
                        console.info("[API Handler] Access token refreshed successfully.");

                        // Retry the original request with the new access token
                        combinedHeaders.set("Authorization", `Bearer ${newAccessToken}`);
                        requestConfig.headers = combinedHeaders;
                        const retryResponse = await instance.request(requestConfig);
                        return retryResponse;
                    } else {
                        console.error("[API Handler] Failed to refresh access token. Redirecting to login.");
                        useCredentials.clearCredentials();
                        useCookies.clearCookies();
                        window.location.href = "/login";
                        const axiosError = new AxiosError(
                            "Failed to renew token",
                            refreshResponse.status.toString(),
                            refreshResponse.config,
                            refreshResponse.request,
                            refreshResponse
                        );
                        throw axiosError;
                    }
                } catch (error) {
                    console.error("[API Handler] Error refreshing access token:", error);
                    const axiosError = new AxiosError(
                        "Error renewing token",
                        HttpStatusCode.INTERNAL_SERVER_ERROR.toString(),
                        undefined,
                        undefined,
                        {
                            data: {
                                status: HttpStatus.INTERNAL_SERVER_ERROR,
                                statuscode: HttpStatusCode.INTERNAL_SERVER_ERROR,
                                details: {
                                    error: ReplyErrorField.INTERNAL_SERVER_ERROR,
                                    message: ReplyErrorMessage.INTERNAL_SERVER_ERROR,
                                }
                            },
                            status: HttpStatusCode.INTERNAL_SERVER_ERROR,
                            statusText: HttpStatus.INTERNAL_SERVER_ERROR,
                            headers: {} as AxiosHeaders,
                            config: {} as AxiosRequestConfig,
                            request: {}
                        } as AxiosResponse
                    );
                    useCredentials.clearCredentials();
                    useCookies.clearCookies();
                    window.location.href = "/login";
                    throw axiosError;
                }
            } else {
                console.warn("[API Handler] No refresh token available. User will need to log in again.");
                useCredentials.clearCredentials();
                useCookies.clearCookies();
                window.location.href = "/login";
                throw axiosError;
            }
        } else {
            console.warn("[API Handler] API request failed:", error);
            throw axiosError;
        }
    }
}
async function get(url: string, headers?: AxiosHeaders, params?: string, query?: Record<string, any>, config?: AxiosRequestConfig) {
    const response = await apiCall(url, "GET", headers, params, undefined, query, config);
    return response;
}
async function patch(url: string, headers?: AxiosHeaders, params?: string, data?: any, config?: AxiosRequestConfig) {
    const response = await apiCall(url, "PATCH", headers, params, data, undefined, config);
    return response;
}
async function post(url: string, headers?: AxiosHeaders, data?: any, config?: AxiosRequestConfig) {
    const response = await apiCall(url, "POST", headers, undefined, data, undefined, config);
    return response;
};
async function put(url: string, headers?: AxiosHeaders, params?: string, data?: any, config?: AxiosRequestConfig) {
    const response = await apiCall(url, "PUT", headers, params, data, undefined, config);
    return response;
}
async function softDelete(url: string, headers?: AxiosHeaders, params?: string, query?: Record<string, any>, config?: AxiosRequestConfig) {
    const response = await apiCall(url, "DELETE", headers, params, undefined, query, config);
    return response;
}
async function hardDelete(url: string, headers?: AxiosHeaders, params?: string, query?: Record<string, any>, config?: AxiosRequestConfig) {
    const response = await apiCall(url, "DELETE", headers, params, undefined, query, config);
    return response;
}

export default { get, patch, post, put, softDelete, delete: hardDelete };