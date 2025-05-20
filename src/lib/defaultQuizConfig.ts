import { QuizConfig } from '@/types/quiz';

export const DEFAULT_QUIZ_CONFIG: QuizConfig = {
  categories: {
    "C1": {
      "name": "像不像/好不好看",
      "weight": 0.20,
      "criteria": {
        "M11": { "name": "外形特点是否一致/设计是否特别", "weight": 0.4, "crit_level": 1, "type": "A", "thresholds": { "imp_low": 5, "imp_high": 9 } },
        "M12": {
          "name": "给人的感觉/气质如何", "weight": 0.3, "crit_level": 1, "type": "B",
          "linguistic_map": { "很差": 1.0, "有点差": 3.0, "一般般": 6.0, "挺好": 9.0, "非常好": 10.0 },
          "rating_labels": ["很差", "有点差", "一般般", "挺好", "非常好"],
          "thresholds": { "imp_low": 4 }
        },
        "M13": { "name": "整体风格是否搭调/设计元素是否融洽", "weight": 0.3, "crit_level": 0, "type": "A" },
      }
    },
    "C2": {
      "name": "形状和比例",
      "weight": 0.25,
      "criteria": {
        "M21": { "name": "左右是否对称", "weight": 0.3, "crit_level": 2, "type": "A", "thresholds": { "crit_low": 4.5 } },
        "M22": { "name": "脸部线条是否流畅自然", "weight": 0.25, "crit_level": 1, "type": "A", "thresholds": { "imp_low": 5.5 } },
        "M23": { "name": "五官的立体感和过渡是否自然", "weight": 0.20, "crit_level": 0, "type": "A" },
        "M24": { "name": "五官大小和位置是否协调", "weight": 0.15, "crit_level": 1, "type": "A", "thresholds": { "imp_low": 5.0 } },
        "M25": { "name": "有无严重结构问题(示例)", "weight": 0.1, "crit_level": 3, "type": "A", "thresholds": { "db": 3.0 } },
      }
    },
    "C3": {
      "name": "表面和颜色",
      "weight": 0.25,
      "criteria": {
        "M31": { "name": "壳子表面是否光滑平整", "weight": 0.3, "crit_level": 2, "type": "A", "thresholds": { "crit_low": 5.0 } },
        "M32": { "name": "肤色/底色是否均匀，质感如何", "weight": 0.3, "crit_level": 1, "type": "A", "thresholds": { "imp_low": 6.0 } },
        "M33": { "name": "化妆/细节颜色是否准确好看", "weight": 0.2, "crit_level": 0, "type": "A" },
        "M34": { "name": "颜色边缘是否清晰整齐", "weight": 0.2, "crit_level": 1, "type": "A", "thresholds": { "imp_low": 5.5 } },
      }
    },
    "C4": {
      "name": "眼睛神采",
      "weight": 0.15,
      "criteria": {
        "M41": {
          "name": "眼神是否生动有神", "weight": 0.4, "crit_level": 1, "type": "B",
          "linguistic_map": { "呆滞": 2.0, "有点呆": 4.0, "一般": 6.0, "有神": 8.0, "灵动": 10.0 },
          "rating_labels": ["呆滞", "有点呆", "一般", "有神", "灵动"],
          "thresholds": { "imp_low": 4.0 }
        },
        "M42": { "name": "眼形和眼眶处理是否精致", "weight": 0.3, "crit_level": 0, "type": "A" },
        "M43": { "name": "眼珠细节和通透感如何", "weight": 0.3, "crit_level": 1, "type": "A", "thresholds": { "imp_high": 8.5 } },
      }
    },
    "C5": {
      "name": "头发和饰品",
      "weight": 0.10,
      "criteria": {
        "M51": { "name": "发型是否好看自然/符合设定", "weight": 0.4, "crit_level": 0, "type": "A" },
        "M52": { "name": "发丝质感和光泽好不好", "weight": 0.3, "crit_level": 0, "type": "A" },
        "M53": { "name": "发际线处理和固定效果如何", "weight": 0.3, "crit_level": 1, "type": "A", "thresholds": { "imp_low": 5.0 } },
      }
    },
    "C6": {
      "name": "整体效果和做工",
      "weight": 0.05,
      "criteria": {
        "M61": { "name": "各部分风格是否统一协调", "weight": 0.5, "crit_level": 0, "type": "A" },
        "M62": { "name": "整体做工是否精细，有无瑕疵", "weight": 0.5, "crit_level": 1, "type": "A", "thresholds": { "imp_low": 6.0 } },
      }
    }
  },
  criticality_adjustment_params: {
    "imp_low_penalty_factor": 0.5,
    "imp_high_bonus_factor": 0.25,
    "crit_severe_reduction_factor": 0.6,
    "crit_low_cap_value": 6.0,
  },
  aimm_config: {
    "harmony_factor_exponent": 0.75,
    "harmony_factor_base_score": 7.5,
    "consistency_penalty_factor": 0.2,
    "synergy_bonus_c2_c3": 1.05,
    "conflict_penalty_c2_c3": 0.5,
  },
  quality_tiers: {
    "S+ (神工级)": { range: [95, 101], class: "tier-s-plus" },
    "S (大师级)": { range: [90, 95], class: "tier-s" },
    "A (优秀)": { range: [80, 90], class: "tier-a" },
    "B (良好)": { range: [70, 80], class: "tier-b" },
    "C (尚可)": { range: [60, 70], class: "tier-c" },
    "D (不足)": { range: [50, 60], class: "tier-d" },
    "F (有缺陷)": { range: [0, 50], class: "tier-f" },
    "不可接受 (有严重问题)": { range: [-1, 0], class: "tier-unacceptable" }
  },
  deal_breaker_score: 15.0,
  rating_circle_definitions: [
    { label: "很差", value: 2, colorClass: "level-1" },
    { label: "较差", value: 4, colorClass: "level-2" },
    { label: "一般", value: 6, colorClass: "level-3" },
    { label: "较好", value: 8, colorClass: "level-4" },
    { label: "很好", value: 10, colorClass: "level-5" }
  ]
};
