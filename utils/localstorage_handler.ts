interface Credentials {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    user: {
        id: string;
        display_id: string;
        name: string;
        email: string;
        role: {
            id: string;
            name: string;
        };
    };
}
export const useCredentials = {
    clearCredential,
    clearCredentials,
    getCredential,
    getCredentials,
    setCredential,
    setCredentials,
};
function clearCredential(field: string) {
    try {
        localStorage.removeItem(field);
    } catch (error) {
        console.error(`[LocalStorage Handler] Error clearing ${field} from localStorage:`, error);
    }
}
function clearCredentials() {
    try {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("expires_in");
        localStorage.removeItem("id");
        localStorage.removeItem("display_id");
        localStorage.removeItem("name");
        localStorage.removeItem("email");
        localStorage.removeItem("role_id");
        localStorage.removeItem("role_name");
    } catch (error) {
        console.error("[LocalStorage Handler] Error clearing credentials from localStorage:", error);
    }
}
function getCredential(field: string): string | null {
    try {
        switch (field) {
            case "access_token":
            case "refresh_token":
            case "expires_in":
            case "id":
            case "display_id":
            case "name":
            case "email":
            case "role_id":
            case "role_name":
                return localStorage.getItem(field);
            default:
                return null;
        }
    } catch (error) {
        console.error("[LocalStorage Handler] Error getting credentials from localStorage:", error);
        return null;
    }
}
function getCredentials(): Credentials | null {
    try {
        const credentials: Credentials = {
            access_token: localStorage.getItem("access_token") || "",
            refresh_token: localStorage.getItem("refresh_token") || "",
            expires_in: parseInt(localStorage.getItem("expires_in") || "0", 10),
            user: {
                id: localStorage.getItem("id") || "",
                display_id: localStorage.getItem("display_id") || "",
                name: localStorage.getItem("name") || "",
                email: localStorage.getItem("email") || "",
                role: {
                    id: localStorage.getItem("role_id") || "",
                    name: localStorage.getItem("role_name") || "",
                },
            },
        };
        return credentials;
    } catch (error) {
        console.error("[LocalStorage Handler] Error getting credentials from localStorage:", error);
        return null;
    }
}
function setCredential(field: string, value: string): void {
    try {
        switch (field) {
            case "access_token":
            case "refresh_token":
            case "expires_in":
            case "id":
            case "display_id":
            case "name":
            case "email":
            case "role_id":
            case "role_name":
                localStorage.setItem(field, value);
                break;
            default:
                console.warn(`[LocalStorage Handler] Invalid field: ${field}`);
        }
    } catch (error) {
        console.error(`[LocalStorage Handler] Error setting ${field} in localStorage:`, error);
    }
}
function setCredentials(data: Credentials): void {
    try {
        localStorage.setItem("access_token", data.access_token);
        localStorage.setItem("refresh_token", data.refresh_token);
        localStorage.setItem("expires_in", data.expires_in.toString());
        localStorage.setItem("id", data.user.id);
        localStorage.setItem("display_id", data.user.display_id);
        localStorage.setItem("name", data.user.name);
        localStorage.setItem("email", data.user.email);
        localStorage.setItem("role_id", data.user.role.id);
        localStorage.setItem("role_name", data.user.role.name);
    } catch (error) {
        console.error("[LocalStorage Handler] Error setting credentials in localStorage:", error);
    }
}