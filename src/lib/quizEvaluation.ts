import { QuizConfig, QuizResponse, QuizResult } from '@/types/quiz';

// Helper function to get base score
function getBaseScore(criterionConfig: any, rawScoreInput: any): number {
  if (criterionConfig.type === "A") {
    const score = parseFloat(rawScoreInput);
    if (isNaN(score)) {
      console.warn(`A型小项 ${criterionConfig.name} 的分数 "${rawScoreInput}" 不是有效数字。将按0分处理。`);
      return 0;
    }
    return score;
  } else if (criterionConfig.type === "B") {
    const linguisticMap = criterionConfig.linguistic_map || {};
    if (rawScoreInput in linguisticMap) {
      return parseFloat(linguisticMap[rawScoreInput]);
    } else {
      const genericMapping = { "很差": 2.0, "较差": 4.0, "一般": 6.0, "较好": 8.0, "很好": 10.0 };
      if (rawScoreInput in genericMapping) {
        console.warn(`B型小项 ${criterionConfig.name} 使用通用评级 '${rawScoreInput}' -> ${genericMapping[rawScoreInput]}.`);
        return genericMapping[rawScoreInput];
      }
      console.warn(`B型小项 ${criterionConfig.name} 的输入 '${rawScoreInput}' 无法映射到分数。将按0分处理。`);
      return 0;
    }
  }
  return 0.0;
}

// Check for deal breakers
function checkDealBreakers(allTestersInputs: QuizResponse[], config: any, resultsLog: string[]): { dealBreakerTriggered: boolean; qualityTier: string; details: string } {
  let dealBreakerActive = false;
  let dealBreakerDetails: string[] = [];
  
  allTestersInputs.forEach((evaluationInput, testerIndex) => {
    for (const catId in config) {
      for (const critId in config[catId].criteria) {
        const critConfig = config[catId].criteria[critId];
        if (critConfig.crit_level === 3) {
          const rawScore = evaluationInput[catId]?.[critId]?.score;
          if (rawScore === undefined || rawScore === null || rawScore === '') {
            resultsLog.push(`[严重问题点检查 - 评价者 ${testerIndex + 1}] 警告: 方面 ${catId} 小项 ${critId} (${critConfig.name}) 缺少评分数据。`);
            continue;
          }
          const baseScore = getBaseScore(critConfig, rawScore);
          const dbThreshold = critConfig.thresholds?.db;
          if (dbThreshold !== undefined && baseScore < dbThreshold) {
            dealBreakerActive = true;
            const detailMsg = `评价者 ${testerIndex + 1} 在方面 ${catId} 的小项 ${critConfig.name} (${critId}) 给出的分数 ${baseScore.toFixed(2)} (由评级 '${rawScore}' 得到) 低于严重问题点阈值 ${dbThreshold}。`;
            resultsLog.push(`[严重问题点触发] ${detailMsg}`);
            if (!dealBreakerDetails.includes(detailMsg)) dealBreakerDetails.push(detailMsg);
          }
        }
      }
    }
  });
  
  if (dealBreakerActive) {
    return { dealBreakerTriggered: true, qualityTier: "不可接受 (有严重问题)", details: dealBreakerDetails.join("\n") };
  }
  return { dealBreakerTriggered: false, qualityTier: "S+ (神工级)", details: "" };
}

// Aggregate tester scores
function aggregateTesterScores(allTestersInputs: QuizResponse[], config: any) {
  const aggregatedRawScores: Record<string, Record<string, { score: number }>> = {};
  const numTesters = allTestersInputs.length;
  
  if (numTesters === 0) return {};
  
  for (const catId in config) {
    aggregatedRawScores[catId] = {};
    for (const critId in config[catId].criteria) {
      const critConfig = config[catId].criteria[critId];
      let sumScores = 0;
      let validScoresCount = 0;
      
      allTestersInputs.forEach(testerInput => {
        const rawScoreInput = testerInput[catId]?.[critId]?.score;
        if (rawScoreInput !== undefined && rawScoreInput !== null && rawScoreInput !== '') {
          sumScores += getBaseScore(critConfig, rawScoreInput);
          validScoresCount++;
        }
      });
      
      aggregatedRawScores[catId][critId] = { score: (validScoresCount > 0 ? sumScores / validScoresCount : 0) };
    }
  }
  
  return aggregatedRawScores;
}

// Calculate effective criterion scores
function calculateEffectiveCriterionScores(aggregatedScores: any, config: any, resultsLog: any) {
  const effectiveScores: Record<string, Record<string, { score: number }>> = {};
  const params = config.criticality_adjustment_params;
  
  resultsLog.push("\n--- 各评价小项有效分计算 (基于平均分) ---");
  
  for (const catId in config.categories) {
    effectiveScores[catId] = {};
    for (const critId in config.categories[catId].criteria) {
      const critConfig = config.categories[catId].criteria[critId];
      const s_ij = aggregatedScores[catId]?.[critId]?.score || 0.0;
      let s_prime_ij = s_ij;
      const critLevel = critConfig.crit_level;
      const thresholds = critConfig.thresholds || {};
      
      let logEntry = `  小项 ${catId}-${critId} (${critConfig.name}): 平均原始分=${s_ij.toFixed(2)}, 影响程度=${critLevel}`;
      
      if (critLevel === 1) {
        const impLow = thresholds.imp_low;
        const impHigh = thresholds.imp_high;
        
        if (impLow !== undefined && s_ij < impLow) {
          const penalty = params.imp_low_penalty_factor * (impLow - s_ij);
          s_prime_ij = s_ij - penalty;
          logEntry += `, 重要低分惩罚=${penalty.toFixed(2)}`;
        } else if (impHigh !== undefined && s_ij > impHigh) {
          const bonus = params.imp_high_bonus_factor * (s_ij - impHigh);
          s_prime_ij = s_ij + bonus;
          logEntry += `, 重要高分奖励=${bonus.toFixed(2)}`;
        }
      } else if (critLevel === 2) {
        const critLow = thresholds.crit_low;
        
        if (critLow !== undefined && s_ij < critLow) {
          s_prime_ij = s_ij * params.crit_severe_reduction_factor;
          logEntry += `, 关键低分减额至=${s_prime_ij.toFixed(2)}`;
          resultsLog.major_flaw_categories = resultsLog.major_flaw_categories || [];
          if (!resultsLog.major_flaw_categories.includes(config.categories[catId].name)) {
            resultsLog.major_flaw_categories.push(config.categories[catId].name);
          }
        }
      }
      
      s_prime_ij = Math.max(0, Math.min(s_prime_ij, 10.5));
      effectiveScores[catId][critId] = { "score": s_prime_ij };
      logEntry += ` => 有效分=${s_prime_ij.toFixed(2)}`;
      resultsLog.push(logEntry);
    }
  }
  
  return effectiveScores;
}

// Calculate weighted category scores
function calculateWeightedCategoryScores(effectiveScores: any, config: any, resultsLog: any) {
  const categoryScores: Record<string, number> = {};
  const params = config.criticality_adjustment_params;
  
  resultsLog.push("\n--- 各评价方面得分计算 ---");
  
  for (const catId in config.categories) {
    let numerator = 0;
    let denominator = 0;
    let hasCritLowTriggeredInCat = false;
    
    if (!effectiveScores[catId]) {
      resultsLog.push(`警告: 方面 ${catId} (${config.categories[catId].name}) 没有有效的评价小项评分数据。`);
      categoryScores[catId] = 0;
      continue;
    }
    
    for (const critId in config.categories[catId].criteria) {
      const critConfig = config.categories[catId].criteria[critId];
      const effScoreData = effectiveScores[catId]?.[critId];
      
      if (!effScoreData) {
        resultsLog.push(`警告: 评价小项 ${catId}-${critId} (${critConfig.name}) 缺少有效评分数据。`);
        continue;
      }
      
      const s_prime_ij = effScoreData.score;
      const w_ij = critConfig.weight;
      
      numerator += w_ij * s_prime_ij;
      denominator += w_ij;
      
      if (resultsLog.major_flaw_categories && resultsLog.major_flaw_categories.includes(config.categories[catId].name)) {
        hasCritLowTriggeredInCat = true;
      }
    }
    
    let s_i_eff;
    
    if (denominator === 0) {
      s_i_eff = 0;
      resultsLog.push(`方面 ${config.categories[catId].name} (${catId}): 分母为0，方面得分计为0`);
    } else {
      s_i_eff = numerator / denominator;
      resultsLog.push(`方面 ${config.categories[catId].name} (${catId}): 加权平均分=${s_i_eff.toFixed(2)}`);
    }
    
    if (hasCritLowTriggeredInCat && params.crit_low_cap_value !== undefined) {
      if (s_i_eff > params.crit_low_cap_value) {
        s_i_eff = params.crit_low_cap_value;
        resultsLog.push(`  由于方面内存在关键缺陷项，方面 ${catId} 得分上限被限制为: ${s_i_eff.toFixed(2)}`);
      }
    }
    
    categoryScores[catId] = Math.max(0, Math.min(s_i_eff, 10.0));
    resultsLog.push(`  方面 ${config.categories[catId].name} (${catId}) 最终有效得分: ${categoryScores[catId].toFixed(2)}`);
  }
  
  return categoryScores;
}

// Calculate core aggregated score
function calculateCoreAggregatedScore(categoryScores: Record<string, number>, config: any, resultsLog: any) {
  let tas_core = 0;
  
  resultsLog.push("\n--- 基础总览分计算 ---");
  
  for (const catId in config.categories) {
    const w_i = config.categories[catId].weight;
    const s_i_eff = categoryScores[catId] || 0;
    
    tas_core += w_i * s_i_eff;
    resultsLog.push(`  方面 ${config.categories[catId].name} (${catId}): 重要程度 ${w_i.toFixed(2)} * 得分 ${s_i_eff.toFixed(2)} = ${(w_i * s_i_eff).toFixed(2)}`);
  }
  
  resultsLog.push(`基础总览分 (TAS_core): ${tas_core.toFixed(2)} (0-10分制)`);
  
  return tas_core;
}

// Apply AIMM module
function applyAimmModule(tas_core: number, categoryScores: Record<string, number>, config: any, resultsLog: any) {
  let globalModifier = 1.0;
  let flatPenalty = 0.0;
  const aimmParams = config.aimm_config;
  
  resultsLog.push("\n--- 综合调整模块 (AIMM) ---");
  
  const s2_eff = categoryScores["C2"] || 0;
  const s3_eff = categoryScores["C3"] || 0;
  
  if (s2_eff < 5.0 && s3_eff > 8.0) {
    const penalty = aimmParams.conflict_penalty_c2_c3;
    flatPenalty += penalty;
    resultsLog.push(`  AIMM: 形状和比例(C2)得分低 (${s2_eff.toFixed(2)}) 但表面和颜色(C3)得分高 (${s3_eff.toFixed(2)})，触发冲突惩罚: -${penalty.toFixed(2)}`);
  } else if (s2_eff > 8.5 && s3_eff > 8.5) {
    const bonusFactor = aimmParams.synergy_bonus_c2_c3;
    globalModifier *= bonusFactor;
    resultsLog.push(`  AIMM: 形状和比例(C2) (${s2_eff.toFixed(2)}) 与表面和颜色(C3) (${s3_eff.toFixed(2)}) 表现均优异，触发协同奖励因子: *${bonusFactor.toFixed(2)}`);
  }
  
  const s6_eff = categoryScores["C6"] || 5.0;
  const harmonyFactorBase = aimmParams.harmony_factor_base_score;
  const harmonyExponent = aimmParams.harmony_factor_exponent;
  
  if (harmonyFactorBase > 0) {
    const harmonyFactor = Math.pow((s6_eff / harmonyFactorBase), harmonyExponent);
    globalModifier *= harmonyFactor;
    resultsLog.push(`  AIMM: 整体效果和做工(C6)得分 ${s6_eff.toFixed(2)}，协调性调节因子: *${harmonyFactor.toFixed(3)} (基准分${harmonyFactorBase}, 指数${harmonyExponent})`);
  } else {
    resultsLog.push(`  AIMM: 整体效果和做工(C6)基准分为0，跳过协调性调节因子计算。`);
  }
  
  const weightedCatScoresValues: number[] = [];
  
  for (const catId in config.categories) {
    weightedCatScoresValues.push(config.categories[catId].weight * (categoryScores[catId] || 0));
  }
  
  if (weightedCatScoresValues.length > 1) {
    const mean_wcs = weightedCatScoresValues.reduce((a, b) => a + b, 0) / weightedCatScoresValues.length;
    const variance_wcs = weightedCatScoresValues.map(x => Math.pow(x - mean_wcs, 2)).reduce((a, b) => a + b, 0) / weightedCatScoresValues.length;
    const std_dev_wcs = Math.sqrt(variance_wcs);
    const consistencyPenalty = aimmParams.consistency_penalty_factor * std_dev_wcs;
    
    flatPenalty += consistencyPenalty;
    resultsLog.push(`  AIMM: 加权方面得分标准差 ${std_dev_wcs.toFixed(2)}，一致性惩罚: -${consistencyPenalty.toFixed(2)}`);
  }
  
  resultsLog.push(`  AIMM 应用前: TAS_core=${tas_core.toFixed(2)}, GlobalModifier=${globalModifier.toFixed(3)}, FlatPenalty=${flatPenalty.toFixed(2)}`);
  
  const tas_intermediate = (tas_core * globalModifier) - flatPenalty;
  resultsLog.push(`AIMM 应用后综合调整分 (TAS_intermediate): ${tas_intermediate.toFixed(2)}`);
  
  return tas_intermediate;
}

// Assign quality tier
function assignQualityTier(tas_100: number, dealBreakerTriggered: boolean, resultsLog: any, config: any) {
  if (dealBreakerTriggered) {
    resultsLog.push(`\n整体评价等级: 不可接受 (有严重问题)`);
    return { finalTier: "不可接受 (有严重问题)", finalScore100: config.deal_breaker_score };
  }
  
  let finalTier = "未评级";
  
  for (const tierName in config.quality_tiers) {
    if (tierName === "不可接受 (有严重问题)") continue;
    
    const [lowerBound, upperBound] = config.quality_tiers[tierName].range;
    
    if (tas_100 >= lowerBound && tas_100 < upperBound) {
      finalTier = tierName;
      break;
    }
  }
  
  if (resultsLog.major_flaw_categories && resultsLog.major_flaw_categories.length > 0) {
    if (finalTier !== "F (有缺陷)" && finalTier !== "D (不足)" && finalTier !== "不可接受 (有严重问题)") {
      const tierNamesOrdered = Object.keys(config.quality_tiers).filter(k => k !== "不可接受 (有严重问题)");
      tierNamesOrdered.sort((a, b) => config.quality_tiers[b].range[0] - config.quality_tiers[a].range[0]);
      
      try {
        const currentTierIdxInOrdered = tierNamesOrdered.indexOf(finalTier);
        
        if (currentTierIdxInOrdered !== -1 && currentTierIdxInOrdered < tierNamesOrdered.length - 1) {
          const originalTier = finalTier;
          finalTier = tierNamesOrdered[currentTierIdxInOrdered + 1];
          resultsLog.push(`  注意: 由于方面 ${resultsLog.major_flaw_categories.join(', ')} 存在关键缺陷项，整体评价等级从 ${originalTier} 降至 ${finalTier}。`);
        } else if (currentTierIdxInOrdered !== -1) {
          resultsLog.push(`  注意: 方面 ${resultsLog.major_flaw_categories.join(', ')} 存在关键缺陷项，但当前已是最低可评等级 ${finalTier}。`);
        }
      } catch (e) {
        resultsLog.push(`  警告: 无法在有序等级列表中找到当前等级 ${finalTier} 以进行降级处理。`);
      }
    }
  }
  
  resultsLog.push(`\n整体评价等级: ${finalTier}`);
  
  return { finalTier, finalScore100: tas_100 };
}

// Main evaluation function
export function evaluateHeadShell_MultiTester(allTestersInputs: QuizResponse[], config: QuizConfig): QuizResult {
  const resultsLog: any = ["头壳外观V3算法评价日志 (多用户版):"];
  resultsLog.major_flaw_categories = [];
  
  const { dealBreakerTriggered, qualityTier: initialQualityTier, details: dealBreakerDetails } = checkDealBreakers(allTestersInputs, config.categories, resultsLog);
  
  let returnObject: QuizResult = {
    deal_breaker_triggered: dealBreakerTriggered,
    deal_breaker_details: dealBreakerDetails || "",
    category_scores_final: {},
    tas_core_10_scale: 0,
    tas_intermediate_10_scale: 0,
    final_score_10_scale: 0,
    final_score_100: 0,
    final_tier: initialQualityTier,
    log: resultsLog
  };
  
  if (dealBreakerTriggered) {
    resultsLog.push(`最终百分制评价分: ${config.deal_breaker_score.toFixed(2)}`);
    if (dealBreakerDetails) resultsLog.push(`严重问题点详情: ${dealBreakerDetails}`);
    returnObject.final_score_100 = config.deal_breaker_score;
    returnObject.final_score_10_scale = config.deal_breaker_score / 10;
    return returnObject;
  }
  
  const aggregatedScores = aggregateTesterScores(allTestersInputs, config.categories);
  
  if (Object.keys(aggregatedScores).length === 0 && allTestersInputs.length > 0) {
    resultsLog.push("错误：无法聚合评价者分数，可能是因为所有评价者都没有提供有效的输入数据。");
    returnObject.final_tier = "未评级 (无有效数据)";
    return returnObject;
  }
  
  const effectiveScores = calculateEffectiveCriterionScores(aggregatedScores, config, resultsLog);
  const categoryScores = calculateWeightedCategoryScores(effectiveScores, config, resultsLog);
  const tas_core = calculateCoreAggregatedScore(categoryScores, config, resultsLog);
  const tas_intermediate = applyAimmModule(tas_core, categoryScores, config, resultsLog);
  const tas_final_10_scale = Math.max(0, Math.min(tas_intermediate, 10.0));
  const tas_final_100_scale = tas_final_10_scale * 10;
  
  resultsLog.push(`\n--- 最终评价分 ---`);
  resultsLog.push(`最终评价分 (10分制): ${tas_final_10_scale.toFixed(2)}`);
  resultsLog.push(`最终评价分 (百分制): ${tas_final_100_scale.toFixed(2)}`);
  
  const { finalTier, finalScore100 } = assignQualityTier(tas_final_100_scale, dealBreakerTriggered, resultsLog, config);
  
  returnObject.category_scores_final = categoryScores;
  returnObject.tas_core_10_scale = tas_core;
  returnObject.tas_intermediate_10_scale = tas_intermediate;
  returnObject.final_score_10_scale = tas_final_10_scale;
  returnObject.final_score_100 = finalScore100;
  returnObject.final_tier = finalTier;
  
  return returnObject;
}
