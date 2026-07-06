import {
    CalculationPlan,
    PlateSourcePlan,
    RoundSourcePlan
} from './type';

export class CalculationDivisionResult {
    constructor(
        public plan: CalculationPlan
    ) {
        this.plan = plan;
    }
}

export class RoundBarPlanGroup {
    constructor(
        public source_plans: RoundSourcePlan[]
    ) {
        this.source_plans = source_plans;
    }
}

export class MsPlatePlanGroup {
    constructor(
        public source_plans: PlateSourcePlan[]
    ) {
        this.source_plans = source_plans;
    }
}
