import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../useAuth';
import { initials } from '../utils';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'Clear', '0', 'Back'];

export default function Login() {
  const [users, setUsers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/auth/users').then((res) => setUsers(res.data));
  }, []);

  function pickUser(u) {
    setSelected(u);
    setPin('');
    setError('');
  }

  function press(key) {
    setError('');
    if (key === 'Clear') setPin('');
    else if (key === 'Back') setPin((p) => p.slice(0, -1));
    else setPin((p) => (p.length < 4 ? p + key : p));
  }

  async function submit() {
    try {
      const res = await api.post('/auth/login', { userId: selected._id, pin });
      login(res.data.token, res.data.user);
      navigate(res.data.user.role === 'BOSS' ? '/dashboard' : '/');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not log in');
      setPin('');
    }
  }

  return (
    <div className="login">
      <section>
        <h1>Office Desk</h1>
        <p className="hint">Tap your name</p>
        <div className="tiles">
          {users.map((u) => (
            <button
              key={u._id}
              className={`tile ${selected?._id === u._id ? 'selected' : ''}`}
              onClick={() => pickUser(u)}
            >
              <span className="avatar">{initials(u.fullName)}</span>
              <strong>{u.shortName}</strong>
              <small>{u.role === 'BOSS' ? 'Boss' : 'Staff'}</small>
            </button>
          ))}
        </div>
      </section>

      {selected && (
        <section className="card">
          <h2>Hello, {selected.shortName}</h2>
          <p className="hint">Enter your 4-digit PIN</p>

          <div className="dots">
            {[0, 1, 2, 3].map((i) => (
              <span key={i} className={i < pin.length ? 'dot filled' : 'dot'} />
            ))}
          </div>

          {error && <p className="error">{error}</p>}

          <div className="keypad">
            {KEYS.map((k) => (
              <button key={k} onClick={() => press(k)}>{k}</button>
            ))}
          </div>

          <button className="btn-primary" disabled={pin.length !== 4} onClick={submit}>
            Log in
          </button>
        </section>
      )}
    </div>
  );
}