export interface RouteInfo {
    path: string;
    methods: string[];
    clearance_level?: number;
    request?: RequestOptions;
    reply?: ReplyOptions;
}
interface RequestOptions {
    params?: string;
    query?: string[];
    body?: Array<{
        clearance_level: number;
        fields: string[];
    }>;
}
interface ReplyOptions {
    data: Array<{
        clearance_level: number;
        fields: string[];
    }>;
}