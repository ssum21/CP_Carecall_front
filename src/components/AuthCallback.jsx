import { useEffect } from 'react';
import { userManager } from '../auth/userManager';

export default function AuthCallback() {
  useEffect(() => {
    userManager.signinCallback()
      .then(() => window.location.replace('/'))
      .catch((err) => {
        console.error('Cognito 콜백 처리 실패:', err);
        window.location.replace('/');
      });
  }, []);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--color-bg-body)' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid var(--color-border)', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem' }} />
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', fontWeight: 600 }}>로그인 처리 중...</p>
      </div>
    </div>
  );
}
