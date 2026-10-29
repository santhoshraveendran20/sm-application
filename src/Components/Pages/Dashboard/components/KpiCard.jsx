import { Info, TrendingDown, TrendingUp } from "lucide-react";
import useCountUp from "./useCountUp.js";

const formatCount = (value) => Math.round(value).toLocaleString("en-US");

function KpiCard({ icon, label, value, format = formatCount, hint, delta, info, tone = "teal", onClick }) {
  const Icon = icon;
  const animated = useCountUp(value);
  const Trend = delta && delta.value < 0 ? TrendingDown : TrendingUp;

  return (
    <article className={`kpi ${onClick ? "is-clickable" : ""}`}>
      {onClick && <button type="button" className="kpi-hit" onClick={onClick} aria-label={`${label}: view details`} />}
      <div className="kpi-top">
        <span className={`kpi-icon tone-${tone}`}>
          <Icon size={16} aria-hidden="true" />
        </span>
        <span className="kpi-label">{label}</span>
        {info && (
          <span className="kpi-info" title={info} role="img" aria-label={info}>
            <Info size={15} aria-hidden="true" />
          </span>
        )}
      </div>
      <strong className="kpi-value">{format(animated)}</strong>
      <div className="kpi-foot">
        {delta && (
          <span className={`kpi-delta ${delta.good ? "is-good" : "is-bad"}`}>
            <Trend size={12} aria-hidden="true" />
            {Math.abs(delta.value).toFixed(1)}%
          </span>
        )}
        {hint && <span className="kpi-hint">{hint}</span>}
      </div>
    </article>
  );
}

export default KpiCard;
