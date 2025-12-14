import React, { useState, useEffect } from "react";

// Pre-defined skip days with reasons
export interface SkipDay {
  date: string; // YYYY-MM-DD format
  reason: string;
  emoji: string;
}

const parseISODate = (value: string) => new Date(`${value}T00:00:00+00:00`);

const formatLongDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString("no-NO", {
    day: "numeric",
    month: "long",
  });

export const generateDates = (totalDays: number, startDate = "2026-01-01") => {
  const dates = [];
  const base = parseISODate(startDate);

  for (let i = 0; i < totalDays; i++) {
    const date = new Date(base);
    date.setDate(base.getDate() + i);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const fullDate = `${year}-${month}-${day}`;

    dates.push({
      id: i,
      day: date.getDate(),
      month: date.toLocaleDateString("no-NO", { month: "short" }),
      fullDate: fullDate,
      weekday: date.toLocaleDateString("no-NO", { weekday: "short" }),
    });
  }
  return dates;
};

// Post-it note colors
const noteColors = [
  "#FFE066", // Yellow
  "#FF6B9D", // Pink
  "#7FDBFF", // Light Blue
  "#98FB98", // Pale Green
  "#FFB366", // Orange
  "#DDA0DD", // Plum
  "#87CEEB", // Sky Blue
  "#F0E68C", // Khaki
];

// Create a map for quick skip day lookup
const skipDayMap = (predefinedSkipDays: SkipDay[]) =>
  new Map(predefinedSkipDays.map((sd) => [sd.date, sd]));

function Calendar({
  name,
  startDate,
  totalDays,
  predefinedSkipDays,
}: {
  name: string;
  startDate: string;
  totalDays: number;
  predefinedSkipDays: SkipDay[];
}) {
  const [flippedNotes, setFlippedNotes] = useState<Set<number>>(() => {
    const saved = localStorage.getItem("godteristopp-flipped");
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  const dates = generateDates(totalDays, startDate);

  // Save to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem(
      "godteristopp-flipped",
      JSON.stringify(Array.from(flippedNotes))
    );
  }, [flippedNotes]);

  const isSkipDay = (date: { id: number; fullDate: string }) =>
    skipDayMap(predefinedSkipDays).has(date.fullDate);

  const getSkipDayInfo = (date: { id: number; fullDate: string }) =>
    skipDayMap(predefinedSkipDays).get(date.fullDate) || null;

  const todayStr = (() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  })();

  const isFutureDate = (fullDate: string) => fullDate > todayStr;

  const handleFlip = (id: number, fullDate: string) => {
    // Skip days are auto-flipped, don't allow manual toggle
    if (isSkipDay({ id, fullDate })) return;
    // Future dates cannot be flipped
    if (isFutureDate(fullDate)) return;

    setFlippedNotes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // Calculate progress excluding skip days
  const totalSkipDays = predefinedSkipDays.length;
  const effectiveDays = Math.max(totalDays - totalSkipDays, 0);
  const progress =
    effectiveDays > 0 ? (flippedNotes.size / effectiveDays) * 100 : 0;

  const getColor = (id: number) => noteColors[id % noteColors.length];

  const rangeLabel =
    dates.length > 0
      ? `${formatLongDate(dates[0].fullDate)} → ${formatLongDate(
          dates[dates.length - 1].fullDate
        )}`
      : "";
  const goalCompleted = flippedNotes.size >= effectiveDays && effectiveDays > 0;
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    if (goalCompleted) {
      setShowCelebration(true);
    }
  }, [goalCompleted]);

  return (
    <div className="calendar">
      <header className="header">
        <h1>🍬 {name}'s godteristopp 🍬</h1>
        <p className="subtitle">{rangeLabel}</p>
        <div className="progress-container">
          <div
            className="progress-bar"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
          <span className="progress-text">
            {flippedNotes.size} av {effectiveDays} dager ({Math.round(progress)}
            %)
          </span>
        </div>
        {totalSkipDays > 0 && (
          <p className="skip-info">
            🎉 {totalSkipDays} unntaksdag{totalSkipDays > 1 ? "er" : ""} (teller
            ikke)
          </p>
        )}
        {goalCompleted && (
          <p className="celebration-banner">
            Gratulerer! Du har fullført alle {effectiveDays} dager 🎉
          </p>
        )}
      </header>

      <main className="board">
        <div className="notes-grid">
          {dates.map((date) => {
            const skipDay = isSkipDay(date);
            const skipInfo = getSkipDayInfo(date);
            const future = isFutureDate(date.fullDate);
            const isFlipped = flippedNotes.has(date.id) || skipDay;

            return (
              <div
                key={date.id}
                className={`note-container ${isFlipped ? "flipped" : ""} ${
                  skipDay ? "skip-day" : ""
                } ${future ? "future" : ""}`}
                onClick={() => handleFlip(date.id, date.fullDate)}
                style={
                  { "--note-color": getColor(date.id) } as React.CSSProperties
                }
                title={
                  skipDay
                    ? `${skipInfo?.emoji} ${skipInfo?.reason}`
                    : future
                    ? "Denne dagen har ikke skjedd ennå"
                    : "Klikk for å markere som godterifri."
                }
              >
                <div className="note">
                  <div className="note-front">
                    <span className="weekday">{date.weekday}</span>
                    <span className="day">{date.day}</span>
                    <span className="month">{date.month}</span>
                  </div>
                  <div className={`note-back ${skipDay ? "skip-back" : ""}`}>
                    {skipDay ? (
                      <>
                        <span className="skip-emoji">{skipInfo?.emoji}</span>
                        <span className="skip-reason">{skipInfo?.reason}</span>
                      </>
                    ) : (
                      <>
                        <span className="checkmark">✓</span>
                      </>
                    )}
                  </div>
                </div>
                <div className={`pin ${skipDay ? "pin-gold" : ""}`} />
              </div>
            );
          })}
        </div>
      </main>
      <div
        className={`celebration-modal ${showCelebration ? "visible" : ""}`}
        role="dialog"
        aria-live="polite"
        aria-modal="true"
      >
        <div className="celebration-card">
          <h2>Gratulerer, {name}!</h2>
          <p>Du har fullført alle {effectiveDays} dager! 🎉</p>
          <button
            onClick={() => setShowCelebration(false)}
            className="celebration-button"
          >
            hurra!
          </button>
        </div>
      </div>
    </div>
  );
}

export default Calendar;
