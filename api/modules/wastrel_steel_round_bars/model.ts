export const reply_options = {
    fields: {
        id: 'wsrb_id',
        material: {
            $fields: {
                id: 'wsrb_mm_id',
                code: 'wsrb_mm_code',
                name: 'wsrb_mm_name',
                shape_type: 'wsrb_mm_shape_type',
                grade: 'wsrb_mm_grade'
            }
        },
        source_steel_round_bar: {
            $nullableBy: 'wsrb_srb_id',
            $fields: {
                id: 'wsrb_srb_id',
                code: 'wsrb_srb_code'
            }
        },
        code: 'wsrb_code',
        diameter: 'wsrb_diameter',
        length: 'wsrb_length',
        quantity: 'wsrb_quantity',
        available_quantity: 'wsrb_available_quantity',
        location: {
            $nullableBy: 'wsrb_loc_id',
            $fields: {
                id: 'wsrb_loc_id',
                code: 'wsrb_loc_code',
                name: 'wsrb_loc_name',
                type: 'wsrb_loc_type'
            }
        },
        location_type: 'wsrb_location_type',
        location_detail: 'wsrb_location',
        status: 'wsrb_status',
        order: {
            $nullableBy: 'wsrb_ord_id',
            $fields: {
                id: 'wsrb_ord_id',
                no: 'wsrb_ord_no'
            }
        },
        order_detail: {
            $nullableBy: 'wsrb_odd_id',
            $fields: {
                id: 'wsrb_odd_id',
                order_id: 'wsrb_odd_ord_id'
            }
        },
        remark: 'wsrb_remark',
        created_at: 'wsrb_created_at',
        updated_at: 'wsrb_updated_at'
    }
};
