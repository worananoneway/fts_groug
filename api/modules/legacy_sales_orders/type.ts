export interface ListQuery {
    docnum?: string;
    cusnam?: string;
    type?: string;
    date_from?: string;
    date_to?: string;
    limit?: number;
    offset?: number;
}

export interface Condition {
    sql: string;
    params: any[];
}
