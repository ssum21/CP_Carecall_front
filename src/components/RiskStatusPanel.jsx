import React, { useState, useCallback, useMemo } from 'react';
import { sortByType } from '../utils/sort';
import { createCorrection } from '../api/dashboardApi';
import { RISK_CONFIG } from '../utils/riskConfig';
import { PhoneIcon, SpinnerIcon, CallConfirmPopover } from './shared';
import { useManualCall } from '../hooks/useManualCall';

const CORRECTION_LEVEL_CONFIG = {
  위험: { color: 'var(--color-danger)', bg: 'var(--color-danger-light)', badgeClass: 'badge-danger' },
  주의: { color: 'var(--color-warning)', bg: 'var(--color-warning-light)', badgeClass: 'badge-warning' },
  정상: { color: 'var(--color-success)', bg: 'var(--color-success-light)', badgeClass: 'badge-success' },
};

function RiskCorrectionModal({ record, currentAdmin, onSave, onCancel }) {
  const [selectedLevel, setSelectedLevel] = useState('');
  const [reason, setReason] = useState('');
  const [step, setStep] = useState('form');

  const aiLevel = record.status === '미응답' ? '미응답' : record.riskLevel;
  const canSubmit = selectedLevel && reason.trim().length >= 5;
  const correctedAt = new Date().toLocaleString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  function handlePrimary() {
    if (step === 'form') {
      setStep('confirm');
    } else {
      onSave({
        riskLevel: selectedLevel,
        reason: reason.trim(),
        correctedBy: `${currentAdmin?.name} (${currentAdmin?.role})`,
        correctedAt: new Date().toISOString(),
      });
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, backgroundColor: 'rgba(15, 23, 42, 0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(3px)', padding: '1rem' }}>
      <div style={{ width: '100%', maxWidth: '480px', backgroundColor: 'var(--color-bg-surface)', borderRadius: 'var(--radius-xl)', boxShadow: '0 25px 60px -12px rgba(0,0,0,0.3)', overflow: 'hidden', animation: 'slideUp 0.25s ease-out' }}>

        {/* Header */}
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--color-border)', background: 'linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%)', display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: 'rgba(79,70,229,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <polyline points="9 12 11 14 15 10" />
            </svg>
          </div>
          <div>
            <h3 style={{ fontWeight: 800, fontSize: '1.0625rem', margin: 0, color: 'var(--color-text-main)' }}>AI 위험도 수동 정정</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: '0.125rem 0 0' }}>관리자 권한으로 AI 판정을 직접 정정합니다</p>
          </div>
        </div>

        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* Subject info card */}
          <div style={{ backgroundColor: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-lg)', padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', border: '1px solid var(--color-border)' }}>
            <div>
              <p style={{ fontSize: '0.625rem', fontWeight: 700, color: 'var(--color-text-light)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>정정 대상자</p>
              <p style={{ fontWeight: 900, fontSize: '1.0625rem', margin: '0.25rem 0 0', color: 'var(--color-text-main)' }}>{record.recipientName}</p>
              {record.callTime && (
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: '0.125rem 0 0' }}>
                  {new Date(record.callTime).toLocaleString('ko-KR', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })} 통화
                </p>
              )}
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '1rem' }}>
              <p style={{ fontSize: '0.625rem', fontWeight: 700, color: 'var(--color-text-light)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>현재 AI 판정</p>
              <div style={{ marginTop: '0.375rem' }}>
                <span className={`badge ${RISK_CONFIG[aiLevel]?.badgeClass || 'badge-neutral'}`} style={{ fontWeight: 900 }}>{aiLevel}</span>
              </div>
              {record.riskReason && (
                <p style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', margin: '0.375rem 0 0', maxWidth: '160px', textAlign: 'right', lineHeight: 1.4 }}>
                  {record.riskReason}
                </p>
              )}
            </div>
          </div>

          {step === 'form' ? (
            <>
              {/* Level selector */}
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.625rem', letterSpacing: '0.03em' }}>
                  정정할 위험도 <span style={{ color: 'var(--color-danger)' }}>*</span>
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.625rem' }}>
                  {['위험', '주의', '정상'].map(level => {
                    const cfg = CORRECTION_LEVEL_CONFIG[level];
                    const isSelected = selectedLevel === level;
                    return (
                      <button
                        key={level}
                        onClick={() => setSelectedLevel(level)}
                        style={{
                          padding: '0.875rem 0.75rem',
                          borderRadius: 'var(--radius-md)',
                          border: `2px solid ${isSelected ? cfg.color : 'var(--color-border)'}`,
                          backgroundColor: isSelected ? cfg.bg : 'var(--color-bg-surface)',
                          cursor: 'pointer',
                          fontWeight: 800,
                          fontSize: '1rem',
                          color: isSelected ? cfg.color : 'var(--color-text-muted)',
                          transition: 'all 0.15s ease',
                          transform: isSelected ? 'scale(1.04)' : 'scale(1)',
                          boxShadow: isSelected ? `0 0 0 3px ${cfg.color}22` : 'none',
                        }}
                      >
                        {level}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Reason textarea */}
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.5rem' }}>
                  정정 사유 <span style={{ color: 'var(--color-danger)' }}>*</span>
                  <span style={{ fontWeight: 500, color: 'var(--color-text-light)', marginLeft: '0.5rem' }}>(최소 5자)</span>
                </label>
                <textarea
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  placeholder="예: 직접 방문 확인 결과 상태 양호함. AI가 이전 대화 맥락을 과도하게 반영한 것으로 판단됨."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    fontSize: '0.875rem',
                    lineHeight: 1.5,
                    border: `1px solid ${reason.trim().length > 0 && reason.trim().length < 5 ? 'var(--color-danger)' : 'var(--color-border)'}`,
                    borderRadius: 'var(--radius-md)',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box',
                    color: 'var(--color-text-main)',
                    outline: 'none',
                    transition: 'border-color 0.15s',
                    backgroundColor: 'var(--color-bg-surface)',
                  }}
                />
                {reason.trim().length > 0 && reason.trim().length < 5 && (
                  <p style={{ fontSize: '0.6875rem', color: 'var(--color-danger)', margin: '0.25rem 0 0', fontWeight: 600 }}>5자 이상 입력해주세요</p>
                )}
              </div>
            </>
          ) : (
            /* Confirm step */
            <div style={{ backgroundColor: 'var(--color-warning-light)', border: '1px solid rgba(245, 158, 11, 0.35)', borderRadius: 'var(--radius-lg)', padding: '1.25rem' }}>
              <div style={{ display: 'flex', gap: '0.625rem', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-warning-hover)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '0.125rem' }}>
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-warning-hover)', margin: 0, lineHeight: 1.5 }}>
                  아래 내용으로 AI 판정이 정정됩니다. 정정 기록은 감사 로그에 영구 저장됩니다.
                </p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--color-text-muted)', fontWeight: 600 }}>기존 AI 판정</span>
                  <span className={`badge ${RISK_CONFIG[aiLevel]?.badgeClass || 'badge-neutral'}`} style={{ fontWeight: 900 }}>{aiLevel}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--color-text-muted)', fontWeight: 600 }}>정정 위험도</span>
                  <span className={`badge ${CORRECTION_LEVEL_CONFIG[selectedLevel]?.badgeClass}`} style={{ fontWeight: 900 }}>{selectedLevel}</span>
                </div>
                <div style={{ borderTop: '1px solid rgba(245, 158, 11, 0.3)', paddingTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <span style={{ color: 'var(--color-text-muted)', fontWeight: 600, fontSize: '0.75rem' }}>정정 사유</span>
                  <span style={{ fontWeight: 600, color: 'var(--color-text-main)', lineHeight: 1.5 }}>{reason}</span>
                </div>
              </div>
            </div>
          )}

          {/* Admin signature */}
          <div style={{ padding: '0.875rem 1.125rem', backgroundColor: 'var(--color-bg-subtle)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: '0.625rem', fontWeight: 700, color: 'var(--color-text-light)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>정정 관리자</p>
              <p style={{ fontSize: '0.875rem', fontWeight: 800, margin: '0.125rem 0 0', color: 'var(--color-text-main)' }}>
                {currentAdmin?.name}
                <span style={{ fontWeight: 500, color: 'var(--color-text-muted)' }}> · {currentAdmin?.role}</span>
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '0.625rem', fontWeight: 700, color: 'var(--color-text-light)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>정정 시각</p>
              <p style={{ fontSize: '0.8125rem', fontWeight: 600, margin: '0.125rem 0 0', color: 'var(--color-text-muted)' }}>{correctedAt}</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '1.125rem 1.5rem', borderTop: '1px solid var(--color-border)', display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', backgroundColor: 'var(--color-bg-subtle)' }}>
          <button
            className="btn btn-outline"
            onClick={step === 'confirm' ? () => setStep('form') : onCancel}
            style={{ fontWeight: 700, minWidth: '80px' }}
          >
            {step === 'confirm' ? '이전' : '취소'}
          </button>
          <button
            className="btn btn-primary"
            onClick={handlePrimary}
            disabled={!canSubmit}
            style={{ fontWeight: 700, minWidth: '120px', opacity: canSubmit ? 1 : 0.45, cursor: canSubmit ? 'pointer' : 'not-allowed' }}
          >
            {step === 'form' ? '다음 단계' : '정정 저장'}
          </button>
        </div>
      </div>
    </div>
  );
}

function TodayStatusCards({ todayStatus, activeFilter, onFilterChange, selectedDate, onDateChange }) {
  const { total = 0, riskCounts = { 정상: 0, 주의: 0, 위험: 0, 미응답: 0 } } = todayStatus || {};
  const todayStr = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Seoul' });
  const isToday = selectedDate === todayStr;

  const cards = [
    { type: '전체', count: total },
    ...Object.entries(riskCounts).map(([type, count]) => ({ type, count }))
  ];

  return (
    <div style={{ marginBottom: '3rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.025em' }}>
            {isToday ? '오늘의 통화 인사이트' : '통화 인사이트'}
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>카드를 클릭하여 상세 대상자를 필터링하세요.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {!isToday && (
            <button
              onClick={() => onDateChange(todayStr)}
              style={{
                fontSize: '0.75rem', fontWeight: 600, padding: '0.375rem 0.75rem',
                backgroundColor: 'var(--color-primary)', color: 'white',
                border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer',
              }}
            >
              오늘
            </button>
          )}
          <input
            type="date"
            value={selectedDate}
            max={todayStr}
            onChange={(e) => e.target.value && onDateChange(e.target.value)}
            style={{
              fontSize: '0.8125rem', fontWeight: 500, padding: '0.375rem 0.625rem',
              border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--color-bg-surface)', color: 'var(--color-text-main)',
              cursor: 'pointer', outline: 'none',
            }}
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.25rem' }}>
        {cards.map(({ type, count }) => {
          const config = RISK_CONFIG[type];
          const isActive = activeFilter === type;
          const isUrgent = (type === '위험' || type === '주의') && count > 0;

          return (
            <div
              key={type}
              role="button"
              tabIndex={0}
              aria-selected={isActive}
              className={`card ${isUrgent ? (type === '위험' ? 'pulse-danger' : 'pulse-warning') : ''}`}
              style={{
                display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '1.5rem',
                cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                border: isActive ? `2px solid ${config.color}` : '1px solid var(--color-border)',
                backgroundColor: isActive ? `color-mix(in srgb, ${config.color} 6%, var(--color-bg-surface))` : 'var(--color-bg-surface)',
                transform: isActive ? 'scale(1.05) translateY(-4px)' : 'translateY(0)',
                boxShadow: isActive
                  ? `var(--shadow-lg), 0 4px 20px -4px color-mix(in srgb, ${config.color} 30%, transparent)`
                  : 'var(--shadow-sm)',
                position: 'relative', overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                  e.currentTarget.style.borderColor = config.border;
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                  e.currentTarget.style.borderColor = 'var(--color-border)';
                }
              }}
              onClick={() => onFilterChange(type)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onFilterChange(type); } }}
            >
              {isActive && (
                <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: config.color }}></div>
                </div>
              )}
              <div style={{ fontSize: '2.5rem', fontWeight: 900, color: config.color, lineHeight: 1, marginBottom: '0.5rem' }}>{count}</div>
              <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>{config.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AtRiskList({ atRiskList, activeFilter, onRecipientSelect, onFilterChange, currentAdmin, onCorrectionSaved }) {
  const [sortType, setSortType] = useState('default');
  const [corrections, setCorrections] = useState({});
  const [correctionTarget, setCorrectionTarget] = useState(null);
  const [toast, setToast] = useState(null);

  const { confirmId: confirmCallId, callingId, popoverPos, handleClick: handleManualCallClick, handleConfirm: handleConfirmCall, handleClose: handleClosePopover } = useManualCall(r => r.contactId);

  const sortedData = useMemo(
    () => sortByType(atRiskList, sortType, (r) => r.status === '응답', (r) => r.riskLevel),
    [atRiskList, sortType]
  );

  const handleSaveCorrection = useCallback(async (data) => {
    const { recipientName: name, contactId: id, riskLevel: originalRiskLevel, recipientId } = correctionTarget;
    setCorrectionTarget(null);
    try {
      await createCorrection(id, {
        originalRiskLevel,
        correctedRiskLevel: data.riskLevel,
        reason: data.reason,
      });
      setCorrections(prev => ({ ...prev, [id]: data }));
      onCorrectionSaved?.(recipientId, data.riskLevel);
      setToast(`${name} 님의 위험도가 "${data.riskLevel}"으로 정정되었습니다.`);
    } catch (err) {
      setToast(`정정 저장 실패: ${err.message}`);
    }
    setTimeout(() => setToast(null), 4000);
  }, [correctionTarget, onCorrectionSaved]);

  return (
    <>
      {confirmCallId && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 25 }} onClick={handleClosePopover} />
      )}
      <div style={{ animation: 'slideUp 0.4s ease-out' }}>
      {/* Toast notification */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 2000,
          backgroundColor: 'var(--color-text-main)', color: 'white',
          padding: '0.875rem 1.25rem', borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-lg)', display: 'flex', alignItems: 'center', gap: '0.625rem',
          fontSize: '0.875rem', fontWeight: 600, animation: 'slideUp 0.3s ease-out',
          maxWidth: '380px',
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <polyline points="20 6 9 17 4 12" />
          </svg>
          {toast}
        </div>
      )}

      {/* Correction modal */}
      {correctionTarget && (
        <RiskCorrectionModal
          record={correctionTarget}
          currentAdmin={currentAdmin}
          onSave={handleSaveCorrection}
          onCancel={() => setCorrectionTarget(null)}
        />
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>
            {activeFilter === '전체' ? '모니터링 현황' : `${activeFilter} 판정 대상자`}
          </h2>
          <span className="badge badge-neutral" style={{ fontSize: '0.75rem' }}>{atRiskList.length}명</span>
          {Object.keys(corrections).length > 0 && (
            <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--color-primary)', backgroundColor: 'var(--color-primary-light)', padding: '0.2rem 0.625rem', borderRadius: '99px', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              수동 정정 {Object.keys(corrections).length}건
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {['default', 'response', 'risk'].map((type) => (
            <button
              key={type}
              onClick={() => setSortType(type)}
              className={`btn ${sortType === type ? 'btn-primary' : 'btn-outline'}`}
              style={{ fontSize: '0.75rem', padding: '0.375rem 0.875rem', borderRadius: 'var(--radius-md)' }}
            >
              {type === 'default' ? '기본순' : type === 'response' ? '미통화 우선' : '위험도순'}
            </button>
          ))}
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden', border: 'none', boxShadow: 'var(--shadow-lg)' }}>
        {atRiskList.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '5rem 2rem', color: 'var(--color-text-muted)' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'var(--color-success-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </div>
            <p style={{ fontWeight: 700, fontSize: '1.0625rem', color: 'var(--color-text-main)', marginBottom: '0.5rem' }}>
              {activeFilter === '전체' ? '오늘 발신된 통화 기록이 없습니다' : `${activeFilter} 판정 대상자가 없습니다`}
            </p>
            {activeFilter !== '전체' && (
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', lineHeight: 1.5, maxWidth: '320px', margin: '0 auto' }}>
                {`현재 "${activeFilter}" 상태에 해당하는 대상자가 없습니다.`}
              </p>
            )}
            {activeFilter !== '전체' && (
              <button
                className="btn btn-outline"
                style={{ marginTop: '1.25rem', fontSize: '0.8125rem', fontWeight: 600 }}
                onClick={() => onFilterChange && onFilterChange('전체')}
              >
                전체 보기
              </button>
            )}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr style={{ backgroundColor: 'var(--color-bg-subtle)' }}>
                  <th style={{ padding: '1rem 1.5rem' }}>대상자 명</th>
                  <th>상태</th>
                  <th>위험도 판정</th>
                  <th style={{ textAlign: 'center' }}>수동 전화</th>
                  <th>발신 시각</th>
                  <th>통화량</th>
                  <th>리스크 감지 사유</th>
                  <th style={{ paddingRight: '1.5rem', textAlign: 'right' }}>관리</th>
                </tr>
              </thead>
              <tbody>
                {sortedData.map((r) => {
                  const correction = corrections[r.contactId];
                  const aiLevel = r.status === '미응답' ? '미응답' : r.riskLevel;
                  const displayLevel = correction ? correction.riskLevel : aiLevel;
                  const config = RISK_CONFIG[displayLevel] || RISK_CONFIG['미응답'];
                  const isUrgent = displayLevel === '위험' || displayLevel === '주의';

                  return (
                    <tr
                      key={r.contactId}
                      style={{
                        backgroundColor: correction
                          ? 'rgba(79, 70, 229, 0.02)'
                          : isUrgent ? (displayLevel === '위험' ? 'rgba(239, 68, 68, 0.02)' : 'rgba(245, 158, 11, 0.02)') : 'transparent',
                        transition: 'background-color 0.2s',
                        borderLeft: correction ? '3px solid var(--color-primary)' : '3px solid transparent',
                      }}
                    >
                      <td style={{ fontWeight: 800, padding: '1.25rem 1.5rem', color: 'var(--color-text-main)' }}>
                        {r.recipientName}
                      </td>
                      <td>
                        <span className={`badge ${r.status === '미응답' ? 'badge-neutral' : 'badge-success'}`} style={{ fontWeight: 700 }}>
                          {r.status}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div className={`badge ${config.badgeClass}`} style={{ fontWeight: 900, padding: '0.375rem 0.75rem', fontSize: '0.75rem', minWidth: '60px', textAlign: 'center' }}>
                            {displayLevel || '분석 중'}
                          </div>
                          <button
                            onClick={() => setCorrectionTarget(r)}
                            title={correction ? '위험도 재정정' : '위험도 수동 정정'}
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                              padding: '0.25rem 0.5rem',
                              borderRadius: '99px',
                              border: `1px solid ${correction ? 'var(--color-primary)' : 'var(--color-border-dark)'}`,
                              backgroundColor: correction ? 'var(--color-primary-light)' : 'transparent',
                              cursor: 'pointer',
                              fontSize: '0.6875rem', fontWeight: 700,
                              color: correction ? 'var(--color-primary)' : 'var(--color-text-muted)',
                              transition: 'all 0.15s ease',
                              whiteSpace: 'nowrap',
                            }}
                            onMouseEnter={e => {
                              e.currentTarget.style.borderColor = 'var(--color-primary)';
                              e.currentTarget.style.color = 'var(--color-primary)';
                              e.currentTarget.style.backgroundColor = 'var(--color-primary-light)';
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.borderColor = correction ? 'var(--color-primary)' : 'var(--color-border-dark)';
                              e.currentTarget.style.color = correction ? 'var(--color-primary)' : 'var(--color-text-muted)';
                              e.currentTarget.style.backgroundColor = correction ? 'var(--color-primary-light)' : 'transparent';
                            }}
                          >
                            {correction ? (
                              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            ) : (
                              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                              </svg>
                            )}
                            {correction ? '정정됨' : '정정'}
                          </button>
                        </div>
                      </td>
                      {/* 수동 전화 열 */}
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ position: 'relative', display: 'inline-block', zIndex: confirmCallId === r.contactId ? 30 : 'auto' }}>
                          <button
                            className="btn"
                            style={{
                              padding: '0.5rem',
                              minWidth: '36px',
                              minHeight: '36px',
                              borderRadius: 'var(--radius-md)',
                              transition: 'all 0.2s',
                              border: '1px solid var(--color-border-dark)',
                              backgroundColor: callingId === r.contactId ? 'var(--color-border-dark)' : 'var(--color-bg-subtle)',
                              color: callingId === r.contactId ? 'white' : 'var(--color-text-muted)',
                              cursor: 'pointer',
                            }}
                            onClick={(e) => handleManualCallClick(r, e)}
                            title="수동 전화 걸기"
                            aria-label="수동 전화 걸기"
                          >
                            {callingId === r.contactId ? <SpinnerIcon size={14} /> : <PhoneIcon size={14} />}
                          </button>
                          {confirmCallId === r.contactId && (
                            <CallConfirmPopover
                              recipient={r}
                              onConfirm={() => handleConfirmCall(r)}
                              onCancel={handleClosePopover}
                              anchorPos={popoverPos}
                            />
                          )}
                        </div>
                      </td>
                      <td style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem', fontWeight: 500 }}>
                        {r.callTime ? new Date(r.callTime).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }) : '-'}
                      </td>
                      <td style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem', fontWeight: 600 }}>
                        {r.duration != null ? `${r.duration}분` : '-'}
                      </td>
                      <td style={{ maxWidth: '260px', fontSize: '0.875rem', fontWeight: 600, color: isUrgent ? 'var(--color-text-main)' : 'var(--color-text-muted)' }}>
                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>
                          {r.riskReason || '-'}
                        </span>
                      </td>
                      <td style={{ paddingRight: '1.5rem', textAlign: 'right' }}>
                        <button
                          className="btn btn-primary"
                          style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', fontWeight: 700 }}
                          onClick={() => onRecipientSelect(r.recipientName)}
                        >
                          이력보기
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
    </>
  );
}

export default function RiskStatusPanel({ todayStatus, atRiskList, activeFilter, onFilterChange, onRecipientSelect, currentAdmin, onCorrectionSaved, selectedDate, onDateChange }) {
  return (
    <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
      <TodayStatusCards todayStatus={todayStatus} activeFilter={activeFilter} onFilterChange={onFilterChange} selectedDate={selectedDate} onDateChange={onDateChange} />
      <AtRiskList atRiskList={atRiskList} activeFilter={activeFilter} onRecipientSelect={onRecipientSelect} onFilterChange={onFilterChange} currentAdmin={currentAdmin} onCorrectionSaved={onCorrectionSaved} />
    </div>
  );
}
