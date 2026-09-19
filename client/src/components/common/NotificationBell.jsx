import { useEffect, useRef, useState } from 'react';
import { FiBell } from 'react-icons/fi';
import * as notificationService from '../../services/notificationService';

function timeAgo(dateStr) {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const containerRef = useRef(null);

  const load = () => {
    notificationService.listNotifications().then(({ data }) => {
      setItems(data.data.items);
      setUnreadCount(data.data.unreadCount);
    });
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const toggleOpen = () => setOpen((v) => !v);

  const markAllRead = async () => {
    await notificationService.markAllNotificationsRead();
    load();
  };

  const markOneRead = async (id) => {
    await notificationService.markNotificationRead(id);
    load();
  };

  return (
    <div className="notification-bell" ref={containerRef}>
      <button type="button" className="icon-button" onClick={toggleOpen} aria-label="Notifications">
        <FiBell />
        {unreadCount > 0 && <span className="notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
      </button>

      {open && (
        <div className="notification-panel">
          <div className="notification-panel__header">
            <span>Notifications</span>
            {unreadCount > 0 && (
              <button type="button" onClick={markAllRead}>
                Mark all read
              </button>
            )}
          </div>
          <div className="notification-panel__list">
            {items.length === 0 && <div className="notification-panel__empty">No notifications yet.</div>}
            {items.map((n) => (
              <button
                type="button"
                key={n._id}
                className={`notification-item ${n.read ? '' : 'is-unread'}`}
                onClick={() => markOneRead(n._id)}
              >
                <div className="notification-item__title">{n.title}</div>
                <div className="notification-item__message">{n.message}</div>
                <div className="notification-item__time">{timeAgo(n.createdAt)}</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
