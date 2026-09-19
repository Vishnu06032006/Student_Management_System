const TONE_BY_VALUE = {
  ENABLED: 'success',
  ACTIVE: 'success',
  DISABLED: 'danger',
  INACTIVE: 'muted',
  LOCKED: 'warning',
  ON_LEAVE: 'warning',
  SUSPENDED: 'danger',
  GRADUATED: 'info',
  TRANSFERRED: 'muted',
  RESIGNED: 'muted',
  RETIRED: 'muted',
  PRESENT: 'success',
  LATE: 'warning',
  ABSENT: 'danger',
  EXCUSED: 'muted',
  ON_DUTY: 'info',
  UPCOMING: 'muted',
  NOT_MARKED: 'muted',
  URGENT: 'danger',
  IMPORTANT: 'warning',
  NORMAL: 'muted',
  PENDING: 'warning',
  APPROVED: 'success',
  REJECTED: 'danger',
};

function Badge({ value, label }) {
  const tone = TONE_BY_VALUE[value] || 'muted';
  return <span className={`badge badge--${tone}`}>{label || value}</span>;
}

export default Badge;
