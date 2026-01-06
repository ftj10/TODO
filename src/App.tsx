import { Link, Route, Routes } from "react-router-dom";
import { AppBar, Box, Button, Container, Toolbar } from "@mui/material";
import { useEffect, useState } from "react";

import type { Task } from "./types";
import { loadTasks, rolloverIfNeeded, saveTasks } from "./app/storage";
import { COMPLETIONS_KEY } from "./app/completions";

import { TodayPage } from "./pages/TodayPage";
import { WeekPage } from "./pages/WeekPage";

const TASKS_KEY = "weekly_todo_tasks_v1";

export default function App() {
  const [tasks, setTasks] = useState<Task[]>(() => rolloverIfNeeded(loadTasks()));

  // ✅ bump this when completions change in another tab
  const [completionsRev, setCompletionsRev] = useState(0);

  useEffect(() => {
    saveTasks(tasks);
  }, [tasks]);

  useEffect(() => {
    function onStorage(e: StorageEvent) {
      // tasks sync
      if (e.key === TASKS_KEY) {
        if (!e.newValue) {
          setTasks([]);
          return;
        }
        try {
          const next = JSON.parse(e.newValue) as Task[];
          if (Array.isArray(next)) setTasks(next);
        } catch {
          // ignore
        }
        return;
      }

      // ✅ completions sync: trigger rerender/refetch in WeekPage (and any others)
      if (e.key === COMPLETIONS_KEY) {
        setCompletionsRev((x) => x + 1);
      }
    }

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Button color="inherit" component={Link} to="/">
            Today
          </Button>
          <Button color="inherit" component={Link} to="/week">
            Week
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth={false}>
        <Box sx={{ py: 2 }}>
          <Routes>
            <Route
              path="/"
              element={<TodayPage tasks={tasks} setTasks={setTasks} />}
            />
            <Route
              path="/week"
              element={
                <WeekPage
                  tasks={tasks}
                  setTasks={setTasks}
                  completionsRev={completionsRev} // ✅ new prop
                />
              }
            />
          </Routes>
        </Box>
      </Container>
    </>
  );
}
