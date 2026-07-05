import { LocationType, StockStatus } from "./type";

export class SteelRoundBar {
    constructor(
        public id: string,
        public mm_id: string,
        public code: string,
        public diameter: number,
        public length: number,
        public quantity: number,
        public available_quantity: number,
        public loc_id: string | null,
        public location_type: LocationType | null,
        public location: string | null,
        public status: StockStatus,
        public received_date: string | null,
        public remark: string | null,
        public created_at: Date,
        public updated_at: Date | null
    ) { }
}