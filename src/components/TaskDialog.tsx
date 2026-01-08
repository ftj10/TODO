import dayjs from "dayjs";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
} from "@mui/material";
import type { Task, TaskType } from "../types";
import { useEffect, useMemo, useState } from "react";
import { weekdayISO, weekStartMonday, ymd } from "../app/date";

type Mode = "create" | "edit";

export function TaskDialog(props: {
  open: boolean;
  mode: Mode;
  defaultDateYmd: string;
  task?: Task;
  onClose: () => void;
  onSave: (t: Task) => void;
  onDelete?: (id: string) => void;
  onMoveOccurrenceToToday?: (task: Task, fromDateYmd: string) => void;
}) {
  const base = useMemo(() => {
    if (props.mode === "edit" && props.task) return props.task;

    const d = dayjs(props.defaultDateYmd);
    return {
      id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
      title: "",
      type: "TEMPORARY" as TaskType,
      date: ymd(d),
      weekday: weekdayISO(d),
      done: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } satisfies Task;
  }, [props.mode, props.task, props.defaultDateYmd, props.open]);

  const [title, setTitle] = useState(base.title);
  const [type, setType] = useState<TaskType>(base.type);
  const [weekday, setWeekday] = useState<number>(base.weekday ?? 1);
  const [date, setDate] = useState<string>(base.date ?? props.defaultDateYmd);

  useEffect(() => {
    if (!props.open) return;
    setTitle(base.title);
    setType(base.type);
    setWeekday(base.weekday ?? 1);
    setDate(base.date ?? props.defaultDateYmd);
  }, [props.open, base, props.defaultDateYmd]);

  const canSave = title.trim().length > 0;

  function buildTask(override?: Partial<Task>): Task {
    const now = new Date().toISOString();
    return {
      ...base,
      title: title.trim(),
      type,
      weekday: type === "PERMANENT" ? weekday : undefined,
      date: type === "TEMPORARY" ? date : undefined,
      done: type === "TEMPORARY" ? (base.done ?? false) : undefined,
      updatedAt: now,
      ...override,
    };
  }

  function save() {
    props.onSave(buildTask());
    props.onClose();
  }

  const todayYmd = ymd(dayjs());
  const currentWeekStart = weekStartMonday(dayjs());
  const currentWeekEnd = ymd(dayjs(currentWeekStart).add(6, "day"));

  // TEMPORARY → move to today
  const canMoveTempToToday =
    props.mode === "edit" &&
    type === "TEMPORARY" &&
    date > todayYmd &&
    date >= currentWeekStart &&
    date <= currentWeekEnd;

  function moveTempToToday() {
    props.onSave(buildTask({ date: todayYmd, done: false }));
    props.onClose();
  }

  // PERMANENT → move occurrence to today
  const fromDateYmd = props.defaultDateYmd;
  const canMovePermanentOccurrenceToToday =
    props.mode === "edit" &&
    type === "PERMANENT" &&
    Boolean(props.onMoveOccurrenceToToday) &&
    fromDateYmd > todayYmd &&
    fromDateYmd >= currentWeekStart &&
    fromDateYmd <= currentWeekEnd;

  function movePermanentOccurrenceToToday() {
    const taskNow = buildTask();
    props.onMoveOccurrenceToToday?.(taskNow, fromDateYmd);
    props.onClose();
  }

  const weekdayItems = [
    { v: 1, label: "Monday" },
    { v: 2, label: "Tuesday" },
    { v: 3, label: "Wednesday" },
    { v: 4, label: "Thursday" },
    { v: 5, label: "Friday" },
    { v: 6, label: "Saturday" },
    { v: 7, label: "Sunday" },
  ];

  return (
    <Dialog open={props.open} onClose={props.onClose} fullWidth maxWidth="sm">
      <DialogTitle>{props.mode === "create" ? "Add task" : "Edit task"}</DialogTitle>

      {/* ✅ FORM: Enter submits */}
      <Box
        component="form"
        onSubmit={(e) => {
          e.preventDefault();
          if (!canSave) return;
          save();
        }}
      >
        <DialogContent sx={{ display: "grid", gap: 3, pt: 2 }}>
          <TextField
            label="Task name"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
            InputLabelProps={{ shrink: true }}
            sx={{ mt: 2 }}
          />

          <FormControl>
            <InputLabel>Type</InputLabel>
            <Select label="Type" value={type} onChange={(e) => setType(e.target.value as TaskType)}>
              <MenuItem value="PERMANENT">Permanent (every week)</MenuItem>
              <MenuItem value="TEMPORARY">Temporary (one-time)</MenuItem>
            </Select>
          </FormControl>

          {type === "PERMANENT" ? (
            <FormControl>
              <InputLabel>Weekday</InputLabel>
              <Select
                label="Weekday"
                value={weekday}
                onChange={(e) => setWeekday(Number(e.target.value))}
              >
                {weekdayItems.map((it) => (
                  <MenuItem key={it.v} value={it.v}>
                    {it.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          ) : (
            <TextField
              label="Date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          )}
        </DialogContent>

        <DialogActions>
          {props.mode === "edit" && props.onDelete && props.task ? (
            <Button
              color="error"
              onClick={() => {
                props.onDelete?.(props.task!.id);
                props.onClose();
              }}
            >
              Delete
            </Button>
          ) : (
            <span />
          )}

          {canMoveTempToToday ? <Button onClick={moveTempToToday}>Move to today</Button> : <span />}

          {canMovePermanentOccurrenceToToday ? (
            <Button onClick={movePermanentOccurrenceToToday}>
              Move occurrence to today
            </Button>
          ) : (
            <span />
          )}

          <Button onClick={props.onClose}>Cancel</Button>
          <Button variant="contained" disabled={!canSave} type="submit">
            Save
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
