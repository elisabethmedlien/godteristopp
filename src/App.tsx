import React, { useEffect, useMemo, useState } from "react";
import "./App.css";
import Calendar, { SkipDay, generateDates } from "./Calendar/Calendar";

const routes = [
  {
    path: "/elisabeth",
    props: {
      name: "Elisabeth",
      startDate: "2026-01-01",
      endDate: "2026-04-01",
      predefinedSkipDays: [],
    },
  },
  {
    path: "/kine",
    props: {
      name: "Kine",
      startDate: "2026-01-01",
      endDate: "2026-04-10",
      predefinedSkipDays: [
        { date: "2026-02-07", reason: "Vilde sin bursdag", emoji: "🎂" },
      ],
    },
  },
];

const normalizedPath = () =>
  window.location.pathname.replace(/\/+$/, "") || "/";

const ROOT_CONFIG_KEY = "godteristopp-builder";
const MS_PER_DAY = 24 * 60 * 60 * 1000;

const parseISODate = (value: string) => new Date(`${value}T00:00:00+00:00`);
const formatISODate = (date: Date) => date.toISOString().split("T")[0];
const addDaysToDate = (value: string, days: number) =>
  formatISODate(new Date(parseISODate(value).getTime() + days * MS_PER_DAY));

const dateDifferenceInclusive = (from: string, to: string) => {
  const start = parseISODate(from).getTime();
  const end = parseISODate(to).getTime();
  if (isNaN(start) || isNaN(end)) return 1;
  const diff = Math.floor((end - start) / MS_PER_DAY) + 1;
  return diff > 0 ? diff : 1;
};

const DEFAULT_START_DATE = "2026-01-01";
const DEFAULT_END_DATE = addDaysToDate(DEFAULT_START_DATE, 99);

interface BuilderConfig {
  name: string;
  startDate: string;
  endDate: string;
  skipDays: SkipDay[];
}

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

function RootCalendar() {
  const defaultConfig: BuilderConfig = {
    name: "Kine",
    startDate: DEFAULT_START_DATE,
    endDate: DEFAULT_END_DATE,
    skipDays: parseSkipDays("2026-02-07|Vilde sin bursdag|🎂"),
  };

  const storedConfig = (() => {
    const raw = localStorage.getItem(ROOT_CONFIG_KEY);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      if (
        parsed &&
        Array.isArray(parsed.skipDays) &&
        parsed.startDate &&
        parsed.endDate
      ) {
        return parsed as BuilderConfig;
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

  // Calculate total days from draft dates for dropdown options
  const draftTotalDays = dateDifferenceInclusive(
    draft.startDate,
    draft.endDate
  );
  const dateOptions = useMemo(
    () => generateDates(draftTotalDays, draft.startDate),
    [draftTotalDays, draft.startDate]
  );

  const handleDraftChange = (
    field: keyof BuilderConfig,
    value: string | SkipDay[]
  ) => {
    setDraft((prev) => ({
      ...prev,
      [field]: value,
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
    // Filter out skip days that are outside the new date range
    const validSkipDays = draft.skipDays.filter(
      (skip) => skip.date >= draft.startDate && skip.date <= draft.endDate
    );
    setConfig({ ...draft, skipDays: validSkipDays });
    setShowBuilder(false);
  };

  // Calculate total days for calendar from config
  const configTotalDays = dateDifferenceInclusive(
    config.startDate,
    config.endDate
  );

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
        startDate={config.startDate}
        totalDays={configTotalDays}
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
              Fra dato
              <input
                type="date"
                value={draft.startDate}
                onChange={(event) =>
                  handleDraftChange("startDate", event.target.value)
                }
              />
            </label>
            <label>
              Til dato
              <input
                type="date"
                value={draft.endDate}
                onChange={(event) =>
                  handleDraftChange("endDate", event.target.value)
                }
              />
            </label>
            <p className="date-info">{draftTotalDays} dager totalt</p>
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

  const totalDays = dateDifferenceInclusive(
    route.props.startDate,
    route.props.endDate
  );

  return (
    <Calendar
      name={route.props.name}
      startDate={route.props.startDate}
      totalDays={totalDays}
      predefinedSkipDays={route.props.predefinedSkipDays}
    />
  );
}

export default App;
