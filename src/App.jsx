import React, { Component, useEffect, useRef, useState, useMemo, useCallback } from 'react';
import RecipientList from './components/RecipientList';
import CallTimeline from './components/CallTimeline';
import RiskStatusPanel from './components/RiskStatusPanel';
import AdminAccountsScreen from './components/admin/AdminAccountsScreen';
import StatsPanel from './components/StatsPanel';
import MyAccountScreen from './components/admin/MyAccountScreen';
import { fetchRecipients, fetchTodayCallStatus, fetchCallHistory, createRecipient, updateRecipient, deleteRecipient } from './api/dashboardApi';
import { ADMIN_ACCOUNTS } from './components/admin/adminMockData';
import { userManager, signOutRedirect } from './auth/userManager';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error, errorInfo) { console.error('ErrorBoundary:', error, errorInfo); }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--color-bg-body)', padding: '2rem' }}>
          <div className="card" style={{ maxWidth: '28rem', textAlign: 'center', padding: '3rem 2rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>&#9888;&#65039;</div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-main)', marginBottom: '0.75rem' }}>문제가 발생했습니다</h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
              {this.state.error?.message || '예기치 않은 오류가 발생했습니다. 페이지를 새로고침해주세요.'}
            </p>
            <button className="btn btn-primary" style={{ padding: '0.75rem 2rem' }} onClick={() => window.location.reload()}>
              페이지 새로고침
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function getAvatarLabel(name, email) {
  return (name?.trim()?.[0] || email?.trim()?.[0] || 'A').toUpperCase();
}

// ── SVG Icons ──────────────────────────────────────────────────────────────────
function ShieldIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  );
}

function BarChartIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/>
      <line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/>
      <line x1="2" y1="20" x2="22" y2="20"/>
    </svg>
  );
}

function UserIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="6" x2="21" y2="6"/>
      <line x1="3" y1="12" x2="21" y2="12"/>
      <line x1="3" y1="18" x2="21" y2="18"/>
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  );
}

// ── Login Screen ───────────────────────────────────────────────────────────────
function LoginScreen() {
  return (
    <div className="login-page">
      <div className="login-left">
        <div className="login-brand">
          <div className="login-brand-icon">
            <svg viewBox="0 0 24 24" fill="white" width="26" height="26">
              <path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.35C17.25 22.15 21 17.25 21 12V7L12 2z"/>
            </svg>
          </div>
          <h1 className="login-brand-title">CareCall</h1>
          <p className="login-brand-desc">
            AI 기반 어르신 안부 전화 시스템입니다.<br />
            내부 관리자 전용 시스템으로,<br />
            권한 없는 접근은 기록됩니다.
          </p>
          <ul className="login-feature-list">
            <li>실시간 위험도 모니터링</li>
            <li>AI 감정 분석 통화 이력</li>
            <li>대상자 관리 및 자동 발신</li>
          </ul>
        </div>
      </div>

      <div className="login-right">
        <div className="login-form-card">
          <div className="login-form-header">
            <h2 className="login-form-title">로그인</h2>
            <p className="login-form-subtitle">계정 정보를 입력해주세요</p>
          </div>
          <div className="login-form-body">
            <button className="btn btn-primary login-submit-btn" onClick={() => userManager.signinRedirect()}>
              로그인
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Sidebar ────────────────────────────────────────────────────────────────────
const SIDEBAR_ITEMS = [
  { id: 'risk',       label: '위험도 현황', view: 'dashboard', tab: '위험도 현황', Icon: ShieldIcon },
  { id: 'recipients', label: '대상자 목록', view: 'dashboard', tab: '대상자 목록', Icon: UsersIcon },
  { id: 'stats',      label: '통계',        view: 'dashboard', tab: '통계',        Icon: BarChartIcon },
];

function Sidebar({ currentView, activeTab, onNavigate, currentUser, onLogout, isMobileOpen, onMobileClose }) {
  const isActive = (item) =>
    item.view === 'myAccount'
      ? currentView === 'myAccount'
      : currentView === 'dashboard' && activeTab === item.tab;

  return (
    <>
      {isMobileOpen && <div className="sidebar-overlay" onClick={onMobileClose} />}
      <aside className={`sidebar${isMobileOpen ? ' sidebar-open' : ''}`}>
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <svg viewBox="0 0 24 24" fill="white" width="16" height="16">
              <path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.35C17.25 22.15 21 17.25 21 12V7L12 2z"/>
            </svg>
          </div>
          <span className="sidebar-logo-text">CareCall</span>
          <button className="sidebar-close-btn mobile-only" onClick={onMobileClose} aria-label="메뉴 닫기">
            <XIcon />
          </button>
        </div>

        <nav className="sidebar-nav" aria-label="주요 메뉴">
          <p className="sidebar-section-label">메인 메뉴</p>
          {SIDEBAR_ITEMS.map((item) => (
            <button
              key={item.id}
              className={`sidebar-item${isActive(item) ? ' active' : ''}`}
              onClick={() => { onNavigate(item.view, item.tab); onMobileClose(); }}
            >
              <item.Icon />
              <span>{item.label}</span>
            </button>
          ))}

          <p className="sidebar-section-label" style={{ marginTop: '1.5rem' }}>계정</p>
          <button
            className={`sidebar-item${currentView === 'myAccount' ? ' active' : ''}`}
            onClick={() => { onNavigate('myAccount', null); onMobileClose(); }}
          >
            <UserIcon />
            <span>내 계정</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user-row">
            <div className="sidebar-avatar">
              {currentUser.photo
                ? <img src={currentUser.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                : getAvatarLabel(currentUser.name, currentUser.email)
              }
            </div>
            <div className="sidebar-user-info">
              <p className="sidebar-user-name">{currentUser.name}</p>
              <p className="sidebar-user-email">{currentUser.email}</p>
            </div>
            <button className="sidebar-logout" onClick={onLogout} aria-label="로그아웃" title="로그아웃">
              <LogoutIcon />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

// ── App ────────────────────────────────────────────────────────────────────────
function App() {
  const [cognitoUser, setCognitoUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [currentView, setCurrentView] = useState('dashboard');
  const [activeTab, setActiveTab] = useState('위험도 현황');
  const [selectedRecipient, setSelectedRecipient] = useState(null);
  const [callHistory, setCallHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [adminAccounts] = useState(ADMIN_ACCOUNTS);
  const [recipients, setRecipients] = useState([]);
  const [todayStatus, setTodayStatus] = useState({ date: null, total: 0, riskCounts: { 정상: 0, 주의: 0, 위험: 0, 미응답: 0 } });
  const [todayRecords, setTodayRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dashboardFilter, setDashboardFilter] = useState('전체');
  const [toast, setToast] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
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

  const handleNavigate = useCallback((view, tab) => {
    setCurrentView(view);
    if (tab) {
      setActiveTab(tab);
      if (tab === '대상자 목록') setDashboardFilter('전체');
    }
  }, []);

  const handleRecipientSelect = useCallback(async (r) => {
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
  }, []);

  if (authLoading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--color-bg-body)' }}>
      <div style={{ width: '36px', height: '36px', border: '3px solid var(--color-border)', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  );

  if (!cognitoUser) return <LoginScreen />;

  const pageTitle = currentView === 'myAccount' ? '내 계정' : activeTab;

  return (
    <div className="app-layout">
      <Sidebar
        currentView={currentView}
        activeTab={activeTab}
        onNavigate={handleNavigate}
        currentUser={currentUser}
        onLogout={signOutRedirect}
        isMobileOpen={sidebarOpen}
        onMobileClose={() => setSidebarOpen(false)}
      />

      <div className="main-area">
        <header className="top-bar glass">
          <div className="top-bar-left">
            <button className="hamburger-btn mobile-only" onClick={() => setSidebarOpen(true)} aria-label="메뉴 열기">
              <MenuIcon />
            </button>
            <div className="desktop-only top-bar-page-info">
              <h2 className="top-bar-title">{pageTitle}</h2>
              {activeTab === '위험도 현황' && currentView === 'dashboard' && (
                <span className="top-bar-date">{selectedDate} 기준</span>
              )}
            </div>
            <span className="mobile-only top-bar-mobile-title">{pageTitle}</span>
          </div>

          <div className="top-bar-right">
            <div className="search-wrapper desktop-only">
              <svg className="search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                type="text"
                className="form-input search-input"
                placeholder="대상자 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </header>

        {apiError && (
          <div className="api-error-banner">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            서버에 연결할 수 없습니다. AWS 연결 상태를 확인해주세요.
          </div>
        )}

        <main className="content-area">
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
                onDelete={async (id) => {
                    const target = recipients.find(r => r.recipientId === id);
                    try {
                      await deleteRecipient(id);
                      setRecipients(prev => prev.filter(r => r.recipientId !== id));
                      showToast(`${target?.name || '대상자'}님이 삭제되었습니다.`);
                    } catch (err) {
                      showToast(`삭제 실패: ${err.message}`);
                    }
                  }}
                onManualCall={(r) => console.log(`수동 발신 요청: ${r.name} (${r.phoneNumber})`)}
              />
            )
          ) : currentView === 'myAccount' ? (
            <MyAccountScreen user={currentUser} onSaveProfile={() => {}} onChangePassword={() => {}} />
          ) : null}
        </main>
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

      {toast && (
        <div className="toast">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          {toast}
        </div>
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
