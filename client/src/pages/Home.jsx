import { useEffect, useState } from 'react';
import api from '../api';
import { useAuth } from '../useAuth';

export default function Home({ title }) {
  const { logout } = useAuth();
  const [me, setMe] = useState(null);

  useEffect(() => {
    api.get('/auth/me').then((res) => setMe(res.data)).catch(logout);
  }, [logout]);

  return (
    <div className="card">
      <h1>{title}</h1>
      {me && <p>Logged in as <strong>{me.fullName}</strong> ({me.role})</p>}
      <p className="hint">This screen comes in a later part.</p>
    </div>
  );
}