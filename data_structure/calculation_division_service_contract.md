# Calculation Division Service Contract

Last updated: 2026-07-06

## Endpoint

`POST /api/:version/calculation-division`

Calculates a JSON-compatible cutting plan for steel round bars and MS plates.
The endpoint is calculate-only: it reads the four stock/wastrel tables, returns the recommended plan, and does not update stock or insert wastrel rows.

## Input

```json
{
  "order_id": "ORD0001",
  "unit": "inch",
  "round_bars": [
    {
      "order_detail_id": "ODD-RB-1",
      "material_master_id": "MM-RB-1",
      "diameter": 1,
      "length": 7,
      "quantity": 4
    }
  ],
  "ms_plates": [
    {
      "order_detail_id": "ODD-MSP-1",
      "material_master_id": "MM-MSP-1",
      "length": 10,
      "width": 5,
      "thickness": 1,
      "quantity": 10,
      "allow_rotation": false
    }
  ]
}
```

`order_id` is optional metadata used in the returned plan and proposed wastrel codes. The endpoint does not load `public.order_details`; callers must send the cutting items in `items`, `round_bars`, or `ms_plates`.
Callers must send `srb_id`, `msp_id`, or both to select the stock source scope:

- `srb_id` filters `steel_round_bars.srb_id` and `wastrel_steel_round_bars.wsrb_srb_id`.
- `msp_id` filters `ms_plates.msp_id` and `wastrel_ms_plates.wmsp_msp_id`.

Supported aliases:

- `order_id` or `ord_id`
- `srb_id`
- `msp_id`
- `order_detail_id` or `odd_id`
- `material_master_id` or `mm_id`
- `length`, `required_length`, or `required_length_mm`
- `width`, `required_width`, or `required_width_mm`
- `diameter`, `required_diameter`, or `required_diameter_mm`
- `thickness`, `required_thickness`, or `required_thickness_mm`

## Stock Selection

- Wastrel stock is considered before normal stock.
- Round bar wastrel comes from `public.wastrel_steel_round_bars`.
- Round bar stock comes from `public.steel_round_bars`.
- MS plate wastrel comes from `public.wastrel_ms_plates`.
- MS plate stock comes from `public.ms_plates`.
- Matching uses material, diameter, and thickness only when the demand provides those values.
- Matching requires `available_quantity > 0`.
- Normal stock status must be `Active` or `AVAILABLE`.
- Wastrel status may be `Active`, `Reserved`, or `AVAILABLE`.

## Algorithm

- Round bars use a wastrel-first best-fit decreasing one-dimensional cutting heuristic.
- MS plates use a wastrel-first max-rects two-dimensional packing heuristic.
- MS plate rotation is allowed only when the item has `allow_rotation: true`.
- Every unused leftover segment/rectangle from a used source piece is returned as wastrel, even if very small.

## Response Shape

The response follows the local Fastify module style:

```json
{
  "status": "OK",
  "statuscode": 200,
  "details": {
    "message": "Calculation Division calculated successfully.",
    "calculation_plan": {},
    "jsonb_payload": {}
  }
}
```

`calculation_plan` and `jsonb_payload` contain the same JSON-compatible object so callers can persist the plan into a JSONB column later if needed.

Important fields inside the plan:

- `persisted`: always `false` for this endpoint.
- `fulfilled`: whether all requested pieces were allocated.
- `round_bars.source_plans`: detailed round bar cut layouts.
- `ms_plates.source_plans`: detailed plate layouts with `x`, `y`, `length`, `width`, and `rotated`.
- `round_bars.pattern_summary`: grouped identical round bar cutting methods.
- `ms_plates.pattern_summary`: grouped identical plate cutting methods.
- `wastrel_to_create.steel_round_bars`: proposed `wastrel_steel_round_bars` rows with `db_payload`.
- `wastrel_to_create.ms_plates`: proposed `wastrel_ms_plates` rows with `db_payload`.
- `unfulfilled`: grouped demand that could not be allocated from available stock.

## Persistence Boundary

This endpoint does not:

- decrement stock quantities;
- insert wastrel rows;
- insert stock reservations;
- insert timeline rows.

Those actions need a separate mutation workflow with transaction boundaries and final business validation.
