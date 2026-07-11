export const reply_options = {
    fields: {
        id: 'wmsp_id',
        material: {
            $fields: {
                id: 'wmsp_mm_id',
                code: 'wmsp_mm_code',
                name: 'wmsp_mm_name',
                shape_type: 'wmsp_mm_shape_type',
                grade: 'wmsp_mm_grade'
            }
        },
        source_ms_plate: {
            $nullableBy: 'wmsp_msp_id',
            $fields: {
                id: 'wmsp_msp_id',
                code: 'wmsp_msp_code'
            }
        },
        stock_code: 'wmsp_stock_code',
        length: 'wmsp_length',
        width: 'wmsp_width',
        thickness: 'wmsp_thickness',
        quantity: 'wmsp_quantity',
        available_quantity: 'wmsp_available_quantity',
        status: 'wmsp_status',
        order: {
            $nullableBy: 'wmsp_ord_id',
            $fields: {
                id: 'wmsp_ord_id',
                no: 'wmsp_ord_no'
            }
        },
        order_detail: {
            $nullableBy: 'wmsp_odd_id',
            $fields: {
                id: 'wmsp_odd_id',
                order_id: 'wmsp_odd_ord_id'
            }
        },
        remark: 'wmsp_remark',
        created_at: 'wmsp_created_at',
        updated_at: 'wmsp_updated_at'
    }
};
