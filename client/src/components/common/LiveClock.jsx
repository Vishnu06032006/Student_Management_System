import { useEffect, useState } from 'react';

const DATE_FORMAT = { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' };
const TIME_FORMAT = { hour: '2-digit', minute: '2-digit', second: '2-digit' };

function LiveClock() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="live-clock">
      <span className="live-clock__date">{now.toLocaleDateString(undefined, DATE_FORMAT)}</span>
      <span className="live-clock__time">{now.toLocaleTimeString(undefined, TIME_FORMAT)}</span>
    </div>
  );
}

export default LiveClock;
