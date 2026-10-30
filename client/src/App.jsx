
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
// DEMO DATA - WILL BE REPLACED BY API DATA
// ============================================

const chartData = [
  { day: "24 Oct", value: 112 },
  { day: "25 Oct", value: 126 },
  { day: "26 Oct", value: 119 },
  { day: "27 Oct", value: 145 },
  { day: "28 Oct", value: 132 },
  { day: "29 Oct", value: 143 },
  { day: "30 Oct", value: 110 },
];

const readings = [
  {
    date: "Today, 08:00 AM",
    slot: "Morning (fasting)",
    value: 110,
  },
  {
    date: "Yesterday, 09:00 PM",
    slot: "After dinner",
    value: 130,
  },
  {
    date: "Yesterday, 02:00 PM",
    slot: "After lunch",
    value: 160,
  },
  {
    date: "Yesterday, 09:00 AM",
    slot: "After breakfast",
    value: 140,
  },
];

// ============================================
// MAIN APP
// ============================================

function App() {
  const [activePage, setActivePage] = useState("Overview");
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
            <div className="avatar">DP</div>

            <div className="profile-info">
              <strong>Demo Patient</strong>
              <span>Personal account</span>
            </div>

            <MoreHorizontal size={20} />
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

            <div className="top-avatar">DP</div>
          </div>
        </header>

        {activePage === "Settings" ? (
          <AppearanceSettings
            settings={settings}
            updateSetting={updateSetting}
            selectedTheme={selectedTheme}
            resetSettings={resetSettings}
          />
        ) : (
          <Dashboard
            activePage={activePage}
            setActivePage={setActivePage}
          />
        )}
      </main>
    </div>
  );
}

// ============================================
// DASHBOARD
// ============================================

function Dashboard({ activePage, setActivePage }) {
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

  return (
    <section className="dashboard-content">
      <div className="welcome-row">
        <div>
          <div className="eyebrow">FRIDAY, OCTOBER 30, 2026</div>

          <h1>
            Good morning, Demo Patient <span>✦</span>
          </h1>

          <p className="welcome-subtitle">
            Here's a little look at how things are going.
          </p>
        </div>

        <button className="primary-button">
          <Plus size={18} />
          Add reading
        </button>
      </div>

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
          value="135"
          unit="mg/dL"
          trend="Across 4 readings"
          color="purple"
        />

        <StatCard
          icon={<TrendingUp size={19} />}
          label="Highest reading"
          value="160"
          unit="mg/dL"
          trend="October 29"
          color="orange"
        />

        <StatCard
          icon={<TrendingDown size={19} />}
          label="Lowest reading"
          value="110"
          unit="mg/dL"
          trend="October 30"
          color="green"
        />

        <StatCard
          icon={<Activity size={19} />}
          label="Total readings"
          value="4"
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
              <p>Readings from the last 7 days</p>
            </div>

            <button className="icon-button" aria-label="More options">
              <MoreHorizontal size={21} />
            </button>
          </div>

          <div className="chart-legend">
            <span className="legend-dot" />
            Glucose level
            <span className="chart-unit">mg/dL</span>
          </div>

          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{
                  top: 10,
                  right: 8,
                  left: -18,
                  bottom: 0,
                }}
              >
                <defs>
                  <linearGradient
                    id="glucoseFill"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor="var(--accent)"
                      stopOpacity={0.23}
                    />
                    <stop
                      offset="100%"
                      stopColor="var(--accent)"
                      stopOpacity={0.01}
                    />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  strokeDasharray="4 4"
                  vertical={false}
                  stroke="var(--border)"
                />

                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fill: "var(--muted)",
                    fontSize: 11,
                  }}
                  dy={10}
                />

                <YAxis
                  domain={[60, 200]}
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fill: "var(--muted)",
                    fontSize: 11,
                  }}
                />

                <Tooltip />

                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="var(--accent)"
                  strokeWidth={2.8}
                  fill="url(#glucoseFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="panel daily-panel">
          <div className="panel-header">
            <div>
              <h3>Today, so far</h3>
              <p>October 30, 2026</p>
            </div>

            <CalendarDays size={19} className="muted-icon" />
          </div>

          <div className="daily-average">
            <span>Today's average</span>

            <strong>
              110 <small>mg/dL</small>
            </strong>

            <div className="status-pill">
              <span />
              1 reading recorded
            </div>
          </div>

          <div className="daily-divider" />

          <div className="daily-stat">
            <span>Highest reading</span>
            <strong>110 mg/dL</strong>
          </div>

          <div className="daily-stat">
            <span>Lowest reading</span>
            <strong>110 mg/dL</strong>
          </div>

          <div className="daily-stat">
            <span>Total readings</span>
            <strong>1</strong>
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
            <span>DATE & TIME</span>
            <span>TIME SLOT</span>
            <span>GLUCOSE LEVEL</span>
            <span>STATUS</span>
          </div>

          {readings.map((reading, index) => (
            <div className="table-row" key={index}>
              <span className="reading-date">{reading.date}</span>
              <span>{reading.slot}</span>

              <strong>
                {reading.value} <small>mg/dL</small>
              </strong>

              <span className="reading-status">Recorded</span>
            </div>
          ))}
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

export default App;
