import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import api from '../api';
import OwnerDialog from './OwnerDialog';
import { registerOwnerHistoryGuard } from '../utils/ownerHistoryGuard';
import { ABOUT_NUMBERS, aboutNumber, setCurrentLeader, validateAboutSettings } from '../utils/aboutContent';
import './AboutPageManager.css';

const resources = {
  settings: ['/about-settings', '/admin/about-settings', 'data'],
  leaders: ['/about-leadership-roster', '/admin/about-leadership-roster', 'roster'],
  photos: ['/about-leadership-photos'],
  milestones: ['/about-accomplishments', '/admin/about-accomplishments', 'entries'],
  culture: ['/about-pageant-queens', '/admin/about-pageant-queens', 'queens']
};
const groups = [['intro', 'Overview & purpose', 'settings'], ['facts', 'Facts & tourism', 'settings'], ['leaders', 'Leadership & photos', 'leaders'], ['milestones', 'Milestones', 'milestones'], ['culture', 'Miss Naujan', 'culture']];
const copy = value => JSON.parse(JSON.stringify(value));

export default function AboutPageManager({ leaveGuard }) {
  const [data, setData] = useState({}), [errors, setErrors] = useState({}), [messages, setMessages] = useState({});
  const [tab, setTab] = useState('intro'), [busy, setBusy] = useState(false), [pending, setPending] = useState(null), [query, setQuery] = useState('');
  const baseline = useRef({}), currentData = useRef(data), writing = useRef(false), mounted = useRef(false), requests = useRef({});
  const position = useRef(window.history.state?.idx), restoring = useRef(false), allowed = useRef(false);
  const [historyBusy, setHistoryBusy] = useState(false);
  currentData.current = data;
  const dirty = Object.keys(baseline.current).some(key => key !== 'photos' && JSON.stringify(data[key]) !== JSON.stringify(baseline.current[key]));
  const load = async key => {
    const request = (requests.current[key] || 0) + 1; requests.current[key] = request;
    setErrors(previous => ({ ...previous, [key]: '' }));
    try {
      const { data: value } = await api.get(resources[key][0]);
      if (['leaders', 'milestones', 'culture'].includes(key) ? !Array.isArray(value) : !value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid About response');
      if (key === 'settings' && !Array.isArray(value.mission_text?.points)) throw new Error('Invalid mission content');
      if (mounted.current && requests.current[key] === request) { baseline.current[key] = copy(value); setData(previous => ({ ...previous, [key]: value })); }
    } catch (error) { if (mounted.current && requests.current[key] === request) setErrors(previous => ({ ...previous, [key]: error.response?.data?.error || 'Could not load this content. Retry before editing; no replacement content has been saved.' })); }
  };
  useEffect(() => { mounted.current = true; Object.keys(resources).forEach(load); return () => { mounted.current = false; Object.keys(requests.current).forEach(key => { requests.current[key] += 1; }); }; }, []);
  const discard = () => { setData(copy(baseline.current)); setMessages({}); };
  const requestLeave = action => {
    if (writing.current || historyBusy) { setMessages(previous => ({ ...previous, navigation: 'Please wait for the save, upload or navigation to finish.' })); return; }
    if (dirty) setPending({ title: 'Discard unsaved About changes?', description: 'Only your unsaved edits will be discarded. Published content and uploaded photos are not deleted.', run: () => { discard(); action(); } });
    else action();
  };
  useLayoutEffect(() => { leaveGuard.current = requestLeave; return () => { leaveGuard.current = action => action(); }; });
  useEffect(() => { const warn = event => { if (dirty || busy) { event.preventDefault(); event.returnValue = ''; } }; window.addEventListener('beforeunload', warn); return () => window.removeEventListener('beforeunload', warn); }, [dirty, busy]);
  useLayoutEffect(() => registerOwnerHistoryGuard(event => {
    if (restoring.current) { restoring.current = false; setHistoryBusy(false); event.stopImmediatePropagation(); return; }
    if (allowed.current) { allowed.current = false; position.current = window.history.state?.idx; return; }
    if (!dirty && !writing.current) { position.current = window.history.state?.idx; return; }
    const next = window.history.state?.idx, previous = position.current;
    if (!Number.isInteger(next) || !Number.isInteger(previous) || next === previous) return;
    const delta = next - previous; event.stopImmediatePropagation(); restoring.current = true; setHistoryBusy(true); window.history.go(-delta);
    if (writing.current) return;
    setPending({ title: 'Discard unsaved About changes?', description: 'Keep editing to retain your draft, or discard it and continue navigating.', run: () => { discard(); allowed.current = true; window.history.go(delta); } });
  }), [dirty, busy]);
  const update = (key, value) => { setData(previous => ({ ...previous, [key]: value })); setMessages(previous => ({ ...previous, [key]: '' })); };
  const save = async (key, confirmed = false) => {
    if (writing.current || !Object.hasOwn(baseline.current, key)) return;
    const value = copy(currentData.current[key]);
    let validation = [];
    if (key === 'settings') validation = validateAboutSettings(value);
    if (key === 'leaders') {
      if (value.some(item => !item.name?.trim() || !item.term?.trim() || item.name.length > 150 || item.term.length > 80)) validation.push('Every leader needs a name (up to 150 characters) and term (up to 80 characters).');
      for (const role of ['mayor', 'vice-mayor']) if (value.filter(item => item.role === role && item.current).length > 1) validation.push('Choose at most one current official per role.');
    }
    if (key === 'milestones' && value.some(item => !item.title?.trim() || !item.date?.trim() || !item.description?.trim() || item.title.length > 180 || item.description.length > 500 || item.date.length > 80)) validation.push('Each milestone needs a date, title (up to 180 characters), and description (up to 500 characters).');
    if (key === 'culture' && value.some(item => !item.name?.trim() || item.name.length > 150 || !Number.isInteger(Number(item.year)) || Number(item.year) < 1 || Number(item.year) > 9999)) validation.push('Every Miss Naujan entry needs a name and a valid year.');
    if (validation.length) { setMessages(previous => ({ ...previous, [key]: validation.join(' ') })); return; }
    if (Array.isArray(value) && !value.length && baseline.current[key]?.length && !confirmed) { setPending({ title: 'Publish an empty list?', description: 'This removes every entry in this list from the public page. Other sections and uploaded files are retained.', run: () => save(key, true) }); return; }
    if (key === 'settings') ABOUT_NUMBERS.forEach(([field]) => { value[field] = Number(value[field]); });
    writing.current = true; setBusy(true); setMessages(previous => ({ ...previous, [key]: '' }));
    try {
      const response = await api.put(resources[key][1], value);
      if (response.data?.success !== true) throw new Error('Save was not confirmed');
      const saved = response.data[resources[key][2]] ?? value;
      baseline.current[key] = copy(saved); setData(previous => ({ ...previous, [key]: saved })); setMessages(previous => ({ ...previous, [key]: 'Saved. These changes are now public.' }));
      window.dispatchEvent(new CustomEvent('naujan:settings-updated', { detail: { key: resources[key][0].slice(1), data: saved } }));
    } catch (error) { setMessages(previous => ({ ...previous, [key]: error.response?.data?.error || 'Save failed. Your edits are retained; please retry.' })); }
    finally { writing.current = false; setBusy(false); }
  };
  const upload = async (key, item, file) => {
    if (!file || writing.current) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 10 * 1024 * 1024) { setMessages(previous => ({ ...previous, [key]: 'Choose a JPEG, PNG or WebP image up to 10 MB.' })); return; }
    if (key === 'leaders' && (!item.name.trim() || !item.term.trim())) { setMessages(previous => ({ ...previous, [key]: 'Enter the leader name and term before uploading a portrait.' })); return; }
    writing.current = true; setBusy(true);
    const form = new FormData();
    const leaderKey = `${item.role}:${item.name}:${item.term}`;
    if (key === 'leaders') form.append('leaderKey', leaderKey);
    else { form.append(key === 'culture' ? 'queenId' : 'entryId', item.id); form.append('section', key === 'culture' ? 'pageant' : 'accomplishments'); }
    // Multer chooses the destination as it receives the file part, so the
    // section metadata must precede the file, not follow it.
    form.append('file', file);
    try {
      const response = await api.post(key === 'leaders' ? '/admin/leader-photo' : key === 'culture' ? '/admin/about/pageant-photo' : '/admin/about/accomplishment-image', form);
      const url = response.data?.photoUrl || response.data?.imageUrl;
      if (typeof url !== 'string' || !url) throw new Error('No uploaded image URL');
      if (key === 'leaders') { const photos = { ...currentData.current.photos, [leaderKey]: url }; baseline.current.photos = copy(photos); setData(previous => ({ ...previous, photos })); }
      else {
        const field = key === 'culture' ? 'photo' : 'imageUrl';
        baseline.current[key] = baseline.current[key].map(entry => entry.id === item.id ? { ...entry, [field]: url } : entry);
        setData(previous => ({ ...previous, [key]: previous[key].map(entry => entry.id === item.id ? { ...entry, [field]: url } : entry) }));
      }
      setMessages(previous => ({ ...previous, [key]: 'Image uploaded. Existing published entries update immediately. Save this list to publish any new entries or text edits.' }));
    } catch (error) { setMessages(previous => ({ ...previous, [key]: error.response?.data?.error || 'Upload failed. Your text edits are retained.' })); }
    finally { writing.current = false; setBusy(false); }
  };
  const resource = groups.find(group => group[0] === tab)[2];
  const settings = data.settings;
  const field = (label, key, multiline = false) => <label key={key}>{label}{multiline ? <textarea rows={5} value={settings[key] ?? ''} onChange={event => update('settings', { ...settings, [key]: event.target.value })} /> : <input value={settings[key] ?? ''} onChange={event => update('settings', { ...settings, [key]: event.target.value })} />}</label>;
  const list = data[resource] || [];
  const editEntry = (id, patch) => update(resource, list.map(item => item.id === id ? { ...item, ...patch } : item));
  const move = (id, delta) => { const index = list.findIndex(item => item.id === id), next = [...list]; if (index + delta < 0 || index + delta >= list.length) return; [next[index], next[index + delta]] = [next[index + delta], next[index]]; update(resource, next); };
  const publicPath = resource === 'leaders' ? '/about/leadership' : resource === 'milestones' ? '/about/accomplishments' : resource === 'culture' ? '/about/culture' : tab === 'facts' ? '/about/quick-facts' : '/about/overview';
  return <section className="about-manager" aria-label="About page management">
    <header className="about-manager-heading"><div><p className="about-manager-eyebrow">Website content</p><h1 className="gov-page-title">About Us management</h1><p>Make one focused change at a time. Saving publishes the selected content group; there is no separate approval step.</p></div><a href={publicPath} target="_blank" rel="noopener noreferrer">View published page ↗</a></header>
    <div className="about-manager-state" role="status">{busy ? 'Saving or uploading…' : dirty ? 'You have unsaved changes.' : 'No unsaved changes.'} {messages.navigation}</div>
    <nav className="about-manager-tabs" aria-label="About content groups">{groups.map(([id, label]) => <button key={id} type="button" aria-pressed={id === tab} disabled={busy} onClick={() => { setTab(id); setQuery(''); }}>{label}</button>)}</nav>
    {errors[resource] ? <p className="about-manager-error" role="alert">{errors[resource]} <button type="button" onClick={() => load(resource)}>Retry content</button></p> : !Object.hasOwn(data, resource) ? <p role="status">Loading saved content…</p> : <>
      <div className="about-manager-toolbar"><p>{resource === 'settings' ? 'Overview, vision, facts and historical tourism figures save together. Other lists save separately.' : 'List changes remain a draft until saved. Photo uploads update existing public entries immediately.'}</p><button type="button" className="gov-btn-primary" disabled={busy} onClick={() => save(resource)}>Save {resource === 'settings' ? 'page content' : resource === 'leaders' ? 'leadership' : resource === 'culture' ? 'Miss Naujan' : 'milestones'}</button></div>
      {messages[resource] && <p className="about-manager-feedback" role={/^(Saved\.|Image uploaded\.)/.test(messages[resource]) ? 'status' : 'alert'}>{messages[resource]}</p>}
      <fieldset disabled={busy}>
        {resource === 'settings' && <div className="about-manager-columns"><div className="gov-glass-panel">
          {tab === 'intro' ? <>{field('Overview text', 'overview_text', true)}{field('Vision text', 'vision_text', true)}<h2>Mission points</h2>{settings.mission_text.points.map((point, index) => <div className="about-manager-mission" key={index}><label>Mission point {index + 1}<textarea rows={2} value={point} onChange={event => update('settings', { ...settings, mission_text: { ...settings.mission_text, points: settings.mission_text.points.map((text, i) => i === index ? event.target.value : text) } })} /></label><button type="button" onClick={() => update('settings', { ...settings, mission_text: { ...settings.mission_text, points: settings.mission_text.points.filter((_, i) => i !== index) } })}>Remove point {index + 1}</button></div>)}<button type="button" onClick={() => update('settings', { ...settings, mission_text: { ...settings.mission_text, points: [...settings.mission_text.points, ''] } })}>Add mission point</button></> : <><h2>Municipal facts</h2><p>Use verified figures. Historical visitor totals here do not change approved monthly owner reports.</p><div className="about-manager-fields">{ABOUT_NUMBERS.map(([key, label, integer]) => <label key={key}>{label}<input type="number" min="0" step={integer ? '1' : '0.01'} value={settings[key] ?? ''} onChange={event => update('settings', { ...settings, [key]: event.target.value })} /></label>)}</div>{field('Municipal rank', 'municipal_rank')}<details><summary>Leadership fallback details</summary><p>Used for current officials only when no current leader is marked in the saved leadership roster.</p>{field('Mayor name', 'current_mayor_name')}{field('Mayor term', 'current_mayor_term')}{field('Vice mayor name', 'current_vice_mayor_name')}{field('Vice mayor term', 'current_vice_mayor_term')}</details></>}
        </div><aside className="gov-glass-panel about-manager-preview" aria-label="Unsaved content preview"><p className="about-manager-eyebrow">Draft preview · not published</p><h2>Meet Naujan</h2><p>{settings.overview_text}</p><dl><dt>Population</dt><dd>{aboutNumber(settings.population)}</dd><dt>Barangays</dt><dd>{aboutNumber(settings.num_barangays)}</dd></dl><h3>Vision</h3><p>{settings.vision_text}</p><h3>Mission</h3><ul>{settings.mission_text.points.map((point, index) => <li key={index}>{point}</li>)}</ul></aside></div>}
        {resource !== 'settings' && <>
          {resource === 'leaders' && errors.photos && <p className="about-manager-error" role="alert">Portraits could not be loaded. <button type="button" onClick={() => load('photos')}>Retry portraits</button></p>}
          <label>Find an entry<input type="search" value={query} onChange={event => setQuery(event.target.value)} /></label>
          {list.filter(item => `${item.name || ''} ${item.title || ''} ${item.term || ''} ${item.year || ''}`.toLowerCase().includes(query.trim().toLowerCase())).map(item => <article className="gov-glass-panel about-manager-entry" key={item.id}>
            <div className="about-manager-fields">{resource === 'leaders' ? <><label>Role<select value={item.role} onChange={event => editEntry(item.id, { role: event.target.value, current: false })}><option value="mayor">Mayor</option><option value="vice-mayor">Vice Mayor</option></select></label><label>Full name<input value={item.name} maxLength={150} onChange={event => editEntry(item.id, { name: event.target.value })} /></label><label>Term<input value={item.term} maxLength={80} onChange={event => editEntry(item.id, { term: event.target.value })} /></label><label className="about-manager-checkbox"><input type="checkbox" checked={Boolean(item.current)} onChange={event => update('leaders', setCurrentLeader(list, item.id, event.target.checked))} /> Current official</label></> : resource === 'culture' ? <><label>Full name<input value={item.name} maxLength={150} onChange={event => editEntry(item.id, { name: event.target.value })} /></label><label>Year<input type="number" min="1" max="9999" value={item.year} onChange={event => editEntry(item.id, { year: event.target.value })} /></label></> : <><label>Date<input value={item.date} maxLength={80} onChange={event => editEntry(item.id, { date: event.target.value })} /></label><label>Category<input value={item.category} maxLength={80} onChange={event => editEntry(item.id, { category: event.target.value })} /></label><label>Title<input value={item.title} maxLength={180} onChange={event => editEntry(item.id, { title: event.target.value })} /></label><label>Description<textarea rows={3} value={item.description} maxLength={500} onChange={event => editEntry(item.id, { description: event.target.value })} /></label></>}</div>
            <div className="about-manager-entry-actions">{(resource === 'leaders' ? data.photos?.[`${item.role}:${item.name}:${item.term}`] : item.photo || item.imageUrl) && <img src={resource === 'leaders' ? data.photos[`${item.role}:${item.name}:${item.term}`] : item.photo || item.imageUrl} alt="Saved content image" />}<label>Upload image (updates existing public entries)<input type="file" accept="image/jpeg,image/png,image/webp" disabled={resource === 'leaders' && !data.photos} onChange={event => { upload(resource, item, event.target.files?.[0]); event.target.value = ''; }} /></label><button type="button" onClick={() => move(item.id, -1)} disabled={list[0].id === item.id}>Move up</button><button type="button" onClick={() => move(item.id, 1)} disabled={list.at(-1).id === item.id}>Move down</button><button type="button" onClick={() => update(resource, list.filter(entry => entry.id !== item.id))}>Remove entry</button></div>
          </article>)}
          {!list.length && <p>No saved entries. Add an entry when you have verified content.</p>}
          <button type="button" onClick={() => { const id = crypto.randomUUID(); update(resource, [...list, resource === 'leaders' ? { id, role: 'mayor', name: '', term: '', current: false } : resource === 'culture' ? { id, name: '', year: new Date().getFullYear(), photo: null } : { id, title: '', date: '', category: 'COMMUNITY', description: '', imageUrl: '' }]); setQuery(''); }}>Add {resource === 'leaders' ? 'leader' : resource === 'culture' ? 'Miss Naujan entry' : 'milestone'}</button>
        </>}
      </fieldset>
    </>}
    {pending && <OwnerDialog title={pending.title} busy={busy || historyBusy} onClose={() => setPending(null)} actions={<><button type="button" className="gov-btn-ghost" disabled={busy || historyBusy} onClick={() => setPending(null)}>Keep editing</button><button type="button" className="gov-btn-danger" disabled={busy || historyBusy} onClick={() => { const action = pending.run; setPending(null); action(); }}>{pending.title === 'Publish an empty list?' ? 'Publish empty list' : 'Discard changes'}</button></>}><p>{pending.description}</p></OwnerDialog>}
  </section>;
}
