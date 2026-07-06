export type ShapeType = 'Round_bar' | 'Ms_plate';
export type RoundBarStockType = 'Round_bar' | 'Wastrel_round_bar';
export type PlateStockType = 'Ms_plate' | 'Wastrel_ms_plate';

export enum ErrorField {
    BODY = 'body',
    ORDER_ID = 'order_id',
    SRB_ID = 'srb_id',
    MSP_ID = 'msp_id',
    ITEMS = 'items',
    SHAPE_TYPE = 'shape_type',
    LENGTH = 'length',
    WIDTH = 'width',
    QUANTITY = 'quantity',
}

export enum ErrorMessage {
    BODY_REQUIRED = 'Request body is required.',
    ORDER_OR_ITEMS_REQUIRED = 'Either order_id or cutting items are required.',
    SRB_OR_MSP_REQUIRED = 'Either srb_id or msp_id is required.',
    SRB_ID_INVALID = 'Steel round bar ID is invalid.',
    MSP_ID_INVALID = 'MS plate ID is invalid.',
    ITEMS_REQUIRED = 'Cutting items are required.',
    ITEMS_INVALID = 'Cutting items must be an array.',
    SHAPE_TYPE_INVALID = 'Shape type must be Round_bar or Ms_plate.',
    LENGTH_REQUIRED = 'Length is required.',
    LENGTH_INVALID = 'Length must be greater than 0.',
    WIDTH_REQUIRED = 'Width is required for MS plate items.',
    WIDTH_INVALID = 'Width must be greater than 0.',
    QUANTITY_REQUIRED = 'Quantity is required.',
    QUANTITY_INVALID = 'Quantity must be a positive integer.',
}

export interface ValidationError {
    field: ErrorField;
    message: ErrorMessage;
    index?: number;
}

export interface BaseDemandPayload {
    order_detail_id?: string;
    odd_id?: string;
    material_master_id?: string;
    mm_id?: string;
    length?: number;
    required_length?: number;
    required_length_mm?: number;
    quantity?: number;
    allow_wastrel?: boolean;
    remark?: string;
}

export interface RoundBarDemandPayload extends BaseDemandPayload {
    shape_type?: ShapeType | string;
    diameter?: number;
    required_diameter?: number;
    required_diameter_mm?: number;
}

export interface MsPlateDemandPayload extends BaseDemandPayload {
    shape_type?: ShapeType | string;
    width?: number;
    required_width?: number;
    required_width_mm?: number;
    thickness?: number;
    required_thickness?: number;
    required_thickness_mm?: number;
    allow_rotation?: boolean;
}

export type CuttingItemPayload = RoundBarDemandPayload | MsPlateDemandPayload;

export interface CalculationPayload {
    order_id?: string;
    ord_id?: string;
    srb_id?: string;
    msp_id?: string;
    unit?: string;
    round_bars?: RoundBarDemandPayload[];
    ms_plates?: MsPlateDemandPayload[];
    items?: CuttingItemPayload[];
}

export interface DemandItem {
    id: string;
    shape_type: ShapeType;
    order_id: string | null;
    order_detail_id: string | null;
    material_master_id: string | null;
    length: number;
    width: number | null;
    thickness: number | null;
    diameter: number | null;
    quantity: number;
    allow_rotation: boolean;
    allow_wastrel: boolean;
    remark: string | null;
}

export interface DemandPiece extends DemandItem {
    piece_id: string;
    sequence: number;
    quantity: 1;
}

export interface SourceState<T> {
    source: T;
    remaining_quantity: number;
    used_count: number;
}

export interface RoundPack {
    cuts: RoundCut[];
    used_length: number;
}

export interface FreeRect {
    x: number;
    y: number;
    length: number;
    width: number;
}

export interface PlatePlacementChoice {
    free_rect: FreeRect;
    piece: DemandPiece;
    length: number;
    width: number;
    rotated: boolean;
    short_side_fit: number;
    long_side_fit: number;
    area_waste: number;
}

export interface PlatePack {
    cuts: PlateCut[];
    used_area: number;
}

export interface RoundBarStockSource {
    stock_type: RoundBarStockType;
    id: string;
    code: string;
    material_master_id: string;
    parent_stock_id: string | null;
    diameter: number;
    length: number;
    available_quantity: number;
    location_id: string | null;
    location_type: string | null;
    location: string | null;
    status: string;
}

export interface PlateStockSource {
    stock_type: PlateStockType;
    id: string;
    code: string;
    material_master_id: string;
    parent_stock_id: string | null;
    length: number;
    width: number;
    thickness: number;
    available_quantity: number;
    location_id: string | null;
    location_type: string | null;
    location: string | null;
    status: string;
}

export interface RoundCut {
    piece_id: string;
    order_detail_id: string | null;
    material_master_id: string | null;
    diameter: number | null;
    length: number;
    position_start: number;
    position_end: number;
}

export interface PlateCut {
    piece_id: string;
    order_detail_id: string | null;
    material_master_id: string | null;
    length: number;
    width: number;
    thickness: number | null;
    x: number;
    y: number;
    rotated: boolean;
}

export interface PlateWastrelRectangle {
    x: number;
    y: number;
    length: number;
    width: number;
    area: number;
}

export interface ProposedRoundWastrel {
    proposed_code: string;
    source_stock_type: RoundBarStockType;
    source_stock_id: string;
    source_stock_code: string;
    material_master_id: string;
    parent_stock_id: string | null;
    diameter: number;
    length: number;
    quantity: 1;
    available_quantity: 1;
    order_id: string | null;
    order_detail_id: string | null;
    db_payload: {
        wsrb_mm_id: string;
        wsrb_srb_id: string | null;
        wsrb_code: string;
        wsrb_diameter: number;
        wsrb_length: number;
        wsrb_quantity: 1;
        wsrb_available_quantity: 1;
        wsrb_ord_id: string | null;
        wsrb_odd_id: string | null;
        wsrb_remark: string;
    };
}

export interface ProposedPlateWastrel {
    proposed_code: string;
    source_stock_type: PlateStockType;
    source_stock_id: string;
    source_stock_code: string;
    material_master_id: string;
    parent_stock_id: string | null;
    length: number;
    width: number;
    thickness: number;
    quantity: 1;
    available_quantity: 1;
    x: number;
    y: number;
    area: number;
    order_id: string | null;
    order_detail_id: string | null;
    db_payload: {
        wmsp_mm_id: string;
        wmsp_msp_id: string | null;
        wmsp_stock_code: string;
        wmsp_length: number;
        wmsp_width: number;
        wmsp_thickness: number;
        wmsp_quantity: 1;
        wmsp_available_quantity: 1;
        wmsp_ord_id: string | null;
        wmsp_odd_id: string | null;
        wmsp_remark: string;
    };
}

export interface RoundSourcePlan {
    source: RoundBarStockSource;
    source_piece_no: number;
    cuts: RoundCut[];
    used_length: number;
    wastrel_length: number;
    efficiency_percent: number;
    wastrel: ProposedRoundWastrel | null;
}

export interface PlateSourcePlan {
    source: PlateStockSource;
    source_piece_no: number;
    cuts: PlateCut[];
    used_area: number;
    wastrel_area: number;
    efficiency_percent: number;
    wastrel_rectangles: PlateWastrelRectangle[];
    wastrel: ProposedPlateWastrel[];
}

export interface PatternSummary {
    pattern_key: string;
    quantity: number;
    source_stock_type: RoundBarStockType | PlateStockType;
    source_size: Record<string, number | string | null>;
    sample_source_ids: string[];
    cuts: Array<RoundCut | PlateCut>;
    wastrel: Array<ProposedRoundWastrel | ProposedPlateWastrel>;
}

export interface UnfulfilledDemand {
    shape_type: ShapeType;
    order_detail_id: string | null;
    material_master_id: string | null;
    length: number;
    width: number | null;
    thickness: number | null;
    diameter: number | null;
    quantity: number;
}

export interface CalculationPlan {
    order_id: string | null;
    unit: string;
    generated_at: string;
    persisted: false;
    strategy: {
        stock_preference: string;
        round_bars: string;
        ms_plates: string;
        note: string;
    };
    fulfilled: boolean;
    round_bars: {
        demand_quantity: number;
        fulfilled_quantity: number;
        source_plans: RoundSourcePlan[];
        pattern_summary: PatternSummary[];
        unfulfilled: UnfulfilledDemand[];
    };
    ms_plates: {
        demand_quantity: number;
        fulfilled_quantity: number;
        source_plans: PlateSourcePlan[];
        pattern_summary: PatternSummary[];
        unfulfilled: UnfulfilledDemand[];
    };
    wastrel_to_create: {
        steel_round_bars: ProposedRoundWastrel[];
        ms_plates: ProposedPlateWastrel[];
    };
    totals: {
        round_used_length: number;
        round_wastrel_length: number;
        plate_used_area: number;
        plate_wastrel_area: number;
    };
}
