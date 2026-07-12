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
        display_id: 'wsrb_display_id',
        diameter: 'wsrb_diameter',
        length: 'wsrb_length',
        quantity: 'wsrb_quantity',
        available_quantity: 'wsrb_available_quantity',
        status: 'wsrb_status',
        order: {
            $nullableBy: 'wsrb_po_id',
            $fields: {
                id: 'wsrb_po_id',
                no: 'wsrb_po_number'
            }
        },
        order_detail: {
            $nullableBy: 'wsrb_podetail_id',
            $fields: {
                id: 'wsrb_podetail_id',
                order_id: 'wsrb_podetail_po_id'
            }
        },
        remark: 'wsrb_remark',
        created_at: 'wsrb_created_at',
        updated_at: 'wsrb_updated_at',
        emp: {
            $nullableBy: 'wsrb_emp_id',
            $fields: {
                id: 'wsrb_emp_id',
                display_id: 'wsrb_emp_display_id',
                prefix: 'wsrb_emp_prefix',
                name: {
                    $locale: {
                        th: { $join: ['wsrb_emp_fname_th', 'wsrb_emp_lname_th'] },
                        en: { $join: ['wsrb_emp_fname_en', 'wsrb_emp_lname_en'] }
                    }
                }
            }
        }
    }
};
