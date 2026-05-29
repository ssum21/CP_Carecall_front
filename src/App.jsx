import React, { Component, useEffect, useRef, useState, useMemo, useCallback } from 'react';
import RecipientList from './components/RecipientList';
import CallTimeline from './components/CallTimeline';
import RiskStatusPanel from './components/RiskStatusPanel';
import AdminAccountsScreen from './components/admin/AdminAccountsScreen';
import StatsPanel from './components/StatsPanel';
import MyAccountScreen from './components/admin/MyAccountScreen';
import { fetchRecipients, fetchTodayCallStatus, fetchCallHistory, createRecipient, updateRecipient } from './api/dashboardApi';
import { ADMIN_ACCOUNTS } from './components/admin/adminMockData';
// import { signIn, signOut, getCurrentSession } from './auth/cognitoAuth'; // Direct Auth (주석처리)
import { userManager, signOutRedirect } from './auth/userManager'; // OIDC

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--color-bg-body)', padding: '2rem' }}>
          <div className="card" style={{ maxWidth: '28rem', textAlign: 'center', padding: '3rem 2rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>&#9888;&#65039;</div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-main)', marginBottom: '0.75rem' }}>
              문제가 발생했습니다
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
              {this.state.error?.message || '예기치 않은 오류가 발생했습니다. 페이지를 새로고침해주세요.'}
            </p>
            <button
              className="btn btn-primary"
              style={{ padding: '0.75rem 2rem' }}
              onClick={() => window.location.reload()}
            >
              페이지 새로고침
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const DASHBOARD_TABS = ['위험도 현황', '대상자 목록', '통계'];

const APP_VIEWS = [
  { id: 'dashboard', label: '대시보드' },
  { id: 'myAccount', label: '내 계정' },
];

function getAvatarLabel(name, email) {
  return (name?.trim()?.[0] || email?.trim()?.[0] || 'A').toUpperCase();
}

/* --- Direct Auth LoginScreen (주석처리) ---
function LoginScreen({ onLogin }) { ... }
--- */

function LoginScreen() {
  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <div style={{ width: '48px', height: '48px', backgroundColor: 'var(--color-primary)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', boxShadow: 'var(--shadow-lg)' }}>
            <span style={{ color: 'white', fontWeight: 'bold', fontSize: '1.5rem' }}>AI</span>
          </div>
          <h1 className="login-title">CareCall</h1>
          <p className="login-subtitle">관리자 통합 대시보드</p>
        </div>
        <button
          className="btn btn-primary"
          style={{ width: '100%', padding: '0.75rem', marginTop: '1.5rem' }}
          onClick={() => userManager.signinRedirect()}
        >
          로그인
        </button>
      </div>
    </div>
  );
}

function AccountMenu({ currentUser, currentView, onNavigate, onLogout }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handlePointerDown(e) { if (menuRef.current && !menuRef.current.contains(e.target)) setIsOpen(false); }
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  return (
    <div ref={menuRef} style={{ position: 'relative' }}>
      <button className="btn btn-outline" aria-label="계정 메뉴" aria-expanded={isOpen} aria-haspopup="true" style={{ padding: '0.375rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', borderRadius: 'var(--radius-lg)' }} onClick={() => setIsOpen(!isOpen)}>
        <div style={{ width: '28px', height: '28px', backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.75rem', overflow: 'hidden' }}>
          {currentUser.photo ? <img src={currentUser.photo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : getAvatarLabel(currentUser.name, currentUser.email)}
        </div>
        <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{currentUser.name}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6"/></svg>
      </button>

      {isOpen && (
        <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '0.5rem', width: '240px', backgroundColor: 'var(--color-bg-surface)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--color-border)', padding: '0.5rem', zIndex: 100 }}>
          <div style={{ padding: '0.75rem', borderBottom: '1px solid var(--color-border)', marginBottom: '0.5rem' }}>
            <p style={{ fontWeight: 700, color: 'var(--color-text-main)', fontSize: '0.875rem', margin: 0 }}>{currentUser.name}</p>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', margin: '0.25rem 0 0' }}>{currentUser.email}</p>
          </div>
          {APP_VIEWS.map((view) => (
            <button key={view.id} className="btn btn-ghost" style={{ justifyContent: 'flex-start', width: '100%', fontSize: '0.875rem', color: currentView === view.id ? 'var(--color-primary)' : 'var(--color-text-main)', backgroundColor: currentView === view.id ? 'var(--color-bg-subtle)' : 'transparent' }} onClick={() => { onNavigate(view.id); setIsOpen(false); }}>
              {view.label}
            </button>
          ))}
          <div style={{ borderTop: '1px solid var(--color-border)', marginTop: '0.5rem', paddingTop: '0.5rem' }}>
            <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'flex-start', color: 'var(--color-danger)', fontSize: '0.875rem' }} onClick={onLogout}>로그아웃</button>
          </div>
        </div>
      )}
    </div>
  );
}

function App() {
  const [cognitoUser, setCognitoUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [currentView, setCurrentView] = useState('dashboard');
  const [activeTab, setActiveTab] = useState('위험도 현황');
  const [selectedRecipient, setSelectedRecipient] = useState(null);
  const [callHistory, setCallHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [adminAccounts, setAdminAccounts] = useState(ADMIN_ACCOUNTS);
  const [recipients, setRecipients] = useState([]);
  const [todayStatus, setTodayStatus] = useState({ date: null, total: 0, riskCounts: { 정상: 0, 주의: 0, 위험: 0, 미응답: 0 } });
  const [todayRecords, setTodayRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dashboardFilter, setDashboardFilter] = useState('전체');
  const [toast, setToast] = useState(null);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Seoul' })
  );

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  const currentUser = adminAccounts.find(a => a.email === cognitoUser?.profile?.email) || adminAccounts[0];

  useEffect(() => {
    userManager.getUser().then(user => {
      setCognitoUser(user);
      setAuthLoading(false);
    }).catch(() => setAuthLoading(false));
  }, []);

  useEffect(() => {
    if (!cognitoUser) return;
    setIsLoading(true);
    Promise.allSettled([fetchRecipients(), fetchTodayCallStatus(selectedDate)])
      .then(([recsResult, todayResult]) => {
        if (recsResult.status === 'fulfilled') {
          setRecipients(recsResult.value);
        } else {
          console.error('대상자 목록 로딩 실패:', recsResult.reason);
          setApiError(true);
        }
        if (todayResult.status === 'fulfilled') {
          const today = todayResult.value;
          setTodayStatus({ date: today.date, total: today.total, riskCounts: today.riskCounts });
          setTodayRecords(today.records || []);
        } else {
          console.error('오늘 현황 로딩 실패:', todayResult.reason);
          setApiError(true);
        }
      })
      .finally(() => setIsLoading(false));
  }, [cognitoUser]);

  const handleDateChange = useCallback(async (newDate) => {
    setSelectedDate(newDate);
    setDashboardFilter('전체');
    setIsLoading(true);
    try {
      const result = await fetchTodayCallStatus(newDate);
      setTodayStatus({ date: result.date, total: result.total, riskCounts: result.riskCounts });
      setTodayRecords(result.records || []);
    } catch (err) {
      console.error('날짜별 현황 로딩 실패:', err);
      setApiError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const filteredRecipients = useMemo(() => recipients.filter(r => {
    const matchesSearch = r.name.toLowerCase().includes(searchQuery.toLowerCase()) || r.phoneNumber.includes(searchQuery);
    const matchesFilter = dashboardFilter === '전체' || r.lastRiskLevel === dashboardFilter;
    return matchesSearch && matchesFilter;
  }), [recipients, searchQuery, dashboardFilter]);

  const filteredTodayRecords = useMemo(() => todayRecords.filter(r => {
    if (dashboardFilter === '전체') return true;
    if (dashboardFilter === '미응답') return r.status === '미응답' || r.riskLevel === '미응답';
    return r.riskLevel === dashboardFilter;
  }).map(r => {
    const recipient = recipients.find(rep => rep.recipientId === r.recipientId);
    return { ...r, phoneNumber: recipient?.phoneNumber || '' };
  }), [todayRecords, dashboardFilter, recipients]);

  if (authLoading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--color-bg-body)' }}>
      <div style={{ width: '36px', height: '36px', border: '3px solid var(--color-border)', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  );
  if (!cognitoUser) return <LoginScreen />;

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === '대상자 목록') {
      setDashboardFilter('전체');
    }
  };

  const handleRecipientSelect = async (r) => {
    setCallHistory([]);
    setHistoryLoading(true);
    setSelectedRecipient(r);
    try {
      const history = await fetchCallHistory(r.name || r.recipientName);
      setCallHistory(history);
    } catch (err) {
      console.error('통화 이력 로딩 실패:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {toast && (
        <div style={{
          position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 2000,
          backgroundColor: 'var(--color-text-main)', color: 'white',
          padding: '0.875rem 1.25rem', borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-lg)', fontSize: '0.875rem', fontWeight: 500,
          display: 'flex', alignItems: 'center', gap: '0.625rem',
          animation: 'slideUp 0.3s ease-out',
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          {toast}
        </div>
      )}
      <header className="app-header glass">
        <div className="container app-header-content">
          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }} onClick={() => { setCurrentView('dashboard'); setDashboardFilter('전체'); setActiveTab('위험도 현황'); }}>
              <div style={{ width: '32px', height: '32px', backgroundColor: 'var(--color-primary)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(79, 70, 229, 0.3)' }}>
                <span style={{ color: 'white', fontWeight: 'bold', fontSize: '1rem' }}>AI</span>
              </div>
              <h1 className="app-title" style={{ fontSize: '1.25rem', letterSpacing: '-0.02em' }}>CareCall</h1>
            </div>

            <div className="tabs desktop-only" style={{ marginBottom: 0, borderBottom: 'none' }}>
                {DASHBOARD_TABS.map((tab) => (
                  <button key={tab} className={`tab ${currentView === 'dashboard' && activeTab === tab ? 'active' : ''}`} style={{ padding: '1.25rem 0' }} onClick={() => { setCurrentView('dashboard'); handleTabChange(tab); }}>
                    {tab}
                  </button>
                ))}
              </div>
              <select className="mobile-only form-input" style={{ width: 'auto', fontSize: '0.875rem', padding: '0.5rem 0.75rem' }} value={activeTab} onChange={(e) => { setCurrentView('dashboard'); handleTabChange(e.target.value); }}>
                {DASHBOARD_TABS.map((tab) => (
                  <option key={tab} value={tab}>{tab}</option>
                ))}
              </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <svg
                style={{ position: 'absolute', left: '0.875rem', color: 'var(--color-text-light)', pointerEvents: 'none' }}
                width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input
                type="text"
                className="form-input"
                placeholder="대상자 검색..."
                style={{ width: '240px', paddingLeft: '2.75rem', backgroundColor: 'var(--color-bg-subtle)', border: '1px solid var(--color-border)' }}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <AccountMenu currentUser={currentUser} currentView={currentView} onNavigate={setCurrentView} onLogout={signOutRedirect} />
          </div>
        </div>
      </header>

      {apiError && (
        <div style={{ backgroundColor: '#fef3c7', borderBottom: '1px solid #fcd34d', padding: '0.625rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', color: '#92400e', fontWeight: 600 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          서버에 연결할 수 없습니다. AWS 연결 상태를 확인해주세요.
        </div>
      )}

      <div style={{ flex: 1, backgroundColor: 'var(--color-bg-body)' }}>
        <div className="container" style={{ padding: '2.5rem 2rem' }}>
          {currentView === 'dashboard' ? (
             activeTab === '위험도 현황' ? (
               <RiskStatusPanel
                  todayStatus={todayStatus}
                  atRiskList={filteredTodayRecords}
                  activeFilter={dashboardFilter}
                  onFilterChange={setDashboardFilter}
                  selectedDate={selectedDate}
                  onDateChange={handleDateChange}
                  onRecipientSelect={(name) => {
                    const recipient = recipients.find(r => r.name === name);
                    if (recipient) handleRecipientSelect(recipient);
                  }}
                  currentAdmin={currentUser}
                  onCorrectionSaved={(recipientId, newRiskLevel) => {
                    setRecipients(prev => prev.map(r =>
                      r.recipientId === recipientId ? { ...r, lastRiskLevel: newRiskLevel } : r
                    ));
                    setTodayRecords(prev => prev.map(r =>
                      r.recipientId === recipientId ? { ...r, riskLevel: newRiskLevel } : r
                    ));
                  }}
               />
             ) : activeTab === '통계' ? (
               <StatsPanel />
             ) : (
               <RecipientList
                 recipients={filteredRecipients}
                 isLoading={isLoading}
                 onSelect={handleRecipientSelect}
                 onAdd={async (r) => {
                   try {
                     await createRecipient(r);
                     const updated = await fetchRecipients();
                     setRecipients(updated);
                     showToast(`${r.name}님이 등록되었습니다.`);
                   } catch (err) {
                     console.error('대상자 등록 실패:', err);
                     showToast(`등록 실패: ${err.message}`);
                   }
                 }}
                 onUpdate={async (r) => {
                   try {
                     await updateRecipient(r.recipientId, {
                       recipientName: r.name,
                       age: r.age,
                       phoneNumber: r.phoneNumber,
                       address: r.address,
                       memo: r.memo,
                       autoCallTime: r.autoCallTime,
                       autoCallEnabled: r.autoCallEnabled,
                     });
                     setRecipients(prev => prev.map(i => i.recipientId === r.recipientId ? { ...i, ...r } : i));
                     showToast(`${r.name}님 정보가 수정되었습니다.`);
                   } catch (err) {
                     console.error('대상자 수정 실패:', err);
                     showToast(`수정 실패: ${err.message}`);
                   }
                 }}
                 onDelete={(id) => setRecipients(recipients.filter(r => r.recipientId !== id))}
                 onManualCall={(r) => console.log(`수동 발신 요청: ${r.name} (${r.phoneNumber})`)}
               />
             )
          ) : (
             currentView === 'adminAccounts' ? null :
             currentView === 'myAccount' ? <MyAccountScreen user={currentUser} onSaveProfile={() => {}} onChangePassword={() => {}} /> :
             null
          )}
        </div>
      </div>

      {selectedRecipient && (
        <CallTimeline
          history={callHistory}
          isLoading={historyLoading}
          recipientName={selectedRecipient.name}
          recipientPhoto={selectedRecipient.photo}
          onClose={() => setSelectedRecipient(null)}
        />
      )}
    </div>
  );
}

function AppWithErrorBoundary() {
  return (
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
}

export default AppWithErrorBoundary;
