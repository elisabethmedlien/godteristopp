import "./App.css";
import Calendar, { SkipDay } from "./Calendar/Calendar";

const TOTAL_GOAL_DAYS = 100; // Total sticky notes you must flip
const NAME = "Kine";

const predefinedSkipDays: SkipDay[] = [
  { date: "2026-02-07", reason: "Vilde sin bursdag", emoji: "🎂" },
];

const routes = [
  {
    path: "/elisabeth",
    props: {
      name: "Elisabeth",
      totalGoalDays: 90,
      predefinedSkipDays: [],
    },
  },
  {
    path: "/",
    props: {
      name: NAME,
      totalGoalDays: TOTAL_GOAL_DAYS,
      predefinedSkipDays,
    },
  },
];

const resolveRoute = () => {
  const normalized = window.location.pathname.replace(/\/+$/, "") || "/";
  return routes.find((route) => route.path === normalized) || routes[1];
};

function App() {
  const route = resolveRoute();

  return (
    <Calendar
      name={route.props.name}
      totalGoalDays={route.props.totalGoalDays}
      predefinedSkipDays={route.props.predefinedSkipDays}
    />
  );
}

export default App;
