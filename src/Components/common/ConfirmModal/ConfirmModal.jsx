import { useId, useState } from "react";
import { Info } from "lucide-react";
import Modal from "../Modal/Modal.jsx";
import "./confirmmodal.css";

const REASON_LIMIT = 200;

function ConfirmModal({
  title,
  message,
  note,
  icon,
  iconTone,
  children,
  confirmLabel,
  cancelLabel = "Cancel",
  tone = "primary",
  withReason = false,
  reasonPlaceholder = "e.g. Left the company on 30 Oct",
  onConfirm,
  onClose,
}) {
  const [reason, setReason] = useState("");
  const reasonId = useId();

  return (
    <Modal
      title={title}
      icon={icon}
      iconTone={iconTone}
      onClose={onClose}
      size="sm"
      footer={
        <>
          <button type="button" className="btn btn-secondary" autoFocus={!withReason} onClick={onClose}>
            {cancelLabel}
          </button>
          <button type="button" className={`btn btn-${tone}`} onClick={() => onConfirm(reason.trim())}>
            {confirmLabel}
          </button>
        </>
      }
    >
      <div className="confirm-body">
        <p className="confirm-message">{message}</p>
        {children}
        {note && (
          <p className="confirm-note">
            <Info size={16} aria-hidden="true" />
            <span>{note}</span>
          </p>
        )}
        {withReason && (
          <div className="field">
            <label htmlFor={reasonId} className="field-label">
              Reason (optional)
            </label>
            <textarea
              id={reasonId}
              className="input"
              autoFocus
              rows={3}
              maxLength={REASON_LIMIT}
              value={reason}
              placeholder={reasonPlaceholder}
              onChange={(event) => setReason(event.target.value)}
            />
            <p className="field-hint">
              {reason.length}/{REASON_LIMIT} · Saved in the audit log
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
}

export default ConfirmModal;
