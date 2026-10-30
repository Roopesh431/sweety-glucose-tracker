
import { useMemo, useState } from "react";
import {
  Activity,
  CalendarDays,
  Clock3,
  Droplets,
  Edit3,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from "lucide-react";
import api from "./api";
import "./MyReadings.css";

const SLOT_LABELS = {
  morning: "Morning (fasting)",
  after_breakfast: "After breakfast",
  after_lunch: "After lunch",
  after_dinner: "After dinner",
};

const getToday = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
};

const toDateInput = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value.slice(0, 10);
  return new Date(value).toISOString().slice(0, 10);
};

const formatDate = (value) => {
  const date = toDateInput(value);
  if (!date) return "—";

  const [year, month, day] = date.split("-").map(Number);

  return new Date(year, month - 1, day).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getDateHeading = (value) => {
  const date = toDateInput(value);
  if (!date) return "Unknown date";

  const today = getToday();
  const yesterdayDate = new Date(`${today}T00:00:00`);
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);

  const yesterday = [
    yesterdayDate.getFullYear(),
    String(yesterdayDate.getMonth() + 1).padStart(2, "0"),
    String(yesterdayDate.getDate()).padStart(2, "0"),
  ].join("-");

  if (date === today) return "Today";
  if (date === yesterday) return "Yesterday";

  return formatDate(date);
};

function EditReadingModal({ reading, onClose, onUpdated }) {
  const [form, setForm] = useState({
    date: toDateInput(reading.reading_date),
    time_slot: reading.time_slot,
    value: String(reading.glucose_value),
  });

  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const change = (event) => {
    setForm((previous) => ({
      ...previous,
      [event.target.name]: event.target.value,
    }));
    setError("");
  };

  const submit = async (event) => {
    event.preventDefault();

    const value = Number(form.value);

    if (!Number.isInteger(value) || value < 40 || value > 600) {
      setError("Enter a whole number between 40 and 600 mg/dL.");
      return;
    }

    if (!form.date || form.date > getToday()) {
      setError("Please choose a valid date that is not in the future.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const response = await api.put(`/readings/${reading.id}`, {
        date: form.date,
        time_slot: form.time_slot,
        value,
      });

      await onUpdated?.(response.data.reading);
      onClose();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to update this reading. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="my-reading-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) onClose();
      }}
    >
      <section
        className="my-reading-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-reading-title"
      >
        <div className="my-reading-modal-head">
          <div>
            <span className="my-reading-eyebrow">UPDATE MEASUREMENT</span>
            <h2 id="edit-reading-title">Edit reading</h2>
            <p>Make changes to this glucose record.</p>
          </div>

          <button
            type="button"
            className="my-reading-icon-button"
            onClick={onClose}
            disabled={saving}
            aria-label="Close"
          >
            <X size={19} />
          </button>
        </div>

        <form className="my-reading-form" onSubmit={submit}>
          <label>
            Reading date
            <input
              type="date"
              name="date"
              value={form.date}
              max={getToday()}
              onChange={change}
              required
            />
          </label>

          <label>
            Time slot
            <select
              name="time_slot"
              value={form.time_slot}
              onChange={change}
              required
            >
              {Object.entries(SLOT_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label>
            Glucose level (mg/dL)
            <input
              type="number"
              name="value"
              min="40"
              max="600"
              step="1"
              value={form.value}
              onChange={change}
              required
            />
          </label>

          {error && (
            <div className="my-reading-error" role="alert">
              {error}
            </div>
          )}

          <div className="my-reading-form-actions">
            <button
              type="button"
              className="my-reading-secondary"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="my-reading-primary"
              disabled={saving}
            >
              {saving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default function MyReadings({
  readings = [],
  loading,
  error,
  onRetry,
  onAddReading,
  onChanged,
}) {
  const [searchDate, setSearchDate] = useState("");
  const [editingReading, setEditingReading] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [actionError, setActionError] = useState("");

  const filteredReadings = useMemo(() => {
    return [...readings]
      .filter(
        (reading) =>
          !searchDate ||
          toDateInput(reading.reading_date) === searchDate
      )
      .sort((a, b) => {
        const dateDifference =
          toDateInput(b.reading_date).localeCompare(
            toDateInput(a.reading_date)
          );

        if (dateDifference !== 0) return dateDifference;

        return Number(b.id) - Number(a.id);
      });
  }, [readings, searchDate]);

  const groupedReadings = useMemo(() => {
    return filteredReadings.reduce((groups, reading) => {
      const date = toDateInput(reading.reading_date);

      if (!groups[date]) groups[date] = [];
      groups[date].push(reading);

      return groups;
    }, {});
  }, [filteredReadings]);

  const handleDelete = async (reading) => {
    const confirmed = window.confirm(
      `Delete the ${reading.glucose_value} mg/dL reading from ${formatDate(reading.reading_date)}?`
    );

    if (!confirmed) return;

    setDeletingId(reading.id);
    setActionError("");

    try {
      await api.delete(`/readings/${reading.id}`);
      await onChanged?.();
    } catch (err) {
      setActionError(
        err.response?.data?.message ||
          "Unable to delete this reading. Please try again."
      );
    } finally {
      setDeletingId(null);
    }
  };

  const handleUpdated = async () => {
    await onChanged?.();
    setEditingReading(null);
  };

  return (
    <section className="dashboard-content my-readings-page">
      <div className="welcome-row">
        <div>
          <div className="eyebrow">SWEETY / YOUR HEALTH HISTORY</div>
          <h1>My Readings</h1>
          <p className="welcome-subtitle">
            All your saved glucose measurements, in one place.
          </p>
        </div>

        <button
          type="button"
          className="primary-button"
          onClick={onAddReading}
        >
          <Plus size={17} />
          Add reading
        </button>
      </div>

      <div className="my-readings-toolbar panel">
        <div className="my-readings-count">
          <span className="my-readings-count-icon">
            <Activity size={19} />
          </span>

          <div>
            <strong>{readings.length}</strong>
            <span>Total saved readings</span>
          </div>
        </div>

        <div className="my-readings-filter-area">
          <span className="my-readings-filter-label">Filter by date</span>

          <label className="my-readings-filter">
            <Search size={16} />

            <input
              type="date"
              value={searchDate}
              max={getToday()}
              onChange={(event) => setSearchDate(event.target.value)}
              aria-label="Filter readings by date"
            />

            {searchDate && (
              <button
                type="button"
                onClick={() => setSearchDate("")}
                aria-label="Clear date filter"
              >
                <X size={15} />
                Clear
              </button>
            )}
          </label>
        </div>
      </div>

      {(error || actionError) && (
        <div className="my-reading-error" role="alert">
          {actionError || error}

          {error && (
            <button type="button" onClick={onRetry}>
              Retry
            </button>
          )}
        </div>
      )}

      <section className="panel my-readings-list-panel">
        <div className="my-readings-list-heading">
          <div>
            <h2>Glucose history</h2>
            <p>
              {searchDate
                ? `Measurements on ${formatDate(searchDate)}`
                : "Your newest measurements appear first."}
            </p>
          </div>

          <div className="my-readings-list-actions">
            <span className="my-readings-result-count">
              {filteredReadings.length}{" "}
              {filteredReadings.length === 1 ? "record" : "records"}
            </span>

            <button
              type="button"
              className="my-reading-refresh"
              onClick={onRetry}
              disabled={loading}
            >
              <RefreshCw
                size={15}
                className={loading ? "my-reading-spin" : ""}
              />
              Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <div className="my-readings-empty">
            <RefreshCw size={24} className="my-reading-spin" />
            <strong>Loading your readings...</strong>
            <p>Your saved measurements will appear here.</p>
          </div>
        ) : filteredReadings.length === 0 ? (
          <div className="my-readings-empty">
            <span>
              <Droplets size={26} />
            </span>

            <strong>
              {searchDate
                ? "No readings for this date"
                : "No readings yet"}
            </strong>

            <p>
              {searchDate
                ? "Try another date or clear the filter."
                : "Add your first glucose measurement to start building your history."}
            </p>

            {searchDate ? (
              <button
                type="button"
                className="my-reading-secondary"
                onClick={() => setSearchDate("")}
              >
                Clear date filter
              </button>
            ) : (
              <button
                type="button"
                className="primary-button"
                onClick={onAddReading}
              >
                <Plus size={17} />
                Add your first reading
              </button>
            )}
          </div>
        ) : (
          <div className="my-readings-groups">
            {Object.entries(groupedReadings).map(([date, items]) => (
              <div className="my-reading-date-group" key={date}>
                <div className="my-reading-date-heading">
                  <div className="my-reading-date-icon">
                    <CalendarDays size={16} />
                  </div>

                  <div>
                    <strong>{getDateHeading(date)}</strong>
                    <span>{formatDate(date)}</span>
                  </div>

                  <span className="my-reading-date-count">
                    {items.length} {items.length === 1 ? "reading" : "readings"}
                  </span>
                </div>

                <div className="my-readings-table-wrap">
                  <table className="my-readings-table">
                    <thead>
                      <tr>
                        <th>
                          <Clock3 size={14} />
                          Time slot
                        </th>
                        <th>Glucose level</th>
                        <th>Actions</th>
                      </tr>
                    </thead>

                    <tbody>
                      {items.map((reading) => (
                        <tr key={reading.id}>
                          <td>
                            <span className="my-reading-slot">
                              {SLOT_LABELS[reading.time_slot] ||
                                reading.time_slot}
                            </span>
                          </td>

                          <td>
                            <strong className="my-reading-value">
                              {reading.glucose_value}
                              <small>mg/dL</small>
                            </strong>
                          </td>

                          <td>
                            <div className="my-reading-row-actions">
                              <button
                                type="button"
                                onClick={() => setEditingReading(reading)}
                                aria-label="Edit reading"
                                title="Edit reading"
                              >
                                <Edit3 size={15} />
                              </button>

                              <button
                                type="button"
                                className="delete"
                                onClick={() => handleDelete(reading)}
                                disabled={deletingId === reading.id}
                                aria-label="Delete reading"
                                title="Delete reading"
                              >
                                {deletingId === reading.id ? (
                                  <RefreshCw
                                    size={15}
                                    className="my-reading-spin"
                                  />
                                ) : (
                                  <Trash2 size={15} />
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {editingReading && (
        <EditReadingModal
          reading={editingReading}
          onClose={() => setEditingReading(null)}
          onUpdated={handleUpdated}
        />
      )}
    </section>
  );
}
