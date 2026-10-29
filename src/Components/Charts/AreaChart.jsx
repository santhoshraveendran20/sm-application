import { useId, useState } from "react";
import useChartWidth from "./useChartWidth.js";
import { buildTicks, safeId } from "./chartUtils.js";
import "./charts.css";

const MARGIN = { top: 14, right: 16, bottom: 28, left: 46 };

function AreaChart({ data, height = 230, color = "var(--chart-teal)", unit = "", format = (value) => value, ariaLabel }) {
  const [ref, width] = useChartWidth();
  const [hover, setHover] = useState(null);
  const gradientId = `area-${safeId(useId())}`;

  const plotW = width - MARGIN.left - MARGIN.right;
  const plotH = height - MARGIN.top - MARGIN.bottom;
  const { ticks, top } = buildTicks(Math.max(1, ...data.map((point) => point.value)));
  const x = (index) => MARGIN.left + (data.length > 1 ? (index / (data.length - 1)) * plotW : plotW / 2);
  const y = (value) => MARGIN.top + plotH - (value / top) * plotH;

  const line = data.map((point, index) => `${index ? "L" : "M"}${x(index).toFixed(1)},${y(point.value).toFixed(1)}`).join(" ");
  const area = `${line} L${x(data.length - 1).toFixed(1)},${MARGIN.top + plotH} L${x(0).toFixed(1)},${MARGIN.top + plotH} Z`;
  const labelEvery = Math.max(1, Math.ceil(data.length / Math.max(1, Math.floor(plotW / 64))));

  const handleMove = (event) => {
    const box = event.currentTarget.getBoundingClientRect();
    const position = event.clientX - box.left - MARGIN.left;
    const index = Math.round((position / plotW) * (data.length - 1));
    setHover(Math.min(data.length - 1, Math.max(0, index)));
  };

  const active = hover === null ? null : data[hover];

  return (
    <div className="chart" ref={ref} style={{ height }}>
      <svg width={width} height={height} role="img" aria-label={ariaLabel} onMouseMove={handleMove} onMouseLeave={() => setHover(null)}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.25" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {ticks.map((tick) => (
          <g key={tick}>
            <line className="chart-grid" x1={MARGIN.left} x2={width - MARGIN.right} y1={y(tick)} y2={y(tick)} />
            <text className="chart-axis" x={MARGIN.left - 8} y={y(tick) + 4} textAnchor="end">
              {format(tick)}
              {unit}
            </text>
          </g>
        ))}
        {data.map((point, index) =>
          index % labelEvery === 0 ? (
            <text key={point.label} className="chart-axis" x={x(index)} y={height - 8} textAnchor="middle">
              {point.label}
            </text>
          ) : null
        )}
        <path d={area} fill={`url(#${gradientId})`} />
        <path d={line} fill="none" stroke={color} strokeWidth="2.25" strokeLinejoin="round" strokeLinecap="round" />
        {data.length > 0 && <circle className="chart-dot" cx={x(data.length - 1)} cy={y(data[data.length - 1].value)} r="4.5" fill={color} />}
        {active && (
          <g>
            <line className="chart-cursor" x1={x(hover)} x2={x(hover)} y1={MARGIN.top} y2={MARGIN.top + plotH} />
            <circle className="chart-dot" cx={x(hover)} cy={y(active.value)} r="5" fill={color} />
          </g>
        )}
      </svg>
      {active && (
        <div className="chart-tip" style={{ left: Math.min(width - 90, Math.max(0, x(hover) - 40)), top: Math.max(0, y(active.value) - 54) }} role="status">
          <span>{active.label}</span>
          <strong>
            {format(active.value)}
            {unit}
          </strong>
        </div>
      )}
    </div>
  );
}

export default AreaChart;
