import { useEffect, useState } from 'react';
import api from '../api';
import { fmtDateTime } from '../utils';

const EMAIL = {
  smtp: 'Email is set up',
  test: 'Email goes to a test inbox (Ethereal)',
  off: 'Email reminders are not set up',
};

export default function RemindersPanel() {
  const [status, setStatus] = useState(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    api.get('/notifications/status').then((res) => setStatus(res.data));
  }, [refreshKey]);

  async function act(action) {
    setBusy(true);
    setMessage('');
    try {
      setMessage(await action());
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Something went wrong');
    }
    setBusy(false);
  }

  const runNow = () =>
    act(async () => {
      const { data } = await api.post('/notifications/run');
      return `Done: ${data.created} new reminders, ${data.emailed} emails sent.`;
    });

  const testEmail = () =>
    act(async () => {
      const { data } = await api.post('/notifications/test-email');
      return data.preview
        ? `Test email sent. Preview: ${data.preview}`
        : 'Test email sent. Check your inbox.';
    });

  if (!status) return null;

  return (
    <section className="card reminders">
      <div className="row-between">
        <div>
          <strong>Reminders run every day at 9:00 AM.</strong>
          <div className="hint">
            {EMAIL[status.email]} · Last run:{' '}
            {status.lastRun
              ? `${fmtDateTime(status.lastRun.at)} (${status.lastRun.created} new)`
              : 'not since the server started'}
          </div>
        </div>
        <div className="chips">
          <button className="btn-small" disabled={busy} onClick={runNow}>
            Run reminders now
          </button>
          <button
            className="btn-small"
            disabled={busy || status.email === 'off'}
            onClick={testEmail}
          >
            Send test email
          </button>
        </div>
      </div>
      {message && <p className="success">{message}</p>}
    </section>
  );
}