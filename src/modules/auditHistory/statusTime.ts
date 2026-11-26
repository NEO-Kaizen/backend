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
  initialStatusId?: number;
  currentStatus: string;
  currentStatusId?: number;
  currentIsTerminal: boolean;
  pausedStatusIds: readonly number[];
  terminalStatusIds: readonly number[];
  transitions: readonly StatusTimeTransition[];
  now: Date;
}

export class StatusTimeHistoryDivergenceError extends Error {
  constructor() {
    super("A auditoria não corresponde ao Status atual da solicitação.");
    this.name = "StatusTimeHistoryDivergenceError";
  }
}

function positiveMilliseconds(start: Date, end: Date): number {
  return Math.max(0, end.getTime() - start.getTime());
}

export function calculateStatusTime(input: StatusTimeCalculationInput): StatusTimeSummary {
  const pausedStatusIds = new Set(input.pausedStatusIds);
  const terminalStatusIds = new Set(input.terminalStatusIds);
  const intervals: StatusTimeInterval[] = [];
  let status = input.initialStatus;
  let statusId = input.initialStatusId;
  let enteredAt = input.openedAt;

  for (const transition of input.transitions) {
    if (transition.status === status) continue;

    const isTerminal = statusId !== undefined && terminalStatusIds.has(statusId);
    const duration = isTerminal ? 0 : positiveMilliseconds(enteredAt, transition.occurredAt);
    const isPaused = statusId !== undefined && pausedStatusIds.has(statusId);
    intervals.push({
      status,
      enteredAt: enteredAt.toISOString(),
      exitedAt: isTerminal ? enteredAt.toISOString() : transition.occurredAt.toISOString(),
      activeMilliseconds: isPaused ? 0 : duration,
      pausedMilliseconds: isPaused ? duration : 0,
      isPaused,
    });

    status = transition.status;
    statusId = transition.statusId;
    enteredAt = transition.occurredAt;
  }

  if (status !== input.currentStatus) {
    throw new StatusTimeHistoryDivergenceError();
  }
  if (
    input.currentStatusId !== undefined &&
    statusId !== undefined &&
    statusId !== input.currentStatusId
  ) {
    throw new StatusTimeHistoryDivergenceError();
  }

  const currentIsTerminal =
    input.currentIsTerminal || (statusId !== undefined && terminalStatusIds.has(statusId));
  const currentEnd = currentIsTerminal
    ? enteredAt
    : input.now.getTime() >= enteredAt.getTime()
      ? input.now
      : enteredAt;
  const currentDuration = positiveMilliseconds(enteredAt, currentEnd);
  const currentIsPaused = statusId !== undefined && pausedStatusIds.has(statusId);

  intervals.push({
    status,
    enteredAt: enteredAt.toISOString(),
    exitedAt: currentIsTerminal ? enteredAt.toISOString() : null,
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
