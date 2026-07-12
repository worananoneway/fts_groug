export const reply_options = {
    fields: {
        id: 'tlsrb_id',
        steel_round_bar: {
            $fields: {
                id: 'tlsrb_srb_id',
                code: 'tlsrb_srb_code'
            }
        },
        order: {
            $nullableBy: 'tlsrb_ord_id',
            $fields: {
                id: 'tlsrb_ord_id',
                no: 'tlsrb_ord_no'
            }
        },
        order_detail: {
            $nullableBy: 'tlsrb_odd_id',
            $fields: {
                id: 'tlsrb_odd_id',
                status: 'tlsrb_odd_status'
            }
        },
        stock_reservation: {
            $nullableBy: 'tlsrb_sr_id',
            $fields: {
                id: 'tlsrb_sr_id',
                status: 'tlsrb_sr_status'
            }
        },
        event_type: 'tlsrb_event_type',
        quantity_change: 'tlsrb_quantity_change',
        length_before: 'tlsrb_length_before',
        length_after: 'tlsrb_length_after',
        status_before: 'tlsrb_status_before',
        status_after: 'tlsrb_status_after',
        location_before: 'tlsrb_location_before',
        location_after: 'tlsrb_location_after',
        event_at: 'tlsrb_event_at',
        remark: 'tlsrb_remark',
        created_at: 'tlsrb_created_at',
        updated_at: 'tlsrb_updated_at'
    }
};
