import { AcademicDebt, DebtSeverity, DebtSource } from '../../types';

export function createDebtItem(params: {
  course_id: string;
  topic_id: string;
  topic_name: string;
  course_code: string;
  source: DebtSource;
  severity: DebtSeverity;
  title: string;
  reason: string;
  estimated_recovery_minutes: number;
  days_until_due?: number;
}): AcademicDebt {
  const dueDays = params.days_until_due ?? (params.severity === 'critical' ? 2 : params.severity === 'high' ? 4 : 7);
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + dueDays);

  return {
    id: `debt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    course_id: params.course_id,
    topic_id: params.topic_id,
    topic_name: params.topic_name,
    course_code: params.course_code,
    source: params.source,
    severity: params.severity,
    title: params.title,
    reason: params.reason,
    estimated_recovery_minutes: params.estimated_recovery_minutes,
    due_at: dueDate.toISOString().split('T')[0],
    status: 'active',
    created_at: new Date().toISOString(),
  };
}

export function resolveDebtItem(
  debt: AcademicDebt,
  evidenceNotes: string
): AcademicDebt {
  return {
    ...debt,
    status: 'resolved',
    resolved_at: new Date().toISOString(),
    resolution_evidence: evidenceNotes,
  };
}
