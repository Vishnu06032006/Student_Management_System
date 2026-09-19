import { useEffect, useState } from 'react';
import PageHeader from '../components/common/PageHeader';
import Badge from '../components/common/Badge';
import * as announcementService from '../services/announcementService';

const PRIORITY_TONE = { NORMAL: 'INFO', IMPORTANT: 'ON_LEAVE', URGENT: 'SUSPENDED' };

function Announcements() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    announcementService
      .listAnnouncements()
      .then(({ data }) => setItems(data.data.items))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <PageHeader title="Announcements" subtitle="Notices relevant to you" />

      {loading && <p>Loading...</p>}
      {!loading && items.length === 0 && <p>No announcements right now.</p>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {items.map((a) => (
          <div key={a._id} className="page-card announcement-card">
            <div className="announcement-card__header">
              <h2>{a.title}</h2>
              <Badge value={PRIORITY_TONE[a.priority] || 'INFO'} label={a.priority} />
            </div>
            <p>{a.message}</p>
            <p className="announcement-card__date">{new Date(a.publishDate).toLocaleString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Announcements;
