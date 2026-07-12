import { FastifyReply, FastifyRequest } from 'fastify';
import service from './service';
import {
    CalculationPayload,
    CalculationPlan,
    DemandItem,
    DemandPiece,
    ErrorField,
    ErrorMessage,
    FreeRect,
    PatternSummary,
    PlateCut,
    PlatePack,
    PlatePlacementChoice,
    PlateSourcePlan,
    PlateStockSource,
    PlateWastrelRectangle,
    ProposedPlateWastrel,
    ProposedRoundWastrel,
    RoundBarStockSource,
    RoundCut,
    RoundPack,
    RoundSourcePlan,
    ShapeType,
    SourceState,
    UnfulfilledDemand,
    ValidationError,
} from './type';

import {
    Condition,
    HttpStatus,
    HttpStatusCode,
    Reply,
    ReplyErrorField,
    ReplyErrorMessage,
} from '@/api/utils/shared_types';

async function calculate_steel_round_bars(
    demands: DemandItem[],
    order_id: string | null,
    round_bar_conditions: Condition,
    wastrel_round_bar_conditions: Condition
): Promise<{
    demand_quantity: number;
    fulfilled_quantity: number;
    source_plans: RoundSourcePlan[];
    pattern_summary: PatternSummary[];
    unfulfilled: UnfulfilledDemand[];
    wastrel: ProposedRoundWastrel[];
}> {
    const [
        wastrel_round_bar_result,
        round_bar_result,
    ] = await Promise.all([
        service.get_wastrel_steel_round_bars(wastrel_round_bar_conditions),
        service.get_steel_round_bars(round_bar_conditions),
    ]);

    if (
        wastrel_round_bar_result.statuscode !== HttpStatusCode.OK
        || round_bar_result.statuscode !== HttpStatusCode.OK
    ) {
        throw new Error("Failed to get steel round bar stock data.");
    }

    const round_sources: RoundBarStockSource[] = [
        ...((wastrel_round_bar_result.data ?? []) as Record<string, unknown>[]).map(map_wastrel_round_bar),
        ...((round_bar_result.data ?? []) as Record<string, unknown>[]).map(map_round_bar),
    ].filter(source => source.length > 0 && source.available_quantity > 0);

    return plan_round_bars(demands, round_sources, order_id);
}

async function calculate_ms_plates(
    demands: DemandItem[],
    order_id: string | null,
    ms_plate_conditions: Condition,
    wastrel_ms_plate_conditions: Condition
): Promise<{
    demand_quantity: number;
    fulfilled_quantity: number;
    source_plans: PlateSourcePlan[];
    pattern_summary: PatternSummary[];
    unfulfilled: UnfulfilledDemand[];
    wastrel: ProposedPlateWastrel[];
}> {
    const [
        wastrel_ms_plate_result,
        ms_plate_result,
    ] = await Promise.all([
        service.get_wastrel_ms_plates(wastrel_ms_plate_conditions),
        service.get_ms_plates(ms_plate_conditions),
    ]);

    if (
        wastrel_ms_plate_result.statuscode !== HttpStatusCode.OK
        || ms_plate_result.statuscode !== HttpStatusCode.OK
    ) {
        throw new Error("Failed to get MS plate stock data.");
    }

    const plate_sources: PlateStockSource[] = [
        ...((wastrel_ms_plate_result.data ?? []) as Record<string, unknown>[]).map(map_wastrel_ms_plate),
        ...((ms_plate_result.data ?? []) as Record<string, unknown>[]).map(map_ms_plate),
    ].filter(source => source.length > 0 && source.width > 0 && source.available_quantity > 0);

    return plan_ms_plates(demands, plate_sources, order_id);
}


async function calculation_division(
    request: FastifyRequest<{ Body: CalculationPayload }>,
    reply: FastifyReply
) {
    try {
        const payload = sanitize_value(request.body) as CalculationPayload;
        const invalid_fields = validate_payload(payload);

        if (invalid_fields.length > 0) {
            console.error("[Controller] Validation errors found in calculation division payload:", invalid_fields);
            return reply.code(HttpStatusCode.UNPROCESSABLE_CONTENT).send(<Reply>{
                status: HttpStatus.UNPROCESSABLE_CONTENT,
                statuscode: HttpStatusCode.UNPROCESSABLE_CONTENT,
                details: {
                    error: ReplyErrorField.VALIDATION_ERROR,
                    message: ReplyErrorMessage.VALIDATION_ERROR,
                    errors: invalid_fields
                }
            });
        }

        const payload_record = payload as Record<string, unknown>;
        const order_id = get_string(payload_record, ['order_id', 'po_id']);
        const unit = get_string(payload_record, ['unit']) ?? 'input_unit';
        const srb_id = get_string(payload_record, ['srb_id']);
        const msp_id = get_string(payload_record, ['msp_id']);
        const demands = normalize_payload_demands(payload, order_id);

        const round_bar_conditions: Condition = { sql: '', params: [] };
        const wastrel_round_bar_conditions: Condition = { sql: '', params: [] };
        const ms_plate_conditions: Condition = { sql: '', params: [] };
        const wastrel_ms_plate_conditions: Condition = { sql: '', params: [] };

        if (srb_id) {
            round_bar_conditions.params.push(srb_id);
            round_bar_conditions.sql += ` AND srb_id = $${round_bar_conditions.params.length} `;

            wastrel_round_bar_conditions.params.push(srb_id);
            wastrel_round_bar_conditions.sql += ` AND wsrb_srb_id = $${wastrel_round_bar_conditions.params.length} `;
        }
        if (msp_id) {
            ms_plate_conditions.params.push(msp_id);
            ms_plate_conditions.sql += ` AND msp_id = $${ms_plate_conditions.params.length} `;

            wastrel_ms_plate_conditions.params.push(msp_id);
            wastrel_ms_plate_conditions.sql += ` AND wmsp_msp_id = $${wastrel_ms_plate_conditions.params.length} `;
        }

        let round_result: Awaited<ReturnType<typeof calculate_steel_round_bars>> = {
            demand_quantity: 0,
            fulfilled_quantity: 0,
            source_plans: [],
            pattern_summary: [],
            unfulfilled: [],
            wastrel: [],
        };
        let plate_result: Awaited<ReturnType<typeof calculate_ms_plates>> = {
            demand_quantity: 0,
            fulfilled_quantity: 0,
            source_plans: [],
            pattern_summary: [],
            unfulfilled: [],
            wastrel: [],
        };

        if (srb_id && msp_id) {
            [round_result, plate_result] = await Promise.all([
                calculate_steel_round_bars(
                    demands.filter(demand => demand.shape_type === 'Round_bar'),
                    order_id,
                    round_bar_conditions,
                    wastrel_round_bar_conditions
                ),
                calculate_ms_plates(
                    demands.filter(demand => demand.shape_type === 'Ms_plate'),
                    order_id,
                    ms_plate_conditions,
                    wastrel_ms_plate_conditions
                ),
            ]);
        } else if (srb_id) {
            round_result = await calculate_steel_round_bars(
                demands.filter(demand => demand.shape_type === 'Round_bar'),
                order_id,
                round_bar_conditions,
                wastrel_round_bar_conditions
            );
        } else if (msp_id) {
            plate_result = await calculate_ms_plates(
                demands.filter(demand => demand.shape_type === 'Ms_plate'),
                order_id,
                ms_plate_conditions,
                wastrel_ms_plate_conditions
            );
        }

        const calculation_plan: CalculationPlan = {
            order_id,
            unit,
            generated_at: new Date().toISOString(),
            persisted: false,
            strategy: {
                stock_preference: "Use wastrel stock first when a matching wastrel can fit at least one remaining piece; use normal stock only after matching wastrel is exhausted.",
                round_bars: "Wastrel-first best-fit decreasing one-dimensional cutting heuristic.",
                ms_plates: "Wastrel-first max-rects two-dimensional packing heuristic with optional per-item rotation.",
                note: "This endpoint calculates and returns JSONB-ready planning data only; it does not update stock or insert wastrel rows.",
            },
            fulfilled: round_result.unfulfilled.length === 0 && plate_result.unfulfilled.length === 0,
            round_bars: {
                demand_quantity: round_result.demand_quantity,
                fulfilled_quantity: round_result.fulfilled_quantity,
                source_plans: round_result.source_plans,
                pattern_summary: round_result.pattern_summary,
                unfulfilled: round_result.unfulfilled,
            },
            ms_plates: {
                demand_quantity: plate_result.demand_quantity,
                fulfilled_quantity: plate_result.fulfilled_quantity,
                source_plans: plate_result.source_plans,
                pattern_summary: plate_result.pattern_summary,
                unfulfilled: plate_result.unfulfilled,
            },
            wastrel_to_create: {
                steel_round_bars: round_result.wastrel,
                ms_plates: plate_result.wastrel,
            },
            totals: {
                round_used_length: round3(round_result.source_plans.reduce((sum, plan_item) => sum + plan_item.used_length, 0)),
                round_wastrel_length: round3(round_result.source_plans.reduce((sum, plan_item) => sum + plan_item.wastrel_length, 0)),
                plate_used_area: round3(plate_result.source_plans.reduce((sum, plan_item) => sum + plan_item.used_area, 0)),
                plate_wastrel_area: round3(plate_result.source_plans.reduce((sum, plan_item) => sum + plan_item.wastrel_area, 0)),
            },
        };

        console.log(`[Controller] ${module_name} calculated successfully.`);
        return reply.code(HttpStatusCode.OK).send(<Reply>{
            status: HttpStatus.OK,
            statuscode: HttpStatusCode.OK,
            details: {
                message: `${module_name} calculated successfully.`,
                calculation_plan,
                jsonb_payload: calculation_plan,
            }
        });
    } catch (error) {
        console.error("[Controller] An error occurred during calculation division:", error);
        return reply.code(HttpStatusCode.INTERNAL_SERVER_ERROR).send(<Reply>{
            status: HttpStatus.INTERNAL_SERVER_ERROR,
            statuscode: HttpStatusCode.INTERNAL_SERVER_ERROR,
            details: {
                error: ReplyErrorField.INTERNAL_SERVER_ERROR,
                message: ReplyErrorMessage.INTERNAL_SERVER_ERROR
            }
        });
    }
}
const EPSILON = 0.000001;
const module_name = 'Calculation Division';

const round3 = (value: number): number => Math.round((value + Number.EPSILON) * 1000) / 1000;

const sanitize_value = (value: unknown): unknown => {
    if (typeof value === 'string') {
        return value.normalize('NFKC').replaceAll(/<.*?>/g, '').trim();
    }
    if (typeof value === 'number' || typeof value === 'boolean' || value === null || value === undefined) {
        return value;
    }
    if (Array.isArray(value)) {
        return value.map(item => sanitize_value(item));
    }
    if (typeof value === 'object') {
        const sanitized: Record<string, unknown> = {};
        for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
            sanitized[key] = sanitize_value(item);
        }
        return sanitized;
    }
    return value;
};

const is_record = (value: unknown): value is Record<string, unknown> => {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
};

const to_number = (value: unknown): number | null => {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return value;
    }
    if (typeof value === 'string' && value.trim() !== '') {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
};

const to_integer = (value: unknown): number | null => {
    const parsed = to_number(value);
    if (parsed === null || !Number.isInteger(parsed) || parsed <= 0) {
        return null;
    }
    return parsed;
};

const to_string_or_null = (value: unknown): string | null => {
    if (typeof value !== 'string') {
        return null;
    }
    const trimmed = value.trim();
    return trimmed === '' ? null : trimmed;
};

const get_number = (payload: Record<string, unknown>, keys: string[]): number | null => {
    for (const key of keys) {
        if (Object.prototype.hasOwnProperty.call(payload, key)) {
            const value = to_number(payload[key]);
            if (value !== null) {
                return round3(value);
            }
        }
    }
    return null;
};

const get_string = (payload: Record<string, unknown>, keys: string[]): string | null => {
    for (const key of keys) {
        if (Object.prototype.hasOwnProperty.call(payload, key)) {
            const value = to_string_or_null(payload[key]);
            if (value !== null) {
                return value;
            }
        }
    }
    return null;
};

const get_boolean = (payload: Record<string, unknown>, keys: string[], default_value: boolean): boolean => {
    for (const key of keys) {
        if (!Object.prototype.hasOwnProperty.call(payload, key)) {
            continue;
        }
        const value = payload[key];
        if (typeof value === 'boolean') {
            return value;
        }
        if (typeof value === 'string') {
            const lowered = value.toLowerCase();
            if (lowered === 'true') {
                return true;
            }
            if (lowered === 'false') {
                return false;
            }
        }
    }
    return default_value;
};

const normalize_shape_type = (value: unknown, fallback: ShapeType | null = null): ShapeType | null => {
    if (typeof value !== 'string') {
        return fallback;
    }
    const normalized = value.toLowerCase().replaceAll('-', '_').replaceAll(' ', '_');
    if (['round_bar', 'roundbar', 'steel_round_bar', 'steel_round_bars'].includes(normalized)) {
        return 'Round_bar';
    }
    if (['ms_plate', 'ms_plates', 'plate', 'msp'].includes(normalized)) {
        return 'Ms_plate';
    }
    return fallback;
};

const as_array = (value: unknown): Record<string, unknown>[] => {
    if (!Array.isArray(value)) {
        return [];
    }
    return value.filter((item): item is Record<string, unknown> => is_record(item));
};

const collect_payload_items = (
    payload: Record<string, unknown>
): Array<{ item: Record<string, unknown>; shape_type: ShapeType | null; index: number }> => {
    const rows: Array<{ item: Record<string, unknown>; shape_type: ShapeType | null; index: number }> = [];
    const add_rows = (value: unknown, fallback: ShapeType | null) => {
        for (const row of as_array(value)) {
            rows.push({
                item: row,
                shape_type: normalize_shape_type(row.shape_type, fallback),
                index: rows.length,
            });
        }
    };

    add_rows(payload.items, null);
    add_rows(payload.round_bars, 'Round_bar');
    add_rows(payload.ms_plates, 'Ms_plate');
    return rows;
};

const validate_payload = (payload: unknown): ValidationError[] => {
    const invalid_fields: ValidationError[] = [];
    if (!is_record(payload)) {
        return [{
            field: ErrorField.BODY,
            message: ErrorMessage.BODY_REQUIRED,
        }];
    }

    for (const field of ['items', 'round_bars', 'ms_plates']) {
        if (payload[field] !== undefined && !Array.isArray(payload[field])) {
            invalid_fields.push({
                field: ErrorField.ITEMS,
                message: ErrorMessage.ITEMS_INVALID,
            });
        }
    }

    const srb_id = get_string(payload, ['srb_id']);
    const msp_id = get_string(payload, ['msp_id']);
    if (!srb_id && !msp_id) {
        invalid_fields.push({
            field: ErrorField.SRB_ID,
            message: ErrorMessage.SRB_OR_MSP_REQUIRED,
        });
    }
    if (payload.srb_id !== undefined && !srb_id) {
        invalid_fields.push({
            field: ErrorField.SRB_ID,
            message: ErrorMessage.SRB_ID_INVALID,
        });
    }
    if (payload.msp_id !== undefined && !msp_id) {
        invalid_fields.push({
            field: ErrorField.MSP_ID,
            message: ErrorMessage.MSP_ID_INVALID,
        });
    }

    const rows = collect_payload_items(payload);
    if (rows.length === 0) {
        invalid_fields.push({
            field: ErrorField.ITEMS,
            message: ErrorMessage.ITEMS_REQUIRED,
        });
    }

    for (const row of rows) {
        if (!row.shape_type) {
            invalid_fields.push({
                field: ErrorField.SHAPE_TYPE,
                message: ErrorMessage.SHAPE_TYPE_INVALID,
                index: row.index,
            });
        }
        if (get_number(row.item, ['length', 'required_length', 'required_length_mm']) === null) {
            invalid_fields.push({
                field: ErrorField.LENGTH,
                message: row.item.length === undefined && row.item.required_length === undefined && row.item.required_length_mm === undefined
                    ? ErrorMessage.LENGTH_REQUIRED
                    : ErrorMessage.LENGTH_INVALID,
                index: row.index,
            });
        }
        if (row.shape_type === 'Ms_plate' && get_number(row.item, ['width', 'required_width', 'required_width_mm']) === null) {
            invalid_fields.push({
                field: ErrorField.WIDTH,
                message: row.item.width === undefined && row.item.required_width === undefined && row.item.required_width_mm === undefined
                    ? ErrorMessage.WIDTH_REQUIRED
                    : ErrorMessage.WIDTH_INVALID,
                index: row.index,
            });
        }
        if (to_integer(row.item.quantity) === null) {
            invalid_fields.push({
                field: ErrorField.QUANTITY,
                message: row.item.quantity === undefined
                    ? ErrorMessage.QUANTITY_REQUIRED
                    : ErrorMessage.QUANTITY_INVALID,
                index: row.index,
            });
        }
    }

    return invalid_fields;
};

const normalize_payload_demands = (payload: CalculationPayload, order_id: string | null): DemandItem[] => {
    const payload_record = payload as Record<string, unknown>;
    return collect_payload_items(payload_record)
        .map((entry): DemandItem | null => {
            const row = entry.item;
            const shape_type = entry.shape_type;
            const length = get_number(row, ['length', 'required_length', 'required_length_mm']);
            const quantity = to_integer(row.quantity);
            const width = get_number(row, ['width', 'required_width', 'required_width_mm']);

            if (!shape_type || length === null || length <= 0 || quantity === null) {
                return null;
            }
            if (shape_type === 'Ms_plate' && (width === null || width <= 0)) {
                return null;
            }

            const demand_id = get_string(row, ['order_detail_id', 'podetail_id']) ?? `manual-${shape_type}-${entry.index + 1}`;
            return {
                id: demand_id,
                shape_type,
                order_id,
                order_detail_id: get_string(row, ['order_detail_id', 'podetail_id']),
                material_master_id: get_string(row, ['material_master_id', 'mm_id']),
                length,
                width: shape_type === 'Ms_plate' ? width : null,
                thickness: get_number(row, ['thickness', 'required_thickness', 'required_thickness_mm']),
                diameter: get_number(row, ['diameter', 'required_diameter', 'required_diameter_mm']),
                quantity,
                allow_rotation: get_boolean(row, ['allow_rotation', 'odd_allow_rotation'], false),
                allow_wastrel: get_boolean(row, ['allow_wastrel', 'odd_allow_wastrel'], true),
                remark: get_string(row, ['remark', 'odd_remark']),
            };
        })
        .filter((item): item is DemandItem => item !== null);
};

const map_wastrel_round_bar = (row: Record<string, unknown>): RoundBarStockSource => ({
    stock_type: 'Wastrel_round_bar',
    id: String(row.wsrb_id),
    code: String(row.wsrb_code),
    material_master_id: String(row.wsrb_mm_id),
    parent_stock_id: to_string_or_null(row.wsrb_srb_id),
    diameter: round3(to_number(row.wsrb_diameter) ?? 0),
    length: round3(to_number(row.wsrb_length) ?? 0),
    available_quantity: to_integer(row.wsrb_available_quantity) ?? 0,
    location_id: to_string_or_null(row.wsrb_loc_id),
    location_type: to_string_or_null(row.wsrb_location_type),
    location: to_string_or_null(row.wsrb_location),
    status: String(row.wsrb_status),
});

const map_round_bar = (row: Record<string, unknown>): RoundBarStockSource => ({
    stock_type: 'Round_bar',
    id: String(row.srb_id),
    code: String(row.srb_code),
    material_master_id: String(row.srb_mm_id),
    parent_stock_id: null,
    diameter: round3(to_number(row.srb_diameter) ?? 0),
    length: round3(to_number(row.srb_length) ?? 0),
    available_quantity: to_integer(row.srb_available_quantity) ?? 0,
    location_id: to_string_or_null(row.srb_loc_id),
    location_type: to_string_or_null(row.srb_location_type),
    location: to_string_or_null(row.srb_location),
    status: String(row.srb_status),
});

const map_wastrel_ms_plate = (row: Record<string, unknown>): PlateStockSource => ({
    stock_type: 'Wastrel_ms_plate',
    id: String(row.wmsp_id),
    code: String(row.wmsp_stock_code),
    material_master_id: String(row.wmsp_mm_id),
    parent_stock_id: to_string_or_null(row.wmsp_msp_id),
    length: round3(to_number(row.wmsp_length) ?? 0),
    width: round3(to_number(row.wmsp_width) ?? 0),
    thickness: round3(to_number(row.wmsp_thickness) ?? 0),
    available_quantity: to_integer(row.wmsp_available_quantity) ?? 0,
    location_id: to_string_or_null(row.wmsp_loc_id),
    location_type: to_string_or_null(row.wmsp_location_type),
    location: to_string_or_null(row.wmsp_location),
    status: String(row.wmsp_status),
});

const map_ms_plate = (row: Record<string, unknown>): PlateStockSource => ({
    stock_type: 'Ms_plate',
    id: String(row.msp_id),
    code: String(row.msp_code),
    material_master_id: String(row.msp_mm_id),
    parent_stock_id: null,
    length: round3(to_number(row.msp_length) ?? 0),
    width: round3(to_number(row.msp_width) ?? 0),
    thickness: round3(to_number(row.msp_thickness) ?? 0),
    available_quantity: to_integer(row.msp_available_quantity) ?? 0,
    location_id: to_string_or_null(row.msp_loc_id),
    location_type: to_string_or_null(row.msp_location_type),
    location: to_string_or_null(row.msp_location),
    status: String(row.msp_status),
});

const expand_demand_pieces = (demands: DemandItem[]): DemandPiece[] => {
    const pieces: DemandPiece[] = [];
    for (const demand of demands) {
        for (let sequence = 1; sequence <= demand.quantity; sequence += 1) {
            pieces.push({
                ...demand,
                piece_id: `${demand.id}-${sequence}`,
                sequence,
                quantity: 1,
            });
        }
    }
    return pieces;
};

const numbers_equal = (left: number | null, right: number | null): boolean => {
    if (left === null || right === null) {
        return true;
    }
    return Math.abs(left - right) <= 0.001;
};

const round_source_matches_piece = (source: RoundBarStockSource, piece: DemandPiece): boolean => {
    if (source.stock_type === 'Wastrel_round_bar' && !piece.allow_wastrel) {
        return false;
    }
    if (piece.material_master_id && source.material_master_id !== piece.material_master_id) {
        return false;
    }
    if (!numbers_equal(source.diameter, piece.diameter)) {
        return false;
    }
    return source.length + EPSILON >= piece.length;
};

const plate_source_matches_piece = (source: PlateStockSource, piece: DemandPiece): boolean => {
    if (source.stock_type === 'Wastrel_ms_plate' && !piece.allow_wastrel) {
        return false;
    }
    if (piece.material_master_id && source.material_master_id !== piece.material_master_id) {
        return false;
    }
    if (!numbers_equal(source.thickness, piece.thickness)) {
        return false;
    }
    if (piece.width === null) {
        return false;
    }
    const fits_without_rotation = source.length + EPSILON >= piece.length && source.width + EPSILON >= piece.width;
    const fits_with_rotation = piece.allow_rotation
        && source.length + EPSILON >= piece.width
        && source.width + EPSILON >= piece.length;
    return fits_without_rotation || fits_with_rotation;
};

const pack_round_source = (source: RoundBarStockSource, pieces: DemandPiece[]): RoundPack => {
    const cuts: RoundCut[] = [];
    let cursor = 0;
    const sorted_pieces = [...pieces]
        .filter(piece => round_source_matches_piece(source, piece))
        .sort((a, b) => b.length - a.length || a.sequence - b.sequence);

    for (const piece of sorted_pieces) {
        if (cursor + piece.length > source.length + EPSILON) {
            continue;
        }
        const position_start = round3(cursor);
        const position_end = round3(cursor + piece.length);
        cuts.push({
            piece_id: piece.piece_id,
            order_detail_id: piece.order_detail_id,
            material_master_id: piece.material_master_id,
            diameter: piece.diameter,
            length: piece.length,
            position_start,
            position_end,
        });
        cursor = position_end;
    }

    return {
        cuts,
        used_length: round3(cursor),
    };
};

const choose_best_round_pack = (
    candidates: SourceState<RoundBarStockSource>[],
    remaining_pieces: DemandPiece[]
): { state: SourceState<RoundBarStockSource>; pack: RoundPack } | null => {
    let best: { state: SourceState<RoundBarStockSource>; pack: RoundPack } | null = null;

    for (const state of candidates) {
        const pack = pack_round_source(state.source, remaining_pieces);
        if (pack.cuts.length === 0) {
            continue;
        }
        if (!best) {
            best = { state, pack };
            continue;
        }

        const current_efficiency = pack.used_length / state.source.length;
        const best_efficiency = best.pack.used_length / best.state.source.length;
        const current_waste = state.source.length - pack.used_length;
        const best_waste = best.state.source.length - best.pack.used_length;

        if (
            current_efficiency > best_efficiency + EPSILON
            || (Math.abs(current_efficiency - best_efficiency) <= EPSILON && pack.used_length > best.pack.used_length + EPSILON)
            || (Math.abs(current_efficiency - best_efficiency) <= EPSILON
                && Math.abs(pack.used_length - best.pack.used_length) <= EPSILON
                && current_waste < best_waste - EPSILON)
        ) {
            best = { state, pack };
        }
    }

    return best;
};

const build_proposed_code = (prefix: string, order_id: string | null, counter: number): string => {
    const order_part = (order_id ?? 'CALC')
        .replaceAll(/[^A-Za-z0-9]/g, '')
        .slice(-12)
        .padStart(4, '0');
    return `${prefix}-${order_part}-${String(counter).padStart(4, '0')}`.slice(0, 50);
};

const get_single_order_detail_id = (cuts: Array<RoundCut | PlateCut>): string | null => {
    const ids = new Set(cuts.map(cut => cut.order_detail_id).filter((id): id is string => id !== null));
    return ids.size === 1 ? [...ids][0] : null;
};

const create_round_wastrel = (
    source: RoundBarStockSource,
    cuts: RoundCut[],
    wastrel_length: number,
    order_id: string | null,
    counter: number
): ProposedRoundWastrel | null => {
    if (wastrel_length <= EPSILON) {
        return null;
    }
    const proposed_code = build_proposed_code('WSRB', order_id, counter);
    const parent_stock_id = source.stock_type === 'Round_bar' ? source.id : source.parent_stock_id;
    const order_detail_id = get_single_order_detail_id(cuts);
    const remark = `Generated by calculation_division from ${source.stock_type} ${source.code}; not persisted by calculate endpoint.`;

    return {
        proposed_code,
        source_stock_type: source.stock_type,
        source_stock_id: source.id,
        source_stock_code: source.code,
        material_master_id: source.material_master_id,
        parent_stock_id,
        diameter: source.diameter,
        length: round3(wastrel_length),
        quantity: 1,
        available_quantity: 1,
        order_id,
        order_detail_id,
        db_payload: {
            wsrb_mm_id: source.material_master_id,
            wsrb_srb_id: parent_stock_id,
            wsrb_code: proposed_code,
            wsrb_diameter: source.diameter,
            wsrb_length: round3(wastrel_length),
            wsrb_quantity: 1,
            wsrb_available_quantity: 1,
            wsrb_po_id: order_id,
            wsrb_podetail_id: order_detail_id,
            wsrb_remark: remark,
        },
    };
};

const rect_area = (rect: Pick<FreeRect, 'length' | 'width'>): number => round3(rect.length * rect.width);

const find_best_plate_placement = (piece: DemandPiece, free_rects: FreeRect[]): PlatePlacementChoice | null => {
    if (piece.width === null) {
        return null;
    }
    const orientations = [
        { length: piece.length, width: piece.width, rotated: false },
        ...(piece.allow_rotation && Math.abs(piece.length - piece.width) > EPSILON
            ? [{ length: piece.width, width: piece.length, rotated: true }]
            : []),
    ];
    let best: PlatePlacementChoice | null = null;

    for (const orientation of orientations) {
        for (const free_rect of free_rects) {
            if (orientation.length > free_rect.length + EPSILON || orientation.width > free_rect.width + EPSILON) {
                continue;
            }
            const leftover_length = round3(free_rect.length - orientation.length);
            const leftover_width = round3(free_rect.width - orientation.width);
            const choice: PlatePlacementChoice = {
                free_rect,
                piece,
                length: orientation.length,
                width: orientation.width,
                rotated: orientation.rotated,
                short_side_fit: Math.min(leftover_length, leftover_width),
                long_side_fit: Math.max(leftover_length, leftover_width),
                area_waste: rect_area(free_rect) - round3(orientation.length * orientation.width),
            };

            if (
                !best
                || choice.short_side_fit < best.short_side_fit - EPSILON
                || (Math.abs(choice.short_side_fit - best.short_side_fit) <= EPSILON && choice.long_side_fit < best.long_side_fit - EPSILON)
                || (Math.abs(choice.short_side_fit - best.short_side_fit) <= EPSILON
                    && Math.abs(choice.long_side_fit - best.long_side_fit) <= EPSILON
                    && choice.area_waste < best.area_waste - EPSILON)
            ) {
                best = choice;
            }
        }
    }

    return best;
};

const rects_intersect = (left: FreeRect, right: FreeRect): boolean => {
    return left.x < right.x + right.length - EPSILON
        && left.x + left.length > right.x + EPSILON
        && left.y < right.y + right.width - EPSILON
        && left.y + left.width > right.y + EPSILON;
};

const split_free_rect = (free_rect: FreeRect, used_rect: FreeRect): FreeRect[] => {
    if (!rects_intersect(free_rect, used_rect)) {
        return [free_rect];
    }

    const next: FreeRect[] = [];
    const free_right = free_rect.x + free_rect.length;
    const free_top = free_rect.y + free_rect.width;
    const used_right = used_rect.x + used_rect.length;
    const used_top = used_rect.y + used_rect.width;

    if (used_rect.x > free_rect.x + EPSILON) {
        next.push({
            x: free_rect.x,
            y: free_rect.y,
            length: round3(used_rect.x - free_rect.x),
            width: free_rect.width,
        });
    }
    if (used_right < free_right - EPSILON) {
        next.push({
            x: round3(used_right),
            y: free_rect.y,
            length: round3(free_right - used_right),
            width: free_rect.width,
        });
    }
    if (used_rect.y > free_rect.y + EPSILON) {
        next.push({
            x: free_rect.x,
            y: free_rect.y,
            length: free_rect.length,
            width: round3(used_rect.y - free_rect.y),
        });
    }
    if (used_top < free_top - EPSILON) {
        next.push({
            x: free_rect.x,
            y: round3(used_top),
            length: free_rect.length,
            width: round3(free_top - used_top),
        });
    }

    return next.filter(rect => rect.length > EPSILON && rect.width > EPSILON);
};

const rect_contains = (outer: FreeRect, inner: FreeRect): boolean => {
    return inner.x + EPSILON >= outer.x
        && inner.y + EPSILON >= outer.y
        && inner.x + inner.length <= outer.x + outer.length + EPSILON
        && inner.y + inner.width <= outer.y + outer.width + EPSILON;
};

const prune_free_rects = (free_rects: FreeRect[]): FreeRect[] => {
    const pruned: FreeRect[] = [];
    for (let index = 0; index < free_rects.length; index += 1) {
        const rect = free_rects[index];
        const is_contained = free_rects.some((candidate, candidate_index) =>
            candidate_index !== index && rect_contains(candidate, rect)
        );
        if (!is_contained) {
            pruned.push(rect);
        }
    }
    return pruned;
};

const pack_plate_source = (source: PlateStockSource, pieces: DemandPiece[]): PlatePack => {
    let free_rects: FreeRect[] = [{ x: 0, y: 0, length: source.length, width: source.width }];
    const cuts: PlateCut[] = [];
    const sorted_pieces = [...pieces]
        .filter(piece => plate_source_matches_piece(source, piece))
        .sort((a, b) => {
            const a_area = a.length * (a.width ?? 0);
            const b_area = b.length * (b.width ?? 0);
            return b_area - a_area || Math.max(b.length, b.width ?? 0) - Math.max(a.length, a.width ?? 0) || a.sequence - b.sequence;
        });

    for (const piece of sorted_pieces) {
        const best = find_best_plate_placement(piece, free_rects);
        if (!best) {
            continue;
        }

        const cut: PlateCut = {
            piece_id: piece.piece_id,
            order_detail_id: piece.order_detail_id,
            material_master_id: piece.material_master_id,
            length: round3(best.length),
            width: round3(best.width),
            thickness: piece.thickness,
            x: round3(best.free_rect.x),
            y: round3(best.free_rect.y),
            rotated: best.rotated,
        };
        cuts.push(cut);

        const used_rect: FreeRect = {
            x: cut.x,
            y: cut.y,
            length: cut.length,
            width: cut.width,
        };
        free_rects = prune_free_rects(
            free_rects.flatMap(free_rect => split_free_rect(free_rect, used_rect))
        );
    }

    return {
        cuts,
        used_area: round3(cuts.reduce((sum, cut) => sum + cut.length * cut.width, 0)),
    };
};

const choose_best_plate_pack = (
    candidates: SourceState<PlateStockSource>[],
    remaining_pieces: DemandPiece[]
): { state: SourceState<PlateStockSource>; pack: PlatePack } | null => {
    let best: { state: SourceState<PlateStockSource>; pack: PlatePack } | null = null;

    for (const state of candidates) {
        const pack = pack_plate_source(state.source, remaining_pieces);
        if (pack.cuts.length === 0) {
            continue;
        }
        if (!best) {
            best = { state, pack };
            continue;
        }

        const current_efficiency = pack.used_area / rect_area(state.source);
        const best_efficiency = best.pack.used_area / rect_area(best.state.source);
        const current_waste = rect_area(state.source) - pack.used_area;
        const best_waste = rect_area(best.state.source) - best.pack.used_area;

        if (
            current_efficiency > best_efficiency + EPSILON
            || (Math.abs(current_efficiency - best_efficiency) <= EPSILON && pack.used_area > best.pack.used_area + EPSILON)
            || (Math.abs(current_efficiency - best_efficiency) <= EPSILON
                && Math.abs(pack.used_area - best.pack.used_area) <= EPSILON
                && current_waste < best_waste - EPSILON)
        ) {
            best = { state, pack };
        }
    }

    return best;
};

const unique_sorted = (values: number[]): number[] => {
    return [...new Set(values.map(value => round3(value)))]
        .filter(value => value >= -EPSILON)
        .sort((a, b) => a - b);
};

const cell_covered_by_cut = (cell: FreeRect, cut: PlateCut): boolean => {
    return cell.x + EPSILON >= cut.x
        && cell.y + EPSILON >= cut.y
        && cell.x + cell.length <= cut.x + cut.length + EPSILON
        && cell.y + cell.width <= cut.y + cut.width + EPSILON;
};

const merge_rectangles = (rectangles: PlateWastrelRectangle[]): PlateWastrelRectangle[] => {
    let merged = [...rectangles];
    let did_merge = true;

    while (did_merge) {
        did_merge = false;
        outer:
        for (let left_index = 0; left_index < merged.length; left_index += 1) {
            for (let right_index = left_index + 1; right_index < merged.length; right_index += 1) {
                const left = merged[left_index];
                const right = merged[right_index];
                const same_row = Math.abs(left.y - right.y) <= EPSILON && Math.abs(left.width - right.width) <= EPSILON;
                const same_column = Math.abs(left.x - right.x) <= EPSILON && Math.abs(left.length - right.length) <= EPSILON;
                const horizontally_adjacent = same_row && Math.abs(left.x + left.length - right.x) <= EPSILON;
                const vertically_adjacent = same_column && Math.abs(left.y + left.width - right.y) <= EPSILON;

                if (horizontally_adjacent) {
                    const next_rect = {
                        x: left.x,
                        y: left.y,
                        length: round3(left.length + right.length),
                        width: left.width,
                        area: round3((left.length + right.length) * left.width),
                    };
                    merged = [
                        ...merged.slice(0, left_index),
                        next_rect,
                        ...merged.slice(left_index + 1, right_index),
                        ...merged.slice(right_index + 1),
                    ];
                    did_merge = true;
                    break outer;
                }

                if (vertically_adjacent) {
                    const next_rect = {
                        x: left.x,
                        y: left.y,
                        length: left.length,
                        width: round3(left.width + right.width),
                        area: round3(left.length * (left.width + right.width)),
                    };
                    merged = [
                        ...merged.slice(0, left_index),
                        next_rect,
                        ...merged.slice(left_index + 1, right_index),
                        ...merged.slice(right_index + 1),
                    ];
                    did_merge = true;
                    break outer;
                }
            }
        }
    }

    return merged.sort((a, b) => a.y - b.y || a.x - b.x);
};

const build_plate_wastrel_rectangles = (source: PlateStockSource, cuts: PlateCut[]): PlateWastrelRectangle[] => {
    if (cuts.length === 0) {
        return [{
            x: 0,
            y: 0,
            length: source.length,
            width: source.width,
            area: rect_area(source),
        }];
    }

    const x_coords = unique_sorted([
        0,
        source.length,
        ...cuts.flatMap(cut => [cut.x, cut.x + cut.length]),
    ]);
    const y_coords = unique_sorted([
        0,
        source.width,
        ...cuts.flatMap(cut => [cut.y, cut.y + cut.width]),
    ]);
    const cells: PlateWastrelRectangle[] = [];

    for (let x_index = 0; x_index < x_coords.length - 1; x_index += 1) {
        for (let y_index = 0; y_index < y_coords.length - 1; y_index += 1) {
            const cell: FreeRect = {
                x: x_coords[x_index],
                y: y_coords[y_index],
                length: round3(x_coords[x_index + 1] - x_coords[x_index]),
                width: round3(y_coords[y_index + 1] - y_coords[y_index]),
            };
            if (cell.length <= EPSILON || cell.width <= EPSILON) {
                continue;
            }
            if (!cuts.some(cut => cell_covered_by_cut(cell, cut))) {
                cells.push({
                    ...cell,
                    area: rect_area(cell),
                });
            }
        }
    }

    return merge_rectangles(cells);
};

const create_plate_wastrel = (
    source: PlateStockSource,
    cuts: PlateCut[],
    rectangle: PlateWastrelRectangle,
    order_id: string | null,
    counter: number
): ProposedPlateWastrel => {
    const proposed_code = build_proposed_code('WMSP', order_id, counter);
    const parent_stock_id = source.stock_type === 'Ms_plate' ? source.id : source.parent_stock_id;
    const order_detail_id = get_single_order_detail_id(cuts);
    const remark = `Generated by calculation_division from ${source.stock_type} ${source.code}; not persisted by calculate endpoint.`;

    return {
        proposed_code,
        source_stock_type: source.stock_type,
        source_stock_id: source.id,
        source_stock_code: source.code,
        material_master_id: source.material_master_id,
        parent_stock_id,
        length: rectangle.length,
        width: rectangle.width,
        thickness: source.thickness,
        quantity: 1,
        available_quantity: 1,
        x: rectangle.x,
        y: rectangle.y,
        area: rectangle.area,
        order_id,
        order_detail_id,
        db_payload: {
            wmsp_mm_id: source.material_master_id,
            wmsp_msp_id: parent_stock_id,
            wmsp_stock_code: proposed_code,
            wmsp_length: rectangle.length,
            wmsp_width: rectangle.width,
            wmsp_thickness: source.thickness,
            wmsp_quantity: 1,
            wmsp_available_quantity: 1,
            wmsp_po_id: order_id,
            wmsp_podetail_id: order_detail_id,
            wmsp_remark: remark,
        },
    };
};

const summarize_unfulfilled = (pieces: DemandPiece[]): UnfulfilledDemand[] => {
    const grouped = new Map<string, UnfulfilledDemand>();
    for (const piece of pieces) {
        const key = JSON.stringify({
            shape_type: piece.shape_type,
            order_detail_id: piece.order_detail_id,
            material_master_id: piece.material_master_id,
            length: piece.length,
            width: piece.width,
            thickness: piece.thickness,
            diameter: piece.diameter,
        });
        const current = grouped.get(key);
        if (current) {
            current.quantity += 1;
        } else {
            grouped.set(key, {
                shape_type: piece.shape_type,
                order_detail_id: piece.order_detail_id,
                material_master_id: piece.material_master_id,
                length: piece.length,
                width: piece.width,
                thickness: piece.thickness,
                diameter: piece.diameter,
                quantity: 1,
            });
        }
    }
    return [...grouped.values()];
};

const hash_pattern = (value: string): string => {
    let hash = 0;
    for (let index = 0; index < value.length; index += 1) {
        hash = ((hash << 5) - hash + value.charCodeAt(index)) | 0;
    }
    return `pattern-${Math.abs(hash)}`;
};

const build_round_pattern_summary = (plans: RoundSourcePlan[]): PatternSummary[] => {
    const grouped = new Map<string, PatternSummary>();

    for (const plan of plans) {
        const raw_key = JSON.stringify({
            source_stock_type: plan.source.stock_type,
            length: plan.source.length,
            diameter: plan.source.diameter,
            cuts: plan.cuts.map(cut => ({
                order_detail_id: cut.order_detail_id,
                length: cut.length,
                position_start: cut.position_start,
                position_end: cut.position_end,
            })),
            wastrel_length: plan.wastrel_length,
        });
        const current = grouped.get(raw_key);
        if (current) {
            current.quantity += 1;
            current.sample_source_ids.push(plan.source.id);
        } else {
            grouped.set(raw_key, {
                pattern_key: hash_pattern(raw_key),
                quantity: 1,
                source_stock_type: plan.source.stock_type,
                source_size: {
                    length: plan.source.length,
                    diameter: plan.source.diameter,
                },
                sample_source_ids: [plan.source.id],
                cuts: plan.cuts,
                wastrel: plan.wastrel ? [plan.wastrel] : [],
            });
        }
    }

    return [...grouped.values()];
};

const build_plate_pattern_summary = (plans: PlateSourcePlan[]): PatternSummary[] => {
    const grouped = new Map<string, PatternSummary>();

    for (const plan of plans) {
        const raw_key = JSON.stringify({
            source_stock_type: plan.source.stock_type,
            length: plan.source.length,
            width: plan.source.width,
            thickness: plan.source.thickness,
            cuts: plan.cuts.map(cut => ({
                order_detail_id: cut.order_detail_id,
                length: cut.length,
                width: cut.width,
                x: cut.x,
                y: cut.y,
                rotated: cut.rotated,
            })),
            wastrel_rectangles: plan.wastrel_rectangles.map(rectangle => ({
                length: rectangle.length,
                width: rectangle.width,
                x: rectangle.x,
                y: rectangle.y,
            })),
        });
        const current = grouped.get(raw_key);
        if (current) {
            current.quantity += 1;
            current.sample_source_ids.push(plan.source.id);
        } else {
            grouped.set(raw_key, {
                pattern_key: hash_pattern(raw_key),
                quantity: 1,
                source_stock_type: plan.source.stock_type,
                source_size: {
                    length: plan.source.length,
                    width: plan.source.width,
                    thickness: plan.source.thickness,
                },
                sample_source_ids: [plan.source.id],
                cuts: plan.cuts,
                wastrel: plan.wastrel,
            });
        }
    }

    return [...grouped.values()];
};

const plan_round_bars = (
    demands: DemandItem[],
    sources: RoundBarStockSource[],
    order_id: string | null
): {
    demand_quantity: number;
    fulfilled_quantity: number;
    source_plans: RoundSourcePlan[];
    pattern_summary: PatternSummary[];
    unfulfilled: UnfulfilledDemand[];
    wastrel: ProposedRoundWastrel[];
} => {
    let remaining_pieces = expand_demand_pieces(demands);
    const demand_quantity = remaining_pieces.length;
    const states: SourceState<RoundBarStockSource>[] = sources.map(source => ({
        source,
        remaining_quantity: source.available_quantity,
        used_count: 0,
    }));
    const source_plans: RoundSourcePlan[] = [];
    const wastrel: ProposedRoundWastrel[] = [];
    let wastrel_counter = 1;

    while (remaining_pieces.length > 0) {
        const wastrel_candidates = states.filter(state =>
            state.remaining_quantity > 0
            && state.source.stock_type === 'Wastrel_round_bar'
            && remaining_pieces.some(piece => round_source_matches_piece(state.source, piece))
        );
        const stock_candidates = states.filter(state =>
            state.remaining_quantity > 0
            && state.source.stock_type === 'Round_bar'
            && remaining_pieces.some(piece => round_source_matches_piece(state.source, piece))
        );
        const candidates = wastrel_candidates.length > 0 ? wastrel_candidates : stock_candidates;
        const best = choose_best_round_pack(candidates, remaining_pieces);
        if (!best) {
            break;
        }

        best.state.remaining_quantity -= 1;
        best.state.used_count += 1;
        const cut_piece_ids = new Set(best.pack.cuts.map(cut => cut.piece_id));
        remaining_pieces = remaining_pieces.filter(piece => !cut_piece_ids.has(piece.piece_id));

        const wastrel_length = round3(best.state.source.length - best.pack.used_length);
        const proposed_wastrel = create_round_wastrel(
            best.state.source,
            best.pack.cuts,
            wastrel_length,
            order_id,
            wastrel_counter
        );
        if (proposed_wastrel) {
            wastrel_counter += 1;
            wastrel.push(proposed_wastrel);
        }

        source_plans.push({
            source: best.state.source,
            source_piece_no: best.state.used_count,
            cuts: best.pack.cuts,
            used_length: best.pack.used_length,
            wastrel_length,
            efficiency_percent: round3((best.pack.used_length / best.state.source.length) * 100),
            wastrel: proposed_wastrel,
        });
    }

    return {
        demand_quantity,
        fulfilled_quantity: demand_quantity - remaining_pieces.length,
        source_plans,
        pattern_summary: build_round_pattern_summary(source_plans),
        unfulfilled: summarize_unfulfilled(remaining_pieces),
        wastrel,
    };
};

const plan_ms_plates = (
    demands: DemandItem[],
    sources: PlateStockSource[],
    order_id: string | null
): {
    demand_quantity: number;
    fulfilled_quantity: number;
    source_plans: PlateSourcePlan[];
    pattern_summary: PatternSummary[];
    unfulfilled: UnfulfilledDemand[];
    wastrel: ProposedPlateWastrel[];
} => {
    let remaining_pieces = expand_demand_pieces(demands);
    const demand_quantity = remaining_pieces.length;
    const states: SourceState<PlateStockSource>[] = sources.map(source => ({
        source,
        remaining_quantity: source.available_quantity,
        used_count: 0,
    }));
    const source_plans: PlateSourcePlan[] = [];
    const wastrel: ProposedPlateWastrel[] = [];
    let wastrel_counter = 1;

    while (remaining_pieces.length > 0) {
        const wastrel_candidates = states.filter(state =>
            state.remaining_quantity > 0
            && state.source.stock_type === 'Wastrel_ms_plate'
            && remaining_pieces.some(piece => plate_source_matches_piece(state.source, piece))
        );
        const stock_candidates = states.filter(state =>
            state.remaining_quantity > 0
            && state.source.stock_type === 'Ms_plate'
            && remaining_pieces.some(piece => plate_source_matches_piece(state.source, piece))
        );
        const candidates = wastrel_candidates.length > 0 ? wastrel_candidates : stock_candidates;
        const best = choose_best_plate_pack(candidates, remaining_pieces);
        if (!best) {
            break;
        }

        best.state.remaining_quantity -= 1;
        best.state.used_count += 1;
        const cut_piece_ids = new Set(best.pack.cuts.map(cut => cut.piece_id));
        remaining_pieces = remaining_pieces.filter(piece => !cut_piece_ids.has(piece.piece_id));

        const wastrel_rectangles = build_plate_wastrel_rectangles(best.state.source, best.pack.cuts)
            .filter(rectangle => rectangle.area > EPSILON);
        const plan_wastrel = wastrel_rectangles.map(rectangle => {
            const proposed = create_plate_wastrel(
                best.state.source,
                best.pack.cuts,
                rectangle,
                order_id,
                wastrel_counter
            );
            wastrel_counter += 1;
            return proposed;
        });
        wastrel.push(...plan_wastrel);

        const source_area = rect_area(best.state.source);
        const wastrel_area = round3(wastrel_rectangles.reduce((sum, rectangle) => sum + rectangle.area, 0));
        source_plans.push({
            source: best.state.source,
            source_piece_no: best.state.used_count,
            cuts: best.pack.cuts,
            used_area: best.pack.used_area,
            wastrel_area,
            efficiency_percent: round3((best.pack.used_area / source_area) * 100),
            wastrel_rectangles,
            wastrel: plan_wastrel,
        });
    }

    return {
        demand_quantity,
        fulfilled_quantity: demand_quantity - remaining_pieces.length,
        source_plans,
        pattern_summary: build_plate_pattern_summary(source_plans),
        unfulfilled: summarize_unfulfilled(remaining_pieces),
        wastrel,
    };
};




const controller = {
    calculation_division
};

export default controller;
