import {
  AcademicDebt,
  Assessment,
  Course,
  PressureBand,
  PressureBreakdown,
  Semester,
  StudentProfile,
  StudyMission,
  Topic,
} from '../../types';

export const PRESSURE_FORMULA_VERSION = 'v1.0.0-academic-deterministic';

export function calculatePressureScore(params: {
  semester: Semester;
  courses: Course[];
  topics: Topic[];
  debts: AcademicDebt[];
  missions: StudyMission[];
  assessments: Assessment[];
  profile: StudentProfile;
}): PressureBreakdown {
  const { semester, courses, topics, debts, missions, assessments, profile } = params;

  // 1. Deadline Risk (0.25)
  // Distance to exam period vs completion
  const now = new Date().getTime();
  const examStart = new Date(semester.exam_start_date).getTime();
  const semStart = new Date(semester.start_date).getTime();
  const totalDays = Math.max(1, (examStart - semStart) / (1000 * 60 * 60 * 24));
  const remainingDays = Math.max(0, (examStart - now) / (1000 * 60 * 60 * 24));
  const timeElapsedPercent = Math.min(100, Math.max(0, ((totalDays - remainingDays) / totalDays) * 100));

  const avgMastery = topics.length > 0
    ? topics.reduce((sum, t) => sum + (t.mastery?.overall || 0), 0) / topics.length
    : 0;

  // If 60% of semester passed but average mastery is only 40%, deadline risk is elevated
  const expectedMastery = Math.min(90, timeElapsedPercent * 0.9);
  const masteryLag = Math.max(0, expectedMastery - avgMastery);
  const examUrgencyMultiplier = remainingDays < 21 ? 1.4 : remainingDays < 45 ? 1.15 : 1.0;
  const deadline_risk = Math.round(Math.min(100, Math.max(10, (masteryLag * 1.5 + (100 - remainingDays * 1.5)) * 0.5 * examUrgencyMultiplier)));

  // 2. Debt Risk (0.20)
  // Count and severity of active debts
  const activeDebts = debts.filter((d) => d.status !== 'resolved');
  const criticalCount = activeDebts.filter((d) => d.severity === 'critical').length;
  const highCount = activeDebts.filter((d) => d.severity === 'high').length;
  const medCount = activeDebts.filter((d) => d.severity === 'medium').length;
  const lowCount = activeDebts.filter((d) => d.severity === 'low').length;

  const debtPoints = criticalCount * 35 + highCount * 22 + medCount * 12 + lowCount * 5;
  const debt_risk = Math.round(Math.min(100, Math.max(0, debtPoints)));

  // 3. Mastery Risk (0.20)
  // Average deficit from standard (80% mastery target)
  const weakTopics = topics.filter((t) => (t.mastery?.overall || 0) < 65);
  const weakPercentage = topics.length > 0 ? (weakTopics.length / topics.length) * 100 : 0;
  const highPriorityWeak = weakTopics.filter((t) => (t.importance || 3) >= 4).length;
  const mastery_risk = Math.round(Math.min(100, Math.max(0, (100 - avgMastery) * 0.6 + weakPercentage * 0.4 + highPriorityWeak * 8)));

  // 4. Consistency Risk (0.15)
  // Recent missions completion rate
  const completedMissions = missions.filter((m) => m.status === 'completed').length;
  const missedMissions = missions.filter((m) => m.status === 'missed').length;
  const totalMissions = Math.max(1, completedMissions + missedMissions);
  const missionSuccessRate = (completedMissions / totalMissions) * 100;
  const consistency_risk = Math.round(Math.min(100, Math.max(5, (100 - missionSuccessRate) * 0.9 + missedMissions * 10)));

  // 5. Assessment Risk (0.10)
  // Recent assessment results
  const gradedAssessments = assessments.filter((a) => a.status === 'graded' && a.max_score);
  let assessment_risk = 20; // default baseline
  if (gradedAssessments.length > 0) {
    const avgScorePct =
      gradedAssessments.reduce((sum, a) => sum + ((a.score || 0) / (a.max_score || 1)) * 100, 0) /
      gradedAssessments.length;
    assessment_risk = Math.round(Math.min(100, Math.max(0, (85 - avgScorePct) * 1.5)));
  }

  // 6. Goal Gap Risk (0.10)
  // Difference between target CGPA and current performance
  const cgpaGap = Math.max(0, (profile.target_cgpa - profile.current_cgpa) / (profile.scale_cgpa || 5.0));
  const goal_gap_risk = Math.round(Math.min(100, Math.max(0, cgpaGap * 100 * 1.8)));

  // Master Weighted Pressure Formula (v1.0)
  const rawScore =
    0.25 * deadline_risk +
    0.20 * debt_risk +
    0.20 * mastery_risk +
    0.15 * consistency_risk +
    0.10 * assessment_risk +
    0.10 * goal_gap_risk;

  const score = Math.round(Math.min(100, Math.max(0, rawScore)));

  let band: PressureBand = 'Stable';
  let system_response = 'Normal daily planning cycle. Maintain steady topic execution.';

  if (score >= 85) {
    band = 'Critical';
    system_response = 'Immediate recovery plan activated. Priority reallocation to critical debt and imminent exam topics.';
  } else if (score >= 70) {
    band = 'High Pressure';
    system_response = 'Daily intervention mandated. Schedule explicit recovery slots and pause elective study.';
  } else if (score >= 50) {
    band = 'At Risk';
    system_response = 'Recovery recommended. Elevated reminder frequency and targeted diagnostic mini-tests.';
  } else if (score >= 25) {
    band = 'Watch';
    system_response = 'Gentle monitoring. Address medium debt items before the upcoming weekly assessment.';
  }

  // Identify top risk topic
  const lowestTopic = [...topics].sort(
    (a, b) => (a.mastery?.overall || 0) - (b.mastery?.overall || 0)
  )[0];

  const top_risk_topic = lowestTopic
    ? `${lowestTopic.name} (Mastery: ${lowestTopic.mastery?.overall || 0}%)`
    : undefined;

  let next_mandatory_action = 'Complete scheduled daily study mission.';
  if (activeDebts.length > 0) {
    const highestDebt = [...activeDebts].sort((a, b) => {
      const order = { critical: 4, high: 3, medium: 2, low: 1 };
      return order[b.severity] - order[a.severity];
    })[0];
    next_mandatory_action = `Resolve ${highestDebt.severity.toUpperCase()} debt: ${highestDebt.title} (${highestDebt.estimated_recovery_minutes} min)`;
  } else if (lowestTopic && (lowestTopic.mastery?.overall || 0) < 60) {
    next_mandatory_action = `Take 15-min practice drill on ${lowestTopic.name}`;
  }

  return {
    score,
    band,
    components: {
      deadline_risk,
      debt_risk,
      mastery_risk,
      consistency_risk,
      assessment_risk,
      goal_gap_risk,
    },
    formula_version: PRESSURE_FORMULA_VERSION,
    system_response,
    top_risk_topic,
    next_mandatory_action,
    calculated_at: new Date().toISOString(),
  };
}
