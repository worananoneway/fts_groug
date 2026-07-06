import { ReservationStatus, ReservationStockType } from "./type";

export class ReservationOrder {
    constructor(
        public id: string,
        public number: string | null
    ) { }
}

export class ReservationOrderDetail {
    constructor(
        public id: string,
        public shape_type: string | null,
        public required_length_mm: number | null,
        public required_width_mm: number | null,
        public required_thickness_mm: number | null,
        public required_diameter_mm: number | null,
        public quantity: number | null
    ) { }
}

export class ReservationStock {
    constructor(
        public id: string,
        public type: ReservationStockType,
        public code: string | null,
        public status: string | null
    ) { }
}

export class StockReservation {
    constructor(
        public id: string,
        public ord_id: string,
        public odd_id: string,
        public stock_type: ReservationStockType,
        public stock_id: string,
        public reserved_quantity: number,
        public reserved_length_mm: number | null,
        public reserved_width_mm: number | null,
        public status: ReservationStatus,
        public reserved_at: Date,
        public used_at: Date | null,
        public created_at: Date,
        public updated_at: Date | null,
        public order: ReservationOrder | null,
        public order_detail: ReservationOrderDetail | null,
        public stock: ReservationStock | null
    ) { }
}
