import { MasteryDimensions, SkillDimension, Topic } from '../../types';

/**
 * Mastery Engine v1.0
 * Overall mastery calculated with transparent dimension weights:
 * overall = 0.15 * recall + 0.20 * conceptual + 0.25 * procedural + 0.30 * application + 0.10 * transfer
 */
export const DIMENSION_WEIGHTS: Record<SkillDimension, number> = {
  recall: 0.15,
  conceptual: 0.20,
  procedural: 0.25,
  application: 0.30,
  transfer: 0.10,
};

export function calculateOverallMastery(dimensions: Omit<MasteryDimensions, 'overall' | 'confidence' | 'last_practiced_at' | 'last_assessed_at'>): number {
  const score =
    dimensions.recall * DIMENSION_WEIGHTS.recall +
    dimensions.conceptual * DIMENSION_WEIGHTS.conceptual +
    dimensions.procedural * DIMENSION_WEIGHTS.procedural +
    dimensions.application * DIMENSION_WEIGHTS.application +
    dimensions.transfer * DIMENSION_WEIGHTS.transfer;
  
  return Math.round(Math.min(100, Math.max(0, score)));
}

/**
 * Updates mastery from assessment question evidence
 */
export function updateMasteryFromAssessment(
  current: MasteryDimensions,
  evidence: { dimension: SkillDimension; isCorrect: boolean; weight?: number }[]
): MasteryDimensions {
  const updated = { ...current };
  const counts: Record<SkillDimension, { correct: number; total: number }> = {
    recall: { correct: 0, total: 0 },
    conceptual: { correct: 0, total: 0 },
    procedural: { correct: 0, total: 0 },
    application: { correct: 0, total: 0 },
    transfer: { correct: 0, total: 0 },
  };

  evidence.forEach((ev) => {
    counts[ev.dimension].total += 1;
    if (ev.isCorrect) counts[ev.dimension].correct += 1;
  });

  // Blend existing score (70% weight) with new assessment batch (30% weight)
  (Object.keys(counts) as SkillDimension[]).forEach((dim) => {
    if (counts[dim].total > 0) {
      const batchScore = (counts[dim].correct / counts[dim].total) * 100;
      updated[dim] = Math.round(current[dim] * 0.65 + batchScore * 0.35);
    }
  });

  updated.overall = calculateOverallMastery(updated);
  updated.last_assessed_at = new Date().toISOString();
  return updated;
}

/**
 * Updates mastery from an active study session
 */
export function updateMasteryFromStudySession(
  current: MasteryDimensions,
  recalledSuccessfully: boolean,
  practiceScorePercent: number
): MasteryDimensions {
  const updated = { ...current };

  // Study session updates recall and procedural/conceptual incrementally
  const recallDelta = recalledSuccessfully ? 8 : -4;
  updated.recall = Math.min(100, Math.max(10, current.recall + recallDelta));

  if (practiceScorePercent > 0) {
    updated.procedural = Math.min(100, Math.max(10, Math.round(current.procedural * 0.7 + practiceScorePercent * 0.3)));
    updated.conceptual = Math.min(100, Math.max(10, Math.round(current.conceptual * 0.8 + practiceScorePercent * 0.2)));
  }

  updated.overall = calculateOverallMastery(updated);
  updated.last_practiced_at = new Date().toISOString();
  return updated;
}

/**
 * Calculates aggregate mastery score across an array of topics
 */
export function calculateAggregateMastery(topics: Topic[]): number {
  if (!topics || topics.length === 0) return 0;
  const sum = topics.reduce((acc, t) => acc + (t.mastery?.overall || 0), 0);
  return Math.round(sum / topics.length);
}
