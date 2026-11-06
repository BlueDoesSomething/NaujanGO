import { useCallback, useEffect, useRef, useState } from 'react';
import api from '../api';

// Fail closed while loading or when policy cannot be read. Do not cache a
// previously enabled policy across mounts/focus after an admin disables it.
export default function useBookingPolicy() {
  const [policy, setPolicy] = useState({ online_payments_enabled: false, storage_ready: false });
  const [loading, setLoading] = useState(true), [error, setError] = useState('');
  const sequence = useRef(0);
  const refresh = useCallback(async () => {
    const request = ++sequence.current; setLoading(true); setError('');
    try {
      const response = await api.get('/bookings/policy');
      if (typeof response.data?.online_payments_enabled !== 'boolean') throw new Error('Invalid booking policy');
      if (request === sequence.current) setPolicy(response.data);
    } catch (error) {
      if (request === sequence.current) { setPolicy({ online_payments_enabled: false, storage_ready: false }); setError(error.response?.data?.error || 'Could not check the booking policy. Please retry.'); }
    } finally { if (request === sequence.current) setLoading(false); }
  }, []);
  useEffect(() => { refresh(); window.addEventListener('focus', refresh); return () => { sequence.current += 1; window.removeEventListener('focus', refresh); }; }, [refresh]);
  return { policy, loading, error, refresh, paymentsDisabled: loading || !policy.online_payments_enabled };
}
