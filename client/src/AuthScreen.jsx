
import { useState } from "react";
import { Heart, Eye, EyeOff, Activity, ShieldCheck } from "lucide-react";
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

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setError("");
    setShowPassword(false);
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
      {/* FORM SECTION */}

      <section className="auth-form-side">
        <div className="auth-form-container">
          <a className="auth-brand" href="/" aria-label="Sweety home">
            <span className="auth-brand-icon">
              <Heart size={19} fill="currentColor" />
            </span>
            <span>Sweety<span className="auth-brand-dot">.</span></span>
          </a>

          <div className="auth-heading">
            <span className="auth-eyebrow">
              {isRegister ? "GETTING STARTED" : "WELCOME BACK"}
            </span>

            <h1>
              {isRegister
                ? "Create your account"
                : "Good to see you again."}
            </h1>

            <p className="auth-description">
              {isRegister
                ? "Create your personal space to keep track of your glucose readings."
                : "Sign in to view your readings and keep track of your progress."}
            </p>
          </div>

          <div className="auth-mode-switch">
            <button
              type="button"
              className={!isRegister ? "selected" : ""}
              onClick={() => switchMode("login")}
            >
              Sign in
            </button>

            <button
              type="button"
              className={isRegister ? "selected" : ""}
              onClick={() => switchMode("register")}
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
                  autoComplete="name"
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
                autoComplete="email"
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
                  autoComplete={
                    isRegister ? "new-password" : "current-password"
                  }
                  required
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((previous) => !previous)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </label>

            {error && (
              <div className="auth-error" role="alert">
                {error}
              </div>
            )}

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
            {isRegister
              ? "Already have an account?"
              : "New to Sweety?"}{" "}
            <button
              type="button"
              onClick={() => switchMode(isRegister ? "login" : "register")}
            >
              {isRegister ? "Sign in" : "Create an account"}
            </button>
          </p>

          <div className="auth-privacy">
            <ShieldCheck size={15} />
            <span>
              Your account keeps your readings private.
            </span>
          </div>

          <p className="auth-copyright">
            © {new Date().getFullYear()} Sweety. Made with care.
          </p>
        </div>
      </section>

      {/* VISUAL SECTION */}

      <aside className="auth-visual">
        <div className="visual-top">
          <span className="visual-label">A HEALTHIER ROUTINE</span>
          <Activity size={19} />
        </div>

        <div className="visual-center">
          <div className="sculpture-scene" aria-hidden="true">
            <div className="sculpture-shadow" />
            <div className="sculpture-base" />
            <div className="sculpture-ribbon ribbon-one" />
            <div className="sculpture-ribbon ribbon-two" />
            <div className="sculpture-ribbon ribbon-three" />
            <div className="sculpture-highlight" />
          </div>

          <div className="visual-copy">
            <span>YOUR PERSONAL HEALTH SPACE</span>
            <h2>
              Small steps.
              <br />
              Better habits.
            </h2>
            <p>
              A simple place to understand your readings and stay
              connected with your health.
            </p>
          </div>
        </div>

        <div className="visual-bottom">
          <div className="visual-bottom-mark">
            <Heart size={15} />
            <span>One day at a time.</span>
          </div>
          <span>Take care of yourself.</span>
        </div>
      </aside>
    </main>
  );
}
