import { Link, Route, Routes } from "react-router-dom";
import { AppBar, Box, Button, Container, Toolbar } from "@mui/material";

import { useEffect, useState } from "react";
import type { Task } from "./types";
import { loadTasks, rolloverIfNeeded, saveTasks } from "./app/storage";

import { TodayPage } from "./pages/TodayPage";
import { WeekPage } from "./pages/WeekPage";

export default function App() {
  // ✅ IMPORTANT: load from storage synchronously to avoid saving [] on first render
  const [tasks, setTasks] = useState<Task[]>(() => {
    const loaded = rolloverIfNeeded(loadTasks());
    return loaded;
  });

  useEffect(() => {
    saveTasks(tasks);
  }, [tasks]);

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
            <Route path="/" element={<TodayPage tasks={tasks} setTasks={setTasks} />} />
            <Route path="/week" element={<WeekPage tasks={tasks} setTasks={setTasks} />} />
          </Routes>
        </Box>
      </Container>
    </>
  );
}
