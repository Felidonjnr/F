/**
 * Utility functions for FirstClass OS
 */

export function cn(...inputs: (string | undefined | null | false | Record<string, boolean>)[]): string {
  const classes: string[] = [];

  for (const input of inputs) {
    if (!input) continue;
    if (typeof input === 'string') {
      classes.push(input);
    } else if (typeof input === 'object') {
      for (const [key, val] of Object.entries(input)) {
        if (val) classes.push(key);
      }
    }
  }

  return classes.join(' ').trim();
}

/**
 * Formats minutes into human-readable duration
 * e.g. 45 -> "45m", 90 -> "1h 30m", 120 -> "2h 0m"
 */
export function formatMinutes(minutes: number): string {
  if (!minutes || minutes <= 0) return '0m';
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hrs === 0) return `${mins}m`;
  if (mins === 0) return `${hrs}h`;
  return `${hrs}h ${mins}m`;
}

/**
 * Returns today's date in ISO YYYY-MM-DD format (local timezone)
 */
export function todayISO(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Formats date into e.g. "Thursday, Aug 20"
 */
export function formatDateLabel(dateStr?: string): string {
  const d = dateStr ? new Date(dateStr + 'T00:00:00') : new Date();
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}
