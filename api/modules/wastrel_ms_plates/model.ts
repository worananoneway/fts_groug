import { LocationType, StockStatus } from "./type";

export class Material {
    constructor(
        public id: string,
        public code: string | null,
        public name: string | null,
        public shape_type: string | null,
        public grade: string | null
    ) { }
}

export class Location {
    constructor(
        public id: string | null,
        public code: string | null,
        public name: string | null,
        public type: LocationType | null
    ) { }
}

export class Order {
    constructor(
        public id: string | null,
        public no: string | null
    ) { }
}

export class OrderDetail {
    constructor(
        public id: string | null,
        public order_id: string | null
    ) { }
}

export class SourceMSPlate {
    constructor(
        public id: string | null,
        public code: string | null
    ) { }
}

export class WastrelMSPlate {
    constructor(
        public id: string,
        public material: Material,
        public source_ms_plate: SourceMSPlate | null,
        public stock_code: string,
        public length: number,
        public width: number,
        public thickness: number,
        public quantity: number,
        public available_quantity: number,
        public location: Location | null,
        public location_type: LocationType | null,
        public location_detail: string | null,
        public status: StockStatus,
        public order: Order | null,
        public order_detail: OrderDetail | null,
        public remark: string | null,
        public created_at: Date,
        public updated_at: Date | null
    ) { }
}
