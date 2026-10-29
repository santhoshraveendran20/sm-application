import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Check, Copy, Database, RefreshCw, SearchX, ThumbsDown, ThumbsUp, TriangleAlert } from "lucide-react";
import { formatTime } from "../../common/formatters.js";
import { sourceLabel } from "./askData.js";
import mark from "../../../images/Logo/srmtech-mark.png";

export function Avatar({ large = false }) {
  return (
    <span className={`as-avatar ${large ? "is-large" : ""}`} aria-hidden="true">
      <img src={mark} alt="" />
    </span>
  );
}

function BarChart({ chart }) {
  const max = Math.max(1, ...chart.data.map((item) => item.value));
  return (
    <figure className="as-chart">
      <figcaption>{chart.label}</figcaption>
      <ul aria-label={chart.data.map((item) => `${item.label} ${item.value}`).join(", ")}>
        {chart.data.map((item, index) => (
          <li key={item.label}>
            <span className="as-chart-label">{item.label}</span>
            <span className="as-chart-track">
              <span className={`as-chart-bar tone-${chart.tones?.[index] || "teal"}`} style={{ width: `${(item.value / max) * 100}%` }} />
            </span>
            <span className="as-chart-value">{item.value.toLocaleString("en-US")}</span>
          </li>
        ))}
      </ul>
    </figure>
  );
}

function ChatMessage({ message, isLast, readOnly, onRetry, onRegenerate, onFeedback }) {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  if (message.role === "user") {
    return (
      <div className="as-msg as-user">
        <div>
          <p className="as-bubble">{message.text}</p>
          <p className="as-time">
            <span className="sr-only">You, </span>
            {formatTime(new Date(message.at))}
          </p>
        </div>
      </div>
    );
  }

  const live = message.status === "thinking" || message.status === "streaming";
  const finished = message.status === "done" || message.status === "stopped";

  const copy = async () => {
    const tableText = message.table ? `\n\n${[message.table.columns, ...message.table.rows].map((row) => row.join("\t")).join("\n")}` : "";
    try {
      await navigator.clipboard.writeText(message.text + tableText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="as-msg as-bot">
      <Avatar />
      <div className="as-bot-body">
        <p className="as-meta">
          <b>Ask CDI</b>
          {message.at && <span>{formatTime(new Date(message.at))}</span>}
        </p>

        {message.status === "thinking" && (
          <p className="as-thinking" role="status">
            <span className="as-dots" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
            Choosing the right data and thinking…
          </p>
        )}

        {message.status === "error" && (
          <div className="as-error" role="alert">
            <p>
              <TriangleAlert size={16} aria-hidden="true" />
              <b>I couldn’t answer that</b>
            </p>
            <p>{message.error}</p>
            {!readOnly && (
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => onRetry(message)}>
                <RefreshCw size={15} aria-hidden="true" />
                Try again
              </button>
            )}
          </div>
        )}

        {(message.text || message.status === "stopped") && message.status !== "error" && (
          <div className={`as-answer ${message.noData ? "is-nodata" : ""} ${message.table || message.chart ? "has-data" : ""}`}>
            {message.noData && !message.unknown && <SearchX size={16} aria-hidden="true" className="as-answer-icon" />}
            <p className="as-text">
              {message.text}
              {message.status === "streaming" && <span className="as-caret" aria-hidden="true" />}
            </p>
            {message.status === "stopped" && <p className="as-stopped">{message.text ? "Stopped. The answer above is incomplete." : "Stopped before an answer was ready."}</p>}

            {message.status === "done" && message.chart && <BarChart chart={message.chart} />}

            {message.status === "done" && message.table && (
              <div className="as-table-wrap" tabIndex={0} role="region" aria-label="Answer table">
                <table className="as-table">
                  <thead>
                    <tr>
                      {message.table.columns.map((column) => (
                        <th key={column} scope="col">
                          {column}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {message.table.rows.map((row, rowIndex) => (
                      <tr key={rowIndex}>
                        {row.map((cell, cellIndex) => (
                          <td key={cellIndex}>{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {message.status === "done" && message.links?.length > 0 && (
              <div className="as-links">
                {message.links.map((link) => (
                  <button key={link.label} type="button" className="btn btn-secondary btn-sm" onClick={() => navigate(link.to)}>
                    {link.label}
                    <ArrowRight size={14} aria-hidden="true" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {finished && (
          <div className="as-actions">
            {message.source && (
              <span className="as-source">
                <Database size={12} aria-hidden="true" />
                {sourceLabel(message.source)}
                {message.citation ? ` · ${message.citation}` : ""}
              </span>
            )}
            <button type="button" className="as-act" onClick={copy} aria-label="Copy answer">
              {copied ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
              {copied ? "Copied" : "Copy"}
            </button>
            {!readOnly && (
              <>
                <button type="button" className={`as-act as-act-icon ${message.feedback === "up" ? "is-up" : ""}`} onClick={() => onFeedback(message, "up")} aria-pressed={message.feedback === "up"} aria-label="Helpful">
                  <ThumbsUp size={14} />
                </button>
                <button type="button" className={`as-act as-act-icon ${message.feedback === "down" ? "is-down" : ""}`} onClick={() => onFeedback(message, "down")} aria-pressed={message.feedback === "down"} aria-label="Not helpful">
                  <ThumbsDown size={14} />
                </button>
                {isLast && (
                  <button type="button" className="as-act" onClick={() => onRegenerate(message)}>
                    <RefreshCw size={14} aria-hidden="true" />
                    Regenerate
                  </button>
                )}
              </>
            )}
          </div>
        )}

        {live && (
          <span className="sr-only" aria-live="polite">
            {message.status === "streaming" ? "Ask CDI is answering" : ""}
          </span>
        )}
      </div>
    </div>
  );
}

export default ChatMessage;
