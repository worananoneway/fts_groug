export const reply_options = {
    fields: {
        id: 'msp_id',
        mm_id: 'msp_mm_id',
        code: 'msp_code',
        length: 'msp_length',
        width: 'msp_width',
        thickness: 'msp_thickness',
        quantity: 'msp_quantity',
        available_quantity: 'msp_available_quantity',
        loc_id: 'msp_loc_id',
        location_type: 'msp_location_type',
        location: 'msp_location',
        status: 'msp_status',
        received_date: 'msp_received_date',
        remark: 'msp_remark',
        created_at: 'msp_created_at',
        updated_at: 'msp_updated_at',
        employee: {
            $fields: {
                id: 'msp_emp_id',
                prefix: 'msp_emp_prefix',
                name: {
                    $locale: {
                        th: { $join: ['msp_emp_firstname_th', 'msp_emp_lastname_th'] },
                        en: { $join: ['msp_emp_firstname_en', 'msp_emp_lastname_en'] }
                    }
                }
            }
        },
        material: {
            $fields: {
                id: 'msp_material_id',
                name: 'msp_material_name',
                type: 'msp_material_type'
            }
        }
    }
};
