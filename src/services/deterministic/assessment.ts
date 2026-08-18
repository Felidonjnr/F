import {
  Assessment,
  AssessmentDiagnosticReport,
  ErrorEvent,
  QuestionAttempt,
  SkillDimension,
  Topic,
} from '../../types';

export function scoreAssessment(
  assessment: Assessment,
  attempts: QuestionAttempt[],
  topics: Topic[]
): {
  score: number;
  max_score: number;
  report: AssessmentDiagnosticReport;
  newErrors: Omit<ErrorEvent, 'id' | 'occurred_at' | 'resolved'>[];
  topicsNeedingDebt: { topic_id: string; topic_name: string; course_code: string; reason: string; severity: 'high' | 'medium' }[];
} {
  const max_score = assessment.questions.length;
  let correctCount = 0;

  const dimCounts: Record<SkillDimension, { correct: number; total: number }> = {
    recall: { correct: 0, total: 0 },
    conceptual: { correct: 0, total: 0 },
    procedural: { correct: 0, total: 0 },
    application: { correct: 0, total: 0 },
    transfer: { correct: 0, total: 0 },
  };

  const topicAttempts: Record<string, { topic_name: string; correct: number; total: number }> = {};
  const newErrors: Omit<ErrorEvent, 'id' | 'occurred_at' | 'resolved'>[] = [];
  const errorClassifications: { question_id: string; category: string; description: string }[] = [];

  assessment.questions.forEach((q) => {
    const attempt = attempts.find((a) => a.question_id === q.id);
    const isCorrect = attempt ? attempt.student_answer === q.correct_answer : false;
    
    if (isCorrect) correctCount++;

    // Track dimensions
    if (q.dimension && dimCounts[q.dimension]) {
      dimCounts[q.dimension].total++;
      if (isCorrect) dimCounts[q.dimension].correct++;
    }

    // Track topics
    const tId = q.topic_id || 'general';
    const tName = q.topic_name || assessment.course_code || 'General Coursework';
    if (!topicAttempts[tId]) {
      topicAttempts[tId] = { topic_name: tName, correct: 0, total: 0 };
    }
    topicAttempts[tId].total++;
    if (isCorrect) topicAttempts[tId].correct++;

    // If incorrect, generate error record
    if (!isCorrect && attempt && attempt.student_answer) {
      const cat = q.dimension === 'procedural'
        ? 'procedural_error'
        : q.dimension === 'recall'
        ? 'formula_retrieval_failure'
        : 'concept_misconception';

      errorClassifications.push({
        question_id: q.id,
        category: cat,
        description: `Incorrect answer: "${attempt.student_answer}". Correct: "${q.correct_answer}".`,
      });

      newErrors.push({
        topic_id: tId,
        topic_name: tName,
        course_code: assessment.course_code || 'STEM',
        question_prompt: q.prompt,
        student_answer: attempt.student_answer,
        correct_answer: q.correct_answer,
        category: cat,
        diagnosis: `Missed ${q.dimension} question on ${tName}. Expected understanding of: ${q.explanation.slice(0, 120)}`,
        remediation_action: `Review lecture notes and complete 3 practice calculations on ${tName}.`,
        recurrence_count: 1,
      });
    }
  });

  const overallScorePct = Math.round((correctCount / Math.max(1, max_score)) * 100);

  const dimension_scores: Record<SkillDimension, number> = {
    recall: dimCounts.recall.total ? Math.round((dimCounts.recall.correct / dimCounts.recall.total) * 100) : 100,
    conceptual: dimCounts.conceptual.total ? Math.round((dimCounts.conceptual.correct / dimCounts.conceptual.total) * 100) : 100,
    procedural: dimCounts.procedural.total ? Math.round((dimCounts.procedural.correct / dimCounts.procedural.total) * 100) : 100,
    application: dimCounts.application.total ? Math.round((dimCounts.application.correct / dimCounts.application.total) * 100) : 100,
    transfer: dimCounts.transfer.total ? Math.round((dimCounts.transfer.correct / dimCounts.transfer.total) * 100) : 100,
  };

  const weak_topics: { topic_id: string; topic_name: string; score: number }[] = [];
  const topicsNeedingDebt: { topic_id: string; topic_name: string; course_code: string; reason: string; severity: 'high' | 'medium' }[] = [];

  Object.entries(topicAttempts).forEach(([tId, stat]) => {
    const pct = Math.round((stat.correct / stat.total) * 100);
    if (pct < 65) {
      weak_topics.push({ topic_id: tId, topic_name: stat.topic_name, score: pct });
      topicsNeedingDebt.push({
        topic_id: tId,
        topic_name: stat.topic_name,
        course_code: assessment.course_code || 'STEM',
        reason: `Scored ${pct}% in ${assessment.title} (${stat.correct}/${stat.total} correct).`,
        severity: pct < 45 ? 'high' : 'medium',
      });
    }
  });

  let ai_recommendation = 'Strong performance. Maintain active retrieval cadence.';
  if (overallScorePct < 60) {
    ai_recommendation = `Priority intervention needed: Focus on ${weak_topics.map((w) => w.topic_name).join(', ') || 'underlying concepts'}. Procedural dimension score is ${dimension_scores.procedural}%.`;
  } else if (overallScorePct < 80) {
    ai_recommendation = `Good baseline with targeted gaps in ${weak_topics.map((w) => w.topic_name).join(', ') || 'application questions'}. Schedule 1 recovery block before next exam.`;
  }

  const report: AssessmentDiagnosticReport = {
    overall_score: overallScorePct,
    dimension_scores,
    weak_topics,
    error_classifications: errorClassifications,
    debt_created_count: topicsNeedingDebt.length,
    ai_recommendation,
  };

  return {
    score: correctCount,
    max_score,
    report,
    newErrors,
    topicsNeedingDebt,
  };
}
