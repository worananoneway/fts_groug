# Customer Module Service Blueprint

พิมพ์เขียวนี้สรุปจากโครงสร้างจริงของ `api/modules/customer` เพื่อใช้เป็นแม่แบบสร้าง service อื่นในโปรเจค modular นี้

## Source ที่ใช้วิเคราะห์

- `api/modules/customer/router.ts`
- `api/modules/customer/controller.ts`
- `api/modules/customer/service.ts`
- `api/modules/customer/model.ts`
- `api/modules/customer/type.ts`
- `api/utils/shared_types.ts`
- `api/utils/input_sanitizer.ts`
- `api/utils/input_validator.ts`
- `data_structure/steel_factory_db_schema_ai_v2.md`
- `data_structure/steel_factory_db_schema_human.md`

หมายเหตุสำคัญ: ใน `steel_factory_db_schema_ai_v2.md` ตาราง `customers` ถูกระบุเป็น `external_dependencies` เท่านั้น โดยมี `orders.ord_cus_id` อ้างถึง `customers.customer_id` และ expected type เป็น `varchar(20)` แต่ไม่มีรายละเอียด column ของ `customers` ครบชุด ดังนั้นรายละเอียด customer field ด้านล่างอ้างจาก service/controller/model ปัจจุบันเป็นหลัก

## โครงสร้าง Module มาตรฐาน

สร้าง service ใหม่ที่ `api/modules/<module_name>/` โดยมีไฟล์หลัก 5 ไฟล์:

```text
api/modules/<module_name>/
  router.ts
  controller.ts
  service.ts
  model.ts
  type.ts
```

บทบาทของแต่ละไฟล์:

| File | หน้าที่หลัก | ห้ามทำ |
| --- | --- | --- |
| `router.ts` | map HTTP method/path ไป controller | validation, SQL, business branching ซับซ้อน |
| `controller.ts` | sanitize, validate, duplicate check, เรียก service, map response/status code | เขียน SQL โดยตรง |
| `service.ts` | ยิงคำสั่ง DB ด้วย `sql_query`, คืน `{ statuscode, error, data }` | ส่ง HTTP response เอง |
| `model.ts` | สร้าง response object/class และกลุ่มข้อมูลย่อย | validate payload, query DB |
| `type.ts` | field names, messages, payload/interface/validation type | runtime logic หนัก ๆ |

## Router Blueprint

`router.ts` ต้องบางที่สุดและทำหน้าที่ endpoint mapping เท่านั้น

```ts
import controller from "./controller";

export default async function (fastify: any, opts: any) {
    fastify.post("/", controller.create);
    fastify.get("/", controller.get);
    fastify.get("/:id", controller.get);
    fastify.put("/:id", controller.update);
    fastify.delete("/:id", controller.soft_delete);
    fastify.patch("/status/:id", controller.update_status);
}
```

Pattern จาก customer:

| Method | Customer route | Controller | ใช้สำหรับ |
| --- | --- | --- | --- |
| `POST` | `/` | `create` | สร้างข้อมูล |
| `GET` | `/` | `get` | list/filter |
| `GET` | `/:customer_id` | `get` | detail by id |
| `PUT` | `/:customer_id` | `update` | update payload หลัก |
| `DELETE` | `/:customer_id` | `soft_delete` | เปลี่ยน status เป็น deleted |
| `PATCH` | `/status/:customer_id` | `update_status` | update status อย่างเดียว |

การ mount route อยู่ใน `server.ts` เช่น customer ใช้ prefix:

```ts
server.register(import("./api/modules/customer/router"), {
    prefix: "/api/:version/accounting/customers"
});
```

## Type Blueprint

`type.ts` ควรรวม contract ที่ controller ใช้ซ้ำ:

```ts
export enum ErrorField {
    ID = "id",
    NAME = "name",
    STATUS = "status",
}

export enum ErrorMessage {
    ID_REQUIRED = "ID is required.",
    NAME_REQUIRED = "Name is required.",
    NAME_MIN_LENGTH = "Name must be at least 2 characters long.",
    NAME_MAX_LENGTH = "Name must be at most 100 characters long.",
    NAME_DUPLICATE = "Name already exists.",
    STATUS_REQUIRED = "Status is required.",
    STATUS_INVALID = "Status is invalid.",
}

export interface Payload {
    name: string;
    status?: string;
}

export interface ValidationError {
    field: ErrorField;
    message: ErrorMessage;
}
```

แนวทางตั้งชื่อ:

- `ErrorField` ใช้ชื่อ field ฝั่ง API payload ไม่ใช่ชื่อ column DB เต็ม เช่น `name_th` แทน `customer_name_th`
- `ErrorMessage` แยก required, invalid, min, max, duplicate ให้ชัด
- `Payload` ใช้ field ที่ client ส่งเข้ามา
- ถ้า service มีผลลัพธ์เฉพาะ เช่น duplicate count หลาย field ให้เพิ่ม interface แยกได้

## Model Blueprint

`model.ts` ใช้จัด response shape โดยเฉพาะข้อมูลที่ join หลายตารางหรือมี object ซ้อน

Pattern จาก customer:

- สร้าง class ย่อยสำหรับ lookup เช่น `Subdistrict`, `District`, `Province`, `Employee`
- สร้าง class กลุ่ม เช่น `Address`, `Contact`
- รวมเป็น class หลัก เช่น `Customer`
- controller เป็นคน map row จาก DB เข้า class และเลือกภาษาจาก `accept-language`

ตัวอย่างรูปแบบ:

```ts
class _Base {
    constructor(
        public id: number,
        public name: string
    ) {}
}

export class Lookup extends _Base {}

export class MainEntity {
    constructor(
        public id: string,
        public name: string,
        public status: string,
        public created_at: Date,
        public updated_at: Date | null
    ) {}
}
```

แนวทาง:

- ถ้า response มี lookup ซ้ำหลายจุด ใช้ `_Base` หรือ class ย่อย
- ถ้า field เป็นกลุ่มตาม domain เช่น address/contact ให้ทำ class แยก
- ถ้า join table มีชื่อไทย/อังกฤษ ให้ service alias column ให้พร้อม แล้ว controller เลือกตาม `lang`

## Service Blueprint

`service.ts` เป็นชั้น DB เท่านั้น ใช้ `sql_query` และคืน `Response` จาก `api/utils/shared_types`

ฟังก์ชันมาตรฐาน:

| Function | หน้าที่ | Success status |
| --- | --- | --- |
| `count_duplicate(conditions)` | นับ unique/domain duplicate ก่อน create/update | `200 OK` |
| `create(payload, emp_id)` | `INSERT ... RETURNING *` | `201 CREATED` |
| `get(conditions, filter)` | `SELECT` พร้อม filter จาก controller | `200 OK` หรือ `404 NOT_FOUND` |
| `update(id, payload, emp_id)` | `UPDATE ... RETURNING id` | `204 NO_CONTENT` หรือ `404 NOT_FOUND` |
| `soft_delete(id, emp_id)` | update status เป็น deleted | `204 NO_CONTENT` หรือ `404 NOT_FOUND` |
| `update_status(id, status, emp_id)` | update status field อย่างเดียว | `204 NO_CONTENT` หรือ `404 NOT_FOUND` |

กติกา service:

- ใช้ parameterized query เท่านั้น เช่น `$1`, `$2`
- รับ `conditions.sql` และ `conditions.params` จาก controller ที่ build ด้วย whitelist เท่านั้น
- ห้ามเอา user input ต่อ string เข้า SQL โดยตรง
- `filter` ต้องเป็น field list ที่ระบบ whitelist แล้ว ถ้ามาจาก request ต้อง validate ก่อน
- ถ้า query สำเร็จแต่ไม่มี row ใน action ที่ต้องเจอข้อมูล ให้คืน `404 NOT_FOUND`
- ถ้าเกิด exception ให้ log ที่ service และคืน `500 INTERNAL_SERVER_ERROR`
- service ไม่ควร import `Reply`, `HttpStatus`, หรือเรียก `reply.code()`

โครง service:

```ts
import sql_query from "@/api/utils/sql_query";
import { Condition, Response, HttpStatusCode } from "@/api/utils/shared_types";
import { Payload } from "./type";

async function get(
    conditions: Condition = { sql: "", params: [] },
    filter: string = "*"
): Promise<Response> {
    const sql = `
        SELECT ${filter}
        FROM public.<table>
        WHERE 1=1${conditions.sql}
        ORDER BY <created_at> DESC;
    `;

    try {
        const result = await sql_query(sql, conditions.params);
        if (result.length === 0) {
            return { statuscode: HttpStatusCode.NOT_FOUND, error: "Not found.", data: null };
        }
        return { statuscode: HttpStatusCode.OK, error: null, data: result };
    } catch (error) {
        console.error("[Service] An error occurred during getting <entity>:", error);
        return { statuscode: HttpStatusCode.INTERNAL_SERVER_ERROR, error, data: null };
    }
}
```

## Controller Blueprint

`controller.ts` เป็นชั้น orchestration:

1. อ่าน `accept-language`
2. อ่าน user จาก auth ถ้าเปิดใช้งานแล้ว
3. sanitize input ด้วย `sanitize_payload`, `sanitize_string`, หรือ `sanitize_input`
4. validate required field จาก schema และ business rule
5. validate type, length, enum, email, digit, date, range
6. duplicate check สำหรับ field ที่ห้ามซ้ำ
7. เรียก service
8. switch `result.statuscode`
9. ส่ง response ตาม `Reply` shape
10. catch error แล้วคืน `500`

Response error shape ที่ใช้ซ้ำ:

```ts
return reply.code(HttpStatusCode.UNPROCESSABLE_CONTENT).send(<Reply>{
    status: HttpStatus.UNPROCESSABLE_CONTENT,
    statuscode: HttpStatusCode.UNPROCESSABLE_CONTENT,
    details: {
        error: ReplyErrorField.VALIDATION_ERROR,
        message: ReplyErrorMessage.VALIDATION_ERROR,
        errors: invalid_fields
    }
});
```

### Create/Update validation flow

ใช้ flow นี้กับ `create` และ `update`:

1. `const payload: Payload = sanitize_payload(request.body);`
2. สร้าง `const invalid_fields: ValidationError[] = [];`
3. เช็ค required จาก DB `not_null` และ business rule
4. เช็คความยาวจาก `varchar(n)` และ text/domain max
5. เช็ค minimum length ตาม domain เช่น name/code ขั้นต่ำ 2 ตัวอักษร ถ้ามี rule เฉพาะให้ override
6. เช็ค enum ด้วย `is_enum_key`
7. normalize enum หลังผ่าน validation แล้วเท่านั้น
8. เช็ค email/digit/date/range
9. ถ้ามี invalid คืน `422`
10. เรียก `service.count_duplicate`
11. ถ้าซ้ำคืน `409`
12. เรียก `service.create` หรือ `service.update`
13. switch status แล้วคืน response

ข้อควรระวังจาก customer: อย่าเขียน enum normalization แบบ `if (field && invalid) ... else normalize` เพราะถ้า field หาย `else` จะเรียก `.toUpperCase()` บน `undefined` ได้ ควรแยกเป็น required check, enum check, แล้วค่อย normalize

ตัวอย่าง enum validation ที่ปลอดภัย:

```ts
if (!payload.status) {
    invalid_fields.push({ field: ErrorField.STATUS, message: ErrorMessage.STATUS_REQUIRED });
} else if (!is_enum_key(status_enum, payload.status)) {
    invalid_fields.push({ field: ErrorField.STATUS, message: ErrorMessage.STATUS_INVALID });
} else {
    payload.status = Status[payload.status.toUpperCase() as keyof typeof Status];
}
```

### Get validation flow

ใช้ `Condition` สำหรับ query filter:

```ts
const conditions: Condition = { sql: "", params: [] };

if (request.params.id) {
    conditions.params.push(sanitize_string(request.params.id));
    conditions.sql += ` AND <id_column> = $${conditions.params.length} `;
}

if (request.query.status && is_enum_key(status_enum, request.query.status)) {
    conditions.params.push(Status[request.query.status.toUpperCase() as keyof typeof Status]);
    conditions.sql += ` AND <status_column> = $${conditions.params.length} `;
}
```

กติกา:

- query field ทุกตัวต้อง whitelist
- enum query ต้อง validate ก่อน push เข้า conditions
- invalid query คืน `422`
- `GET /` และ `GET /:id` ใช้ controller/service เดียวกันได้
- map row เป็น model ก่อนส่ง response ถ้าต้องซ่อน prefix DB หรือจัดกลุ่มข้อมูล

### Soft delete flow

1. require id จาก params
2. sanitize id
3. `service.get` เพื่อตรวจว่ามีข้อมูลจริง
4. ตรวจ status conflict เช่น deleted/inactive ซ้ำ
5. เรียก `service.soft_delete`
6. success คืน `204`

ข้อควรระวัง: ให้ status ที่ controller ตรวจ conflict ตรงกับ status ที่ service ใช้จริง เช่นถ้า service set เป็น `Deleted` ก็ไม่ควรเช็คแค่ `Inactive`

### Update status flow

1. require id และ `status`
2. sanitize status
3. validate enum
4. normalize enum value
5. ตรวจว่าข้อมูลมีอยู่จริง
6. เรียก `service.update_status`
7. success คืน `204`

## Schema-driven Validation Rules

ใช้ schema เป็น source หลักก่อนเขียน controller:

| DB metadata | Controller rule |
| --- | --- |
| `primary_key: true` + default generated | ไม่ต้องรับจาก payload ตอน create |
| `nullable: false` และ `default: null` | required |
| `nullable: false` แต่มี default เช่น status/created_at | ไม่ต้อง required ถ้า service/DB เติมให้ |
| `varchar(n)` | เช็ค max length `n` |
| `text` | optional max ตาม business rule ถ้าจำเป็น |
| `int4`, `int8` | เช็ค digit/integer และ range ตามชนิด |
| `numeric`, `decimal` | เช็ค number และ precision/scale ถ้า schema ระบุ |
| `date`, `timestamptz` | เช็ค valid date format |
| PostgreSQL enum | ใช้ enum ใน `shared_types.ts` หรือเพิ่ม enum ใหม่ แล้ว validate ด้วย `is_enum_key` |
| `unique_constraints` | เพิ่ม duplicate check |
| foreign key | validate type/length ก่อน และพิจารณา existence check ถ้าต้องการ error ที่อ่านง่าย |

Minimum length:

- default สำหรับชื่อ/code ที่เป็น `varchar` ควรเริ่มที่ 2 ตัวอักษร ถ้าไม่มี business rule อื่น
- customer ปัจจุบันใช้ `name_th` และ `name_en` ขั้นต่ำ 5 ตัวอักษร
- ID/code/tax fields ใช้ format เฉพาะแทน min length ธรรมดา

Field ที่ควรพิจารณาห้ามซ้ำ:

- column ใน `unique_constraints`
- natural key เช่น `*_code`, `*_no`, `tax_id`, เลขบัตรประชาชน, เลขทะเบียน, email login
- ชื่อซ้ำที่กระทบงานจริง เช่น customer/supplier name ถ้า domain ต้องการ
- ตอน update ต้อง exclude row ปัจจุบัน เช่น `AND <id_column> != $n`

## Customer Pattern ที่ถอดได้

Customer มี field สำคัญที่อนุมานจาก service/controller:

| API payload | DB column | Validation ปัจจุบัน |
| --- | --- | --- |
| `name_th` | `customer_name_th` | required, min 5, max 100, duplicate |
| `name_en` | `customer_name_en` | optional จาก required check ปัจจุบัน, min 5 ถ้ามีค่า, max 100, duplicate |
| `tax_id` | `customer_tax_id` | required, exactly 13 digits, duplicate |
| `tax_type` | `customer_tax_type` | enum `TaxType` |
| `contact_name` | `customer_contact_name` | max 100 |
| `contact_phone` | `customer_contact_phone` | max 20 |
| `contact_fax` | `customer_contact_fax` | max 20 |
| `contact_email` | `customer_contact_email` | email format, max 150 |
| `address` | `customer_address` | max 268435455 |
| `subdistrict_id` | `customer_subdistrict_id` | required, digit |
| `district_id` | `customer_district_id` | required, digit |
| `province_id` | `customer_province_id` | required, digit |
| `postcode` | `customer_postcode` | required |
| `branch_type` | `customer_branch_type` | enum `BranchType` |
| `branch_number` | `customer_branch_number` | max 20 |
| `status` | `customer_status` | enum `Status` เฉพาะ update status/get filter |

Customer duplicate check:

- `customer_tax_id`
- `customer_name_th`
- `customer_name_en`

Customer joins ใน `get`:

- `subdistricts` จาก `customer_subdistrict_id`
- `districts` จาก `customer_district_id`
- `provinces` จาก `customer_province_id`
- `employees` จาก `customer_emp_id`

Customer query filters:

- `branch_type`
- `status`
- `tax_type`
- `customer_id` จาก params

## Status Code Contract

| Case | Status code | Response details |
| --- | --- | --- |
| create success | `201 CREATED` | message และข้อมูล row ที่สร้าง |
| get success | `200 OK` | list/detail ใน key ของ entity |
| update success | `204 NO_CONTENT` | message |
| soft delete success | `204 NO_CONTENT` | message |
| update status success | `204 NO_CONTENT` | message |
| missing required params เฉพาะบาง action | `400 BAD_REQUEST` | validation error |
| validation ผิดจาก payload/query | `422 UNPROCESSABLE_CONTENT` | `errors: ValidationError[]` |
| duplicate | `409 CONFLICT` | `duplicates: ValidationError[]` |
| not found | `404 NOT_FOUND` | common not found message |
| service/db error | `500 INTERNAL_SERVER_ERROR` | common internal message |
| service status ไม่รู้จัก | `500 INTERNAL_SERVER_ERROR` | `UNRECOGNIZED_STATUSCODE` |

หมายเหตุ: customer ปัจจุบันส่ง body พร้อม `204 NO_CONTENT` ตาม pattern เดิม ถ้าจะเปลี่ยนเป็น `200` หรือไม่ส่ง body ต้องให้ Claude review เพราะเป็น production behavior change

## Step-by-step สำหรับสร้าง Service ใหม่

1. อ่าน schema ของ table เป้าหมายจาก `data_structure/steel_factory_db_schema_ai_v2.md`
2. ทำ field matrix: column, type, nullable, default, primary key, unique, FK, enum
3. ตัดสิน payload fields โดยตัด prefix DB ออก เช่น `customer_name_th` เป็น `name_th`
4. ระบุ required fields จาก `not_null` ที่ไม่มี default และไม่ใช่ generated field
5. ระบุ duplicate fields จาก unique/domain key
6. เพิ่ม enum ใน `shared_types.ts` เฉพาะเมื่อ schema/domain ต้องใช้จริง
7. สร้าง `type.ts` ก่อน เพื่อให้ controller มี field/message กลาง
8. สร้าง `model.ts` ตาม response shape และ joined lookup
9. สร้าง `service.ts` ด้วย parameterized SQL
10. สร้าง `controller.ts` ด้วย validation flow ด้านบน
11. สร้าง `router.ts` แบบบาง
12. register route ใน `server.ts`
13. ทดสอบ create/get/update/delete/update_status และ invalid cases

## Pre-build Checklist

ก่อนเขียน service ใหม่ให้ตอบคำถามนี้ให้ครบ:

- Table name และ prefix column คืออะไร
- Primary key field คืออะไร และ generated โดย DB หรือไม่
- Field ไหน required จาก DB
- Field ไหน required เพิ่มจาก business rule
- Field ไหนมี max length จาก `varchar(n)`
- Field ไหนควรมี min length เช่น name/code
- Field ไหนเป็น enum และ enum อยู่ที่ไหน
- Field ไหนเป็น unique หรือ natural key
- Field ไหนเป็น FK และต้อง join อะไรตอน get
- Status lifecycle ใช้ค่าอะไรบ้าง เช่น `Active`, `Inactive`, `Deleted`
- Soft delete ใช้ column ไหน และใช้ status ค่าอะไร
- Response ต้อง group field เป็น model ย่อยไหม
- ต้องรองรับภาษาไทย/อังกฤษจาก `accept-language` ไหม

## Test Checklist

อย่างน้อยควรมี manual/API test หรือ automated test สำหรับ:

- create success
- create missing required field
- create invalid enum
- create over max length
- create duplicate natural key
- get list
- get by id success
- get by id not found
- get invalid query enum
- update success
- update duplicate excluding current id
- soft delete success
- soft delete already deleted/inactive conflict
- update status success
- update status invalid enum
- service/db error path ถ้ามี test double ได้

## สิ่งที่ต้องส่งให้ Claude review ก่อน

ตาม workflow โปรเจค ให้หยุดขอ review ถ้างานใหม่มีผลกับ:

- architecture หรือการแบ่งชั้นของ module
- DB design, migration, constraint, enum ใน DB
- quant logic
- production-critical behavior
- เปลี่ยน status code contract เดิม
- เปลี่ยน semantics ของ soft delete/status lifecycle

