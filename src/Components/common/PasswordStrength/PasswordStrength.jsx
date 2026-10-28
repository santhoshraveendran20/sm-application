import { Check } from "lucide-react";
import { evaluatePassword, strengthLabels } from "../passwordUtils.js";
import "./passwordstrength.css";

const SEGMENTS = [1, 2, 3, 4];

function PasswordStrength({ password, username }) {
  const { results, score } = evaluatePassword(password, username);

  return (
    <div className={`pw-strength score-${score}`}>
      <div className="pw-strength-head">
        <div className="pw-strength-bars" aria-hidden="true">
          {SEGMENTS.map((segment) => (
            <span key={segment} className={`pw-strength-bar ${segment <= score ? "filled" : ""}`} />
          ))}
        </div>
        <span className="pw-strength-label" aria-live="polite">
          {score ? strengthLabels[score] : "—"}
        </span>
      </div>
      <ul className="pw-rules">
        {results.map((rule) => (
          <li key={rule.id} className={`pw-rule ${rule.met ? "met" : ""}`}>
            <span className="pw-rule-mark" aria-hidden="true">
              {rule.met ? <Check size={11} strokeWidth={3} /> : null}
            </span>
            <span>{rule.label}</span>
            <span className="sr-only">{rule.met ? "(met)" : "(not met)"}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default PasswordStrength;
