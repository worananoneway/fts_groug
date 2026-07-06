// Cookie options interface
interface CookieOptions {
    maxAge?: number; // in seconds
    path?: string;
    secure?: boolean;
    sameSite?: "Strict" | "Lax" | "None";
}

// Helper function to check if we're using HTTPS
function isSecureContext(): boolean {
    if (typeof window === "undefined") return false;
    return window.location.protocol === "https:";
}

// Default cookie options (will be evaluated at runtime)
const getDefaultOptions = (): CookieOptions => ({
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: "/",
    secure: false, // ✅ ตรวจสอบ HTTPS จริงๆ แทน NODE_ENV
    sameSite: "Lax",
});

// Cookie expiration times
const TOKEN_EXPIRY = {
    access_token: 7 * 24 * 60 * 60, // 7 days
    refresh_token: 30 * 24 * 60 * 60, // 30 days
};

export const useCookies = {
    clearCookie,
    clearCookies,
    getCookie,
    setCookie,
    setTokens,
};

/**
 * Set a cookie with the given name, value, and options
 */
function setCookie(name: string, value: string, options?: CookieOptions): void {
    try {
        if (typeof document === "undefined") {
            console.warn("[Cookie Handler] Cannot set cookie: document is undefined (server-side)");
            return;
        }

        const opts = { ...getDefaultOptions(), ...options };
        let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;

        if (opts.maxAge !== undefined) {
            cookieString += `; max-age=${opts.maxAge}`;
        }

        if (opts.path) {
            cookieString += `; path=${opts.path}`;
        }

        if (opts.secure) {
            cookieString += "; secure";
        }

        if (opts.sameSite) {
            cookieString += `; samesite=${opts.sameSite}`;
        }

        document.cookie = cookieString;
        console.debug(`[Cookie Handler] Cookie set: ${name}`);
    } catch (error) {
        console.error(`[Cookie Handler] Error setting cookie ${name}:`, error);
    }
}

/**
 * Get a cookie value by name
 */
function getCookie(name: string): string | null {
    try {
        if (typeof document === "undefined") {
            console.warn("[Cookie Handler] Cannot get cookie: document is undefined (server-side)");
            return null;
        }

        const cookies = document.cookie.split(";");
        for (const cookie of cookies) {
            const [cookieName, cookieValue] = cookie.trim().split("=");
            if (decodeURIComponent(cookieName) === name) {
                return decodeURIComponent(cookieValue);
            }
        }
        return null;
    } catch (error) {
        console.error(`[Cookie Handler] Error getting cookie ${name}:`, error);
        return null;
    }
}

/**
 * Clear a specific cookie by name
 */
function clearCookie(name: string): void {
    try {
        if (typeof document === "undefined") {
            console.warn("[Cookie Handler] Cannot clear cookie: document is undefined (server-side)");
            return;
        }

        // Set the cookie with an expired date to delete it
        document.cookie = `${encodeURIComponent(name)}=; max-age=0; path=/`;
        console.debug(`[Cookie Handler] Cookie cleared: ${name}`);
    } catch (error) {
        console.error(`[Cookie Handler] Error clearing cookie ${name}:`, error);
    }
}

/**
 * Clear all auth-related cookies
 */
function clearCookies(): void {
    try {
        clearCookie("access_token");
        clearCookie("refresh_token");
        console.debug("[Cookie Handler] All auth cookies cleared");
    } catch (error) {
        console.error("[Cookie Handler] Error clearing cookies:", error);
    }
}

/**
 * Set both access and refresh tokens with appropriate expiry times
 */
function setTokens(accessToken: string, refreshToken: string): void {
    try {
        setCookie("access_token", accessToken, {
            maxAge: TOKEN_EXPIRY.access_token,
            path: "/",
            sameSite: "Lax",
        });

        setCookie("refresh_token", refreshToken, {
            maxAge: TOKEN_EXPIRY.refresh_token,
            path: "/",
            sameSite: "Lax",
        });

        console.debug("[Cookie Handler] Tokens set successfully");
    } catch (error) {
        console.error("[Cookie Handler] Error setting tokens:", error);
    }
}
