export const reply_options = {
    fields: {
        id: 'tlwsrb_id',
        wastrel_steel_round_bar: {
            $fields: {
                id: 'tlwsrb_wsrb_id',
                code: 'tlwsrb_wsrb_code'
            }
        },
        order: {
            $nullableBy: 'tlwsrb_po_id',
            $fields: {
                id: 'tlwsrb_po_id',
                no: 'tlwsrb_ord_no'
            }
        },
        order_detail: {
            $nullableBy: 'tlwsrb_podetail_id',
            $fields: {
                id: 'tlwsrb_podetail_id',
                status: 'tlwsrb_odd_status'
            }
        },
        stock_reservation: {
            $nullableBy: 'tlwsrb_sr_id',
            $fields: {
                id: 'tlwsrb_sr_id',
                status: 'tlwsrb_sr_status'
            }
        },
        event_type: 'tlwsrb_event_type',
        quantity_change: 'tlwsrb_quantity_change',
        length_before: 'tlwsrb_length_before',
        length_after: 'tlwsrb_length_after',
        status_before: 'tlwsrb_status_before',
        status_after: 'tlwsrb_status_after',
        location_before: 'tlwsrb_location_before',
        location_after: 'tlwsrb_location_after',
        event_at: 'tlwsrb_event_at',
        remark: 'tlwsrb_remark',
        created_at: 'tlwsrb_created_at',
        updated_at: 'tlwsrb_updated_at'
    }
};
