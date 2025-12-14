import React, { useState, useEffect } from "react";
import "./App.css";

// Motivational messages for the back of flipped notes
const motivationalMessages = [
  "Du klarte det! 💪",
  "En dag nærmere målet! 🎯",
  "Sterk vilje! 🌟",
  "Fantastisk! ⭐",
  "Keep going! 🚀",
  "Du er rå! 🔥",
  "Imponerende! 👏",
  "Viljestyrke! 💎",
  "Mestrer dette! 🏆",
  "Så bra! 🌈",
  "Champion! 🥇",
  "Heia deg! 🎉",
  "Nailed it! ✨",
  "Respekt! 🙌",
  "Legendarisk! 👑",
];

// Pre-defined skip days with reasons
interface SkipDay {
  date: string; // YYYY-MM-DD format
  reason: string;
  emoji: string;
}

const predefinedSkipDays: SkipDay[] = [
  { date: "2026-02-07", reason: "Vilde sin bursdag", emoji: "🎂" },
];

// Generate dates from Jan 1 to Mar 31, 2026
const generateDates = () => {
  const dates = [];
  const startDate = new Date(2026, 0, 1); // January 1, 2026

  for (let i = 0; i < 90; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    // Format date as YYYY-MM-DD without timezone issues
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

const dates = generateDates();

// Create a map for quick skip day lookup
const skipDayMap = new Map(predefinedSkipDays.map((sd) => [sd.date, sd]));

function App() {
  const [flippedNotes, setFlippedNotes] = useState<Set<number>>(() => {
    const saved = localStorage.getItem("godteristopp-flipped");
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  const [customSkipDays, setCustomSkipDays] = useState<Set<number>>(() => {
    const saved = localStorage.getItem("godteristopp-skipdays");
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  // Save to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem(
      "godteristopp-flipped",
      JSON.stringify(Array.from(flippedNotes))
    );
  }, [flippedNotes]);

  useEffect(() => {
    localStorage.setItem(
      "godteristopp-skipdays",
      JSON.stringify(Array.from(customSkipDays))
    );
  }, [customSkipDays]);

  const isSkipDay = (date: { id: number; fullDate: string }) => {
    return skipDayMap.has(date.fullDate) || customSkipDays.has(date.id);
  };

  const getSkipDayInfo = (date: { id: number; fullDate: string }) => {
    const predefined = skipDayMap.get(date.fullDate);
    if (predefined) return predefined;
    if (customSkipDays.has(date.id)) {
      return { reason: "Unntaksdag", emoji: "🎉" };
    }
    return null;
  };

  const handleFlip = (id: number, fullDate: string) => {
    // Skip days are auto-flipped, don't allow manual toggle
    if (isSkipDay({ id, fullDate })) return;

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

  const handleContextMenu = (
    e: React.MouseEvent,
    id: number,
    fullDate: string
  ) => {
    e.preventDefault();
    // Don't allow modifying predefined skip days
    if (skipDayMap.has(fullDate)) return;

    if (customSkipDays.has(id)) {
      // Remove from skip days
      setCustomSkipDays((prev) => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    } else {
      // Add as skip day
      setCustomSkipDays((prev) => {
        const newSet = new Set(prev);
        newSet.add(id);
        return newSet;
      });
      // Also remove from flipped if it was flipped
      setFlippedNotes((prev) => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  // Calculate progress excluding skip days
  const totalSkipDays = predefinedSkipDays.length + customSkipDays.size;
  const effectiveDays = 90 - totalSkipDays;
  const progress =
    effectiveDays > 0 ? (flippedNotes.size / effectiveDays) * 100 : 0;

  const getMessage = (id: number) =>
    motivationalMessages[id % motivationalMessages.length];
  const getColor = (id: number) => noteColors[id % noteColors.length];

  return (
    <div className="app">
      <header className="header">
        <h1>🍬 Kines kalender for godteristopp 2026 🍬</h1>
        <p className="subtitle">1. januar → 1. april</p>
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
      </header>

      <main className="board">
        <div className="notes-grid">
          {dates.map((date) => {
            const skipDay = isSkipDay(date);
            const skipInfo = getSkipDayInfo(date);
            const isFlipped = flippedNotes.has(date.id) || skipDay;

            return (
              <div
                key={date.id}
                className={`note-container ${isFlipped ? "flipped" : ""} ${
                  skipDay ? "skip-day" : ""
                }`}
                onClick={() => handleFlip(date.id, date.fullDate)}
                onContextMenu={(e) =>
                  handleContextMenu(e, date.id, date.fullDate)
                }
                style={
                  { "--note-color": getColor(date.id) } as React.CSSProperties
                }
                title={
                  skipDay
                    ? `${skipInfo?.emoji} ${skipInfo?.reason}`
                    : "Klikk for å markere som godterifri. Høyreklikk for unntaksdag."
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
                        <span className="message">{getMessage(date.id)}</span>
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

      <footer className="footer">
        <p>Venstreklikk = godterifri dag ✓ | Høyreklikk = unntaksdag 🎉</p>
      </footer>
    </div>
  );
}

export default App;
