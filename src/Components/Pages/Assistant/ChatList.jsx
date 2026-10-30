import { useEffect, useRef, useState } from "react";
import { Archive, ArchiveRestore, Check, ListChecks, MessageSquare, MoreHorizontal, Pencil, Plus, Search, X } from "lucide-react";
import SwitchField from "../../common/SwitchField/SwitchField.jsx";
import { GROUPS, groupOf } from "./chatData.js";

function RenameRow({ chat, onSave, onCancel }) {
  const [value, setValue] = useState(chat.title);
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const save = () => {
    const title = value.trim();
    if (!title) return setError("Enter a name.");
    if (title.length > 80) return setError("Use 80 characters or fewer.");
    onSave(title);
  };

  return (
    <div className="as-rename">
      <div className="as-rename-row">
        <input
          ref={inputRef}
          className={`input ${error ? "is-invalid" : ""}`}
          value={value}
          maxLength={90}
          aria-label="Chat name"
          aria-invalid={Boolean(error)}
          onChange={(event) => {
            setValue(event.target.value);
            setError("");
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") save();
            if (event.key === "Escape") onCancel();
          }}
        />
        <button type="button" className="as-icon-btn" onClick={save} aria-label="Save name">
          <Check size={16} />
        </button>
        <button type="button" className="as-icon-btn" onClick={onCancel} aria-label="Cancel rename">
          <X size={16} />
        </button>
      </div>
      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

function RowMenu({ chat, onRename, onArchive }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const close = (event) => {
      if (!ref.current?.contains(event.target)) setOpen(false);
    };
    const onKey = (event) => event.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="as-menu" ref={ref}>
      <button type="button" className="as-icon-btn as-row-more" aria-haspopup="menu" aria-expanded={open} aria-label={`More actions for ${chat.title}`} onClick={() => setOpen(!open)}>
        <MoreHorizontal size={16} />
      </button>
      {open && (
        <div className="as-menu-pop" role="menu">
          <button type="button" role="menuitem" onClick={() => { setOpen(false); onRename(); }}>
            <Pencil size={15} aria-hidden="true" />
            Rename
          </button>
          <button type="button" role="menuitem" onClick={() => { setOpen(false); onArchive(); }}>
            <Archive size={15} aria-hidden="true" />
            Archive
          </button>
        </div>
      )}
    </div>
  );
}

function ChatList({ chats, activeId, onOpen, onNew, onRename, onArchive, onRestore, onClose }) {
  const [query, setQuery] = useState("");
  const [renaming, setRenaming] = useState(null);
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState(new Set());
  const [showArchived, setShowArchived] = useState(false);

  const needle = query.trim().toLowerCase();
  const matches = (chat) => !needle || chat.title.toLowerCase().includes(needle) || chat.messages.some((message) => message.text?.toLowerCase().includes(needle));
  const active = chats.filter((chat) => !chat.archived && matches(chat)).sort((a, b) => b.updatedAt - a.updatedAt);
  const archived = chats.filter((chat) => chat.archived && matches(chat));
  const archivedCount = chats.filter((chat) => chat.archived).length;

  const toggle = (id) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const stopSelecting = () => {
    setSelecting(false);
    setSelected(new Set());
  };

  return (
    <div className="as-list">
      <div className="as-list-head">
        <div className="as-list-title-row">
          <h2 className="as-list-title">Chats</h2>
          {active.length > 0 && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => (selecting ? stopSelecting() : setSelecting(true))}>
              {selecting ? <X size={15} aria-hidden="true" /> : <ListChecks size={15} aria-hidden="true" />}
              {selecting ? "Cancel" : "Select"}
            </button>
          )}
          {onClose && (
            <button type="button" className="as-icon-btn as-close" onClick={onClose} aria-label="Close chats">
              <X size={18} />
            </button>
          )}
        </div>
        <button type="button" className="btn btn-primary as-new" onClick={onNew}>
          <Plus size={16} aria-hidden="true" />
          New chat
        </button>
        <div className="as-search">
          <Search size={16} aria-hidden="true" />
          <input type="search" className="input" placeholder="Search chats" aria-label="Search chats" value={query} onChange={(event) => setQuery(event.target.value)} />
        </div>
      </div>

      <nav className="as-groups" aria-label="Chat history">
        {active.length === 0 && !showArchived && <p className="as-empty">{needle ? `No chats match “${query.trim()}”.` : "No chats yet. Ask your first question."}</p>}

        {GROUPS.map((group) => {
          const items = active.filter((chat) => groupOf(chat.updatedAt) === group);
          if (!items.length) return null;
          return (
            <section key={group} className="as-group">
              <h3>{group}</h3>
              <ul>
                {items.map((chat) => (
                  <li key={chat.id} className={`as-row ${chat.id === activeId ? "is-active" : ""}`}>
                    {renaming === chat.id ? (
                      <RenameRow chat={chat} onCancel={() => setRenaming(null)} onSave={(title) => { onRename(chat, title); setRenaming(null); }} />
                    ) : (
                      <>
                        {selecting && <input type="checkbox" className="as-check" checked={selected.has(chat.id)} onChange={() => toggle(chat.id)} aria-label={`Select ${chat.title}`} />}
                        <button type="button" className="as-row-main" title={chat.title} aria-current={chat.id === activeId ? "page" : undefined} onClick={() => (selecting ? toggle(chat.id) : onOpen(chat.id))}>
                          <MessageSquare size={16} aria-hidden="true" />
                          <span>{chat.title}</span>
                        </button>
                        {!selecting && <RowMenu chat={chat} onRename={() => setRenaming(chat.id)} onArchive={() => onArchive([chat.id])} />}
                      </>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          );
        })}

        {showArchived && (
          <section className="as-group">
            <h3>Archived</h3>
            {archived.length === 0 ? (
              <p className="as-empty as-empty-sm">No archived chats.</p>
            ) : (
              <ul>
                {archived.map((chat) => (
                  <li key={chat.id} className="as-row is-archived">
                    <button type="button" className="as-row-main" title={chat.title} onClick={() => onOpen(chat.id)}>
                      <Archive size={16} aria-hidden="true" />
                      <span>{chat.title}</span>
                    </button>
                    <button type="button" className="as-icon-btn" title="Restore" aria-label={`Restore ${chat.title}`} onClick={() => onRestore([chat.id])}>
                      <ArchiveRestore size={16} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </nav>

      {selecting && selected.size > 0 && (
        <div className="as-bulk" role="region" aria-label="Bulk actions">
          <b>{selected.size} selected</b>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => {
              onArchive([...selected]);
              stopSelecting();
            }}
          >
            <Archive size={15} aria-hidden="true" />
            Archive
          </button>
        </div>
      )}

      <div className="as-list-foot">
        <SwitchField checked={showArchived} onChange={setShowArchived}>
          Show archived{archivedCount ? ` (${archivedCount})` : ""}
        </SwitchField>
      </div>
    </div>
  );
}

export default ChatList;
