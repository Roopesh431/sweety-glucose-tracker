import { useEffect, useState } from "react";
import {
  Activity,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  FileBarChart,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Droplets,
} from "lucide-react";
import api from "./api";
import "./Reports.css";

const getLocalDateString = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatDate = (value) => {
  if (!value) return "—";
  const dateString = String(value).slice(0, 10);
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

const formatMonth = (startDate) => {
  if (!startDate) return "Previous month";
  const [year, month] = String(startDate).slice(0, 10).split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
};

function Stat({ icon: Icon, label, value, suffix = "mg/dL" }) {
  return (
    <div className="report-stat">
      <span className="report-stat-icon"><Icon size={18} /></span>
      <span className="report-stat-label">{label}</span>
      <strong>{value ?? "—"} <small>{value == null ? "" : suffix}</small></strong>
    </div>
  );
}

function ReportSummary({ title, subtitle, stats }) {
  return (
    <section className="panel report-summary">
      <div className="report-section-heading">
        <div>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
        <span className="report-count"><Activity size={15} /> {stats?.count ?? 0} readings</span>
      </div>

      {(stats?.count ?? 0) === 0 ? (
        <div className="report-empty">
          <Droplets size={25} />
          <strong>No readings in this period</strong>
          <p>Measurements you record during this period will appear here.</p>
        </div>
      ) : (
        <div className="report-stats-grid">
          <Stat icon={TrendingUp} label="Highest" value={stats.highest} />
          <Stat icon={TrendingDown} label="Lowest" value={stats.lowest} />
          <Stat icon={Activity} label="Average" value={stats.average} />
          <Stat icon={FileBarChart} label="Total readings" value={stats.count} suffix="records" />
        </div>
      )}
    </section>
  );
}

export default function Reports() {
  const [selectedDate, setSelectedDate] = useState(() => getLocalDateString(new Date()));
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadReport = async (date = selectedDate) => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/reports", {
        params: { date },
      });
      setReport(response.data);
    } catch (err) {
      console.error("Reports loading failed:", err);
      setError(
        err.response?.data?.message ||
          "Unable to load reports. Please try again."
      );
      setReport(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport(selectedDate);
    // Initial load; date changes are handled by the date input effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDateChange = (event) => {
    const nextDate = event.target.value;
    if (!nextDate) return;
    setSelectedDate(nextDate);
    loadReport(nextDate);
  };

  const shiftDate = (amount) => {
    const date = new Date(`${selectedDate}T00:00:00`);
    date.setDate(date.getDate() + amount);
    const nextDate = getLocalDateString(date);
    if (nextDate > getLocalDateString(new Date())) return;
    setSelectedDate(nextDate);
    loadReport(nextDate);
  };

  const daily = report?.daily;
  const monthToDate = report?.monthToDate;
  const previousMonth = report?.monthly;

  return (
    <section className="dashboard-content reports-page">
      <div className="welcome-row">
        <div>
          <div className="eyebrow">SWEETY / YOUR HEALTH INSIGHTS</div>
          <h1>Reports</h1>
          <p className="welcome-subtitle">
            Understand your glucose readings across different time periods.
          </p>
        </div>
        <button
          type="button"
          className="report-refresh-button"
          onClick={() => loadReport()}
          disabled={loading}
        >
          <RefreshCw size={16} className={loading ? "report-spin" : ""} />
          Refresh
        </button>
      </div>

      <div className="panel report-date-toolbar">
        <div>
          <span className="report-toolbar-icon"><CalendarDays size={19} /></span>
          <div>
            <strong>Choose report date</strong>
            <p>Daily and month-to-date reports use this date.</p>
          </div>
        </div>
        <div className="report-date-controls">
          <button
            type="button"
            aria-label="Previous day"
            onClick={() => shiftDate(-1)}
            disabled={loading}
          >
            <ChevronLeft size={18} />
          </button>
          <input
            type="date"
            value={selectedDate}
            max={getLocalDateString(new Date())}
            onChange={handleDateChange}
            aria-label="Select report date"
          />
          <button
            type="button"
            aria-label="Next day"
            onClick={() => shiftDate(1)}
            disabled={loading || selectedDate >= getLocalDateString(new Date())}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {error && (
        <div className="report-error" role="alert">
          {error}
          <button type="button" onClick={() => loadReport()}>Try again</button>
        </div>
      )}

      {loading ? (
        <div className="panel report-loading">
          <RefreshCw size={22} className="report-spin" />
          <strong>Preparing your reports...</strong>
        </div>
      ) : report ? (
        <>
          <ReportSummary
            title="Daily report"
            subtitle={`Measurements recorded on ${formatDate(daily?.date || selectedDate)}.`}
            stats={daily}
          />

          <ReportSummary
            title="Month-to-date"
            subtitle={`${formatDate(monthToDate?.startDate)} – ${formatDate(monthToDate?.endDate)}`}
            stats={monthToDate}
          />

          <ReportSummary
            title={formatMonth(previousMonth?.startDate)}
            subtitle={`${formatDate(previousMonth?.startDate)} – ${formatDate(previousMonth?.endDate)}`}
            stats={previousMonth}
          />

          <section className="panel report-daily-readings">
            <div className="report-section-heading">
              <div>
                <h2>Daily readings</h2>
                <p>Individual measurements for the selected date.</p>
              </div>
            </div>

            {!daily?.readings?.length ? (
              <div className="report-empty compact">
                <Droplets size={23} />
                <strong>No measurements for this date</strong>
                <p>Choose another date or add a reading.</p>
              </div>
            ) : (
              <div className="report-table-wrap">
                <table className="report-table">
                  <thead>
                    <tr><th>Time slot</th><th>Glucose level</th></tr>
                  </thead>
                  <tbody>
                    {daily.readings.map((reading) => (
                      <tr key={reading.id}>
                        <td>
                          {{
                            morning: "Morning (fasting)",
                            after_breakfast: "After breakfast",
                            after_lunch: "After lunch",
                            after_dinner: "After dinner",
                          }[reading.time_slot] || reading.time_slot}
                        </td>
                        <td><strong>{reading.glucose_value} <small>mg/dL</small></strong></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      ) : null}
    </section>
  );
}
