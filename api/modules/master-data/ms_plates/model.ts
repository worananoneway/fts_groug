export class MSPlate {
    constructor(
        public id: string,
        public mm_id: string,
        public code: string,
        public length: number,
        public width: number,
        public thickness: number,
        public quantity: number,
        public available_quantity: number,
        public loc_id: string,
        public location_type: string,
        public location: string,
        public status: string,
        public received_date: Date,
        public remark: string,
        public created_at: Date,
        public updated_at: Date,
        public employee?: Employee,
        public material?: Material
    ) {
        this.id = id;
        this.mm_id = mm_id;
        this.code = code;
        this.length = length;
        this.width = width;
        this.thickness = thickness;
        this.quantity = quantity;
        this.available_quantity = available_quantity;
        this.loc_id = loc_id;
        this.location_type = location_type;
        this.location = location;
        this.status = status;
        this.received_date = received_date;
        this.remark = remark;
        this.created_at = created_at;
        this.updated_at = updated_at;
        this.employee = employee;
        this.material = material;
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

export class Material {
    constructor(
        public id: string,
        public name: string,
        public type: string,
    ) {
        this.id = id;
        this.name = name;
        this.type = type;
    }
}