export const created_reply_options = {
    fields: {
        id: 'po_id',
        number: 'po_number',
        customer: {
            $fields: {
                id: { $from: ['po_customer_id', 'po_cus_id'] },
                display_id: 'po_customer_display_id',
                name_th: 'po_customer_name_th',
                name_en: 'po_customer_name_en',
                tax_id: 'po_customer_tax_id',
                tax_type: 'po_customer_tax_type',
                contact: {
                    $nullableBy: ['po_customer_id', 'po_cus_id'],
                    $fields: {
                        name: 'po_customer_contact_name',
                        phone: 'po_customer_contact_phone',
                        fax: 'po_customer_contact_fax',
                        email: 'po_customer_contact_email'
                    }
                },
                address: {
                    $nullableBy: ['po_customer_id', 'po_cus_id'],
                    $fields: {
                        detail: 'po_customer_address',
                        subdistrict: {
                            $nullableBy: 'po_customer_subdistrict_id',
                            $fields: {
                                id: 'po_customer_subdistrict_id',
                                name: {
                                    $locale: {
                                        th: 'po_customer_subdistrict_name_th',
                                        en: 'po_customer_subdistrict_name_en'
                                    }
                                }
                            }
                        },
                        district: {
                            $nullableBy: 'po_customer_district_id',
                            $fields: {
                                id: 'po_customer_district_id',
                                name: {
                                    $locale: {
                                        th: 'po_customer_district_name_th',
                                        en: 'po_customer_district_name_en'
                                    }
                                }
                            }
                        },
                        province: {
                            $nullableBy: 'po_customer_province_id',
                            $fields: {
                                id: 'po_customer_province_id',
                                name: {
                                    $locale: {
                                        th: 'po_customer_province_name_th',
                                        en: 'po_customer_province_name_en'
                                    }
                                }
                            }
                        },
                        postcode: 'po_customer_postcode'
                    }
                },
                branch_type: 'po_customer_branch_type',
                branch_number: 'po_customer_branch_number'
            }
        },
        due_date: 'po_due_date',
        remark: 'po_remark',
        issue_date: 'po_issue_date',
        ship_via: 'po_ship_via',
        qt_on: 'po_qt_on',
        shipping_terms: 'po_shipping_terms',
        tax_rate: 'po_tax_rate',
        recipient: {
            $nullableBy: 'po_recipient_id',
            $fields: {
                id: 'po_recipient_id',
                display_id: 'po_recipient_display_id',
                prefix: 'po_recipient_prefix',
                firstname_th: 'po_recipient_firstname_th',
                lastname_th: 'po_recipient_lastname_th',
                firstname_en: 'po_recipient_firstname_en',
                lastname_en: 'po_recipient_lastname_en',
                number_id: 'po_recipient_number_id',
                department: {
                    $nullableBy: 'po_recipient_department_id',
                    $fields: {
                        id: 'po_recipient_department_id',
                        name: {
                            $locale: {
                                th: 'po_recipient_department_name_th',
                                en: 'po_recipient_department_name_en'
                            }
                        }
                    }
                },
                position: {
                    $nullableBy: 'po_recipient_position_id',
                    $fields: {
                        id: 'po_recipient_position_id',
                        name: {
                            $locale: {
                                th: 'po_recipient_position_name_th',
                                en: 'po_recipient_position_name_en'
                            }
                        }
                    }
                },
                email: 'po_recipient_email',
                phone: 'po_recipient_phone'
            }
        },
        comment: 'po_comment',
        status_date: {
            $fields: {
                sent_date: 'po_status_sent_date',
                goods_received_date: {
                    $from: ['po_status_goods_received_date', 'po_status_goods_received_']
                },
                paid_date: 'po_status_paid_date'
            }
        },
        status_note: 'po_status_note',
        details: {
            $from: 'details',
            $default: [],
            $each: {
                id: 'id',
                po_id: 'po_id',
                material: {
                    $fields: {
                        id: 'material_id',
                        name: 'material_name',
                        shape_type: 'material_shape_type'
                    }
                },
                required_length_mm: 'required_length_mm',
                required_width_mm: 'required_width_mm',
                required_thickness_mm: 'required_thickness_mm',
                required_diameter_mm: 'required_diameter_mm',
                cut_quantity: 'cut_quantity',
                remaining_quantity: 'remaining_quantity',
                allow_wastrel: 'allow_wastrel',
                allow_rotation: 'allow_rotation',
                status: 'status',
                remark: 'remark',
                on: 'on',
                unit: 'unit',
                description: 'description',
                qty: 'qty',
                discount: 'discount',
                unit_price: 'unit_price',
                total: 'total',
                created_at: 'created_at',
                updated_at: 'updated_at',
                emp: {
                    $from: 'emp',
                    $fields: {
                        id: 'id',
                        prefix: 'prefix',
                        name: 'name'
                    }
                }
            }
        },
        price_summary: {
            $fields: {
                subtotal: { $from: 'po_subtotal', $default: 0 },
                tax_rate: {
                    $from: ['po_tax_rate_calc', 'po_tax_rate'],
                    $default: 0
                },
                tax: { $from: 'po_tax_amount', $default: 0 },
                total: { $from: 'po_total_amount', $default: 0 }
            }
        },
        created_at: 'po_created_at',
        updated_at: 'po_updated_at',
        emp: {
            $nullableBy: 'po_emp_id',
            $fields: {
                id: 'po_emp_id',
                prefix: 'emp_prefix',
                name: {
                    $locale: {
                        th: { $join: ['po_emp_fname_th', 'po_emp_lname_th'] },
                        en: { $join: ['po_emp_fname_en', 'po_emp_lname_en'] }
                    }
                }
            }
        },
        status: 'po_status',
        project: {
            $nullableBy: 'po_project_id',
            $fields: {
                id: 'po_project_id',
                display_id: 'po_project_display_id',
                name_en: 'po_project_name_en',
                name_th: 'po_project_name_th'
            }
        },
        condition_paid: 'po_condition_paid',
        delivery_address: {
            $fields: {
                subdistrict: {
                    $nullableBy: 'po_delivery_subdistrict_id',
                    $fields: {
                        id: 'po_delivery_subdistrict_id',
                        name: {
                            $locale: {
                                th: 'po_delivery_subdistrict_name_th',
                                en: 'po_delivery_subdistrict_name_en'
                            }
                        }
                    }
                },
                district: {
                    $nullableBy: 'po_delivery_district_id',
                    $fields: {
                        id: 'po_delivery_district_id',
                        name: {
                            $locale: {
                                th: 'po_delivery_district_name_th',
                                en: 'po_delivery_district_name_en'
                            }
                        }
                    }
                },
                province: {
                    $nullableBy: 'po_delivery_province_id',
                    $fields: {
                        id: 'po_delivery_province_id',
                        name: {
                            $locale: {
                                th: 'po_delivery_province_name_th',
                                en: 'po_delivery_province_name_en'
                            }
                        }
                    }
                }
            }
        },
        approved_by: {
            $nullableBy: 'po_approved_by_emp_id',
            $fields: {
                id: 'po_approved_by_emp_id',
                prefix: 'po_approved_by_emp_prefix',
                name: {
                    $locale: {
                        th: 'po_approved_by_emp_name_th',
                        en: 'po_approved_by_emp_name_en'
                    }
                }
            }
        },
        purchasing_fname: 'po_purchasing_fname',
        purchasing_lname: 'po_purchasing_lname'
    }
};
