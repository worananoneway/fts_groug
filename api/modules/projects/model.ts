export const reply_options = {
    fields: {
        id: 'project_id',
        display_id: 'project_display_id',
        name_th: 'project_name_th',
        name_en: 'project_name_en',
        notifications: { $from: 'project_notifications', $default: [] },
        contact: {
            $fields: {
                name: 'project_contact_name',
                phone: 'project_contact_phone',
                fax: 'project_contact_fax',
                email: 'project_contact_email'
            }
        },
        customer: {
            $fields: {
                id: 'project_customer_id',
                display_id: 'customer_display_id',
                name: {
                    $locale: {
                        th: 'project_customer_name_th',
                        en: 'project_customer_name_en'
                    }
                }
            }
        },
        manager: {
            $fields: {
                id: 'project_manager_id',
                display_id: 'project_manager_display_id',
                prefix: 'project_manager_prefix',
                name: {
                    $locale: {
                        th: { $join: ['project_manager_fname_th', 'project_manager_lname_th'] },
                        en: { $join: ['project_manager_fname_en', 'project_manager_lname_en'] }
                    }
                }
            }
        },
        budget: 'project_budget',
        closing_date: 'project_closing_date',
        note: 'project_note',
        po_file: 'project_po_file',
        created_at: 'project_created_at',
        updated_at: 'project_updated_at',
        emp: {
            $fields: {
                id: 'project_emp_id',
                prefix: 'project_emp_prefix',
                name: {
                    $locale: {
                        th: { $join: ['project_emp_fname_th', 'project_emp_lname_th'] },
                        en: { $join: ['project_emp_fname_en', 'project_emp_lname_en'] }
                    }
                }
            }
        },
        status: 'project_status'
    }
};
