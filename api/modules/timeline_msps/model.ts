export const reply_options = {
    fields: {
        id: 'tlmsp_id',
        ms_plate: {
            $fields: {
                id: 'tlmsp_msp_id',
                code: 'tlmsp_msp_code'
            }
        },
        order: {
            $nullableBy: 'tlmsp_ord_id',
            $fields: {
                id: 'tlmsp_ord_id',
                no: 'tlmsp_ord_no'
            }
        },
        order_detail: {
            $nullableBy: 'tlmsp_odd_id',
            $fields: {
                id: 'tlmsp_odd_id',
                status: 'tlmsp_odd_status'
            }
        },
        stock_reservation: {
            $nullableBy: 'tlmsp_sr_id',
            $fields: {
                id: 'tlmsp_sr_id',
                status: 'tlmsp_sr_status'
            }
        },
        event_type: 'tlmsp_event_type',
        quantity_change: 'tlmsp_quantity_change',
        length_before: 'tlmsp_length_before',
        width_before: 'tlmsp_width_before',
        length_after: 'tlmsp_length_after',
        width_after: 'tlmsp_width_after',
        status_before: 'tlmsp_status_before',
        status_after: 'tlmsp_status_after',
        location_before: 'tlmsp_location_before',
        location_after: 'tlmsp_location_after',
        event_at: 'tlmsp_event_at',
        remark: 'tlmsp_remark',
        created_at: 'tlmsp_created_at',
        updated_at: 'tlmsp_updated_at'
    }
};
