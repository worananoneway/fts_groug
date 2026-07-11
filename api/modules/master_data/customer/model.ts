export const reply_options = {
    fields: {
        id: 'customer_id',
        display_id: 'customer_display_id',
        name_th: 'customer_name_th',
        name_en: 'customer_name_en',
        tax_id: 'customer_tax_id',
        tax_type: 'customer_tax_type',
        contact: {
            $fields: {
                name: 'customer_contact_name',
                phone: 'customer_contact_phone',
                fax: 'customer_contact_fax',
                email: 'customer_contact_email'
            }
        },
        address: {
            $fields: {
                detail: 'customer_address',
                subdistrict: {
                    $fields: {
                        id: 'customer_subdistrict_id',
                        name: {
                            $locale: {
                                th: 'customer_subdistrict_name_th',
                                en: 'customer_subdistrict_name_en'
                            }
                        }
                    }
                },
                district: {
                    $fields: {
                        id: 'customer_district_id',
                        name: {
                            $locale: {
                                th: 'customer_district_name_th',
                                en: 'customer_district_name_en'
                            }
                        }
                    }
                },
                province: {
                    $fields: {
                        id: 'customer_province_id',
                        name: {
                            $locale: {
                                th: 'customer_province_name_th',
                                en: 'customer_province_name_en'
                            }
                        }
                    }
                },
                postcode: 'customer_postcode'
            }
        },
        branch_type: 'customer_branch_type',
        branch_number: 'customer_branch_number',
        pp20_file: 'customer_pp20_file',
        certificate_file: 'customer_certificate_file',
        created_at: 'customer_created_at',
        updated_at: 'customer_updated_at',
        employee: {
            $fields: {
                id: 'customer_emp_id',
                prefix: 'customer_emp_prefix',
                name: {
                    $locale: {
                        th: { $join: ['customer_emp_firstname_th', 'customer_emp_lastname_th'] },
                        en: { $join: ['customer_emp_firstname_en', 'customer_emp_lastname_en'] }
                    }
                }
            }
        },
        status: 'customer_status'
    }
};
