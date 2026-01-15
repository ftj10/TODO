export type TaskType = "PERMANENT" | "TEMPORARY";

/**
 * Defines a task in the weekly TODO application.
 *
 * `emergency` indicates the priority of a task. A lower number means a higher priority.
 * 1 = highest urgency, 5 = lowest urgency (default).
 */
export type Task = {
  id: string;
  title: string;
  type: TaskType;

  /** PERMANENT tasks specify a weekday (1=Mon..7=Sun). */
  weekday?: number;

  /** TEMPORARY tasks specify a calendar date (YYYY-MM-DD). */
  date?: string;

  /**
   * Emergency level of the task. 1 = highest, 5 = lowest (default).
   * Existing tasks without this property will default to 5.
   */
  emergency?: number;

  /** Only used for TEMPORARY tasks to mark completion. */
  done?: boolean;

  createdAt: string;
  updatedAt: string;
};