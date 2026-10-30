
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Activity,
  ClipboardList,
  FileBarChart,
  Settings,
  Bell,
  Search,
  Plus,
  Heart,
  TrendingUp,
  TrendingDown,
  CalendarDays,
  ChevronDown,
  Menu,
  X,
  Droplets,
  MoreHorizontal,
  Palette,
  Sun,
  Moon,
  Monitor,
  Check,
  RotateCcw,
  Clock3,
} from "lucide-react";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

import "./App.css";
import { LogOut } from "lucide-react";
import AuthScreen from "./AuthScreen";
import api from "./api";
import AddReadingModal from "./AddReadingModal";
import MyReadings from "./MyReadings";
import Reports from "./Reports";

// ============================================
// THEME CONFIGURATION
// ============================================

const themes = {
  sage: {
    name: "Sage & Cream",
    background: "#F5F4EC",
    surface: "#FFFFFF",
    accent: "#82977B",
    ink: "#343D32",
    muted: "#858B7E",
    border: "#E8E8DC",
    sidebar: "#303B32",
  },
  lavender: {
    name: "Lavender",
    background: "#F5F2FC",
    surface: "#FFFFFF",
    accent: "#8871CF",
    ink: "#332D48",
    muted: "#9189A5",
    border: "#EBE6F4",
    sidebar: "#302A42",
  },
  ocean: {
    name: "Ocean Blue",
    background: "#EFF5F8",
    surface: "#FFFFFF",
    accent: "#478BA6",
    ink: "#283D4B",
    muted: "#8496A2",
    border: "#DFEAF0",
    sidebar: "#293D49",
  },
  peach: {
    name: "Peach & Rose",
    background: "#FFF4EF",
    surface: "#FFFFFF",
    accent: "#D58C78",
    ink: "#49352F",
    muted: "#A28B83",
    border: "#F2E4DD",
    sidebar: "#49352F",
  },
};

const defaultSettings = {
  theme: "sage",
  customAccent: "",
  appearance: "light",
  density: "comfortable",
};

const navigation = [
  { label: "Overview", icon: LayoutDashboard },
  { label: "My Readings", icon: Activity },
  { label: "Reports", icon: FileBarChart },
  { label: "Health Records", icon: ClipboardList },
];

// ============================================
// DATE AND READING HELPERS
// ============================================

const SLOT_LABELS = {
  morning: "Morning (fasting)",
  after_breakfast: "After breakfast",
  after_lunch: "After lunch",
  after_dinner: "After dinner",
};

const formatDate = (dateValue) => {
  if (!dateValue) return "—";
  const date = new Date(`${String(dateValue).slice(0, 10)}T00:00:00`);
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatReadingDate = (dateValue) => {
  if (!dateValue) return "—";
  const today = new Date();
  const todayString = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayString = [
    yesterday.getFullYear(),
    String(yesterday.getMonth() + 1).padStart(2, "0"),
    String(yesterday.getDate()).padStart(2, "0"),
  ].join("-");
  const value = String(dateValue).slice(0, 10);

  if (value === todayString) return "Today";
  if (value === yesterdayString) return "Yesterday";
  return formatDate(value);
};

const formatSlot = (slot) => SLOT_LABELS[slot] || slot || "—";

const getLocalDateString = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const buildChartData = (allReadings) => {
  const today = new Date();
  const days = [];

  for (let offset = 6; offset >= 0; offset -= 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - offset);
    const dateKey = getLocalDateString(date);

    const dayReadings = allReadings.filter(
      (reading) => String(reading.reading_date).slice(0, 10) === dateKey
    );

    const values = dayReadings.map((reading) =>
      Number(reading.glucose_value)
    );
    const average = values.length
      ? values.reduce((sum, value) => sum + value, 0) / values.length
      : null;

    days.push({
      day: date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
      }),
      value: average === null ? null : Number(average.toFixed(1)),
      rangeMin: values.length ? Math.min(...values) : null,
      rangeMax: values.length ? Math.max(...values) : null,
      rangeSpan: values.length ? Math.max(...values) - Math.min(...values) : null,
      count: values.length,
    });
  }

  return days;
};

function GlucoseChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  const point = payload.find((item) => item?.payload)?.payload;
  if (!point || point.count === 0 || point.value === null) return null;

  return (
    <div className="glucose-chart-tooltip">
      <strong>{label}</strong>
      <div className="glucose-tooltip-row">
        <span><i className="glucose-tooltip-dot average" />Daily average</span>
        <b>{Number(point.value).toFixed(1)} mg/dL</b>
      </div>
      {point.rangeMin !== null && point.rangeMax !== null && (
        <div className="glucose-tooltip-row">
          <span><i className="glucose-tooltip-dot range" />Daily range</span>
          <b>{point.rangeMin}–{point.rangeMax} mg/dL</b>
        </div>
      )}
      <small>{point.count} {point.count === 1 ? "reading" : "readings"}</small>
    </div>
  );
}

// ============================================
// MAIN APP
// ============================================

function DashboardApp({ user, onLogout }) {
  const [showAddReading, setShowAddReading] = useState(false);
  const [readings, setReadings] = useState([]);
  const [report, setReport] = useState(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState("");

  const loadDashboardData = async () => {
    setDataLoading(true);
    setDataError("");

    try {
      const [readingsResponse, reportResponse] = await Promise.all([
        api.get("/readings"),
        api.get("/reports"),
      ]);

      setReadings(readingsResponse.data.readings || []);
      setReport(reportResponse.data);
    } catch (error) {
      console.error("Dashboard data loading failed:", error);
      setDataError(
        error.response?.data?.message ||
          "Unable to load your glucose data. Please try again."
      );
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);
  const [activePage, setActivePage] = useState(() => {
  return sessionStorage.getItem("sweety-active-page") || "Overview";
});

useEffect(() => {
  sessionStorage.setItem("sweety-active-page", activePage);
}, [activePage]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem("sweety-appearance");

      return saved
        ? { ...defaultSettings, ...JSON.parse(saved) }
        : { ...defaultSettings };
    } catch {
      return { ...defaultSettings };
    }
  });

  const [systemDark, setSystemDark] = useState(() =>
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );

  // Save appearance preferences
  useEffect(() => {
    localStorage.setItem(
      "sweety-appearance",
      JSON.stringify(settings)
    );
  }, [settings]);

  // Listen for system theme changes
  useEffect(() => {
    const media = window.matchMedia(
      "(prefers-color-scheme: dark)"
    );

    const handleChange = (event) => {
      setSystemDark(event.matches);
    };

    media.addEventListener("change", handleChange);

    return () => {
      media.removeEventListener("change", handleChange);
    };
  }, []);

  const selectedTheme = themes[settings.theme] || themes.sage;

  const isDark =
    settings.appearance === "dark" ||
    (settings.appearance === "system" && systemDark);

  const appStyle = {
    "--app-bg": isDark ? "#20251F" : selectedTheme.background,
    "--surface": isDark ? "#2B322A" : selectedTheme.surface,
    "--accent": settings.customAccent || selectedTheme.accent,
    "--ink": isDark ? "#F0F0E9" : selectedTheme.ink,
    "--muted": isDark ? "#A7B09F" : selectedTheme.muted,
    "--border": isDark ? "#414A3F" : selectedTheme.border,
    "--sidebar-bg": isDark ? "#171E18" : selectedTheme.sidebar,
  };

  const updateSetting = (key, value) => {
    setSettings((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  const resetSettings = () => {
    setSettings({ ...defaultSettings });
  };

  return (
    <div
      className={`app-shell ${isDark ? "dark-mode" : ""} density-${settings.density}`}
      style={appStyle}
    >
      {sidebarOpen && (
        <div
          className="mobile-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR */}

      <aside
        className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}
      >
        <div className="brand">
          <div className="brand-icon">
            <Heart size={21} fill="white" />
          </div>

          <span>
            Sweety<span className="brand-dot">.</span>
          </span>

          <button
            className="mobile-close"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close navigation"
          >
            <X size={20} />
          </button>
        </div>

        <div className="nav-label">MENU</div>

        <nav className="navigation">
          {navigation.map(({ label, icon: Icon }) => (
            <button
              key={label}
              className={`nav-item ${
                activePage === label ? "active" : ""
              }`}
              onClick={() => {
                setActivePage(label);
                setSidebarOpen(false);
              }}
            >
              <Icon size={19} />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="help-card">
            <div className="help-icon">
              <Heart size={18} />
            </div>

            <h4>Your health matters.</h4>

            <p>
              One reading at a time. You're building a habit.
            </p>
          </div>

          <button
            className={`nav-item ${
              activePage === "Settings" ? "active" : ""
            }`}
            onClick={() => {
              setActivePage("Settings");
              setSidebarOpen(false);
            }}
          >
            <Settings size={19} />
            <span>Settings</span>
          </button>

          <div className="profile">
  <div className="avatar">
    {(user?.name || "U")
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase()}
  </div>

  <div className="profile-info">
    <strong>{user?.name || "User"}</strong>
    <span>Personal account</span>
  </div>

  <button
    type="button"
    className="logout-button"
    onClick={onLogout}
    title="Sign out"
    aria-label="Sign out"
  >
    <LogOut size={18} />
  </button>
</div>
        </div>
      </aside>

      {/* MAIN CONTENT */}

      <main className="main-content">
        <header className="topbar">
          <button
            className="menu-button"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open navigation"
          >
            <Menu size={22} />
          </button>

          <div className="breadcrumb">
            <span>Pages</span>
            <span>/</span>
            <strong>{activePage}</strong>
          </div>

          <div className="topbar-actions">
            <button className="search-button" aria-label="Search">
              <Search size={18} />
            </button>

            <button
              className="notification-button"
              aria-label="Notifications"
            >
              <Bell size={19} />
              <i />
            </button>

            <div className="top-avatar">
                {(user?.name || "U")
                  .split(" ")
                  .map((part) => part[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
            </div>
          </div>
        </header>

        {activePage === "Settings" ? (
          <AppearanceSettings
            settings={settings}
            updateSetting={updateSetting}
            selectedTheme={selectedTheme}
            resetSettings={resetSettings}
          />
        ) : activePage === "My Readings" ? (
          <MyReadings
            readings={readings}
            loading={dataLoading}
            error={dataError}
            onRetry={loadDashboardData}
            onAddReading={() => setShowAddReading(true)}
            onChanged={loadDashboardData}
          />
        ) : activePage === "Reports" ? (
          <Reports />
        ) : (
          <Dashboard
            activePage={activePage}
            setActivePage={setActivePage}
            user={user}
            readings={readings}
            report={report}
            dataLoading={dataLoading}
            dataError={dataError}
            onRetry={loadDashboardData}
            onAddReading={() => setShowAddReading(true)}
          />
        )}
      </main>

      {showAddReading && (
        <AddReadingModal
          onClose={() => setShowAddReading(false)}
          onCreated={() => {
            loadDashboardData();
          }}
        />
      )}
    </div>
  );
}

// ============================================
// DASHBOARD
// ============================================

function Dashboard({
  activePage,
  setActivePage,
  user,
  readings,
  report,
  dataLoading,
  dataError,
  onRetry,
  onAddReading,
}) {
  if (activePage !== "Overview") {
    return (
      <section className="dashboard-content">
        <div className="welcome-row">
          <div>
            <div className="eyebrow">SWEETY / YOUR SPACE</div>
            <h1>{activePage}</h1>
            <p className="welcome-subtitle">
              This section will be connected to your account and readings.
            </p>
          </div>
        </div>

        <div className="panel placeholder-panel">
          <Activity size={32} />
          <h3>{activePage} is coming next</h3>
          <p>
            We're building this section with your real glucose data.
          </p>

          <button
            className="primary-button"
            onClick={() => setActivePage("Overview")}
          >
            Back to overview
          </button>
        </div>
      </section>
    );
  }

  const monthlyStats = report?.monthToDate || {};
  const dailyStats = report?.daily || {};
  const chartData = buildChartData(readings);
  const recentReadings = readings.slice(0, 4);

  return (
    <section className="dashboard-content">
      <div className="welcome-row">
        <div>
          <div className="eyebrow">
            {new Date().toLocaleDateString("en-IN", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            }).toUpperCase()}
          </div>

          <h1>
            Good morning, {user?.name?.split(" ")[0] || "there"} <span>✦</span>
          </h1>

          <p className="welcome-subtitle">
            Here's a little look at how things are going.
          </p>
        </div>

        <button className="primary-button" onClick={onAddReading}>
          <Plus size={18} />
          Add reading
        </button>
      </div>

      {dataError && (
        <div className="reading-modal-error" role="alert">
          {dataError}{" "}
          <button className="text-button" onClick={onRetry}>Try again</button>
        </div>
      )}

      <div className="section-heading">
        <div>
          <h2>Your week at a glance</h2>
          <p>A little snapshot of your glucose readings.</p>
        </div>

        <button className="date-filter">
          <CalendarDays size={16} />
          Last 7 days
          <ChevronDown size={15} />
        </button>
      </div>

      <div className="stats-grid">
        <StatCard
          icon={<Droplets size={19} />}
          label="Average glucose"
          value={dataLoading ? "—" : monthlyStats.average ?? "—"}
          unit="mg/dL"
          trend={`${monthlyStats.count || 0} readings this month`}
          color="purple"
        />

        <StatCard
          icon={<TrendingUp size={19} />}
          label="Highest reading"
          value={dataLoading ? "—" : monthlyStats.highest ?? "—"}
          unit="mg/dL"
          trend="Month to date"
          color="orange"
        />

        <StatCard
          icon={<TrendingDown size={19} />}
          label="Lowest reading"
          value={dataLoading ? "—" : monthlyStats.lowest ?? "—"}
          unit="mg/dL"
          trend="Month to date"
          color="green"
        />

        <StatCard
          icon={<Activity size={19} />}
          label="Total readings"
          value={dataLoading ? "—" : monthlyStats.count ?? 0}
          unit="readings"
          trend="This month"
          color="blue"
        />
      </div>

      <div className="dashboard-grid">
        <section className="panel chart-panel">
          <div className="panel-header">
            <div>
              <h3>Your glucose journey</h3>
              <p>Daily average from your last 7 days</p>
            </div>

            <button className="icon-button" aria-label="More options">
              <MoreHorizontal size={21} />
            </button>
          </div>

          <div className="chart-legend">
            <span className="legend-dot" />
            Daily average
            <span className="range-legend">
              <span />
              Daily min–max
            </span>
            <span className="chart-unit">mg/dL</span>
          </div>

          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 12, right: 10, left: -18, bottom: 0 }}
              >
                <defs>
                  <linearGradient
                    id="glucoseAverageFill"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor="#6F91B8" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#6F91B8" stopOpacity={0.015} />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  stroke="var(--chart-grid)"
                  strokeDasharray="3 5"
                  vertical
                />

                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "var(--muted)", fontSize: 10 }}
                  tickMargin={10}
                  minTickGap={12}
                />

                <YAxis
                  domain={["dataMin - 20", "dataMax + 20"]}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "var(--muted)", fontSize: 10 }}
                  width={42}
                  tickCount={5}
                />

                <Tooltip
                  cursor={{ stroke: "var(--chart-line)", strokeDasharray: "3 3" }}
                  content={<GlucoseChartTooltip />}
                />

                {/* Stacked areas create a real min-to-max band. */}
                <Area
                  type="monotone"
                  dataKey="rangeMin"
                  stackId="dailyRange"
                  stroke="none"
                  fill="transparent"
                  fillOpacity={0}
                  activeDot={false}
                  isAnimationActive={false}
                />
                <Area
                  type="monotone"
                  dataKey="rangeSpan"
                  stackId="dailyRange"
                  stroke="none"
                  fill="#8EACCE"
                  fillOpacity={0.28}
                  activeDot={false}
                  isAnimationActive={false}
                />

                <Area
                  type="monotone"
                  dataKey="value"
                  name="Daily average"
                  stroke="var(--chart-line)"
                  strokeWidth={2.5}
                  fill="url(#glucoseAverageFill)"
                  connectNulls={false}
                  activeDot={{
                    r: 4,
                    fill: "var(--chart-line)",
                    stroke: "var(--surface)",
                    strokeWidth: 2,
                  }}
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          {!dataLoading && !dataError && readings.length === 0 && (
            <p className="chart-empty-note">
              Your glucose trend will appear after you add readings.
            </p>
          )}
        </section>

        <section className="panel daily-panel">
          <div className="panel-header">
            <div>
              <h3>Today, so far</h3>
              <p>{formatDate(dailyStats.date)}</p>
            </div>

            <CalendarDays size={19} className="muted-icon" />
          </div>

          <div className="daily-average">
            <span>Today's average</span>

            <strong>
              {dataLoading ? "—" : dailyStats.average ?? "—"} <small>mg/dL</small>
            </strong>

            <div className="status-pill">
              <span />
              {dailyStats.count || 0} {dailyStats.count === 1 ? "reading" : "readings"} recorded
            </div>
          </div>

          <div className="daily-divider" />

          <div className="daily-stat">
            <span>Highest reading</span>
            <strong>{dataLoading ? "—" : dailyStats.highest ?? "—"} mg/dL</strong>
          </div>

          <div className="daily-stat">
            <span>Lowest reading</span>
            <strong>{dataLoading ? "—" : dailyStats.lowest ?? "—"} mg/dL</strong>
          </div>

          <div className="daily-stat">
            <span>Total readings</span>
            <strong>{dataLoading ? "—" : dailyStats.count ?? 0}</strong>
          </div>

          <div className="daily-note">
            <Clock3 size={16} />
            Keep logging your readings when convenient.
          </div>
        </section>
      </div>

      <section className="panel readings-panel">
        <div className="panel-header">
          <div>
            <h3>Recently recorded</h3>
            <p>Your latest glucose measurements</p>
          </div>

          <button
            className="text-button"
            onClick={() => setActivePage("My Readings")}
          >
            See all <span>→</span>
          </button>
        </div>

        <div className="readings-table">
          <div className="table-row table-heading">
            <span>DATE</span>
            <span>TIME SLOT</span>
            <span>GLUCOSE LEVEL</span>
            <span>STATUS</span>
          </div>

          {dataLoading ? (
            <div className="table-row">
              <span>Loading your readings...</span>
            </div>
          ) : dataError ? (
            <div className="table-row">
              <span>{dataError}</span>
              <button className="text-button" onClick={onRetry}>Retry</button>
            </div>
          ) : recentReadings.length === 0 ? (
            <div className="empty-readings">
              <Droplets size={24} />
              <strong>No readings yet</strong>
              <span>Add your first glucose reading to see it here.</span>
              <button className="text-button" onClick={onAddReading}>Add a reading</button>
            </div>
          ) : (
            recentReadings.map((reading) => (
              <div className="table-row" key={reading.id}>
                <span className="reading-date">
                  {formatReadingDate(reading.reading_date)}
                </span>
                <span>{formatSlot(reading.time_slot)}</span>
                <strong>
                  {reading.glucose_value} <small>mg/dL</small>
                </strong>
                <span className="reading-status">Recorded</span>
              </div>
            ))
          )}
        </div>
      </section>

      <footer className="footer">
        <span>© 2026 Sweety. A little care, every day.</span>
        <span>
          Made with <Heart size={13} /> for your health.
        </span>
      </footer>
    </section>
  );
}

// ============================================
// STATISTICS CARD
// ============================================

function StatCard({ icon, label, value, unit, trend, color }) {
  return (
    <div className="stat-card">
      <div className="stat-top">
        <span className={`stat-icon ${color}`}>
          {icon}
        </span>

        <MoreHorizontal size={19} className="muted-icon" />
      </div>

      <span className="stat-label">{label}</span>

      <div className="stat-value">
        {value} <small>{unit}</small>
      </div>

      <div className="stat-trend">
        <span className="trend-neutral">•</span>
        {trend}
      </div>
    </div>
  );
}

// ============================================
// APPEARANCE SETTINGS
// ============================================

function AppearanceSettings({
  settings,
  updateSetting,
  selectedTheme,
  resetSettings,
}) {
  const appearanceOptions = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "system", label: "System", icon: Monitor },
  ];

  const themeEntries = Object.entries(themes);

  return (
    <section className="settings-page">
      <div className="settings-heading">
        <div className="eyebrow">MAKE SWEETY YOURS</div>

        <h1>Appearance & preferences</h1>

        <p>
          Make yourself comfortable. Choose how Sweety looks and feels.
        </p>
      </div>

      <div className="settings-layout">
        <div className="settings-main">

          {/* THEME PALETTES */}

          <div className="settings-card">
            <div className="settings-card-heading">
              <div className="settings-heading-icon">
                <Palette size={19} />
              </div>

              <div>
                <h3>Choose your colour palette</h3>
                <p>
                  Pick a colour combination that feels like you.
                </p>
              </div>
            </div>

            <div className="theme-options">
              {themeEntries.map(([key, theme]) => (
                <button
                  key={key}
                  className={`theme-option ${
                    settings.theme === key ? "selected" : ""
                  }`}
                  onClick={() => updateSetting("theme", key)}
                  aria-pressed={settings.theme === key}
                >
                  <div className="theme-swatches">
                    <span style={{ background: theme.background }} />
                    <span style={{ background: theme.surface }} />
                    <span style={{ background: theme.accent }} />
                    <span style={{ background: theme.sidebar }} />
                  </div>

                  <div className="theme-option-footer">
                    <strong>{theme.name}</strong>

                    {settings.theme === key && (
                      <span className="selected-check">
                        <Check size={16} />
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* CUSTOM ACCENT */}

          <div className="settings-card">
            <div className="settings-card-heading">
              <div className="settings-heading-icon">
                <Palette size={19} />
              </div>

              <div>
                <h3>Your own accent colour</h3>
                <p>
                  Add a personal touch with your favourite colour.
                </p>
              </div>
            </div>

            <div className="custom-colour-row">
              <label className="colour-picker">
                <input
                  type="color"
                  value={
                    settings.customAccent || selectedTheme.accent
                  }
                  onChange={(event) =>
                    updateSetting("customAccent", event.target.value)
                  }
                  aria-label="Choose custom accent colour"
                />

                <span
                  style={{
                    background:
                      settings.customAccent || selectedTheme.accent,
                  }}
                />
              </label>

              <div className="colour-details">
                <strong>Custom accent</strong>
                <span>
                  {settings.customAccent || selectedTheme.accent}
                </span>
              </div>

              <button
                className="reset-button"
                onClick={() => updateSetting("customAccent", "")}
              >
                Reset
              </button>
            </div>
          </div>

          {/* APPEARANCE MODE */}

          <div className="settings-card">
            <div className="settings-card-heading">
              <div className="settings-heading-icon">
                <Sun size={19} />
              </div>

              <div>
                <h3>Appearance mode</h3>
                <p>
                  Choose what feels comfortable for your eyes.
                </p>
              </div>
            </div>

            <div className="appearance-options">
              {appearanceOptions.map((option) => {
                const Icon = option.icon;

                return (
                  <button
                    key={option.value}
                    className={`appearance-option ${
                      settings.appearance === option.value
                        ? "selected"
                        : ""
                    }`}
                    onClick={() =>
                      updateSetting("appearance", option.value)
                    }
                    aria-pressed={
                      settings.appearance === option.value
                    }
                  >
                    <Icon size={22} className="appearance-symbol" />

                    <strong>{option.label}</strong>

                    {settings.appearance === option.value && (
                      <span className="selected-check">
                        <Check size={15} />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* LAYOUT DENSITY */}

          <div className="settings-card">
            <div className="settings-card-heading">
              <div className="settings-heading-icon">
                <LayoutDashboard size={19} />
              </div>

              <div>
                <h3>Layout density</h3>
                <p>
                  Decide how much breathing room your dashboard gets.
                </p>
              </div>
            </div>

            <div className="density-options">
              {[
                {
                  value: "comfortable",
                  label: "Comfortable",
                  detail: "More space between elements",
                },
                {
                  value: "compact",
                  label: "Compact",
                  detail: "Fit more information on screen",
                },
              ].map((option) => (
                <button
                  key={option.value}
                  className={`density-option ${
                    settings.density === option.value
                      ? "selected"
                      : ""
                  }`}
                  onClick={() =>
                    updateSetting("density", option.value)
                  }
                >
                  <span className="density-radio">
                    {settings.density === option.value && <span />}
                  </span>

                  <span className="density-copy">
                    <strong>{option.label}</strong>
                    <small>{option.detail}</small>
                  </span>
                </button>
              ))}
            </div>
          </div>

          <button className="restore-button" onClick={resetSettings}>
            <RotateCcw size={15} />
            Restore default appearance
          </button>
        </div>

        {/* LIVE PREVIEW */}

        <aside className="live-preview">
          <div className="preview-heading">
            <span>LIVE PREVIEW</span>
            <span className="preview-dot" />
          </div>

          <div className="preview-screen">
            <div className="preview-brand">
              <div className="preview-logo">
                <Heart size={16} fill="white" />
              </div>

              <strong>Sweety.</strong>
            </div>

            <div className="preview-content">
              <small>YOUR PERSONAL HEALTH SPACE</small>

              <h3>
                A little progress
                <br />
                every day.
              </h3>

              <p>Your health journey, at your pace.</p>

              <div className="preview-stat">
                <span>Today's average</span>

                <strong>
                  110 <small>mg/dL</small>
                </strong>

                <div className="preview-progress">
                  <span />
                </div>
              </div>

              <button className="preview-action">
                View my readings →
              </button>
            </div>
          </div>

          <p className="preview-caption">
            A little space that feels like yours.
          </p>
        </aside>
      </div>
    </section>
  );
}

// ============================================
// AUTHENTICATION WRAPPER
// ============================================

function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("sweety-token");

    if (!token) {
      setAuthLoading(false);
      return;
    }

    const verifySession = async () => {
  try {
    const response = await api.get("/auth/profile");
    setUser(response.data.user);
  } catch (error) {
    console.error("Session verification failed:", error);
    localStorage.removeItem("sweety-token");
    setUser(null);
  } finally {
    setAuthLoading(false);
  }
};

    verifySession();
  }, []);

  const handleAuthenticated = (token, authenticatedUser) => {
    localStorage.setItem("sweety-token", token);
    setUser(authenticatedUser);
    setAuthLoading(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("sweety-token");
    setUser(null);
  };

  if (authLoading) {
    return (
      <div className="auth-loading">
        <Heart size={26} fill="currentColor" />
        <span>Getting your space ready...</span>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen onAuthenticated={handleAuthenticated} />;
  }

  return <DashboardApp user={user} onLogout={handleLogout} />;
}

export default App;
