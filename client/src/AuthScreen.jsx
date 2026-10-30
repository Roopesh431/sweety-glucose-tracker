import { useState } from "react";
import { Heart, Eye, EyeOff, Activity } from "lucide-react";
import api from "./api";
import "./AuthScreen.css";

export default function AuthScreen({ onAuthenticated }) {
  const [mode, setMode] = useState("login");
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isRegister = mode === "register";

  const handleChange = (event) => {
    setForm((previous) => ({
      ...previous,
      [event.target.name]: event.target.value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (isRegister && !form.name.trim()) {
      setError("Please enter your name.");
      return;
    }

    if (form.password.length < 8) {
      setError("Your password must contain at least 8 characters.");
      return;
    }

    setLoading(true);

    try {
      const endpoint = isRegister ? "/auth/register" : "/auth/login";

      const payload = isRegister
        ? {
            name: form.name.trim(),
            email: form.email.trim(),
            password: form.password,
          }
        : {
            email: form.email.trim(),
            password: form.password,
          };

      const response = await api.post(endpoint, payload);
      const { token, user } = response.data;

      if (!token || !user) {
        throw new Error("The server returned an incomplete response.");
      }

      onAuthenticated(token, user);
    } catch (err) {
      const responseData = err.response?.data;

      const validationMessage = responseData?.errors
        ?.map((item) => item.message)
        .join(" ");

      setError(
        validationMessage ||
          responseData?.message ||
          err.message ||
          "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-intro">
        <div className="auth-brand">
          <span className="auth-brand-icon">
            <Heart size={22} fill="white" />
          </span>
          <span>Sweety<span className="auth-brand-dot">.</span></span>
        </div>

        <div className="auth-intro-content">
          <span className="auth-eyebrow">YOUR PERSONAL HEALTH SPACE</span>

          <h1>
            A little care,
            <br />
            every day.
          </h1>

          <p>
            Keep track of your glucose readings, understand your patterns,
            and build healthier habits at your own pace.
          </p>

          <div className="auth-feature">
            <span><Activity size={19} /></span>
            <div>
              <strong>Your readings, in one place</strong>
              <small>A simple way to keep track of your progress.</small>
            </div>
          </div>
        </div>

        <span className="auth-footer">
          Made with care. Your health matters.
        </span>
      </section>

      <section className="auth-form-side">
        <div className="auth-form-container">
          <div className="auth-mobile-brand">
            <Heart size={20} fill="currentColor" />
            Sweety.
          </div>

          <span className="auth-eyebrow">
            {isRegister ? "LET'S GET STARTED" : "WELCOME BACK"}
          </span>

          <h2>{isRegister ? "Create your account" : "Good to see you again."}</h2>

          <p className="auth-description">
            {isRegister
              ? "A few details and your personal health space is ready."
              : "Sign in to continue your health journey."}
          </p>

          <div className="auth-mode-switch">
            <button
              type="button"
              className={!isRegister ? "selected" : ""}
              onClick={() => {
                setMode("login");
                setError("");
              }}
            >
              Sign in
            </button>

            <button
              type="button"
              className={isRegister ? "selected" : ""}
              onClick={() => {
                setMode("register");
                setError("");
              }}
            >
              Create account
            </button>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            {isRegister && (
              <label>
                Your name
                <input
                  type="text"
                  name="name"
                  placeholder="Enter your name"
                  value={form.name}
                  onChange={handleChange}
                  maxLength={100}
                  required
                />
              </label>
            )}

            <label>
              Email address
              <input
                type="email"
                name="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
                maxLength={255}
                required
              />
            </label>

            <label>
              Password
              <div className="auth-password-field">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="At least 8 characters"
                  value={form.password}
                  onChange={handleChange}
                  minLength={8}
                  maxLength={72}
                  required
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((previous) => !previous)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>

            {error && <div className="auth-error">{error}</div>}

            <button
              type="submit"
              className="auth-submit"
              disabled={loading}
            >
              {loading
                ? "Please wait..."
                : isRegister
                  ? "Create my account"
                  : "Sign in to Sweety"}
            </button>
          </form>

          <p className="auth-switch-text">
            {isRegister ? "Already have an account?" : "New to Sweety?"}{" "}
            <button
              type="button"
              onClick={() => {
                setMode(isRegister ? "login" : "register");
                setError("");
              }}
            >
              {isRegister ? "Sign in" : "Create an account"}
            </button>
          </p>

          <p className="auth-privacy">
            Your health information is personal. Your account keeps your
            readings private.
          </p>
        </div>
      </section>
    </main>
  );
}