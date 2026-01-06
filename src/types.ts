export type TaskType = "PERMANENT" | "TEMPORARY";

export type Task = {
  id: string;
  title: string;
  type: TaskType;

  weekday?: number; // PERMANENT: 1=Mon..7=Sun
  date?: string;    // TEMPORARY: YYYY-MM-DD

  done?: boolean;
  createdAt: string;
  updatedAt: string;
};
