import { useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { BellOff, CheckCheck, Settings, X } from "lucide-react";
import { formatLastActive } from "../../common/formatters.js";
import { escapeProps } from "../../common/dismissProps.js";
import "./notificationpanel.css";

function NotificationPanel({ notifications, onClose, onMarkRead, onMarkAllRead }) {
  const navigate = useNavigate();
  const [tab, setTab] = useState("all");
  const unread = notifications.filter((item) => item.unread);
  const list = tab === "all" ? notifications : unread;

  const openSettings = () => {
    onClose();
    navigate("/config/notifications");
  };

  return createPortal(
    <div className="notif-root" {...escapeProps(onClose)}>
      <div className="notif-overlay" onClick={onClose} aria-hidden="true" />
      <aside className="notif-panel" role="dialog" aria-modal="true" aria-labelledby="notif-title">
        <header className="notif-head">
          <div>
            <h2 id="notif-title" className="notif-title">
              Notifications
            </h2>
            <p className="notif-count">{unread.length} unread</p>
          </div>
          <button type="button" autoFocus className="icon-btn ghost" aria-label="Close notifications" onClick={onClose}>
            <X size={20} />
          </button>
        </header>

        <div className="notif-tabs" role="tablist" aria-label="Filter notifications">
          <button type="button" role="tab" aria-selected={tab === "all"} className={`notif-tab ${tab === "all" ? "active" : ""}`} onClick={() => setTab("all")}>
            All ({notifications.length})
          </button>
          <button type="button" role="tab" aria-selected={tab === "unread"} className={`notif-tab ${tab === "unread" ? "active" : ""}`} onClick={() => setTab("unread")}>
            Unread ({unread.length})
          </button>
        </div>

        <ul className="notif-list">
          {list.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.id}>
                <button type="button" className={`notif-item ${item.unread ? "unread" : ""}`} onClick={() => onMarkRead(item.id)}>
                  <span className={`notif-icon tone-${item.tone}`} aria-hidden="true">
                    <Icon size={18} />
                  </span>
                  <span className="notif-text">
                    <span className="notif-item-title">{item.title}</span>
                    <span className="notif-item-desc">{item.text}</span>
                    <span className="notif-item-time">{formatLastActive(item.at)}</span>
                  </span>
                  {item.unread && (
                    <span className="notif-dot">
                      <span className="sr-only">Unread</span>
                    </span>
                  )}
                </button>
              </li>
            );
          })}
          {list.length === 0 && (
            <li className="notif-empty">
              <BellOff size={22} aria-hidden="true" />
              <span>You're all caught up.</span>
            </li>
          )}
        </ul>

        <footer className="notif-foot">
          <button type="button" className="btn btn-secondary btn-sm" onClick={onMarkAllRead} disabled={unread.length === 0}>
            <CheckCheck size={16} />
            Mark all as read
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={openSettings}>
            <Settings size={16} />
            Notification settings
          </button>
        </footer>
      </aside>
    </div>,
    document.body
  );
}

export default NotificationPanel;
