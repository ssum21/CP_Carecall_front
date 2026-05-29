import React, { useState, useEffect } from 'react';
import { fetchTodayCallStatus, fetchCorrectionStats } from '../api/dashboardApi';

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

const AI_STATS = {};

const EMPTY_CORRECTION_STATS = {
  correctionCount: 0,
  correctionByLevel: { 위험: 0, 주의: 0, 정상: 0 },
};

const EMPTY_CALL_STATS = {
  totalCalls: 0,
  successCalls: 0,
  missedCalls: 0,
  callSuccessRate: 0,
  dailyCalls: [0, 0, 0, 0, 0, 0, 0],
  dailyLabels: ['월', '화', '수', '목', '금', '토', '일'],
};

function getLast7Dates() {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toLocaleDateString('sv-SE', { timeZone: 'Asia/Seoul' });
  });
}

function CircleProgress({ percent, size = 88, strokeWidth = 7, color, children }) {
  const r = (size - strokeWidth * 2) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - Math.min(percent, 100) / 100);
  return (
    <div style={{ position: 'relative', width: size, height: size, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <svg width={size} height={size} style={{ position: 'absolute', top: 0, left: 0, transform: 'rotate(-90deg)' }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--color-border)" strokeWidth={strokeWidth} />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.7s ease' }} />
      </svg>
      <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>{children}</div>
    </div>
  );
}

function MiniBar({ value, max, color }) {
  return (
    <div style={{ height: '5px', backgroundColor: 'var(--color-border)', borderRadius: '99px', overflow: 'hidden', flex: 1 }}>
      <div style={{ width: `${max > 0 ? (value / max) * 100 : 0}%`, height: '100%', backgroundColor: color, borderRadius: '99px', transition: 'width 0.7s ease' }} />
    </div>
  );
}

function BarChart({ values, labels, color }) {
  const max = Math.max(...values, 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: '60px' }}>
      {values.map((v, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', height: '100%', justifyContent: 'flex-end' }}>
          <div style={{
            width: '100%', backgroundColor: color, borderRadius: '3px 3px 0 0',
            height: `${(v / max) * 100}%`, minHeight: v > 0 ? '3px' : '0',
            transition: 'height 0.7s ease', opacity: 0.85,
          }} />
          <span style={{ fontSize: '0.5625rem', color: 'var(--color-text-light)', whiteSpace: 'nowrap' }}>{labels[i]}</span>
        </div>
      ))}
    </div>
  );
}

export default function StatsPanel() {
  const [callStats, setCallStats] = useState(null);
  const [correctionStats, setCorrectionStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const dates = getLast7Dates();
    const today = dates[dates.length - 1];

    Promise.allSettled([
      Promise.all(dates.map(date => fetchTodayCallStatus(date))),
      fetchCorrectionStats(today),
    ]).then(([callsResult, correctionResult]) => {
      if (callsResult.status === 'fulfilled') {
        const results = callsResult.value;
        const dailyCalls = results.map(r => r.total || 0);
        const dailyLabels = dates.map(date => {
          const d = new Date(`${date}T00:00:00+09:00`);
          return DAY_LABELS[d.getDay()];
        });
        const totalCalls = dailyCalls.reduce((a, b) => a + b, 0);
        const missedCalls = results.reduce((acc, r) => acc + (r.riskCounts?.미응답 || 0), 0);
        const successCalls = totalCalls - missedCalls;
        const callSuccessRate = totalCalls > 0 ? (successCalls / totalCalls) * 100 : 0;
        setCallStats({ totalCalls, successCalls, missedCalls, callSuccessRate, dailyCalls, dailyLabels });
      } else {
        console.error('통계 로딩 실패:', callsResult.reason);
      }
      if (correctionResult.status === 'fulfilled') {
        const stats = correctionResult.value;
        setCorrectionStats({
          correctionCount: stats.totalCorrections,
          correctionByLevel: stats.correctionByLevel,
        });
      } else {
        console.error('정정 통계 로딩 실패:', correctionResult.reason);
      }
    }).finally(() => setIsLoading(false));
  }, []);

  const d = { ...AI_STATS, ...EMPTY_CORRECTION_STATS, ...(correctionStats || {}), ...(callStats || EMPTY_CALL_STATS) };

  return (
    <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.025em' }}>통계</h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
            최근 7일 시스템 운영 현황을 수치로 확인합니다.
          </p>
        </div>
        {isLoading && (
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '14px', height: '14px', border: '2px solid var(--color-border)', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            불러오는 중...
          </div>
        )}
      </div>

      {/* Row 1: 2 core KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>

        <div className="card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <CircleProgress percent={d.callSuccessRate} color="var(--color-primary)">
            <div style={{ fontSize: '1.0625rem', fontWeight: 800, color: 'var(--color-primary)', lineHeight: 1 }}>{d.callSuccessRate.toFixed(1)}</div>
            <div style={{ fontSize: '0.5625rem', color: 'var(--color-text-muted)' }}>%</div>
          </CircleProgress>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: '0.9375rem', marginBottom: '0.625rem' }}>안부 전화 성공률</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.625rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', flexShrink: 0 }}>성공</span>
                <MiniBar value={d.successCalls} max={d.totalCalls} color="var(--color-primary)" />
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-primary)', flexShrink: 0 }}>{d.successCalls}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.625rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', flexShrink: 0 }}>미응답</span>
                <MiniBar value={d.missedCalls} max={d.totalCalls} color="var(--color-border-dark)" />
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', flexShrink: 0 }}>{d.missedCalls}</span>
              </div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-light)', marginTop: '0.125rem' }}>
                총 {d.totalCalls.toLocaleString()}건 발신
              </div>
            </div>
          </div>
        </div>

        {(() => {
          const matched = Math.max(0, d.successCalls - d.correctionCount);
          const mismatched = d.correctionCount;
          const total = d.successCalls;
          const accuracy = total > 0 ? (matched / total) * 100 : 0;
          return (
            <div className="card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <CircleProgress percent={accuracy} color="var(--color-success)">
                <div style={{ fontSize: '1.0625rem', fontWeight: 800, color: 'var(--color-success-hover)', lineHeight: 1 }}>{accuracy.toFixed(1)}</div>
                <div style={{ fontSize: '0.5625rem', color: 'var(--color-text-muted)' }}>%</div>
              </CircleProgress>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: '0.9375rem', marginBottom: '0.625rem' }}>AI 위험 탐지 정확도</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.625rem' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', flexShrink: 0, width: '42px' }}>일치</span>
                    <MiniBar value={matched} max={total || 1} color="var(--color-success)" />
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-success-hover)', flexShrink: 0 }}>{matched}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.625rem' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', flexShrink: 0, width: '42px' }}>불일치</span>
                    <MiniBar value={mismatched} max={total || 1} color="var(--color-danger)" />
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-danger)', flexShrink: 0 }}>{mismatched}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Row 2: 정정 현황 + 발신 추이 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>

        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.9375rem' }}>위험도 수동 정정 현황</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                AI 판정을 관리자가 직접 정정한 건수
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--color-primary)', lineHeight: 1 }}>{d.correctionCount}</span>
              <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>건</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[
              { label: '위험으로 정정', value: d.correctionByLevel.위험, color: 'var(--color-danger)', bg: 'var(--color-danger-light)', textColor: 'var(--color-danger-hover)' },
              { label: '주의로 정정', value: d.correctionByLevel.주의, color: 'var(--color-warning)', bg: 'var(--color-warning-light)', textColor: 'var(--color-warning-hover)' },
              { label: '정상으로 정정', value: d.correctionByLevel.정상, color: 'var(--color-success)', bg: 'var(--color-success-light)', textColor: 'var(--color-success-hover)' },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{
                  fontSize: '0.75rem', fontWeight: 600, flexShrink: 0, width: '88px',
                  padding: '0.25rem 0.5rem', backgroundColor: item.bg, color: item.textColor,
                  borderRadius: '99px', textAlign: 'center',
                }}>{item.label}</span>
                <MiniBar value={item.value} max={d.correctionCount || 1} color={item.color} />
                <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-text-main)', flexShrink: 0, width: '20px', textAlign: 'right' }}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ marginBottom: '1.25rem' }}>
            <div style={{ fontWeight: 700, fontSize: '0.9375rem' }}>발신 추이</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
              최근 7일 일별 발신 건수
            </div>
          </div>
          <BarChart values={d.dailyCalls} labels={d.dailyLabels} color="var(--color-primary)" />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--color-border)' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.0625rem', fontWeight: 800, color: 'var(--color-text-main)' }}>{Math.max(...d.dailyCalls)}</div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>최대</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.0625rem', fontWeight: 800, color: 'var(--color-text-main)' }}>{Math.round(d.dailyCalls.reduce((a, b) => a + b, 0) / d.dailyCalls.length)}</div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>평균</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.0625rem', fontWeight: 800, color: 'var(--color-text-main)' }}>{Math.min(...d.dailyCalls)}</div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>최소</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.0625rem', fontWeight: 800, color: 'var(--color-primary)' }}>{d.totalCalls.toLocaleString()}</div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>합계</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
