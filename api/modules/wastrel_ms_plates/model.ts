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
        display_id: 'wmsp_display_id',
        length: 'wmsp_length',
        width: 'wmsp_width',
        thickness: 'wmsp_thickness',
        quantity: 'wmsp_quantity',
        available_quantity: 'wmsp_available_quantity',
        status: 'wmsp_status',
        order: {
            $nullableBy: 'wmsp_po_id',
            $fields: {
                id: 'wmsp_po_id',
                no: 'wmsp_po_number'
            }
        },
        order_detail: {
            $nullableBy: 'wmsp_podetail_id',
            $fields: {
                id: 'wmsp_podetail_id',
                order_id: 'wmsp_podetail_po_id'
            }
        },
        remark: 'wmsp_remark',
        created_at: 'wmsp_created_at',
        updated_at: 'wmsp_updated_at',
        emp: {
            $nullableBy: 'wmsp_emp_id',
            $fields: {
                id: 'wmsp_emp_id',
                display_id: 'wmsp_emp_display_id',
                prefix: 'wmsp_emp_prefix',
                name: {
                    $locale: {
                        th: { $join: ['wmsp_emp_fname_th', 'wmsp_emp_lname_th'] },
                        en: { $join: ['wmsp_emp_fname_en', 'wmsp_emp_lname_en'] }
                    }
                }
            }
        }
    }
};
