import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../useAuth';
import { initials } from '../utils';

export default function TopBar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [unread, setUnread] = useState(0);

  // Refresh the count on every page change and every minute
  useEffect(() => {
    const load = () =>
      api
        .get('/notifications/count')
        .then((res) => setUnread(res.data.unread))
        .catch(() => {});
    load();
    const timer = setInterval(load, 60000);
    return () => clearInterval(timer);
  }, [location.pathname]);

  const common = [
    ['/inward', 'Inward'],
    ['/outward', 'Outward'],
    ['/documents', 'Documents'],
  ];
  const links =
    user.role === 'BOSS'
      ? [
          ['/dashboard', 'Dashboard'],
          ['/', 'My Work'],
          ['/tasks', 'All tasks'],
          ...common,
          ['/clients', 'Clients'],
          ['/settings', 'Settings'],
        ]
      : [['/', 'My Work'], ...common];

  return (
    <header className="topbar">
      <div className="brand">
        <span className="logo">OD</span> Office Desk
      </div>
      <nav>
        {links.map(([to, label]) => (
          <NavLink key={to} to={to} end>
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="me">
        <Link to="/notifications" className="bell" aria-label={`Notifications, ${unread} unread`}>
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.7 21a2 2 0 0 1-3.4 0" />
          </svg>
          {unread > 0 && <span className="badge">{unread}</span>}
        </Link>
        <span className="avatar small">{initials(user.fullName)}</span>
        {user.shortName}
        <button onClick={logout}>Switch user</button>
      </div>
    </header>
  );
}