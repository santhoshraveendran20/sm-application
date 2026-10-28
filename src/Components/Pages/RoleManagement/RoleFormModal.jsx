import { useId, useRef, useState } from "react";
import { AlertCircle, Info } from "lucide-react";
import Modal from "../../common/Modal/Modal.jsx";
import { pluralize } from "../../common/formatters.js";

const NAME_LIMIT = 50;
const DESCRIPTION_LIMIT = 240;

const validateName = (name, roles, role) => {
  const value = name.trim().toLowerCase();
  if (!value) return "Enter a role name.";
  if (roles.some((item) => item.id !== role?.id && item.name.toLowerCase() === value)) return "A role with this name already exists.";
  return "";
};

function RoleFormModal({ role, roles, userCount = 0, onClose, onSubmit }) {
  const formId = useId();
  const isEdit = Boolean(role);
  const nameLocked = role?.type === "system";
  const [name, setName] = useState(role?.name || "");
  const [description, setDescription] = useState(role?.description || "");
  const [submitted, setSubmitted] = useState(false);
  const nameRef = useRef(null);
  const error =submitted && !nameLocked ? validateName(name, roles, role) : "";

  const note = !isEdit
    ? "New roles start with no permissions. You can set them right after you create the role."
    : userCount > 0
      ? `This role is assigned to ${pluralize(userCount, "user")}. Changes apply to all of them.`
      : "No users have this role yet.";

  const handleSubmit = (event) => {
    event.preventDefault();
    setSubmitted(true);
    if (!nameLocked && validateName(name, roles, role)) {
      nameRef.current?.focus();
      return;
    }
    onSubmit({ name: nameLocked ? role.name : name.trim(), description: description.trim() });
  };

  return (
    <Modal
      title={isEdit ? "Edit role" : "Create role"}
      subtitle={isEdit ? `Update the details for ${role.name}.` : "Add a role, then choose what it can do in Role permissions."}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" form={formId} className="btn btn-primary">
            {isEdit ? "Save changes" : "Create role"}
          </button>
        </>
      }
    >
      <form id={formId} className="role-form" onSubmit={handleSubmit} noValidate>
        <div className="field">
          <label htmlFor={`${formId}-name`} className="field-label">
            Role name<span className="req">*</span>
          </label>
          <input
            ref={nameRef}
            autoFocus={!nameLocked}
            id={`${formId}-name`}
            className={`input ${error ? "is-invalid" : ""}`}
            placeholder="e.g. Regional Sales Lead"
            autoComplete="off"
            maxLength={NAME_LIMIT}
            disabled={nameLocked}
            value={name}
            onChange={(event) => setName(event.target.value)}
            aria-invalid={Boolean(error)}
            aria-describedby={`${formId}-name-help`}
          />
          {error ? (
            <p className="field-error" id={`${formId}-name-help`}>
              <AlertCircle size={13} aria-hidden="true" />
              {error}
            </p>
          ) : (
            <p className="field-hint" id={`${formId}-name-help`}>
              {nameLocked ? "System role names can't be changed." : "Shown in user lists and on the permissions screen."}
            </p>
          )}
        </div>

        <div className="field">
          <label htmlFor={`${formId}-description`} className="field-label">
            Description
          </label>
          <textarea
            autoFocus={nameLocked}
            id={`${formId}-description`}
            className="input"
            rows={4}
            maxLength={DESCRIPTION_LIMIT}
            placeholder="What this role is for and who should have it."
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </div>

        <p className="role-form-note">
          <Info size={16} aria-hidden="true" />
          <span>{note}</span>
        </p>
      </form>
    </Modal>
  );
}

export default RoleFormModal;
