import { CATEGORICAL } from '../../utils/chartColors';

const GAP_DEGREES = 1.5;

// A true pie chart: filled wedges from the center, not a ring. Slices get a
// small angular gap (the mark-separation spacer) instead of a border stroke,
// per the dataviz skill - "never draw a border around a mark to separate it."
function DonutChart({ data, size = 160, emptyLabel = 'No data yet' }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const radius = size / 2 - 2;
  const center = size / 2;

  if (total === 0) {
    return (
      <div className="donut-chart donut-chart--empty" style={{ width: size, height: size }}>
        {emptyLabel}
      </div>
    );
  }

  const toRad = (deg) => (deg * Math.PI) / 180;
  const { segments } = data.filter((d) => d.value > 0).reduce(
    (acc, d, i) => {
      const fraction = d.value / total;
      const angle = fraction * 360;
      const hasGap = data.filter((x) => x.value > 0).length > 1;
      const startAngle = acc.cursor + (hasGap ? GAP_DEGREES / 2 : 0);
      const endAngle = acc.cursor + angle - (hasGap ? GAP_DEGREES / 2 : 0);

      const x1 = center + radius * Math.cos(toRad(startAngle));
      const y1 = center + radius * Math.sin(toRad(startAngle));
      const x2 = center + radius * Math.cos(toRad(endAngle));
      const y2 = center + radius * Math.sin(toRad(endAngle));
      const largeArc = endAngle - startAngle > 180 ? 1 : 0;

      const color = d.color || CATEGORICAL[i % CATEGORICAL.length];
      const path = `M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;

      acc.segments.push({ ...d, color, path, percentage: Math.round(fraction * 1000) / 10 });
      acc.cursor += angle;
      return acc;
    },
    { cursor: -90, segments: [] }
  );

  return (
    <div className="donut-chart">
      <div className="donut-chart__figure">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Pie chart">
          {segments.map((seg) => (
            <path key={seg.label} d={seg.path} fill={seg.color}>
              <title>{`${seg.label}: ${seg.value} (${seg.percentage}%)`}</title>
            </path>
          ))}
        </svg>
        <span className="donut-chart__total-caption">Total: {total}</span>
      </div>
      <ul className="donut-chart__legend">
        {segments.map((seg) => (
          <li key={seg.label}>
            <span className="donut-chart__swatch" style={{ background: seg.color }} />
            <span className="donut-chart__legend-label">{seg.label}</span>
            <span className="donut-chart__legend-value">
              {seg.value} ({seg.percentage}%)
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default DonutChart;
