import { NavLink } from 'react-router-dom';
import { useAuth } from '../useAuth';
import { initials } from '../utils';

export default function TopBar() {
  const { user, logout } = useAuth();
  const links =
    user.role === 'BOSS'
      ? [['/dashboard', 'Dashboard'], ['/', 'My Work'], ['/clients', 'Clients']]
      : [['/', 'My Work']];

  return (
    <header className="topbar">
      <div className="brand"><span className="logo">OD</span> Office Desk</div>
      <nav>
        {links.map(([to, label]) => (
          <NavLink key={to} to={to} end>{label}</NavLink>
        ))}
      </nav>
      <div className="me">
        <span className="avatar small">{initials(user.fullName)}</span>
        {user.shortName}
        <button onClick={logout}>Switch user</button>
      </div>
    </header>
  );
}