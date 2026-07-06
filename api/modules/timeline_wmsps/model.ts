export class TimelineWmsp {
    constructor(
        public id: string,
        public wmsp_id: string,
        public ord_id: string | null,
        public odd_id: string | null,
        public sr_id: string | null,
        public event_type: string,
        public quantity_change: number | null,
        public length_before: number | null,
        public width_before: number | null,
        public length_after: number | null,
        public width_after: number | null,
        public status_before: string | null,
        public status_after: string | null,
        public location_before: string | null,
        public location_after: string | null,
        public event_at: Date,
        public remark: string | null,
        public created_at: Date,
        public updated_at: Date | null,
        public emp_id: string | null
    ) {
        this.id = id;
        this.wmsp_id = wmsp_id;
        this.ord_id = ord_id;
        this.odd_id = odd_id;
        this.sr_id = sr_id;
        this.event_type = event_type;
        this.quantity_change = quantity_change;
        this.length_before = length_before;
        this.width_before = width_before;
        this.length_after = length_after;
        this.width_after = width_after;
        this.status_before = status_before;
        this.status_after = status_after;
        this.location_before = location_before;
        this.location_after = location_after;
        this.event_at = event_at;
        this.remark = remark;
        this.created_at = created_at;
        this.updated_at = updated_at;
        this.emp_id = emp_id;
    }
}
