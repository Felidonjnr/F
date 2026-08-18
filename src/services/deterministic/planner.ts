import { AcademicDebt, Course, MissionPriority, StudyMission, Topic } from '../../types';

export function generateDailyStudyMissions(params: {
  courses: Course[];
  topics: Topic[];
  debts: AcademicDebt[];
  dailyAvailableMinutes: number; // e.g. 180
  dateStr?: string;
}): StudyMission[] {
  const { courses, topics, debts, dailyAvailableMinutes, dateStr } = params;
  const today = dateStr || new Date().toISOString().split('T')[0];
  const missions: StudyMission[] = [];
  let remainingBudget = dailyAvailableMinutes;

  // 1. High/Critical Debts get first priority allocation
  const activeDebts = debts
    .filter((d) => d.status !== 'resolved')
    .sort((a, b) => {
      const order = { critical: 4, high: 3, medium: 2, low: 1 };
      return order[b.severity] - order[a.severity];
    });

  if (activeDebts.length > 0 && remainingBudget >= 30) {
    const primaryDebt = activeDebts[0];
    const dur = Math.min(45, primaryDebt.estimated_recovery_minutes);
    missions.push({
      id: `m-debt-${primaryDebt.id}-${today}`,
      course_id: primaryDebt.course_id,
      topic_id: primaryDebt.topic_id,
      course_code: primaryDebt.course_code,
      topic_name: primaryDebt.topic_name,
      date: today,
      priority: 'Remediate',
      learning_objective: `Remediate unresolved weakness: ${primaryDebt.title}`,
      reason_for_priority: `Active ${primaryDebt.severity.toUpperCase()} debt flagged from ${primaryDebt.source.replace('_', ' ')}. Due ${primaryDebt.due_at}.`,
      estimated_duration_minutes: dur,
      completed_minutes: 0,
      recall_prompt: `Explain the fundamental definitions and key pitfalls for ${primaryDebt.topic_name}.`,
      practice_prompt: `Solve 2 targeted retest problems focusing on ${primaryDebt.reason}.`,
      ai_tutoring_hint: `Ask Coach: "Show me step-by-step diagnostic breakdown for ${primaryDebt.topic_name}."`,
      status: 'pending',
      is_debt_recovery: true,
      debt_id: primaryDebt.id,
    });
    remainingBudget -= dur;
  }

  // 2. Score topics by urgency & importance
  const scoredTopics = topics
    .map((t) => {
      const course = courses.find((c) => c.id === t.course_id);
      const mastery = t.mastery?.overall || 0;
      const courseWeight = course?.priority_weight || 3;
      const importance = t.importance || 3;
      
      // Topics with lower mastery, high importance, high course weight score higher
      const urgencyScore = (100 - mastery) * 0.4 + importance * 10 + courseWeight * 6;
      return { topic: t, course, urgencyScore };
    })
    .sort((a, b) => b.urgencyScore - a.urgencyScore);

  for (const item of scoredTopics) {
    if (remainingBudget < 25) break;

    // Avoid duplicate topics in same day missions
    if (missions.some((m) => m.topic_id === item.topic.id)) continue;

    const dur = Math.min(remainingBudget, Math.max(25, item.topic.estimated_minutes > 60 ? 45 : 30));
    const isPriority = item.urgencyScore > 75 || (item.topic.mastery?.overall || 0) < 55;
    const priority: MissionPriority = isPriority ? 'Priority' : 'Normal';

    const obj = item.topic.learning_objectives?.[0] || 'Demonstrate mastery of core principles';

    missions.push({
      id: `m-topic-${item.topic.id}-${today}`,
      course_id: item.topic.course_id,
      topic_id: item.topic.id,
      course_code: item.course?.code || 'STEM',
      topic_name: item.topic.name,
      date: today,
      priority,
      learning_objective: obj,
      reason_for_priority: isPriority
        ? `High-yield topic with current mastery deficit (${item.topic.mastery?.overall || 0}%). Course unit weight: ${item.course?.units || 3}.`
        : `Scheduled curriculum progression for ${item.course?.code}.`,
      estimated_duration_minutes: dur,
      completed_minutes: 0,
      recall_prompt: `State the governing laws, boundary conditions, and primary formula for ${item.topic.name}.`,
      practice_prompt: `Work through 2 representative procedural problem sets on ${obj}.`,
      ai_tutoring_hint: `Ask Coach: "Give me an intuitive real-world engineering analogy for ${item.topic.name}."`,
      status: 'pending',
    });

    remainingBudget -= dur;
  }

  return missions;
}
