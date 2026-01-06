const COMPLETIONS_KEY = "weekly_todo_completions_v1";

/**
 * Store: { [key: "taskId::YYYY-MM-DD"]: true }
 * Only for PERMANENT tasks.
 */
export type CompletionMap = Record<string, true>;

export function completionKey(taskId: string, dateYmd: string) {
  return `${taskId}::${dateYmd}`;
}

export function loadCompletions(): CompletionMap {
  try {
    const raw = localStorage.getItem(COMPLETIONS_KEY);
    return raw ? (JSON.parse(raw) as CompletionMap) : {};
  } catch {
    return {};
  }
}

export function saveCompletions(map: CompletionMap) {
  localStorage.setItem(COMPLETIONS_KEY, JSON.stringify(map));
}

export function isDoneForDate(map: CompletionMap, taskId: string, dateYmd: string) {
  return Boolean(map[completionKey(taskId, dateYmd)]);
}

export function markDoneForDate(map: CompletionMap, taskId: string, dateYmd: string): CompletionMap {
  return { ...map, [completionKey(taskId, dateYmd)]: true };
}

export function unmarkDoneForDate(map: CompletionMap, taskId: string, dateYmd: string): CompletionMap {
  const next = { ...map };
  delete next[completionKey(taskId, dateYmd)];
  return next;
}
