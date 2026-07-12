export const reply_options = {
    fields: {
        id: 'sr_id',
        ord_id: 'sr_ord_id',
        odd_id: 'sr_odd_id',
        stock_type: 'sr_stock_type',
        stock_id: 'sr_stock_id',
        reserved_quantity: 'sr_reserved_quantity',
        reserved_length_mm: 'sr_reserved_length_mm',
        reserved_width_mm: 'sr_reserved_width_mm',
        status: 'sr_status',
        reserved_at: 'sr_reserved_at',
        used_at: 'sr_used_at',
        created_at: 'sr_created_at',
        updated_at: 'sr_updated_at',
        order: {
            $fields: {
                id: 'sr_ord_id',
                number: 'sr_ord_no'
            }
        },
        order_detail: {
            $fields: {
                id: 'sr_odd_id',
                shape_type: 'sr_odd_shape_type',
                required_length_mm: 'sr_odd_required_length_mm',
                required_width_mm: 'sr_odd_required_width_mm',
                required_thickness_mm: 'sr_odd_required_thickness_mm',
                required_diameter_mm: 'sr_odd_required_diameter_mm',
                quantity: 'sr_odd_quantity'
            }
        },
        stock: {
            $fields: {
                id: 'sr_stock_id',
                type: 'sr_stock_type',
                code: 'sr_stock_code',
                status: 'sr_stock_status'
            }
        }
    }
};
