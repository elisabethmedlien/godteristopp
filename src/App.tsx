import "./App.css";
import Calendar, { SkipDay } from "./Calendar/Calendar";

const TOTAL_GOAL_DAYS = 100; // Total sticky notes you must flip
const NAME = "Kine";

const predefinedSkipDays: SkipDay[] = [
  { date: "2026-02-07", reason: "Vilde sin bursdag", emoji: "🎂" },
];

function App() {
  return (
    <Calendar
      name={NAME}
      totalGoalDays={TOTAL_GOAL_DAYS}
      predefinedSkipDays={predefinedSkipDays}
    />
  );
}

export default App;
