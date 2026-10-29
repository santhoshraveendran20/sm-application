import "./charts.css";

function HorizontalBarList({ items, onPick, columns = 1 }) {
  const max = Math.max(1, ...items.map((item) => item.value));

  return (
    <ul className={`hbar-list ${columns > 1 ? "is-two-col" : ""}`}>
      {items.map((item) => (
        <li key={item.key}>
          <button type="button" className="hbar-row" disabled={!onPick} onClick={() => onPick?.(item.key)} title={item.title}>
            <span className="hbar-label">{item.key}</span>
            <span className="hbar-track">
              <span className="hbar-fill" style={{ width: `${(item.value / max) * 100}%` }} />
            </span>
            <span className="hbar-value">
              {item.value.toLocaleString("en-US")} <small>{item.share.toFixed(1)}%</small>
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

export default HorizontalBarList;
