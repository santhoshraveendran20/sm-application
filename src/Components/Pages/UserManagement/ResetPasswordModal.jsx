import { useId, useState } from "react";
import { KeyRound, Mail, Sparkles } from "lucide-react";
import Modal from "../../common/Modal/Modal.jsx";
import PasswordField from "../../common/PasswordField/PasswordField.jsx";
import PasswordStrength from "../../common/PasswordStrength/PasswordStrength.jsx";
import { evaluatePassword, generateStrongPassword } from "../../common/passwordUtils.js";
import "./resetpasswordmodal.css";

function ResetPasswordModal({ user, onClose, onSubmit }) {
  const formId = useId();
  const [method, setMethod] = useState("link");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [requireReset, setRequireReset] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const name = `${user.firstName} ${user.lastName}`;
  const passwordValid = evaluatePassword(password, user.username).valid;

  const errors = {};
  if (submitted && method === "temporary") {
    if (!password) errors.password = "Enter a temporary password.";
    else if (!passwordValid) errors.password = "The password doesn't meet every requirement below.";
    if (!confirm) errors.confirm = "Confirm the password.";
    else if (confirm !== password) errors.confirm = "Passwords don't match.";
  }

  const handleGenerate = () => {
    const value = generateStrongPassword();
    setPassword(value);
    setConfirm(value);
    setShowPassword(true);
    setShowConfirm(true);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (method === "link") {
      onSubmit({ method: "link" });
      return;
    }
    setSubmitted(true);
    if (!password || !passwordValid || confirm !== password) return;
    onSubmit({ method: "temporary", requireReset });
  };

  return (
    <Modal
      title={`Reset password for ${name}`}
      subtitle={`Username: ${user.username}`}
      onClose={onClose}
      size="md"
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" form={formId} className="btn btn-primary">
            {method === "link" ? "Send reset link" : "Set password"}
          </button>
        </>
      }
    >
      <form id={formId} className="reset-form" onSubmit={handleSubmit} noValidate>
        <div className="reset-switch" role="tablist" aria-label="Reset method">
          <button
            type="button"
            role="tab"
            aria-selected={method === "link"}
            autoFocus
            className={`reset-switch-btn ${method === "link" ? "active" : ""}`}
            onClick={() => setMethod("link")}
          >
            <Mail size={15} aria-hidden="true" />
            Email a reset link
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={method === "temporary"}
            className={`reset-switch-btn ${method === "temporary" ? "active" : ""}`}
            onClick={() => setMethod("temporary")}
          >
            <KeyRound size={15} aria-hidden="true" />
            Set a temporary password
          </button>
        </div>

        {method === "link" ? (
          <p className="reset-text">
            We'll email a one-time link to <strong>{user.email}</strong>. It expires in 30 minutes.
          </p>
        ) : (
          <div className="reset-temporary">
            <div className="reset-grid">
              <PasswordField
                id={`${formId}-password`}
                label="Temporary password"
                required
                value={password}
                visible={showPassword}
                error={errors.password}
                onChange={setPassword}
                onToggleVisible={() => setShowPassword((prev) => !prev)}
              />
              <PasswordField
                id={`${formId}-confirm`}
                label="Confirm password"
                required
                value={confirm}
                visible={showConfirm}
                error={errors.confirm}
                onChange={setConfirm}
                onToggleVisible={() => setShowConfirm((prev) => !prev)}
              />
            </div>
            <button type="button" className="btn btn-secondary btn-sm reset-generate" onClick={handleGenerate}>
              <Sparkles size={15} />
              Generate strong password
            </button>
            <PasswordStrength password={password} username={user.username} />
            <label className="checkbox-row">
              <input type="checkbox" checked={requireReset} onChange={(event) => setRequireReset(event.target.checked)} />
              <span className="checkbox-text">
                <strong>Require a new password at next sign-in</strong>
                <span>Share the temporary password with {user.firstName} through a secure channel.</span>
              </span>
            </label>
          </div>
        )}
      </form>
    </Modal>
  );
}

export default ResetPasswordModal;
