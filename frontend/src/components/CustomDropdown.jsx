import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

const MENU_EST_HEIGHT = 150;

const DROPDOWN_GLOBAL_CSS = `
@keyframes custom-dropdown-fade-slide {
  from { opacity: 0; transform: translateY(-6px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
.custom-dropdown-trigger:hover {
  border-color: #059669 !important;
  background-color: #f0fdf4 !important;
}
.custom-dropdown-option:hover {
  background-color: #f0fdf4 !important;
  color: #16a34a !important;
}
`;

let stylesInjected = false;
function ensureGlobalStyles() {
  if (stylesInjected || typeof document === 'undefined') return;
  stylesInjected = true;
  const el = document.createElement('style');
  el.setAttribute('data-custom-dropdown', 'true');
  el.textContent = DROPDOWN_GLOBAL_CSS;
  document.head.appendChild(el);
}

const DEFAULT_BORDER = '#e5e7eb';
const PRIMARY = '#16a34a';
const PRIMARY_SOFT = '#f0fdf4';
const TEXT = '#1f2937';

const style = {
  wrapper: {
    position: 'relative',
    display: 'inline-block',
    fontFamily: 'inherit',
  },
  trigger: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.45rem',
    width: 'auto',
    minWidth: '120px',
    padding: '7px 10px',
    border: `1.5px solid ${PRIMARY}`,
    borderRadius: '7px',
    fontSize: '0.85rem',
    fontWeight: 700,
    color: TEXT,
    backgroundColor: '#ffffff',
    fontFamily: 'inherit',
    lineHeight: '1.4',
    cursor: 'pointer',
    transition: 'border-color 0.15s ease, box-shadow 0.15s ease, background-color 0.15s ease',
    boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
    textAlign: 'left',
  },
  triggerOpen: {
    borderColor: '#059669',
    boxShadow: '0 0 0 3px rgba(22,163,74,0.15)',
    backgroundColor: PRIMARY_SOFT,
  },
  triggerLabel: {
    flex: 1,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  chevron: {
    transition: 'transform 0.2s ease',
    flexShrink: 0,
    color: '#6b7280',
  },
  menu: {
    position: 'fixed',
    zIndex: 9999,
    minWidth: 0,
    margin: 0,
    padding: '4px',
    listStyle: 'none',
    listStyleType: 'none',
    backgroundColor: '#ffffff',
    border: `1px solid ${DEFAULT_BORDER}`,
    borderRadius: '10px',
    boxShadow: '0 12px 32px rgba(0,0,0,0.18)',
    animation: 'custom-dropdown-fade-slide 0.18s cubic-bezier(0.22, 1, 0.36, 1)',
    maxHeight: 'min(320px, calc(100vh - 16px))',
    overflowY: 'auto',
  },
  option: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    width: '100%',
    padding: '8px 10px',
    border: 'none',
    background: 'transparent',
    borderRadius: '7px',
    fontSize: '0.86rem',
    fontWeight: 600,
    color: TEXT,
    textAlign: 'left',
    fontFamily: 'inherit',
    cursor: 'pointer',
    transition: 'background-color 0.12s ease, color 0.12s ease',
    whiteSpace: 'nowrap',
  },
  optionActive: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    width: '100%',
    padding: '8px 10px',
    border: 'none',
    borderRadius: '7px',
    fontSize: '0.86rem',
    fontWeight: 700,
    color: PRIMARY,
    backgroundColor: 'rgba(22,163,74,0.1)',
    textAlign: 'left',
    fontFamily: 'inherit',
    cursor: 'pointer',
    transition: 'background-color 0.12s ease, color 0.12s ease',
    whiteSpace: 'nowrap',
  },
  optionIcon: {
    fontSize: '0.95rem',
    lineHeight: '1',
    flexShrink: 0,
  },
  optionDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    flexShrink: 0,
  },
  check: {
    marginLeft: 'auto',
    flexShrink: 0,
    color: PRIMARY,
  },
};

const CustomDropdown = ({ value, options, onChange, triggerStyle, fullWidth = false, placeholder, title }) => {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState(null);
  const rootRef = useRef(null);
  const buttonRef = useRef(null);

  useEffect(() => {
    ensureGlobalStyles();
  }, []);

  useEffect(() => {
    if (!open || !buttonRef.current) return;

    const updatePosition = () => {
      const rect = buttonRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const menuTop = spaceBelow < MENU_EST_HEIGHT + 8
        ? Math.max(8, rect.top - MENU_EST_HEIGHT)
        : rect.bottom + 6;
      const menuLeft = Math.max(8, Math.min(rect.left, window.innerWidth - rect.width - 8));
      setPos({
        top: menuTop,
        left: menuLeft,
        width: Math.max(rect.width, 128),
      });
    };

    updatePosition();
    window.addEventListener('scroll', updatePosition);
    window.addEventListener('resize', updatePosition);

    const onClickOutside = (e) => {
      if (e.target.closest('.custom-dropdown-menu')) return;
      if (rootRef.current && !rootRef.current.contains(e.target) && buttonRef.current && !buttonRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', onClickOutside);
    document.addEventListener('keydown', onKey);

    return () => {
      window.removeEventListener('scroll', updatePosition);
      window.removeEventListener('resize', updatePosition);
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const current = options.find((o) => o.value === value) || null;
  const wrapperStyle = { ...style.wrapper, ...(fullWidth ? { width: '100%' } : {}) };
  const baseTrigger = {
    ...style.trigger,
    ...(triggerStyle || {}),
    ...(fullWidth ? { width: '100%' } : {}),
  };
  const triggerStyleFinal = open
    ? { ...style.triggerOpen, ...baseTrigger }
    : baseTrigger;

  return (
    <>
      <div className="custom-dropdown" ref={rootRef} style={wrapperStyle}>
        <button
          ref={buttonRef}
          type="button"
          className={`custom-dropdown-trigger${open ? ' is-open' : ''}`}
          style={triggerStyleFinal}
          onClick={() => setOpen((o) => !o)}
          aria-haspopup="listbox"
          aria-expanded={open}
          title={title}
        >
          {current && current.icon && <span style={style.optionIcon}>{current.icon}</span>}
          {current && current.color && <span style={{ ...style.optionDot, background: current.color }} />}
          <span style={style.triggerLabel}>{current ? current.label : (placeholder || '')}</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ ...style.chevron, transform: open ? 'rotate(180deg)' : 'none' }}>
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      </div>
      {open && pos && createPortal(
        <ul className="custom-dropdown-menu" style={{ ...style.menu, top: `${pos.top}px`, left: `${pos.left}px`, width: `${pos.width}px` }} role="listbox">
          {options.map((opt) => (
            <li key={opt.value} role="option" aria-selected={opt.value === value}>
              <button
                type="button"
                className="custom-dropdown-option"
                style={opt.value === value ? style.optionActive : style.option}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
              >
                {opt.icon && <span style={style.optionIcon}>{opt.icon}</span>}
                {opt.color && <span style={{ ...style.optionDot, background: opt.color }} />}
                <span style={{ flex: 1 }}>{opt.label}</span>
                {opt.value === value && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={style.check}>
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </button>
            </li>
          ))}
        </ul>,
        document.body
      )}
    </>
  );
};

export default CustomDropdown;