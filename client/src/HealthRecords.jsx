import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  CalendarDays,
  Download,
  FileText,
  Filter,
  Printer,
  Search,
  X,
  Droplets,
} from "lucide-react";

import api from "./api";
import "./HealthRecords.css";

const SLOT_LABELS = {
  morning: "Morning (fasting)",
  after_breakfast: "After breakfast",
  after_lunch: "After lunch",
  after_dinner: "After dinner",
};

const formatDate = (value) => {
  if (!value) return "—";

  return new Date(`${String(value).slice(0, 10)}T00:00:00`)
    .toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
};

const escapeCSV = (value) =>
  `"${String(value ?? "").replace(/"/g, '""')}"`;

export default function HealthRecords() {
  const [readings, setReadings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState("all");

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/readings");
      setReadings(response.data.readings || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load your health records."
      );
    } finally {
      setLoading(false);
    }
  };

  const filteredReadings = useMemo(() => {
    return readings.filter((reading) => {
      const date = String(reading.reading_date).slice(0, 10);
      const value = String(reading.glucose_value);

      const matchesSearch =
        !search ||
        value.includes(search.trim()) ||
        date.includes(search.trim()) ||
        formatDate(date)
          .toLowerCase()
          .includes(search.trim().toLowerCase()) ||
        (SLOT_LABELS[reading.time_slot] || "")
          .toLowerCase()
          .includes(search.trim().toLowerCase());

      const matchesStart = !startDate || date >= startDate;
      const matchesEnd = !endDate || date <= endDate;

      const matchesSlot =
        selectedSlot === "all" ||
        reading.time_slot === selectedSlot;

      return (
        matchesSearch &&
        matchesStart &&
        matchesEnd &&
        matchesSlot
      );
    });
  }, [readings, search, startDate, endDate, selectedSlot]);

  const groupedReadings = useMemo(() => {
    return filteredReadings.reduce((groups, reading) => {
      const date = String(reading.reading_date).slice(0, 10);
      const month = date.slice(0, 7);

      if (!groups[month]) groups[month] = [];

      groups[month].push(reading);
      return groups;
    }, {});
  }, [filteredReadings]);

  const average = filteredReadings.length
    ? (
        filteredReadings.reduce(
          (sum, item) => sum + Number(item.glucose_value),
          0
        ) / filteredReadings.length
      ).toFixed(1)
    : "—";

  const highest = filteredReadings.length
    ? Math.max(
        ...filteredReadings.map((item) =>
          Number(item.glucose_value)
        )
      )
    : "—";

  const lowest = filteredReadings.length
    ? Math.min(
        ...filteredReadings.map((item) =>
          Number(item.glucose_value)
        )
      )
    : "—";

  const exportCSV = () => {
    const headers = [
      "Date",
      "Time Slot",
      "Glucose Level (mg/dL)",
    ];

    const rows = filteredReadings.map((reading) => [
      String(reading.reading_date).slice(0, 10),
      SLOT_LABELS[reading.time_slot] || reading.time_slot,
      reading.glucose_value,
    ]);

    const csv = [
      headers.map(escapeCSV).join(","),
      ...rows.map((row) => row.map(escapeCSV).join(",")),
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "sweety-health-records.csv";
    link.click();

    URL.revokeObjectURL(url);
  };

  const clearFilters = () => {
    setSearch("");
    setStartDate("");
    setEndDate("");
    setSelectedSlot("all");
  };

  const monthLabel = (month) => {
    const [year, number] = month.split("-");

    return new Date(
      Number(year),
      Number(number) - 1,
      1
    ).toLocaleDateString("en-IN", {
      month: "long",
      year: "numeric",
    });
  };

  return (
    <section className="health-records-page">
      <div className="hr-heading">
        <div>
          <div className="eyebrow">
            SWEETY / PERSONAL HEALTH
          </div>

          <h1>Health Records</h1>

          <p>
            Your complete glucose history, all in one place.
          </p>
        </div>

        <div className="hr-actions">
          <button
            className="hr-secondary-button"
            onClick={exportCSV}
            disabled={!filteredReadings.length}
          >
            <Download size={16} />
            Export CSV
          </button>

          <button
            className="hr-primary-button"
            onClick={() => window.print()}
            disabled={!filteredReadings.length}
          >
            <Printer size={16} />
            Print records
          </button>
        </div>
      </div>

      <div className="hr-stats">
        <div className="hr-stat-card">
          <span><Activity size={18} /></span>
          <small>Total records</small>
          <strong>{filteredReadings.length}</strong>
        </div>

        <div className="hr-stat-card">
          <span><Droplets size={18} /></span>
          <small>Average glucose</small>
          <strong>{average} <em>mg/dL</em></strong>
        </div>

        <div className="hr-stat-card">
          <span><Activity size={18} /></span>
          <small>Highest reading</small>
          <strong>{highest} <em>mg/dL</em></strong>
        </div>

        <div className="hr-stat-card">
          <span><Activity size={18} /></span>
          <small>Lowest reading</small>
          <strong>{lowest} <em>mg/dL</em></strong>
        </div>
      </div>

      <div className="hr-filter-panel">
        <div className="hr-filter-heading">
          <div>
            <Filter size={17} />
            <strong>Filter records</strong>
          </div>

          <button onClick={clearFilters}>
            <X size={14} />
            Clear filters
          </button>
        </div>

        <div className="hr-filter-grid">
          <label className="hr-search">
            <span>Search records</span>
            <div>
              <Search size={16} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search date, value or slot..."
              />
            </div>
          </label>

          <label>
            <span>From date</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </label>

          <label>
            <span>To date</span>
            <input
              type="date"
              value={endDate}
              min={startDate || undefined}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </label>

          <label>
            <span>Time slot</span>
            <select
              value={selectedSlot}
              onChange={(e) => setSelectedSlot(e.target.value)}
            >
              <option value="all">All time slots</option>
              {Object.entries(SLOT_LABELS).map(
                ([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                )
              )}
            </select>
          </label>
        </div>
      </div>

      {loading ? (
        <div className="hr-empty">
          Loading your health records...
        </div>
      ) : error ? (
        <div className="hr-empty">
          <p>{error}</p>
          <button
            className="hr-primary-button"
            onClick={fetchRecords}
          >
            Try again
          </button>
        </div>
      ) : filteredReadings.length === 0 ? (
        <div className="hr-empty">
          <FileText size={32} />
          <h3>No records found</h3>
          <p>
            Try changing your filters or add a reading from My Readings.
          </p>
          <button
            className="hr-secondary-button"
            onClick={clearFilters}
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="hr-history">
          {Object.entries(groupedReadings).map(
            ([month, items]) => (
              <section className="hr-month-group" key={month}>
                <div className="hr-month-heading">
                  <div>
                    <CalendarDays size={17} />
                    <h3>{monthLabel(month)}</h3>
                  </div>

                  <span>
                    {items.length}{" "}
                    {items.length === 1 ? "record" : "records"}
                  </span>
                </div>

                <div className="hr-table-wrap">
                  <table className="hr-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Time slot</th>
                        <th>Glucose level</th>
                        <th>Unit</th>
                      </tr>
                    </thead>

                    <tbody>
                      {items.map((reading) => (
                        <tr key={reading.id}>
                          <td>{formatDate(reading.reading_date)}</td>

                          <td>
                            {SLOT_LABELS[reading.time_slot] ||
                              reading.time_slot}
                          </td>

                          <td className="hr-value">
                            {reading.glucose_value}
                          </td>

                          <td>mg/dL</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )
          )}
        </div>
      )}

      <div className="hr-disclaimer">
        <Activity size={16} />
        These records are for personal tracking. They are not a
        substitute for professional medical advice.
      </div>
    </section>
  );
}