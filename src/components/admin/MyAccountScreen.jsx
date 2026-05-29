import React, { useEffect, useState, useMemo } from 'react';

function formatDateLabel(value) {
  if (!value) return '-';
  return new Date(value).toLocaleString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

function MyAccountScreen({ user, onSaveProfile, onChangePassword }) {
  const [form, setForm] = useState({
    name: user.name,
    phone: user.phone,
    title: user.title,
    department: user.department,
  });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [errors, setErrors] = useState({});
  const [isPasswordSectionExpanded, setIsPasswordSectionExpanded] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    nextPassword: '',
    confirmPassword: '',
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const currentPasswordRef = React.useRef(null);

  useEffect(() => {
    setForm({
      name: user.name,
      phone: user.phone,
      title: user.title,
      department: user.department,
    });
  }, [user]);

  function validatePhone(phone) {
    const phoneRegex = /^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  }

  function validateForm() {
    const newErrors = {};

    if (!form.name.trim()) {
      newErrors.name = '이름을 입력해주세요';
    }

    if (!form.phone.trim()) {
      newErrors.phone = '연락처를 입력해주세요';
    } else if (!validatePhone(form.phone)) {
      newErrors.phone = '올바른 전화번호 형식이 아닙니다 (예: 010-1234-5678)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      await onSaveProfile(form);
      setToast({ type: 'success', message: '프로필이 성공적으로 저장되었습니다' });
      setTimeout(() => setToast(null), 3000);
    } catch (error) {
      setToast({ type: 'error', message: '프로필 저장에 실패했습니다' });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setLoading(false);
    }
  }

  const permissionsCount = user.permissions?.length || 0;

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

  const isPasswordFormValid =
    passwordForm.currentPassword &&
    passwordForm.nextPassword &&
    passwordForm.confirmPassword &&
    !isPasswordMismatch &&
    passwordStrength?.strength !== 'weak';

  async function handlePasswordSubmit(event) {
    event.preventDefault();

    if (!isPasswordFormValid) {
      return;
    }

    setPasswordLoading(true);
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
      setPasswordLoading(false);
    }
  }

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

      {/* Hero Profile Header */}
      <div className="content-surface" style={{ marginBottom: '1.5rem' }}>
        <div className="profile-summary">
          <div className="profile-summary__avatar" style={{ width: '64px', height: '64px', fontSize: '1.75rem' }}>
            {user.name.slice(0, 1)}
          </div>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>
              {user.name}
              <span className="badge badge-success" style={{ marginLeft: '0.75rem', fontSize: '0.75rem' }}>
                {user.role}
              </span>
            </div>
            <div className="table-secondary" style={{ fontSize: '1rem' }}>{user.email}</div>
          </div>
        </div>
      </div>

      {/* Statistics Bar */}
      <div className="detail-grid" style={{ marginBottom: '1.5rem', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        <div className="content-surface" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
            최근 접속
          </div>
          <div style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-primary)' }}>
            {user.lastAccess || '오늘'}
          </div>
        </div>
        <div className="content-surface" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
            보유 권한
          </div>
          <div style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-primary)' }}>
            {permissionsCount}
          </div>
        </div>
      </div>

      {/* Single Column Stack Layout */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Section 1: Profile Edit Form */}
        <div className="content-surface">
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '1.5rem' }}>
            프로필 정보
          </div>
          <form className="stack-form" onSubmit={handleSubmit}>
            <div className="form-grid">
              <label className="field">
                <span>이름 *</span>
                <input
                  type="text"
                  value={form.name}
                  onChange={(event) => {
                    setForm((previous) => ({ ...previous, name: event.target.value }));
                    if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
                  }}
                  required
                  aria-label="이름"
                  aria-required="true"
                  aria-invalid={!!errors.name}
                />
                {errors.name && (
                  <span className="validation-text" style={{ animation: 'fadeIn 0.2s ease-out' }}>
                    {errors.name}
                  </span>
                )}
              </label>
              <label className="field">
                <span>연락처 *</span>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(event) => {
                    setForm((previous) => ({ ...previous, phone: event.target.value }));
                    if (errors.phone) setErrors((prev) => ({ ...prev, phone: '' }));
                  }}
                  placeholder="010-1234-5678"
                  required
                  aria-label="연락처"
                  aria-required="true"
                  aria-invalid={!!errors.phone}
                />
                {errors.phone && (
                  <span className="validation-text" style={{ animation: 'fadeIn 0.2s ease-out' }}>
                    {errors.phone}
                  </span>
                )}
              </label>
              <label className="field">
                <span>직책</span>
                <input
                  type="text"
                  value={form.title}
                  onChange={(event) =>
                    setForm((previous) => ({ ...previous, title: event.target.value }))
                  }
                  aria-label="직책"
                />
              </label>
              <label className="field">
                <span>부서</span>
                <input
                  type="text"
                  value={form.department}
                  onChange={(event) =>
                    setForm((previous) => ({ ...previous, department: event.target.value }))
                  }
                  aria-label="부서"
                />
              </label>
            </div>

            <label className="field">
              <span>기관 이메일</span>
              <input
                type="email"
                value={user.email}
                disabled
                tabIndex="-1"
                aria-label="기관 이메일"
                aria-disabled="true"
              />
            </label>

            <div className="action-row">
              <button
                type="submit"
                className="primary-button"
                disabled={loading}
                aria-busy={loading}
              >
                {loading ? '저장 중...' : '프로필 저장'}
              </button>
            </div>
          </form>
        </div>

        {/* Section 2: Permissions */}
        <div className="content-surface">
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
            보유 권한 ({permissionsCount})
          </div>
          <div className="chip-list">
            {user.permissions.map((permission) => (
              <span key={permission} className="chip-token">
                {permission}
              </span>
            ))}
          </div>
        </div>

        {/* Section 3: Password Change (Expandable) */}
        <div className="content-surface" style={{ borderTop: '2px solid var(--color-border)', paddingTop: '1.5rem' }}>
          {!isPasswordSectionExpanded ? (
            <button
              type="button"
              className="btn btn-outline"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.25rem' }}
              onClick={() => setIsPasswordSectionExpanded(true)}
            >
              <span>비밀번호 변경</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 9l6 6 6-6"/>
              </svg>
            </button>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                  비밀번호 변경
                </div>
                <button
                  type="button"
                  className="btn btn-ghost"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem' }}
                  onClick={() => setIsPasswordSectionExpanded(false)}
                  aria-label="접기"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 15l-6-6-6 6"/>
                  </svg>
                </button>
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
                    disabled={!isPasswordFormValid || passwordLoading}
                    aria-busy={passwordLoading}
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
                    {passwordLoading ? '변경 중...' : '비밀번호 변경'}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default MyAccountScreen;
