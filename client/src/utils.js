export const initials = (name = '') =>
  name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();

export const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

export const fmtTime = (d) => new Date(d).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });

export const fmtDateTime = (d) => `${fmtDate(d)}, ${fmtTime(d)}`;

export const placeText = (p) => `${p.officeName} · Cupboard ${p.cupboard} · Row ${p.row}`;