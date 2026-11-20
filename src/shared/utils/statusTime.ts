export interface StatusTimeTransition {
  status: string;
  occurredAt: Date;
}

export interface StatusTimeInterval {
  status: string;
  enteredAt: string;
  exitedAt: string | null;
  activeMilliseconds: number;
  pausedMilliseconds: number;
  isPaused: boolean;
}

export interface StatusTimeSummary {
  intervals: StatusTimeInterval[];
  totalActiveMilliseconds: number;
  totalPausedMilliseconds: number;
}

export interface StatusTimeCalculationInput {
  openedAt: Date;
  initialStatus: string;
  currentStatus: string;
  pausedStatusNames: readonly string[];
  transitions: readonly StatusTimeTransition[];
  now: Date;
}

function positiveMilliseconds(start: Date, end: Date): number {
  return Math.max(0, end.getTime() - start.getTime());
}

export function calculateStatusTime(input: StatusTimeCalculationInput): StatusTimeSummary {
  const pausedStatusNames = new Set(input.pausedStatusNames);
  const intervals: StatusTimeInterval[] = [];
  let status = input.initialStatus;
  let enteredAt = input.openedAt;

  for (const transition of input.transitions) {
    if (transition.status === status) continue;

    const duration = positiveMilliseconds(enteredAt, transition.occurredAt);
    const isPaused = pausedStatusNames.has(status);
    intervals.push({
      status,
      enteredAt: enteredAt.toISOString(),
      exitedAt: transition.occurredAt.toISOString(),
      activeMilliseconds: isPaused ? 0 : duration,
      pausedMilliseconds: isPaused ? duration : 0,
      isPaused,
    });

    status = transition.status;
    enteredAt = transition.occurredAt;
  }

  const now = input.now.getTime() >= enteredAt.getTime() ? input.now : enteredAt;
  if (status !== input.currentStatus) {
    const duration = positiveMilliseconds(enteredAt, now);
    const isPaused = pausedStatusNames.has(status);
    intervals.push({
      status,
      enteredAt: enteredAt.toISOString(),
      exitedAt: now.toISOString(),
      activeMilliseconds: isPaused ? 0 : duration,
      pausedMilliseconds: isPaused ? duration : 0,
      isPaused,
    });
    status = input.currentStatus;
    enteredAt = now;
  }

  const currentDuration = positiveMilliseconds(enteredAt, now);
  const currentIsPaused = pausedStatusNames.has(status);

  intervals.push({
    status,
    enteredAt: enteredAt.toISOString(),
    exitedAt: null,
    activeMilliseconds: currentIsPaused ? 0 : currentDuration,
    pausedMilliseconds: currentIsPaused ? currentDuration : 0,
    isPaused: currentIsPaused,
  });

  let totalActiveMilliseconds = 0;
  let totalPausedMilliseconds = 0;
  for (const interval of intervals) {
    totalActiveMilliseconds += interval.activeMilliseconds;
    totalPausedMilliseconds += interval.pausedMilliseconds;
  }

  return {
    intervals,
    totalActiveMilliseconds,
    totalPausedMilliseconds,
  };
}
