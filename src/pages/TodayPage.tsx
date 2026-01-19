import dayjs from "dayjs";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Box,
  Button,
  Card,
  CardContent,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import TodayIcon from "@mui/icons-material/Today";
import CheckIcon from "@mui/icons-material/Check";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";

import type { Task } from "../types";
import { tasksForDate } from "../app/taskLogic";
import { weekStartMonday, ymd } from "../app/date";
import { TaskDialog } from "../components/TaskDialog";
import { ConfirmDoneDialog } from "../components/ConfirmDoneDialog";
import { ConfirmDeleteDialog } from "../components/ConfirmDeleteDialog";

import {
  COMPLETIONS_KEY,
  loadCompletions,
  saveCompletions,
  markDoneForDate,
  type CompletionMap,
} from "../app/completions";

export function TodayPage(props: { tasks: Task[]; setTasks: (next: Task[]) => void }) {
  // ✅ read date from URL: /?date=YYYY-MM-DD
  const [searchParams] = useSearchParams();
  const initialDayParam = searchParams.get("date");

  const [selectedDay, setSelectedDay] = useState(() =>
    initialDayParam ?? ymd(dayjs())
  );

  // ✅ update selectedDay if user navigates with another date param
  useEffect(() => {
    const param = searchParams.get("date");
    if (param) {
      setSelectedDay(param);
    }
  }, [searchParams]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Task | undefined>(undefined);

  const [completions, setCompletions] = useState<CompletionMap>(() => loadCompletions());
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key !== COMPLETIONS_KEY) return;
      // reload completions whenever another tab updates it
      setCompletions(loadCompletions());
    }

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const todays = useMemo(
    () => tasksForDate(props.tasks, selectedDay, completions),
    [props.tasks, selectedDay, completions]
  );

  const [doneConfirm, setDoneConfirm] = useState<{ open: boolean; task?: Task }>({ open: false });
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; task?: Task }>({
    open: false,
  });

  function upsert(t: Task) {
    const next = props.tasks.some((x) => x.id === t.id)
      ? props.tasks.map((x) => (x.id === t.id ? t : x))
      : [...props.tasks, t];
    props.setTasks(next);
  }

  function remove(id: string) {
    props.setTasks(props.tasks.filter((t) => t.id !== id));
  }

  function markTemporaryDone(task: Task) {
    props.setTasks(
      props.tasks.map((t) =>
        t.id === task.id ? { ...t, done: true, updatedAt: new Date().toISOString() } : t
      )
    );
  }

  function markPermanentDoneForSelectedDate(task: Task) {
    const next = markDoneForDate(completions, task.id, selectedDay);
    setCompletions(next);
    saveCompletions(next);
  }

  function moveTemporaryToTomorrow(task: Task) {
    if (task.type !== "TEMPORARY") return;
    const tomorrow = dayjs(task.date ?? selectedDay).add(1, "day");
    upsert({
      ...task,
      date: ymd(tomorrow),
      done: false,
      updatedAt: new Date().toISOString(),
    });
  }

  // ✅ NEW: move TEMPORARY to today (this week only, from a future day)
  function moveTemporaryToToday(task: Task) {
    if (task.type !== "TEMPORARY") return;
    const todayYmd = ymd(dayjs());
    upsert({
      ...task,
      date: todayYmd,
      done: false,
      updatedAt: new Date().toISOString(),
    });
  }

  // ✅ NEW: move PERMANENT occurrence (selectedDay) to today for THIS WEEK ONLY
  // Implementation: mark permanent as done on selectedDay + create temp clone on today
  function movePermanentOccurrenceToToday(task: Task) {
    if (task.type !== "PERMANENT") return;

    const todayYmd = ymd(dayjs());
    const nowIso = new Date().toISOString();

    // 1) hide the permanent occurrence on its original day (selectedDay)
    const next = markDoneForDate(completions, task.id, selectedDay);
    setCompletions(next);
    saveCompletions(next);

    // 2) create a temporary one-time task for today
    const temp: Task = {
      id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
      title: task.title,
      type: "TEMPORARY",
      date: todayYmd,
      done: false,
      createdAt: nowIso,
      updatedAt: nowIso,
      emergency: task.emergency ?? 5,
    };
    upsert(temp);
  }

  const title = dayjs(selectedDay).format("dddd, MMM D");

  const todayYmd = ymd(dayjs());
  const currentWeekStart = weekStartMonday(dayjs());
  const currentWeekEnd = ymd(dayjs(currentWeekStart).add(6, "day"));

  function isWithinThisWeek(dateYmd: string) {
    return dateYmd >= currentWeekStart && dateYmd <= currentWeekEnd;
  }

  function canMoveFromSelectedDayToToday(task: Task) {
    // user wants: move from day AFTER today -> today, only this week
    if (!isWithinThisWeek(selectedDay)) return false;
    if (selectedDay <= todayYmd) return false;

    if (task.type === "TEMPORARY") {
      return true;
    }

    if (task.type === "PERMANENT") {
      return true;
    }

    return false;
  }

  const permanentColorMap: { [level: number]: { bg: string; border: string; text: string } } = {
    1: { bg: "#0D47A1", border: "#08306B", text: "#FFFFFF" },
    2: { bg: "#1565C0", border: "#0D47A1", text: "#FFFFFF" },
    3: { bg: "#1E88E5", border: "#1565C0", text: "#FFFFFF" },
    4: { bg: "#90CAF9", border: "#42A5F5", text: "#000000" },
    5: { bg: "#E3F2FD", border: "#BBDEFB", text: "#000000" },
  };

  const temporaryColorMap: { [level: number]: { bg: string; border: string; text: string } } = {
    1: { bg: "#F57F17", border: "#E65100", text: "#000000" },
    2: { bg: "#F9A825", border: "#F57F17", text: "#000000" },
    3: { bg: "#FDD835", border: "#FBC02D", text: "#000000" },
    4: { bg: "#FFF59D", border: "#FDD835", text: "#000000" },
    5: { bg: "#FFFDE7", border: "#FFF9C4", text: "#000000" },
  };

  function getTaskColors(task: Task) {
    const level = task.emergency ?? 5;
    const safeLevel = Math.min(5, Math.max(1, level));

    const map = task.type === "PERMANENT" ? permanentColorMap : temporaryColorMap;
    return map[safeLevel] ?? map[5];
  }

  return (
    <Box sx={{ maxWidth: 900, mx: "auto", p: 2 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <IconButton onClick={() => setSelectedDay(ymd(dayjs(selectedDay).subtract(1, "day")))}>
            <ArrowBackIcon />
          </IconButton>
          <IconButton onClick={() => setSelectedDay(ymd(dayjs(selectedDay).add(1, "day")))}>
            <ArrowForwardIcon />
          </IconButton>
          <Button startIcon={<TodayIcon />} onClick={() => setSelectedDay(ymd(dayjs()))}>
            Today
          </Button>
          <Typography variant="h6">{title}</Typography>
        </Stack>

        <Button
          variant="contained"
          onClick={() => {
            setEditing(undefined);
            setDialogOpen(true);
          }}
        >
          Add task
        </Button>
      </Stack>

      <Stack spacing={2}>
        {todays.map((task) => {
          const col = getTaskColors(task);

          return (
            <Card
              key={task.id}
              variant="outlined"
              sx={{
                backgroundColor: col.bg,
                borderColor: col.border,
                color: col.text,
                borderWidth: 1,
              }}
            >
              <CardContent
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 2,
                }}
              >
                <Box>
                  <Typography
                    fontWeight={700}
                    sx={{ cursor: "pointer", userSelect: "none" }}
                    onClick={() => {
                      setEditing(task);
                      setDialogOpen(true);
                    }}
                  >
                    {task.title}
                  </Typography>

                  <Typography variant="body2" sx={{ color: col.text }}>
                    {task.type === "PERMANENT" ? "Permanent (weekly)" : "Temporary (one-time)"}
                  </Typography>
                </Box>

                <Stack direction="row" spacing={1} alignItems="center">
                  {task.type === "TEMPORARY" && (
                    <Button startIcon={<SwapHorizIcon />} onClick={() => moveTemporaryToTomorrow(task)}>
                      Move to tomorrow
                    </Button>
                  )}

                  {canMoveFromSelectedDayToToday(task) && (
                    <Button
                      startIcon={<TodayIcon />}
                      onClick={() => {
                        if (task.type === "TEMPORARY") moveTemporaryToToday(task);
                        if (task.type === "PERMANENT") movePermanentOccurrenceToToday(task);
                      }}
                    >
                      Move to today
                    </Button>
                  )}

                  <Button
                    startIcon={<CheckIcon />}
                    variant="outlined"
                    onClick={() => setDoneConfirm({ open: true, task })}
                    sx={{
                      borderColor: col.text,
                      color: col.text,
                    }}
                  >
                    Done
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          );
        })}

        {todays.length === 0 && <Typography color="text.secondary">No tasks for this day.</Typography>}
      </Stack>

      <TaskDialog
        open={dialogOpen}
        mode={editing ? "edit" : "create"}
        task={editing}
        defaultDateYmd={selectedDay}
        onClose={() => {
          setDialogOpen(false);
          setEditing(undefined);
        }}
        onSave={upsert}
        onDelete={remove}
        onMoveOccurrenceToToday={(task, fromDateYmd) => {
          const todayStr = ymd(dayjs());
          const nowIso = new Date().toISOString();

          const next = markDoneForDate(completions, task.id, fromDateYmd);
          setCompletions(next);
          saveCompletions(next);

          const temp: Task = {
            id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
            title: task.title,
            type: "TEMPORARY",
            date: todayStr,
            done: false,
            createdAt: nowIso,
            updatedAt: nowIso,
            emergency: task.emergency ?? 5,
          };
          upsert(temp);
        }}
      />

      <ConfirmDoneDialog
        open={doneConfirm.open}
        title={doneConfirm.task?.title ?? ""}
        onCancel={() => setDoneConfirm({ open: false })}
        onConfirm={() => {
          const t = doneConfirm.task;
          setDoneConfirm({ open: false });
          if (!t) return;

          if (t.type === "TEMPORARY") markTemporaryDone(t);
          if (t.type === "PERMANENT") markPermanentDoneForSelectedDate(t);
        }}
      />

      <ConfirmDeleteDialog
        open={deleteConfirm.open}
        title={deleteConfirm.task?.title ?? ""}
        onCancel={() => setDeleteConfirm({ open: false })}
        onConfirm={() => {
          const t = deleteConfirm.task;
          setDeleteConfirm({ open: false });
          if (!t) return;
          remove(t.id);
        }}
      />
    </Box>
  );
}
