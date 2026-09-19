// Magnitude comparison -> sequential single hue per the dataviz skill (never
// categorical rainbow colors for "which is bigger", that job is identity not
// distinction). Horizontal bars keep it responsive with no rotated labels.
const SEQUENTIAL_HUE = '#2a78d6';

function BarChart({ data, unit = '', max }) {
  const maxValue = max ?? Math.max(...data.map((d) => d.value), 1);

  if (data.length === 0) {
    return <p className="chart-empty">No data yet</p>;
  }

  return (
    <div className="bar-chart">
      {data.map((d) => (
        <div className="bar-chart__row" key={d.label} title={`${d.label}: ${d.value}${unit}`}>
          <span className="bar-chart__label">{d.label}</span>
          <div className="bar-chart__track">
            <div
              className="bar-chart__fill"
              style={{ width: `${Math.max(2, (d.value / maxValue) * 100)}%`, background: SEQUENTIAL_HUE }}
            />
          </div>
          <span className="bar-chart__value">
            {d.value}
            {unit}
          </span>
        </div>
      ))}
    </div>
  );
}

export default BarChart;
