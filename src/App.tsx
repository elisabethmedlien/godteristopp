import React, { useMemo, useState } from "react";
import "./App.css";
import Calendar, { SkipDay } from "./Calendar/Calendar";

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
    path: "/kine",
    props: {
      name: "Kine",
      totalGoalDays: 100,
      predefinedSkipDays: [
        { date: "2026-02-07", reason: "Vilde sin bursdag", emoji: "🎂" },
      ],
    },
  },
];

const normalizedPath = () =>
  window.location.pathname.replace(/\/+$/, "") || "/";

const parseSkipDays = (input: string): SkipDay[] => {
  return input
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((entry) => {
      const [date, reason = "Unntaksdag", emoji = "🎉"] = entry
        .split("|")
        .map((part) => part.trim());
      return { date, reason, emoji };
    })
    .filter((skip) => skip.date);
};

function RootCalendar() {
  const [name, setName] = useState("example");
  const [goalDays, setGoalDays] = useState(50);
  const [skipInput, setSkipInput] = useState("2026-02-07|Vilde sin bursdag|🎂");

  const userSkipDays = useMemo(() => parseSkipDays(skipInput), [skipInput]);

  return (
    <div className="app">
      <section className="root-config">
        <h1>Bygg din egen godteristopp</h1>
        <form className="root-form" onSubmit={(e) => e.preventDefault()}>
          <label>
            Navn
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Navn"
            />
          </label>
          <label>
            Antall dager
            <input
              type="number"
              min={1}
              value={goalDays}
              onChange={(event) => setGoalDays(Number(event.target.value) || 1)}
            />
          </label>
          <label>
            Unntaksdager
            <textarea
              value={skipInput}
              onChange={(event) => setSkipInput(event.target.value)}
              placeholder="2026-02-07|Vilde sin bursdag|🎂"
            />
          </label>
          <p className="form-hint">
            Hver linje: <code>YYYY-MM-DD|Beskrivelse|Emoji</code>. Emoji og
            beskrivelse er valgfrie.
          </p>
        </form>
      </section>

      <Calendar
        name={name}
        totalGoalDays={goalDays}
        predefinedSkipDays={userSkipDays}
      />
    </div>
  );
}

function App() {
  const normalized = normalizedPath();

  if (normalized === "/") {
    return <RootCalendar />;
  }

  const route = routes.find((route) => route.path === normalized);

  if (!route) {
    return <RootCalendar />;
  }

  return (
    <Calendar
      name={route.props.name}
      totalGoalDays={route.props.totalGoalDays}
      predefinedSkipDays={route.props.predefinedSkipDays}
    />
  );
}

export default App;
