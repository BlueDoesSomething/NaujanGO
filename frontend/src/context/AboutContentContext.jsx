import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import api from '../api';

const AboutContentContext = createContext({ settings: null });
export const useAboutContent = () => useContext(AboutContentContext);
export function AboutContentProvider({ children }) {
  const [settings, setSettings] = useState(null), [loading, setLoading] = useState(true), [error, setError] = useState('');
  const sequence = useRef(0);
  const refresh = useCallback(async () => {
    const request = ++sequence.current; setLoading(true); setError('');
    try {
      const { data } = await api.get('/about-settings');
      if (!data || typeof data !== 'object' || Array.isArray(data) || typeof data.overview_text !== 'string' || !Array.isArray(data.mission_text?.points)) throw new Error('Invalid About content');
      if (request === sequence.current) setSettings(data);
    } catch { if (request === sequence.current) setError('Municipal content could not be loaded. Previously loaded content, if any, is retained.'); }
    finally { if (request === sequence.current) setLoading(false); }
  }, []);
  useEffect(() => { refresh(); const update = event => { if (event.detail?.key === 'about-settings') refresh(); }; window.addEventListener('naujan:settings-updated', update); return () => { sequence.current += 1; window.removeEventListener('naujan:settings-updated', update); }; }, [refresh]);
  return <AboutContentContext.Provider value={{ settings, loading, error, refresh }}>{children}</AboutContentContext.Provider>;
}
