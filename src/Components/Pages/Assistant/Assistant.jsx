import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";
import { Archive, PanelLeftClose, PanelLeftOpen, SendHorizontal, Square } from "lucide-react";
import ConfirmModal from "../../common/ConfirmModal/ConfirmModal.jsx";
import { useConfigStore } from "../Configurations/configData.js";
import { useUploadStore } from "../DataUpload/uploadData.js";
import { SOURCES, SUGGESTIONS, askCdi, sourceLabel } from "./askData.js";
import { addChat, addMessage, archiveChats, makeTitle, patchMessage, removeMessage, renameChat, restoreChats, useChatStore } from "./chatData.js";
import ChatList from "./ChatList.jsx";
import ChatMessage, { Avatar } from "./ChatMessage.jsx";
import "./assistant.css";

const MAX_LENGTH = 2000;

const greeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  return hour < 17 ? "Good afternoon" : "Good evening";
};

function Composer({ onSend, onStop, streaming, source, setSource }) {
  const [text, setText] = useState("");
  const areaRef = useRef(null);

  useEffect(() => {
    const area = areaRef.current;
    if (!area) return;
    area.style.height = "auto";
    area.style.height = `${Math.min(area.scrollHeight, 168)}px`;
  }, [text]);

  const send = () => {
    const question = text.trim();
    if (!question || streaming) return;
    onSend(question);
    setText("");
  };

  const left = MAX_LENGTH - text.length;

  return (
    <form
      className="as-composer"
      onSubmit={(event) => {
        event.preventDefault();
        send();
      }}
    >
      <label htmlFor="ask-input" className="sr-only">
        Ask a question
      </label>
      <textarea
        id="ask-input"
        ref={areaRef}
        rows={1}
        value={text}
        maxLength={MAX_LENGTH}
        placeholder="Ask about leakage, HCP fatigue, imports, rosters or Salesforce…"
        aria-describedby="ask-help"
        onChange={(event) => setText(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
            event.preventDefault();
            send();
          }
        }}
      />
      <div className="as-composer-bar">
        <label className="as-source-pick">
          <span className="sr-only">Data source</span>
          <select value={source} onChange={(event) => setSource(event.target.value)} aria-label="Answer using">
            {SOURCES.map((item) => (
              <option key={item.id} value={item.id}>
                {item.id === "auto" ? "Auto" : item.label}
              </option>
            ))}
          </select>
        </label>
        {left <= 200 && (
          <span className={`as-left ${left <= 50 ? "is-low" : ""}`} aria-live="polite">
            {left} characters left
          </span>
        )}
        <span className="as-grow" />
        {streaming ? (
          <button type="button" className="as-send" onClick={onStop} aria-label="Stop answering" title="Stop">
            <Square size={14} fill="currentColor" />
          </button>
        ) : (
          <button type="submit" className="as-send" disabled={!text.trim()} aria-label="Send" title="Send (Enter)">
            <SendHorizontal size={16} />
          </button>
        )}
      </div>
    </form>
  );
}

function Assistant() {
  const { chats } = useChatStore();
  const { thresholds } = useConfigStore();
  const { jobs } = useUploadStore();
  const userName = useSelector((state) => state.auth.user?.name) || "there";

  const [activeId, setActiveId] = useState(null);
  const [source, setSource] = useState("auto");
  const [drawer, setDrawer] = useState(false);
  const [listHidden, setListHidden] = useState(false);
  const [archiving, setArchiving] = useState(null);
  const [streaming, setStreaming] = useState(false);

  const scrollRef = useRef(null);
  const streamRef = useRef(null);
  const latest = useRef({});
  latest.current = { thresholds, jobs, source };

  const chat = chats.find((item) => item.id === activeId) || null;
  const lastMessage = chat?.messages[chat.messages.length - 1];

  useEffect(() => () => streamRef.current?.stop(true), []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [activeId, chat?.messages.length, lastMessage?.text, lastMessage?.status]);

  const answerQuestion = useCallback((chatId, question) => {
    const messageId = `a${Date.now()}`;
    addMessage(chatId, { id: messageId, role: "assistant", status: "thinking", text: "", at: Date.now(), question });

    let interval = null;
    let streamed = "";
    const timer = setTimeout(() => {
      const { thresholds: limits, jobs: jobList, source: pick } = latest.current;
      const result = askCdi(question, { thresholds: limits, jobs: jobList, source: pick });
      const { text, ...rest } = result;
      patchMessage(chatId, messageId, { status: "streaming", source: result.source });

      const words = text.split(/(\s+)/);
      let cursor = 0;
      interval = setInterval(() => {
        streamed += words.slice(cursor, cursor + 3).join("");
        cursor += 3;
        patchMessage(chatId, messageId, { text: streamed });
        if (cursor >= words.length) {
          clearInterval(interval);
          patchMessage(chatId, messageId, { ...rest, text, status: "done" });
          streamRef.current = null;
          setStreaming(false);
        }
      }, 45);
    }, 900 + Math.random() * 600);

    streamRef.current = {
      stop: (silent) => {
        clearTimeout(timer);
        clearInterval(interval);
        streamRef.current = null;
        if (silent) return;
        patchMessage(chatId, messageId, { status: "stopped", text: streamed });
        setStreaming(false);
      },
    };
    setStreaming(true);
  }, []);

  const ask = (question) => {
    let chatId = chat && !chat.archived ? chat.id : null;
    if (!chatId) {
      chatId = `c${Date.now()}`;
      addChat({ id: chatId, title: makeTitle(question), createdAt: Date.now(), updatedAt: Date.now(), archived: null, messages: [] });
      setActiveId(chatId);
    }
    addMessage(chatId, { id: `u${Date.now()}`, role: "user", text: question, at: Date.now() });
    answerQuestion(chatId, question);
  };

  const regenerate = (message) => {
    const index = chat.messages.findIndex((item) => item.id === message.id);
    const question = message.question || chat.messages[index - 1]?.text;
    removeMessage(chat.id, message.id);
    answerQuestion(chat.id, question);
  };

  const feedback = (message, value) => {
    const next = message.feedback === value ? null : value;
    patchMessage(chat.id, message.id, { feedback: next });
    if (next) toast.success(value === "up" ? "Thanks — glad that helped." : "Thanks — we’ll use this to improve answers.");
  };

  const newChat = () => {
    streamRef.current?.stop();
    setActiveId(null);
    setDrawer(false);
    requestAnimationFrame(() => document.getElementById("ask-input")?.focus());
  };

  const confirmArchive = (reason) => {
    archiveChats(archiving, reason);
    toast.success(archiving.length > 1 ? `${archiving.length} chats archived` : "Chat archived");
    if (archiving.includes(activeId)) setActiveId(null);
    setArchiving(null);
  };

  const listProps = {
    chats,
    activeId,
    onNew: newChat,
    onOpen: (id) => {
      setActiveId(id);
      setDrawer(false);
    },
    onRename: (item, title) => {
      renameChat(item.id, title);
      toast.success("Chat renamed");
    },
    onArchive: setArchiving,
    onRestore: (ids) => {
      restoreChats(ids);
      toast.success(ids.length > 1 ? `${ids.length} chats restored` : "Chat restored");
    },
  };

  const empty = !chat || chat.messages.length === 0;
  const archivedChat = Boolean(chat?.archived);

  return (
    <div className="assistant-page">
      {!listHidden && (
        <aside className="as-side" aria-label="Chats">
          <ChatList {...listProps} />
        </aside>
      )}

      {drawer && (
        <div className="as-drawer">
          <div className="as-drawer-scrim" onClick={() => setDrawer(false)} aria-hidden="true" />
          <aside className="as-drawer-panel" aria-label="Chats">
            <ChatList {...listProps} onClose={() => setDrawer(false)} />
          </aside>
        </div>
      )}

      <section className="as-main" aria-label="Conversation">
        <header className="as-head">
          <button type="button" className="as-icon-btn as-only-mobile" onClick={() => setDrawer(true)} aria-label="Show chats">
            <PanelLeftOpen size={18} />
          </button>
          <button type="button" className="as-icon-btn as-only-desktop" onClick={() => setListHidden(!listHidden)} aria-label={listHidden ? "Show chats" : "Hide chats"} aria-expanded={!listHidden}>
            {listHidden ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </button>
          <h1 className="as-head-title">
            {chat ? chat.title : "New chat"}
            {archivedChat && <span> (archived, read only)</span>}
          </h1>
        </header>

        <div className="as-scroll" ref={scrollRef}>
          <div className="as-thread">
            {empty ? (
              <div className="as-welcome">
                <Avatar large />
                <h2>
                  {greeting()}, {userName.split(" ")[0]}
                </h2>
                <p>Ask about leakage, HCP fatigue, data imports, memCOT roster checks or Salesforce.</p>
                <ul aria-label="Suggested questions">
                  {SUGGESTIONS.map((question) => (
                    <li key={question}>
                      <button type="button" className="as-suggest" disabled={streaming} onClick={() => ask(question)}>
                        {question}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="as-messages" role="log" aria-label="Messages" aria-live="polite" aria-relevant="additions">
                {chat.messages.map((message, index) => (
                  <ChatMessage
                    key={message.id}
                    message={message}
                    isLast={index === chat.messages.length - 1}
                    readOnly={archivedChat}
                    onRetry={regenerate}
                    onRegenerate={regenerate}
                    onFeedback={feedback}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="as-foot">
          <div className="as-foot-inner">
            {archivedChat ? (
              <p className="as-archived-note">This chat is archived. Restore it from the chat list to continue.</p>
            ) : (
              <Composer onSend={ask} onStop={() => streamRef.current?.stop()} streaming={streaming} source={source} setSource={setSource} />
            )}
            <p id="ask-help" className="as-help">
              Ask CDI can make mistakes. Check important numbers in Leakage and HCP Fatigue. Enter to send · Shift+Enter for a new line. Answering from: {sourceLabel(source)}.
            </p>
          </div>
        </div>
      </section>

      {archiving && (
        <ConfirmModal
          title={archiving.length > 1 ? `Archive ${archiving.length} chats?` : "Archive this chat?"}
          message="Archived chats are hidden from the list but kept. Restore them any time with Show archived."
          icon={<Archive size={20} />}
          confirmLabel="Archive"
          withReason
          reasonPlaceholder="e.g. Finished this analysis"
          onConfirm={confirmArchive}
          onClose={() => setArchiving(null)}
        />
      )}
    </div>
  );
}

export default Assistant;
