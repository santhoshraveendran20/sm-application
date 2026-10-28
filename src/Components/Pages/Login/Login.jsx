import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useMsal } from "@azure/msal-react";
import { InteractionStatus } from "@azure/msal-browser";
import toast from "react-hot-toast";
import { AlertCircle, CircleUserRound, Eye, EyeOff, Loader2, LockKeyhole, LogIn } from "lucide-react";
import request from "../../../api/api.jsx";
import { clearSsoPending, hasSsoPending, isSsoConfigured, loginRequest, markSsoPending } from "../../../config/authConfig.jsx";
import { setCredentials } from "../../redux/features/auth.jsx";
import { normalizeUser } from "../../common/formatters.js";
import { useTheme } from "../../../Themecontext.jsx";
import logo from "../../../images/Logo/srmtech-logo.png";
import logoWhite from "../../../images/Logo/srmtech-logo-white.png";
import "./login.css";

const features = [
  { title: "Rx leakage", text: "Rejected claims by product, HCP, pharmacy and state" },
  { title: "HCP fatigue", text: "Channel saturation and next-best actions" },
  { title: "Role-based access", text: "Every user sees only what their role allows" },
];

const loginErrorMessage = (error) => {
  if (error?.status === 400 || error?.status === 401) return "Incorrect username or password.";
  if (error?.status === 423) return "Your account is locked. Contact your IT administrator.";
  if (error?.status === 403) return "Your account doesn't have access to this application.";
  return "We couldn't reach the sign-in service. Try again, or sign in with Microsoft.";
};

function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { instance, inProgress } = useMsal();
  const { theme } = useTheme();
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const [form, setForm] = useState({ username: "", password: "", remember: true });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ssoStarting, setSsoStarting] = useState(false);

  const ssoBusy = ssoStarting || (inProgress !== InteractionStatus.None && hasSsoPending());

  if (isAuthenticated) {
    return <Navigate to={location.state?.from || "/dashboard"} replace />;
  }

  const handleChange = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
    if (formError) setFormError("");
  };

  const validate = () => {
    const nextErrors = {};
    if (!form.username.trim()) nextErrors.username = "Enter your username or work email.";
    if (!form.password) nextErrors.password = "Enter your password.";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setFormError("");

    request({
      url: "/auth/login",
      method: "POST",
      data: { username: form.username.trim(), password: form.password, remember: form.remember },
    })
      .then((response) => {
        const token = response?.token || response?.access_token || response?.accessToken;
        if (!token) {
          setFormError("Incorrect username or password.");
          return;
        }
        const user = normalizeUser(response?.user || response?.data || {}, form.username.trim());
        dispatch(setCredentials({ token, user, method: "password", remember: form.remember }));
        toast.success(`Welcome, ${user.firstName}. Signed in as ${user.role}.`);
        navigate(location.state?.from || "/dashboard", { replace: true });
      })
      .catch((error) => setFormError(loginErrorMessage(error)))
      .finally(() => setLoading(false));
  };

  const handleMicrosoft = async () => {
    if (inProgress !== InteractionStatus.None) return;
    if (!isSsoConfigured) {
      setFormError("Microsoft sign-in isn't configured. Add VITE_CLIENT_ID and VITE_AUTHORITY to the .env file.");
      return;
    }

    setFormError("");
    setSsoStarting(true);
    markSsoPending();

    try {
      await instance.loginRedirect(loginRequest);
    } catch {
      clearSsoPending();
      setSsoStarting(false);
      setFormError("Microsoft sign-in couldn't start. Check your connection and try again.");
    }
  };

  const handleForgotPassword = () => {
    toast("Password resets are handled by your IT administrator. Contact them to reset your password.", {
      icon: <LockKeyhole size={18} color="var(--link)" />,
    });
  };

  return (
    <div className="login-page">
      <section className="login-hero">
        <span className="login-hero-glow" aria-hidden="true" />
        <span className="login-hero-ring" aria-hidden="true" />
        <div className="login-hero-content">
          <h1 className="login-hero-title">Commercial Decision Intelligence</h1>
          <p className="login-hero-text">
            See where brand prescriptions are being lost, which HCPs are over-contacted, and what the field team should do next.
          </p>
          <ul className="login-features">
            {features.map((feature) => (
              <li key={feature.title} className="login-feature">
                <strong>{feature.title}</strong>
                <span>{feature.text}</span>
              </li>
            ))}
          </ul>
        </div>
        <p className="login-hero-footer">SRMTech · Commercial intelligence at work</p>
      </section>

      <main className="login-main">
        <div className="login-card">
          <img src={theme === "dark" ? logoWhite : logo} alt="SRMTech — ideas@work" className="login-logo" />
          <p className="login-product">Commercial Decision Intelligence</p>
          <h2 className="login-title">Sign in</h2>
          <p className="login-subtitle">Welcome back. Sign in with your username or work email.</p>

          {formError && (
            <div className="login-alert" role="alert">
              <AlertCircle size={16} aria-hidden="true" />
              <span>{formError}</span>
            </div>
          )}

          <form className="login-form" onSubmit={handleSubmit} noValidate>
            <div className="field">
              <label htmlFor="login-username" className="field-label">
                Username or work email
              </label>
              <div className="input-wrap">
                <CircleUserRound className="input-icon" size={17} aria-hidden="true" />
                <input
                  id="login-username"
                  className={`input has-icon ${errors.username ? "is-invalid" : ""}`}
                  placeholder="e.g. priya.raman"
                  autoComplete="username"
                  value={form.username}
                  aria-invalid={Boolean(errors.username)}
                  aria-describedby={errors.username ? "login-username-error" : undefined}
                  onChange={(event) => handleChange("username", event.target.value)}
                />
              </div>
              {errors.username && (
                <p className="field-error" id="login-username-error">
                  <AlertCircle size={13} aria-hidden="true" />
                  {errors.username}
                </p>
              )}
            </div>

            <div className="field">
              <label htmlFor="login-password" className="field-label">
                Password
              </label>
              <div className="input-wrap">
                <LockKeyhole className="input-icon" size={17} aria-hidden="true" />
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  className={`input has-icon has-action ${errors.password ? "is-invalid" : ""}`}
                  autoComplete="current-password"
                  value={form.password}
                  aria-invalid={Boolean(errors.password)}
                  aria-describedby={errors.password ? "login-password-error" : undefined}
                  onChange={(event) => handleChange("password", event.target.value)}
                />
                <button
                  type="button"
                  className="input-action"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword((prev) => !prev)}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              {errors.password && (
                <p className="field-error" id="login-password-error">
                  <AlertCircle size={13} aria-hidden="true" />
                  {errors.password}
                </p>
              )}
            </div>

            <div className="login-options">
              <label className="checkbox-row">
                <input type="checkbox" checked={form.remember} onChange={(event) => handleChange("remember", event.target.checked)} />
                <span>Keep me signed in</span>
              </label>
              <button type="button" className="login-link" onClick={handleForgotPassword}>
                Forgot password?
              </button>
            </div>

            <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={loading || ssoBusy}>
              {loading ? <Loader2 size={17} className="spin" /> : <LogIn size={17} />}
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <div className="login-divider">
            <span>OR</span>
          </div>

          <button type="button" className="btn btn-secondary btn-lg btn-block login-microsoft" onClick={handleMicrosoft} disabled={ssoBusy || loading}>
            {ssoBusy ? (
              <Loader2 size={17} className="spin" />
            ) : (
              <span className="ms-logo" aria-hidden="true">
                <span />
                <span />
                <span />
                <span />
              </span>
            )}
            {ssoBusy ? "Connecting to Microsoft…" : "Sign in with Microsoft"}
          </button>

          <p className="login-help">Having trouble? Contact your IT administrator. Access is limited to authorized users.</p>
        </div>
      </main>
    </div>
  );
}

export default Login;
