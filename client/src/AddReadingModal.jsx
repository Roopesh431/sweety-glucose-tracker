
import { useState } from "react";
import { X, Droplets, CalendarDays } from "lucide-react";
import api from "./api";
import "./AddReadingModal.css";

const getToday = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const slots = [
  { value: "morning", label: "Morning (fasting)" },
  { value: "after_breakfast", label: "After breakfast" },
  { value: "after_lunch", label: "After lunch" },
  { value: "after_dinner", label: "After dinner" },
];

export default function AddReadingModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    reading_date: getToday(),
    time_slot: "morning",
    glucose_value: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    setForm((previous) => ({
      ...previous,
      [event.target.name]: event.target.value,
    }));
    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    const value = Number(form.glucose_value);

    if (
      form.glucose_value === "" ||
      !Number.isInteger(value) ||
      value < 40 ||
      value > 600
    ) {
      setError("Enter a whole number between 40 and 600 mg/dL.");
      return;
    }

    if (form.reading_date > getToday()) {
      setError("You cannot record a future date.");
      return;
    }

    setLoading(true);

    try {
      // IMPORTANT: These names must match readingController.js
      const response = await api.post("/readings", {
        date: form.reading_date,
        time_slot: form.time_slot,
        value: value,
      });

      if (response.data.success) {
        onCreated?.(response.data.reading);
        onClose();
      } else {
        setError(response.data.message || "Unable to save reading.");
      }
    } catch (err) {
      const data = err.response?.data;

      setError(
        data?.message ||
        data?.errors?.map((item) => item.message).join(" ") ||
        "Unable to save your reading. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="reading-modal-overlay"
      onMouseDown={onClose}
    >
      <section
        className="reading-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="reading-modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="reading-modal-header">
          <div className="reading-modal-heading">
            <span className="reading-modal-icon">
              <Droplets size={21} />
            </span>

            <div>
              <h2 id="reading-modal-title">Add glucose reading</h2>
              <p>Record a measurement from your day.</p>
            </div>
          </div>

          <button
            type="button"
            className="reading-modal-close"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="reading-modal-form">
          <label>
            Reading date

            <div className="reading-date-input">
              <CalendarDays size={17} />

              <input
                type="date"
                name="reading_date"
                value={form.reading_date}
                max={getToday()}
                onChange={handleChange}
                required
              />
            </div>
          </label>

          <label>
            Time slot

            <select
              name="time_slot"
              value={form.time_slot}
              onChange={handleChange}
              required
            >
              {slots.map((slot) => (
                <option key={slot.value} value={slot.value}>
                  {slot.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            Glucose level

            <div className="glucose-value-input">
              <input
                type="number"
                name="glucose_value"
                placeholder="e.g. 110"
                min="40"
                max="600"
                step="1"
                value={form.glucose_value}
                onChange={handleChange}
                required
              />

              <span>mg/dL</span>
            </div>

            <small>Enter a whole number between 40 and 600.</small>
          </label>

          {error && (
            <div className="reading-modal-error">
              {error}
            </div>
          )}

          <div className="reading-modal-actions">
            <button
              type="button"
              className="reading-cancel-button"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="reading-save-button"
              disabled={loading}
            >
              {loading ? "Saving..." : "Save reading"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
