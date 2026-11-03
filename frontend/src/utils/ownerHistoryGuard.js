// Window is the popstate target: its listeners run in registration order, even
// with capture:true. Install before BrowserRouter mounts, not from a child
// effect after its history listener. Outside the owner dashboard this is inert.
let guard = null;
if (typeof window !== 'undefined') {
  const handlePop = event => guard?.(event);
  window.addEventListener('popstate', handlePop);
  if (import.meta.hot) import.meta.hot.dispose(() => window.removeEventListener('popstate', handlePop));
}

export const registerOwnerHistoryGuard = listener => {
  guard = listener;
  return () => { if (guard === listener) guard = null; };
};
