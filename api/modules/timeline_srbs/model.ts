import { StockStatus, TimelineEventType } from "./type";

export class SteelRoundBar {
    constructor(
        public id: string,
        public code: string | null
    ) { }
}

export class Order {
    constructor(
        public id: string,
        public no: string | null
    ) { }
}

export class OrderDetail {
    constructor(
        public id: string,
        public status: string | null
    ) { }
}

export class StockReservation {
    constructor(
        public id: string,
        public status: string | null
    ) { }
}

export class TimelineSrb {
    constructor(
        public id: string,
        public steel_round_bar: SteelRoundBar,
        public order: Order | null,
        public order_detail: OrderDetail | null,
        public stock_reservation: StockReservation | null,
        public event_type: TimelineEventType,
        public quantity_change: number | null,
        public length_before: number | null,
        public length_after: number | null,
        public status_before: StockStatus | null,
        public status_after: StockStatus | null,
        public location_before: string | null,
        public location_after: string | null,
        public event_at: Date,
        public remark: string | null,
        public created_at: Date,
        public updated_at: Date | null
    ) { }
}
