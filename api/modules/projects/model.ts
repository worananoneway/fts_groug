class _Base {
    constructor(
        public id: number,
        public name: string
    ) {
        this.id = id;
        this.name = name;
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
export class Customer extends _Base {
    constructor(
        public id: number,
        public display_id: string,
        public name: string
    ) {
        super(id, name);
        this.display_id = display_id;
    }
}
export class Emp {
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
export class Manager extends _Base {
    constructor(
        public id: number,
        public display_id: string,
        public prefix: string,
        public name: string
    ) {
        super(id, name);
        this.display_id = display_id;
        this.prefix = prefix;
    }
}
export class Project {
    constructor(
        public id: string,
        public display_id: string,
        public name_th: string,
        public name_en: string,
        public notifications: string[],
        public contact: Contact,
        public customer: Customer,
        public manager: Manager,
        public budget: string,
        public closing_date: string | null,
        public note: string,
        public po_file: string,
        public created_at: Date,
        public updated_at: Date,
        public emp: Emp,
        public status: string
    ) {
        this.id = id;
        this.display_id = display_id;
        this.name_th = name_th;
        this.name_en = name_en;
        this.notifications = notifications;
        this.contact = contact;
        this.customer = customer;
        this.manager = manager;
        this.budget = budget;
        this.closing_date = closing_date;
        this.note = note;
        this.po_file = po_file;
        this.created_at = created_at;
        this.updated_at = updated_at;
        this.emp = emp;
        this.status = status;
    }
}

