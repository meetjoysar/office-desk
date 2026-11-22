import { useState } from 'react';
import StaffSettings from '../components/settings/StaffSettings';
import StorageSettings from '../components/settings/StorageSettings';
import TypeSettings from '../components/settings/TypeSettings';

const TABS = [['staff', 'Staff & PINs'], ['storage', 'Storage places'], ['DOC', 'Document list'], ['TASK', 'Work types']];

export default function Settings() {
  const [tab, setTab] = useState('staff');

  return (
    <>
      <h1>Settings</h1>
      <div className="chips">
        {TABS.map(([key, label]) => (
          <button key={key} className={`chip ${tab === key ? 'selected' : ''}`} onClick={() => setTab(key)}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'staff' && <StaffSettings />}
      {tab === 'storage' && <StorageSettings />}
      {(tab === 'DOC' || tab === 'TASK') && <TypeSettings key={tab} kind={tab} />}
    </>
  );
}