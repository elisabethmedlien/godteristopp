import React, { useMemo, useState, useEffect } from "react";
import "./App.css";
import Calendar, { SkipDay, generateDates } from "./Calendar/Calendar";

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

const ROOT_CONFIG_KEY = "godteristopp-builder";

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

const emojiOptions = ["🎂", "🎉", "✨", "💪", "😍", "🍏"];

interface BuilderConfig {
  name: string;
  goalDays: number;
  skipDays: SkipDay[];
}

function RootCalendar() {
  const defaultConfig: BuilderConfig = {
    name: "Kine",
    goalDays: 100,
    skipDays: parseSkipDays("2026-02-07|Vilde sin bursdag|🎂"),
  };

  const storedConfig = (() => {
    const raw = localStorage.getItem(ROOT_CONFIG_KEY);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.skipDays)) {
        return parsed;
      }
      if (parsed.skipInput) {
        return {
          name: parsed.name || defaultConfig.name,
          goalDays: parsed.goalDays || defaultConfig.goalDays,
          skipDays: parseSkipDays(parsed.skipInput),
        };
      }
    } catch {
      return null;
    }
    return null;
  })();

  const [config, setConfig] = useState<BuilderConfig>(
    storedConfig || defaultConfig
  );
  const [draft, setDraft] = useState<BuilderConfig>(
    storedConfig || defaultConfig
  );
  const [showBuilder, setShowBuilder] = useState(!storedConfig);

  useEffect(() => {
    localStorage.setItem(ROOT_CONFIG_KEY, JSON.stringify(config));
  }, [config]);

  const totalNotes = draft.goalDays + draft.skipDays.length + 2;
  const dateOptions = useMemo(() => generateDates(totalNotes), [totalNotes]);

  const handleDraftChange = (
    field: "name" | "goalDays" | "skipDays",
    value: string | number | SkipDay[]
  ) => {
    setDraft((prev: BuilderConfig) => ({
      ...prev,
      [field]: value as any,
    }));
  };

  const updateSkipDay = (index: number, update: Partial<SkipDay>) => {
    handleDraftChange(
      "skipDays",
      draft.skipDays.map((day, i) =>
        i === index ? { ...day, ...update } : day
      )
    );
  };

  const removeSkipDay = (index: number) => {
    handleDraftChange(
      "skipDays",
      draft.skipDays.filter((_, i) => i !== index)
    );
  };

  const addSkipDay = () => {
    const used = new Set(draft.skipDays.map((day) => day.date));
    const available = dateOptions.find((date) => !used.has(date.fullDate));
    if (!available) return;
    handleDraftChange("skipDays", [
      ...draft.skipDays,
      { date: available.fullDate, reason: "", emoji: "🎉" },
    ]);
  };

  const usedDates = new Set(draft.skipDays.map((day) => day.date));

  const handleSave = () => {
    setConfig(draft);
    setShowBuilder(false);
  };

  return (
    <div className="app">
      <button
        className="open-builder-btn"
        onClick={() => {
          setDraft(config);
          setShowBuilder(true);
        }}
      >
        Tilpass kalender
      </button>

      <Calendar
        name={config.name}
        totalGoalDays={config.goalDays}
        predefinedSkipDays={config.skipDays}
      />

      <div className={`builder-modal ${showBuilder ? "visible" : ""}`}>
        <div className="builder-card">
          <header>
            <h2>Bygg din egen godteristopp</h2>
            <button onClick={() => setShowBuilder(false)}>Lukk</button>
          </header>
          <form
            className="root-form"
            onSubmit={(event) => event.preventDefault()}
          >
            <label>
              Navn
              <input
                type="text"
                value={draft.name}
                onChange={(event) =>
                  handleDraftChange("name", event.target.value)
                }
              />
            </label>
            <label>
              Antall dager
              <input
                type="number"
                min={1}
                value={draft.goalDays}
                onChange={(event) =>
                  handleDraftChange("goalDays", Number(event.target.value) || 1)
                }
              />
            </label>
            <section className="skip-rows">
              <div className="skip-row-header">
                <span>Dag</span>
                <span>Årsak</span>
                <span>Emoji</span>
                <span></span>
              </div>
              {draft.skipDays.map((skip, index) => (
                <div key={`${skip.date}-${index}`} className="skip-row">
                  <select
                    value={skip.date}
                    onChange={(event) =>
                      updateSkipDay(index, { date: event.target.value })
                    }
                  >
                    {dateOptions.map((date) => (
                      <option
                        key={date.fullDate}
                        value={date.fullDate}
                        disabled={
                          usedDates.has(date.fullDate) &&
                          date.fullDate !== skip.date
                        }
                      >
                        {date.weekday} {date.day}. {date.month}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    maxLength={50}
                    value={skip.reason}
                    onChange={(event) =>
                      updateSkipDay(index, { reason: event.target.value })
                    }
                    placeholder="Hvorfor?"
                  />
                  <select
                    value={skip.emoji}
                    onChange={(event) =>
                      updateSkipDay(index, { emoji: event.target.value })
                    }
                  >
                    {emojiOptions.map((emoji) => (
                      <option key={emoji} value={emoji}>
                        {emoji}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="remove-skip"
                    onClick={() => removeSkipDay(index)}
                    aria-label="Fjern unntaksdag"
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button type="button" className="add-skip" onClick={addSkipDay}>
                Legg til unntaksdag
              </button>
            </section>
          </form>
          <button className="celebration-button" onClick={handleSave}>
            Lagre og lukk
          </button>
        </div>
      </div>
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
