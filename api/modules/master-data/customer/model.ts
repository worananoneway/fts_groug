class _Base {
    constructor(
        public id: number,
        public name: string
    ) {
        this.id = id;
        this.name = name;
    }
}
export class Address {
    constructor(
        public detail: string,
        public subdistrict: Subdistrict,
        public district: District,
        public province: Province,
        public postcode: number
    ) {
        this.detail = detail;
        this.subdistrict = subdistrict;
        this.district = district;
        this.province = province;
        this.postcode = postcode;
    }
}
export class Contact {
    constructor(
        public name: string,
        public phone: string,
        public fax: string,
        public email: string
    ) {
        this.name = name;
        this.phone = phone;
        this.fax = fax;
        this.email = email;
    }
}
export class Customer {
    constructor(
        public id: string,
        public display_id: string,
        public name_th: string,
        public name_en: string,
        public tax_id: string,
        public tax_type: string,
        public contact: Contact | null,
        public address: Address | null,
        public branch_type: string,
        public branch_number: string | null,
        public pp20_file: string | null,
        public certificate_file: string | null,
        public created_at: Date,
        public updated_at: Date,
        public employee: Employee,
        public status: string
    ) {
        this.id = id;
        this.display_id = display_id;
        this.name_th = name_th;
        this.name_en = name_en;
        this.tax_id = tax_id;
        this.tax_type = tax_type;
        this.contact = contact;
        this.address = address;
        this.branch_type = branch_type;
        this.branch_number = branch_number;
        this.pp20_file = pp20_file;
        this.certificate_file = certificate_file;
        this.created_at = created_at;
        this.updated_at = updated_at;
        this.employee = employee;
        this.status = status;
    }
}
export class District extends _Base {
    constructor(
        public id: number,
        public name: string
    ) {
        super(id, name);
    }
}
export class Employee {
    constructor(
        public id: string,
        public prefix: string,
        public name: string
    ) {
        this.id = id;
        this.prefix = prefix;
        this.name = name;
    }
}
export class Province extends _Base {
    constructor(
        public id: number,
        public name: string
    ) {
        super(id, name);
    }
}
export class Subdistrict extends _Base {
    constructor(
        public id: number,
        public name: string
    ) {
        super(id, name);
    }
}