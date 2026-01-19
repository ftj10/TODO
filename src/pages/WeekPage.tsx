import { Box, Button, Stack, Typography } from "@mui/material";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import dayjs from "dayjs";

import type { Task } from "../types";
import { toCalendarEventsForRange } from "../app/taskLogic";
import { TaskDialog } from "../components/TaskDialog";
import { ymd } from "../app/date";

import { loadCompletions } from "../app/completions";

export function WeekPage(props: {
  tasks: Task[];
  setTasks: (next: Task[]) => void;
  completionsRev: number;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Task | undefined>(undefined);
  const [defaultDate, setDefaultDate] = useState(() => ymd(dayjs()));

  const navigate = useNavigate();

  function upsert(t: Task) {
    const next = props.tasks.some((x) => x.id === t.id)
      ? props.tasks.map((x) => (x.id === t.id ? t : x))
      : [...props.tasks, t];
    props.setTasks(next);
  }

  function remove(id: string) {
    props.setTasks(props.tasks.filter((t) => t.id !== id));
  }

  // ✅ Generate events for the currently visible range (prev/next week works)
  const events = useMemo(() => {
    return (info: any, successCallback: any) => {
      const completions = loadCompletions(); // read latest (in case TodayPage changed it)
      const start = dayjs(info.start);
      const end = dayjs(info.end);
      const evts = toCalendarEventsForRange(props.tasks, completions, start, end);
      successCallback(evts);
    };
  }, [props.tasks, props.completionsRev]);

  return (
    <Box sx={{ maxWidth: 1100, mx: "auto", p: 2 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h6">Weekly Schedule (Mon–Sun)</Typography>
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

      <FullCalendar
        plugins={[timeGridPlugin, dayGridPlugin, interactionPlugin]}
        initialView="dayGridWeek"
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridWeek,timeGridWeek",
        }}
        firstDay={1}
        events={events}

        // ✅ CLICK "Monday 1" / "Tuesday 2" header to jump to TodayPage
        dayHeaderContent={(arg) => {
          const ymdStr = dayjs(arg.date).format("YYYY-MM-DD");
          return (
            <span
              style={{ cursor: "pointer", textDecoration: "underline" }}
              onClick={() => navigate(`/?date=${ymdStr}`)}
            >
              {arg.text}
            </span>
          );
        }}

        eventClick={(info) => {
          const taskId = info.event.extendedProps.taskId as string;
          const task = props.tasks.find((t) => t.id === taskId);
          if (!task) return;
          setEditing(task);
          const startStr = info.event.startStr.slice(0, 10);
          setDefaultDate(startStr);
          setDialogOpen(true);
        }}

        // optional: keep only for selecting default date (no jump)
        dateClick={(info) => {
          const date = info.dateStr.slice(0, 10);
          setDefaultDate(date);
        }}

        height="auto"
      />


      <TaskDialog
        open={dialogOpen}
        mode={editing ? "edit" : "create"}
        task={editing}
        defaultDateYmd={defaultDate}
        onClose={() => {
          setDialogOpen(false);
          setEditing(undefined);
        }}
        onSave={upsert}
        onDelete={remove}
      />
    </Box>
  );
}
