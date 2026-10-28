import { useId, useRef, useState } from "react";
import { AlertCircle, Info, Mail, Sparkles, UserRound } from "lucide-react";
import Modal from "../../common/Modal/Modal.jsx";
import SelectField from "../../common/SelectField/SelectField.jsx";
import PasswordField from "../../common/PasswordField/PasswordField.jsx";
import PasswordStrength from "../../common/PasswordStrength/PasswordStrength.jsx";
import { evaluatePassword, generateStrongPassword } from "../../common/passwordUtils.js";
import "./userformmodal.css";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_PATTERN = /^[a-z0-9._-]{3,30}$/;
const PHONE_PATTERN = /^[+()\d\s-]{7,20}$/;

const suggestUsername = (firstName, lastName) =>
  [firstName, lastName]
    .map((part) => part.trim().toLowerCase().replace(/[^a-z0-9]/g, ""))
    .filter(Boolean)
    .join(".")
    .slice(0, 30);

const buildInitialForm = (user) => ({
  firstName: user?.firstName || "",
  lastName: user?.lastName || "",
  email: user?.email || "",
  phone: user?.phone || "",
  jobTitle: user?.jobTitle || "",
  role: user?.role || "",
  username: user?.username || "",
  password: "",
  confirmPassword: "",
  requireReset: true,
  sendEmail: true,
});

const validate = (form, mode, users, user) => {
  const errors = {};
  const others = users.filter((item) => item.id !== user?.id);
  const email = form.email.trim().toLowerCase();

  if (!form.firstName.trim()) errors.firstName = "Enter a first name.";
  if (!form.lastName.trim()) errors.lastName = "Enter a last name.";
  if (!email) errors.email = "Enter a work email.";
  else if (!EMAIL_PATTERN.test(email)) errors.email = "Enter a valid email, like name@company.com.";
  else if (others.some((item) => item.email.toLowerCase() === email)) errors.email = "Another user already has this email.";
  if (form.phone.trim() && !PHONE_PATTERN.test(form.phone.trim())) errors.phone = "Enter a valid phone number.";
  if (!form.role) errors.role = "Choose a role.";

  if (mode === "add") {
    if (!form.username) errors.username = "Enter a username.";
    else if (!USERNAME_PATTERN.test(form.username)) errors.username = "Use 3–30 characters: a–z, 0–9, dot, dash or underscore.";
    else if (others.some((item) => item.username === form.username)) errors.username = "This username is already taken.";
    if (!form.password) errors.password = "Enter a password.";
    else if (!evaluatePassword(form.password, form.username).valid) errors.password = "The password doesn't meet every requirement below.";
    if (!form.confirmPassword) errors.confirmPassword = "Confirm the password.";
    else if (form.confirmPassword !== form.password) errors.confirmPassword = "Passwords don't match.";
  }

  return errors;
};

function UserFormModal({ mode, user, users, roleOptions, onClose, onSubmit }) {
  const formId = useId();
  const isAdd = mode === "add";
  const roleChoices = user?.role && !roleOptions.includes(user.role) ? [user.role, ...roleOptions] : roleOptions;
  const [form, setForm] = useState(() => buildInitialForm(user));
  const [usernameTouched, setUsernameTouched] = useState(!isAdd);
  const [submitted, setSubmitted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const fieldRefs = useRef({});
  const errors = submitted ? validate(form, mode, users, user) : {};

  const fieldRef = (name) => (node) => {
    fieldRefs.current[name] = node;
  };

  const update = (name, value) => {
    setForm((prev) => {
      const next = { ...prev, [name]: value };
      if (!usernameTouched && (name === "firstName" || name === "lastName")) {
        next.username = suggestUsername(next.firstName, next.lastName);
      }
      return next;
    });
  };

  const handleUsername = (value) => {
    setUsernameTouched(true);
    update("username", value.toLowerCase().replace(/\s/g, ""));
  };

  const handleGenerate = () => {
    const password = generateStrongPassword();
    setForm((prev) => ({ ...prev, password, confirmPassword: password }));
    setShowPassword(true);
    setShowConfirm(true);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setSubmitted(true);
    const nextErrors = validate(form, mode, users, user);
    const firstInvalid = Object.keys(nextErrors)[0];

    if (firstInvalid) {
      fieldRefs.current[firstInvalid]?.focus();
      return;
    }

    onSubmit({
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim().toLowerCase(),
      phone: form.phone.trim(),
      jobTitle: form.jobTitle.trim(),
      role: form.role,
      username: form.username,
      requireReset: form.requireReset,
      sendEmail: form.sendEmail,
    });
  };

  const inputProps = (name) => ({
    ref: fieldRef(name),
    id: `${formId}-${name}`,
    value: form[name],
    onChange: (event) => update(name, event.target.value),
    "aria-invalid": Boolean(errors[name]),
    "aria-describedby": errors[name] ? `${formId}-${name}-error` : undefined,
  });

  const renderError = (name) =>
    errors[name] ? (
      <p className="field-error" id={`${formId}-${name}-error`}>
        <AlertCircle size={13} aria-hidden="true" />
        {errors[name]}
      </p>
    ) : null;

  return (
    <Modal
      title={isAdd ? "Add user" : "Edit user"}
      subtitle={isAdd ? "Fields marked * are required." : `Username: ${user.username}`}
      onClose={onClose}
      size="lg"
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" form={formId} className="btn btn-primary">
            {isAdd ? "Create user" : "Save changes"}
          </button>
        </>
      }
    >
      <form id={formId} className="user-form" onSubmit={handleSubmit} noValidate>
        <section className="user-form-section" aria-labelledby={`${formId}-personal`}>
          <h3 className="user-form-heading" id={`${formId}-personal`}>
            Personal details
          </h3>
          <div className="user-form-grid">
            <div className="field">
              <label htmlFor={`${formId}-firstName`} className="field-label">
                First name<span className="req">*</span>
              </label>
              <input className={`input ${errors.firstName ? "is-invalid" : ""}`} autoComplete="off" autoFocus {...inputProps("firstName")} />
              {renderError("firstName")}
            </div>
            <div className="field">
              <label htmlFor={`${formId}-lastName`} className="field-label">
                Last name<span className="req">*</span>
              </label>
              <input className={`input ${errors.lastName ? "is-invalid" : ""}`} autoComplete="off" {...inputProps("lastName")} />
              {renderError("lastName")}
            </div>
            <div className="field">
              <label htmlFor={`${formId}-email`} className="field-label">
                Work email<span className="req">*</span>
              </label>
              <div className="input-wrap">
                <Mail className="input-icon" size={16} aria-hidden="true" />
                <input
                  type="email"
                  className={`input has-icon ${errors.email ? "is-invalid" : ""}`}
                  placeholder="name@srmtech.com"
                  autoComplete="off"
                  {...inputProps("email")}
                />
              </div>
              {renderError("email")}
            </div>
            <div className="field">
              <label htmlFor={`${formId}-phone`} className="field-label">
                Phone <span className="user-form-optional">(optional)</span>
              </label>
              <input type="tel" className={`input ${errors.phone ? "is-invalid" : ""}`} placeholder="+1 312 555 0147" autoComplete="off" {...inputProps("phone")} />
              {renderError("phone")}
            </div>
            <div className="field">
              <label htmlFor={`${formId}-jobTitle`} className="field-label">
                Job title <span className="user-form-optional">(optional)</span>
              </label>
              <input className="input" placeholder="e.g. Regional Sales Lead" autoComplete="off" {...inputProps("jobTitle")} />
            </div>
            <div className="field">
              <label htmlFor={`${formId}-role`} className="field-label">
                Role<span className="req">*</span>
              </label>
              <SelectField invalid={Boolean(errors.role)} {...inputProps("role")}>
                <option value="" disabled>
                  Choose a role
                </option>
                {roleChoices.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </SelectField>
              {renderError("role")}
            </div>
          </div>
        </section>

        <section className="user-form-section" aria-labelledby={`${formId}-signin`}>
          <h3 className="user-form-heading" id={`${formId}-signin`}>
            Sign-in details
          </h3>
          <div className="field">
            <label htmlFor={`${formId}-username`} className="field-label">
              Username<span className="req">*</span>
            </label>
            <div className="input-wrap">
              <UserRound className="input-icon" size={16} aria-hidden="true" />
              <input
                ref={fieldRef("username")}
                id={`${formId}-username`}
                className={`input has-icon user-form-username ${errors.username ? "is-invalid" : ""}`}
                value={form.username}
                disabled={!isAdd}
                autoComplete="off"
                aria-invalid={Boolean(errors.username)}
                aria-describedby={`${formId}-username-hint`}
                onChange={(event) => handleUsername(event.target.value)}
              />
            </div>
            {renderError("username")}
            <p className="field-hint" id={`${formId}-username-hint`}>
              {isAdd ? "Suggested from the name. 3–30 characters: a–z, 0–9, dot, dash, underscore." : "Usernames can't be changed."}
            </p>
          </div>

          {isAdd ? (
            <>
              <div className="user-form-grid">
                <PasswordField
                  ref={fieldRef("password")}
                  id={`${formId}-password`}
                  label="Password"
                  required
                  value={form.password}
                  visible={showPassword}
                  error={errors.password}
                  onChange={(value) => update("password", value)}
                  onToggleVisible={() => setShowPassword((prev) => !prev)}
                />
                <PasswordField
                  ref={fieldRef("confirmPassword")}
                  id={`${formId}-confirmPassword`}
                  label="Confirm password"
                  required
                  value={form.confirmPassword}
                  visible={showConfirm}
                  error={errors.confirmPassword}
                  onChange={(value) => update("confirmPassword", value)}
                  onToggleVisible={() => setShowConfirm((prev) => !prev)}
                />
              </div>
              <button type="button" className="btn btn-secondary btn-sm user-form-generate" onClick={handleGenerate}>
                <Sparkles size={15} />
                Generate strong password
              </button>
              <PasswordStrength password={form.password} username={form.username} />
              <div className="user-form-options">
                <label className="checkbox-row">
                  <input type="checkbox" checked={form.requireReset} onChange={(event) => update("requireReset", event.target.checked)} />
                  <span className="checkbox-text">
                    <strong>Require a new password at first sign-in</strong>
                    <span>Recommended. The user replaces this password the first time they sign in.</span>
                  </span>
                </label>
                <label className="checkbox-row">
                  <input type="checkbox" checked={form.sendEmail} onChange={(event) => update("sendEmail", event.target.checked)} />
                  <span className="checkbox-text">
                    <strong>Email sign-in details to the user</strong>
                    <span>Sends the username and a sign-in link. The password is never included.</span>
                  </span>
                </label>
              </div>
            </>
          ) : (
            <p className="user-form-note">
              <Info size={16} aria-hidden="true" />
              <span>To change this user's password, use Reset password in the users table.</span>
            </p>
          )}
        </section>
      </form>
    </Modal>
  );
}

export default UserFormModal;
