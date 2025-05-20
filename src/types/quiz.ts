// Types for quiz configuration and responses

export interface CriterionConfig {
  name: string;
  weight: number;
  crit_level: number;
  type: 'A' | 'B';
  thresholds?: {
    imp_low?: number;
    imp_high?: number;
    crit_low?: number;
    db?: number;
  };
  linguistic_map?: Record<string, number>;
  rating_labels?: string[];
}

export interface CategoryConfig {
  name: string;
  weight: number;
  criteria: Record<string, CriterionConfig>;
}

export interface QuizConfig {
  categories: Record<string, CategoryConfig>;
  criticality_adjustment_params: {
    imp_low_penalty_factor: number;
    imp_high_bonus_factor: number;
    crit_severe_reduction_factor: number;
    crit_low_cap_value: number;
  };
  aimm_config: {
    harmony_factor_exponent: number;
    harmony_factor_base_score: number;
    consistency_penalty_factor: number;
    synergy_bonus_c2_c3: number;
    conflict_penalty_c2_c3: number;
  };
  quality_tiers: Record<string, {
    range: [number, number];
    class: string;
  }>;
  deal_breaker_score: number;
  rating_circle_definitions: Array<{
    label: string;
    value: number | string;
    colorClass: string;
  }>;
}

export interface CriterionResponse {
  score: number | string;
}

export interface CategoryResponse {
  [criterionId: string]: CriterionResponse;
}

export interface QuizResponse {
  [categoryId: string]: CategoryResponse;
}

export interface QuizResult {
  deal_breaker_triggered: boolean;
  deal_breaker_details: string;
  category_scores_final: Record<string, number>;
  tas_core_10_scale: number;
  tas_intermediate_10_scale: number;
  final_score_10_scale: number;
  final_score_100: number;
  final_tier: string;
  log: string[];
}

export interface QuizWithResponses {
  id: string;
  title: string;
  description: string | null;
  createdAt: Date;
  isActive: boolean;
  creatorId: string;
  config: QuizConfig;
  responses: Array<{
    id: string;
    testerName: string;
    answers: QuizResponse;
    createdAt: Date;
  }>;
}
