import { forwardRef } from "react";
import { AlertCircle, Eye, EyeOff, LockKeyhole } from "lucide-react";
import "./passwordfield.css";

const PasswordField = forwardRef(function PasswordField(
  { id, label, value, onChange, visible, onToggleVisible, error, required = false, autoComplete = "new-password", placeholder = "" },
  ref
) {
  const errorId = `${id}-error`;

  return (
    <div className="field password-field">
      <label htmlFor={id} className="field-label">
        {label}
        {required && <span className="req">*</span>}
      </label>
      <div className="input-wrap">
        <LockKeyhole className="input-icon" size={16} aria-hidden="true" />
        <input
          ref={ref}
          id={id}
          type={visible ? "text" : "password"}
          className={`input has-icon has-action ${visible ? "is-revealed" : ""} ${error ? "is-invalid" : ""}`}
          value={value}
          placeholder={placeholder}
          autoComplete={autoComplete}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          onChange={(event) => onChange(event.target.value)}
        />
        <button
          type="button"
          className="input-action"
          aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          onClick={onToggleVisible}
        >
          {visible ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      {error && (
        <p className="field-error" id={errorId}>
          <AlertCircle size={13} aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  );
});

export default PasswordField;
