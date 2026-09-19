function toneFor(value) {
  if (value >= 75) return 'success';
  if (value >= 40) return 'warning';
  return 'danger';
}

function PercentBar({ value }) {
  return (
    <div className="percent-bar" title={`${value}%`}>
      <div className={`percent-bar__fill percent-bar__fill--${toneFor(value)}`} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
      <span className="percent-bar__label">{value}%</span>
    </div>
  );
}

export default PercentBar;
