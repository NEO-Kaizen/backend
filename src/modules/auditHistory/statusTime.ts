export interface StatusTimeTransition {
  status: string;
  statusId?: number;
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
  totalsByStatus: StatusTimeByStatus[];
  totalActiveMilliseconds: number;
  totalPausedMilliseconds: number;
}

export interface StatusTimeByStatus {
  status: string;
  activeMilliseconds: number;
  pausedMilliseconds: number;
  isPaused: boolean;
}

export interface StatusTimeCalculationInput {
  openedAt: Date;
  initialStatus: string;
  currentStatus: string;
  pausedStatusNames: readonly string[];
  pausedStatusIds?: readonly number[];
  transitions: readonly StatusTimeTransition[];
  now: Date;
}

function positiveMilliseconds(start: Date, end: Date): number {
  return Math.max(0, end.getTime() - start.getTime());
}

export function calculateStatusTime(input: StatusTimeCalculationInput): StatusTimeSummary {
  const pausedStatusNames = new Set(input.pausedStatusNames);
  const pausedStatusIds = new Set(input.pausedStatusIds ?? []);
  const intervals: StatusTimeInterval[] = [];
  let status = input.initialStatus;
  let statusId: number | undefined;
  let enteredAt = input.openedAt;

  for (const transition of input.transitions) {
    if (transition.status === status) continue;

    const duration = positiveMilliseconds(enteredAt, transition.occurredAt);
    const isPaused =
      (statusId !== undefined && pausedStatusIds.has(statusId)) || pausedStatusNames.has(status);
    intervals.push({
      status,
      enteredAt: enteredAt.toISOString(),
      exitedAt: transition.occurredAt.toISOString(),
      activeMilliseconds: isPaused ? 0 : duration,
      pausedMilliseconds: isPaused ? duration : 0,
      isPaused,
    });

    status = transition.status;
    statusId = transition.statusId;
    enteredAt = transition.occurredAt;
  }

  const now = input.now.getTime() >= enteredAt.getTime() ? input.now : enteredAt;
  if (status !== input.currentStatus) {
    throw new Error("A auditoria não corresponde ao Status atual da solicitação.");
  }

  const currentDuration = positiveMilliseconds(enteredAt, now);
  const currentIsPaused =
    (statusId !== undefined && pausedStatusIds.has(statusId)) || pausedStatusNames.has(status);

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
  const totalsByStatus = new Map<
    string,
    { status: string; activeMilliseconds: number; pausedMilliseconds: number; isPaused: boolean }
  >();

  for (const interval of intervals) {
    totalActiveMilliseconds += interval.activeMilliseconds;
    totalPausedMilliseconds += interval.pausedMilliseconds;
    const total = totalsByStatus.get(interval.status) ?? {
      status: interval.status,
      activeMilliseconds: 0,
      pausedMilliseconds: 0,
      isPaused: interval.isPaused,
    };
    total.activeMilliseconds += interval.activeMilliseconds;
    total.pausedMilliseconds += interval.pausedMilliseconds;
    totalsByStatus.set(interval.status, total);
  }

  return {
    intervals,
    totalsByStatus: [...totalsByStatus.values()],
    totalActiveMilliseconds,
    totalPausedMilliseconds,
  };
}
