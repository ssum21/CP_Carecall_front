import React, { useEffect, useState } from 'react';
import { ADMIN_STATUS_META, ROLE_META } from './adminMockData';

function formatDateLabel(value) {
  if (!value || value.includes('초대') || value.includes('잠금') || value.includes('방금')) return value || '-';
  return new Date(value).toLocaleString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export default function AdminAccountsScreen({ accounts, currentUser, onUpdateStatus }) {
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedId, setSelectedId] = useState(accounts[0]?.id || null);

  const filteredAccounts = accounts.filter((account) => {
    const matchesQuery = !query || account.name.includes(query) || account.email.toLowerCase().includes(query.toLowerCase()) || account.role.includes(query);
    const matchesStatus = statusFilter === 'ALL' || account.status === statusFilter;
    return matchesQuery && matchesStatus;
  });

  const selectedAccount = accounts.find((account) => account.id === selectedId) || filteredAccounts[0] || accounts[0] || null;

  return (
    <div className="admin-workspace" style={{ animation: 'fadeIn 0.3s ease-out' }}>
      <div className="section-grid">
        <div className="content-surface">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 className="surface-title">관리자 계정</h2>
            <div className="toolbar">
              <input
                style={{ width: '200px' }}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="검색..."
              />
              <select style={{ width: '140px' }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="ALL">전체 상태</option>
                <option value="ACTIVE">활성</option>
                <option value="INVITED">초대 대기</option>
                <option value="LOCKED">잠금</option>
              </select>
            </div>
          </div>

          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>관리자 정보</th>
                  <th>역할</th>
                  <th>상태</th>
                  <th>최근 접속</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filteredAccounts.map((account) => {
                  const statusMeta = ADMIN_STATUS_META[account.status];
                  return (
                    <tr key={account.id} style={{ cursor: 'pointer', backgroundColor: selectedId === account.id ? 'var(--color-bg-subtle)' : '' }} onClick={() => setSelectedId(account.id)}>
                      <td>
                        <div className="table-primary">{account.name}</div>
                        <div className="table-secondary">{account.email}</div>
                      </td>
                      <td>
                        <span className="inline-badge" style={{ backgroundColor: 'var(--color-bg-subtle)', color: 'var(--color-text-main)' }}>
                          {account.role}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${account.status === 'ACTIVE' ? 'badge-success' : account.status === 'LOCKED' ? 'badge-danger' : 'badge-neutral'}`}>
                          {statusMeta?.label || account.status}
                        </span>
                      </td>
                      <td className="table-secondary">{formatDateLabel(account.lastAccess)}</td>
                      <td>
                        <button className="table-action-button">보기</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="stack-layout">
          {selectedAccount ? (
            <div className="content-surface">
              <div className="profile-summary" style={{ marginBottom: '2rem' }}>
                <div className="profile-summary__avatar">{selectedAccount.name.slice(0, 1)}</div>
                <div>
                  <div style={{ fontSize: '1.125rem', fontWeight: 700 }}>
                    {selectedAccount.name}
                    {selectedAccount.id === currentUser.id && <span className="badge badge-success" style={{ marginLeft: '0.5rem', fontSize: '0.625rem' }}>본인</span>}
                  </div>
                  <div className="table-secondary">{selectedAccount.email}</div>
                </div>
              </div>

              <div className="detail-grid" style={{ marginBottom: '2rem' }}>
                <DetailItem label="기관" value={selectedAccount.orgName} />
                <DetailItem label="부서" value={selectedAccount.department} />
                <DetailItem label="직책" value={selectedAccount.title} />
                <DetailItem label="연락처" value={selectedAccount.phone} />
              </div>

              <div style={{ marginBottom: '2rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>보유 권한</div>
                <div className="chip-list">
                  {selectedAccount.permissions.map((p) => <span key={p} className="chip-token">{p}</span>)}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>계정 상태 제어</div>
                <div className="action-row">
                  <button className="secondary-button" onClick={() => onUpdateStatus(selectedAccount.id, 'ACTIVE')}>활성</button>
                  <button className="secondary-button" onClick={() => onUpdateStatus(selectedAccount.id, 'INACTIVE')}>비활성</button>
                  <button className="secondary-button" style={{ color: 'var(--color-danger)', borderColor: 'var(--color-danger)' }} onClick={() => onUpdateStatus(selectedAccount.id, 'LOCKED')}>잠금 처리</button>
                </div>
              </div>
            </div>
          ) : (
            <div className="content-surface" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
              계정을 선택하여 상세 정보를 확인하세요.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailItem({ label, value }) {
  return (
    <div className="detail-item">
      <span className="detail-item__label">{label}</span>
      <strong className="detail-item__value">{value || '-'}</strong>
    </div>
  );
}
