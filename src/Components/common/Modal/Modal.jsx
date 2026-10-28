import { useId } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { escapeProps } from "../dismissProps.js";
import "./modal.css";

function Modal({ title, subtitle, icon, iconTone = "info", onClose, children, footer, size = "md" }) {
  const titleId = useId();

  return createPortal(
    <div
      className="modal-root"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      {...escapeProps(onClose)}
    >
      <div className={`modal-panel modal-${size} ${icon ? "has-icon" : ""}`} role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <div className="modal-header">
          <div className="modal-heading">
            {icon && (
              <span className={`modal-icon tone-${iconTone}`} aria-hidden="true">
                {icon}
              </span>
            )}
            <h2 id={titleId} className="modal-title">
              {title}
            </h2>
            {subtitle && <p className="modal-subtitle">{subtitle}</p>}
          </div>
          <button type="button" className="icon-btn ghost modal-close" aria-label="Close dialog" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}

export default Modal;
