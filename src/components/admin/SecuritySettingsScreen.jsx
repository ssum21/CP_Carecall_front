import React, { useState, useMemo } from 'react';

function formatSecurityDate(value) {
  return new Date(value).toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function SecuritySettingsScreen({ securityEvents, onChangePassword }) {
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    nextPassword: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const currentPasswordRef = React.useRef(null);

  const passwordStrength = useMemo(() => {
    const password = passwordForm.nextPassword;
    if (!password) return null;

    const checks = {
      length: password.length >= 8,
      hasNumber: /\d/.test(password),
      hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };

    const passedChecks = Object.values(checks).filter(Boolean).length;
    let strength = 'weak';
    if (passedChecks === 3) strength = 'strong';
    else if (passedChecks === 2) strength = 'medium';

    return { ...checks, strength };
  }, [passwordForm.nextPassword]);

  const isPasswordMismatch =
    passwordForm.confirmPassword &&
    passwordForm.nextPassword !== passwordForm.confirmPassword;

  const isFormValid =
    passwordForm.currentPassword &&
    passwordForm.nextPassword &&
    passwordForm.confirmPassword &&
    !isPasswordMismatch &&
    passwordStrength?.strength !== 'weak';

  async function handlePasswordSubmit(event) {
    event.preventDefault();

    if (!isFormValid) {
      return;
    }

    setLoading(true);
    try {
      await onChangePassword(passwordForm);
      setPasswordForm({ currentPassword: '', nextPassword: '', confirmPassword: '' });
      setToast({ type: 'success', message: '비밀번호가 성공적으로 변경되었습니다' });
      setTimeout(() => setToast(null), 3000);
      if (currentPasswordRef.current) {
        currentPasswordRef.current.focus();
      }
    } catch (error) {
      setToast({ type: 'error', message: '비밀번호 변경에 실패했습니다' });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setLoading(false);
    }
  }

  // Calculate security score
  const lastPasswordChange = securityEvents.find(e => e.title === '비밀번호 변경');
  const daysSincePasswordChange = lastPasswordChange
    ? Math.floor((Date.now() - new Date(lastPasswordChange.createdAt)) / (1000 * 60 * 60 * 24))
    : 180;
  const hasTwoFactor = true; // Mock data
  const suspiciousCount = securityEvents.filter(e => e.severity === 'high').length;

  let securityScore = 85;
  if (daysSincePasswordChange > 90) securityScore -= 20;
  if (!hasTwoFactor) securityScore -= 30;
  if (suspiciousCount > 0) securityScore -= 15;

  const securityLevel = securityScore >= 80 ? '강함' : securityScore >= 50 ? '보통' : '약함';
  const securityColor = securityScore >= 80 ? 'var(--color-success)' : securityScore >= 50 ? 'var(--color-warning, #f59e0b)' : 'var(--color-danger)';

  const filteredEvents = severityFilter === 'ALL'
    ? securityEvents
    : securityEvents.filter(e => e.severity === severityFilter);

  return (
    <div className="admin-workspace" style={{ animation: 'fadeIn 0.3s ease-out' }}>
      {toast && (
        <div
          className={`toast toast--${toast.type}`}
          role="alert"
          aria-live="polite"
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '12px 20px',
            borderRadius: 'var(--radius-m)',
            backgroundColor: toast.type === 'success' ? 'var(--color-success)' : 'var(--color-error)',
            color: 'white',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            zIndex: 1000,
            animation: 'fadeIn 0.3s ease-out',
          }}
        >
          {toast.message}
          <style>{`
            @keyframes fadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            @media (max-width: 768px) {
              .toast {
                left: 50% !important;
                right: auto !important;
                transform: translateX(-50%);
              }
            }
          `}</style>
        </div>
      )}

      {/* Security Dashboard Card */}
      <div className="content-surface" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
              보안 점수
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem' }}>
              <div style={{ fontSize: '2.5rem', fontWeight: 700, color: securityColor }}>
                {securityScore}
              </div>
              <div style={{ fontSize: '1.125rem', fontWeight: 600, color: securityColor }}>
                {securityLevel}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div style={{ textAlign: 'center' }}>
              <div className={`badge ${daysSincePasswordChange <= 90 ? 'badge-success' : 'badge-neutral'}`} style={{ fontSize: '0.875rem', padding: '0.5rem 0.75rem' }}>
                비밀번호 변경
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                {daysSincePasswordChange}일 전
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div className={`badge ${hasTwoFactor ? 'badge-success' : 'badge-neutral'}`} style={{ fontSize: '0.875rem', padding: '0.5rem 0.75rem' }}>
                2단계 인증
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                {hasTwoFactor ? '활성화됨' : '비활성화됨'}
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div className={`badge ${suspiciousCount === 0 ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '0.875rem', padding: '0.5rem 0.75rem' }}>
                의심 활동
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                {suspiciousCount}건
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Master-Detail Layout */}
      <div className="section-grid">
        {/* Left: Password Change Form */}
        <div className="content-surface">
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '1.5rem' }}>
            비밀번호 변경
          </div>
          <form className="stack-form" onSubmit={handlePasswordSubmit}>
            <label className="field">
              <span>현재 비밀번호</span>
              <input
                ref={currentPasswordRef}
                type="password"
                value={passwordForm.currentPassword}
                onChange={(event) =>
                  setPasswordForm((previous) => ({
                    ...previous,
                    currentPassword: event.target.value,
                  }))
                }
                placeholder="현재 비밀번호"
                required
                aria-label="현재 비밀번호"
                aria-required="true"
              />
            </label>
            <label className="field">
              <span>새 비밀번호</span>
              <input
                type="password"
                value={passwordForm.nextPassword}
                onChange={(event) =>
                  setPasswordForm((previous) => ({
                    ...previous,
                    nextPassword: event.target.value,
                  }))
                }
                placeholder="8자 이상"
                required
                aria-label="새 비밀번호"
                aria-required="true"
                aria-describedby="password-strength"
              />
            </label>

            {passwordStrength && (
              <div id="password-strength" style={{ marginTop: '-8px', marginBottom: '12px' }}>
                <div
                  style={{
                    display: 'flex',
                    gap: '4px',
                    marginBottom: '8px',
                  }}
                >
                  <div
                    style={{
                      flex: 1,
                      height: '4px',
                      borderRadius: 'var(--radius-s)',
                      backgroundColor:
                        passwordStrength.strength === 'weak'
                          ? 'var(--color-error)'
                          : passwordStrength.strength === 'medium'
                          ? 'var(--color-warning, #f59e0b)'
                          : 'var(--color-success)',
                      transition: 'background-color 0.3s ease',
                    }}
                  />
                  <div
                    style={{
                      flex: 1,
                      height: '4px',
                      borderRadius: 'var(--radius-s)',
                      backgroundColor:
                        passwordStrength.strength === 'medium' || passwordStrength.strength === 'strong'
                          ? passwordStrength.strength === 'medium'
                            ? 'var(--color-warning, #f59e0b)'
                            : 'var(--color-success)'
                          : 'var(--color-border)',
                      transition: 'background-color 0.3s ease',
                    }}
                  />
                  <div
                    style={{
                      flex: 1,
                      height: '4px',
                      borderRadius: 'var(--radius-s)',
                      backgroundColor:
                        passwordStrength.strength === 'strong' ? 'var(--color-success)' : 'var(--color-border)',
                      transition: 'background-color 0.3s ease',
                    }}
                  />
                </div>
                <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    <span role="status" style={{ color: passwordStrength.length ? 'var(--color-success)' : 'inherit', transition: 'color 0.2s ease' }}>
                      <span style={{ display: 'inline-block', animation: passwordStrength.length ? 'scaleIn 0.2s ease-out' : 'none' }}>
                        {passwordStrength.length ? '✓' : '○'}
                      </span> 8자 이상
                    </span>
                    <span role="status" style={{ color: passwordStrength.hasNumber ? 'var(--color-success)' : 'inherit', transition: 'color 0.2s ease' }}>
                      <span style={{ display: 'inline-block', animation: passwordStrength.hasNumber ? 'scaleIn 0.2s ease-out' : 'none' }}>
                        {passwordStrength.hasNumber ? '✓' : '○'}
                      </span> 숫자 포함
                    </span>
                    <span role="status" style={{ color: passwordStrength.hasSpecial ? 'var(--color-success)' : 'inherit', transition: 'color 0.2s ease' }}>
                      <span style={{ display: 'inline-block', animation: passwordStrength.hasSpecial ? 'scaleIn 0.2s ease-out' : 'none' }}>
                        {passwordStrength.hasSpecial ? '✓' : '○'}
                      </span> 특수문자 포함
                    </span>
                  </div>
                </div>
                <style>{`
                  @keyframes scaleIn {
                    from { transform: scale(0); }
                    to { transform: scale(1); }
                  }
                `}</style>
              </div>
            )}

            <label className="field">
              <span>새 비밀번호 확인</span>
              <input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(event) =>
                  setPasswordForm((previous) => ({
                    ...previous,
                    confirmPassword: event.target.value,
                  }))
                }
                placeholder="새 비밀번호 확인"
                required
                aria-label="새 비밀번호 확인"
                aria-required="true"
                aria-invalid={isPasswordMismatch}
              />
            </label>

            {isPasswordMismatch && (
              <p className="validation-text" style={{ animation: 'fadeIn 0.2s ease-out' }}>
                새 비밀번호가 일치하지 않습니다.
              </p>
            )}

            <div className="action-row">
              <button
                type="submit"
                className="primary-button"
                disabled={!isFormValid || loading}
                aria-busy={loading}
                style={{
                  transition: 'background-color 0.2s ease, transform 0.1s ease',
                }}
                onMouseEnter={(e) => {
                  if (!e.currentTarget.disabled) {
                    e.currentTarget.style.filter = 'brightness(1.1)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.filter = 'brightness(1)';
                }}
              >
                {loading ? '변경 중...' : '비밀번호 변경'}
              </button>
            </div>
          </form>
        </div>

        {/* Right: Security Activity Log */}
        <div className="content-surface">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
              보안 활동 로그
            </div>
            <div className="toolbar">
              <select style={{ width: '140px' }} value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)}>
                <option value="ALL">전체</option>
                <option value="low">낮음</option>
                <option value="medium">보통</option>
                <option value="high">높음</option>
              </select>
            </div>
          </div>

          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>시간</th>
                  <th>활동</th>
                  <th>위치</th>
                  <th>심각도</th>
                </tr>
              </thead>
              <tbody>
                {filteredEvents.map((event) => (
                  <tr key={event.id}>
                    <td className="table-secondary">{formatSecurityDate(event.createdAt)}</td>
                    <td>
                      <div className="table-primary">{event.title}</div>
                      <div className="table-secondary">{event.description}</div>
                    </td>
                    <td className="table-secondary">{event.location}</td>
                    <td>
                      <span className={`badge ${event.severity === 'high' ? 'badge-danger' : event.severity === 'medium' ? 'badge-neutral' : 'badge-success'}`}>
                        {event.severity === 'high' ? '높음' : event.severity === 'medium' ? '보통' : '낮음'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SecuritySettingsScreen;
