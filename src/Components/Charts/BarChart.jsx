import useChartWidth from "./useChartWidth.js";
import { buildTicks, wrapLabel } from "./chartUtils.js";
import "./charts.css";

const MARGIN = { top: 24, right: 10, bottom: 40, left: 44 };

function BarChart({ data, height = 230, format = (value) => value.toLocaleString("en-US"), ariaLabel }) {
  const [ref, width] = useChartWidth();
  const plotW = width - MARGIN.left - MARGIN.right;
  const plotH = height - MARGIN.top - MARGIN.bottom;
  const { ticks, top } = buildTicks(Math.max(1, ...data.map((item) => item.value)));
  const slot = plotW / Math.max(1, data.length);
  const barW = Math.min(72, slot * 0.62);
  const y = (value) => MARGIN.top + plotH - (value / top) * plotH;

  return (
    <div className="chart" ref={ref} style={{ height }}>
      <svg width={width} height={height} role="img" aria-label={ariaLabel}>
        {ticks.map((tick) => (
          <g key={tick}>
            <line className="chart-grid" x1={MARGIN.left} x2={width - MARGIN.right} y1={y(tick)} y2={y(tick)} />
            <text className="chart-axis" x={MARGIN.left - 8} y={y(tick) + 4} textAnchor="end">
              {format(tick)}
            </text>
          </g>
        ))}
        {data.map((item, index) => {
          const cx = MARGIN.left + slot * index + slot / 2;
          const barH = Math.max(item.value > 0 ? 2 : 0, MARGIN.top + plotH - y(item.value));
          return (
            <g key={item.label} className="chart-bar">
              <title>{`${item.label}: ${format(item.value)}`}</title>
              <rect x={cx - barW / 2} y={MARGIN.top + plotH - barH} width={barW} height={barH} rx="6" fill={item.color} />
              <text className="chart-value" x={cx} y={MARGIN.top + plotH - barH - 6} textAnchor="middle">
                {format(item.value)}
              </text>
              <text className="chart-axis" x={cx} textAnchor="middle">
                {wrapLabel(item.label).map((part, line) => (
                  <tspan key={part} x={cx} y={height - 22 + line * 13}>
                    {part}
                  </tspan>
                ))}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default BarChart;
