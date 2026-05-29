import React from 'react';

export function PhoneIcon({ size = 16, style = {} }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.11 12 19.79 19.79 0 0 1 1.04 3.36 2 2 0 0 1 3 1.14h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
    </svg>
  );
}

export function SpinnerIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: 'spin 0.8s linear infinite' }}>
      <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
    </svg>
  );
}

/**
 * 수동 전화 확인 팝오버.
 * - anchorPos 제공 시: fixed 포지셔닝 (테이블 overflow 환경)
 * - anchorPos 미제공 시: absolute 포지셔닝 (position='above'|'below')
 */
export function CallConfirmPopover({ recipient, onConfirm, onCancel, anchorPos, position = 'above' }) {
  const displayName = recipient.name || recipient.recipientName;

  const posStyle = anchorPos ? {
    position: 'fixed',
    top: anchorPos.top,
    left: anchorPos.left,
    transform: 'translateX(-50%)',
    zIndex: 2000,
  } : {
    position: 'absolute',
    ...(position === 'above' ? { bottom: 'calc(100% + 8px)' } : { top: 'calc(100% + 8px)' }),
    right: 0,
    zIndex: 30,
  };

  return (
    <div style={{
      ...posStyle,
      backgroundColor: 'white',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-lg)',
      boxShadow: '0 20px 25px -5px rgba(0,0,0,0.15), 0 8px 10px -6px rgba(0,0,0,0.08)',
      padding: '1rem',
      width: '200px',
      animation: 'slideUp 0.15s cubic-bezier(0.16,1,0.3,1)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.75rem' }}>
        <div style={{
          width: '34px', height: '34px', borderRadius: '50%', flexShrink: 0,
          background: 'linear-gradient(135deg, var(--color-success-light), #a7f3d0)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <PhoneIcon size={14} />
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {displayName}
          </div>
          <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>
            {recipient.phoneNumber}
          </div>
        </div>
      </div>
      <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.75rem', lineHeight: 1.5 }}>
        지금 수동 발신하시겠습니까?
      </p>
      <div style={{ display: 'flex', gap: '0.375rem' }}>
        <button
          className="btn"
          style={{
            flex: 1, fontSize: '0.75rem', padding: '0.5rem',
            backgroundColor: 'var(--color-success)', color: 'white',
            borderRadius: 'var(--radius-md)', fontWeight: 700, border: 'none',
          }}
          onClick={(e) => { e.stopPropagation(); onConfirm(); }}
        >
          발신
        </button>
        <button
          className="btn btn-outline"
          style={{ flex: 1, fontSize: '0.75rem', padding: '0.5rem' }}
          onClick={(e) => { e.stopPropagation(); onCancel(); }}
        >
          취소
        </button>
      </div>
    </div>
  );
}
