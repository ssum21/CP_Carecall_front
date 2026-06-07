import React, { useState, useEffect } from 'react';
import { getRecordingPresignedUrl } from '../api/dashboardApi';

const RISK_COLORS = {
  위험: 'var(--color-danger)',
  주의: 'var(--color-warning)',
  정상: 'var(--color-success)',
  미응답: 'var(--color-text-light)',
};

const SENTIMENT_LABELS = {
  POSITIVE: { label: '긍정', color: 'var(--color-success)', bg: 'var(--color-success-light)' },
  NEGATIVE: { label: '부정', color: 'var(--color-danger)', bg: 'var(--color-danger-light)' },
  NEUTRAL: { label: '중립', color: 'var(--color-text-muted)', bg: 'var(--color-bg-subtle)' },
  MIXED: { label: '복합', color: 'var(--color-warning-hover)', bg: 'var(--color-warning-light)' },
};

const DEFAULT_AVATAR = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2'%3E%3C/path%3E%3Ccircle cx='12' cy='7' r='4'%3E%3C/circle%3E%3C/svg%3E";

function SentimentLineChart({ history, isLoading, error }) {
  const data = history.filter(r => r.status === '응답').slice(0, 7).reverse();

  if (isLoading) return (
    <div style={{ height: '160px', backgroundColor: 'var(--color-bg-surface)', borderRadius: 'var(--radius-xl)', marginBottom: '2rem', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '24px', height: '24px', border: '2.5px solid var(--color-border)', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  );

  if (error || data.length < 2) return (
    <div style={{ padding: '1.25rem 1.5rem', backgroundColor: 'var(--color-bg-surface)', borderRadius: 'var(--radius-xl)', marginBottom: '2rem', border: '1px solid var(--color-border)' }}>
      <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>감정 지수 추이는 2회 이상 응답 시 표시됩니다.</span>
    </div>
  );

  const W = 560, H = 150, PL = 28, PR = 28, PT = 24, PB = 10;
  const cW = W - PL - PR, cH = H - PT - PB;

  const scores = data.map(d => d.sentimentScore ?? 50);
  const latest = scores[scores.length - 1];
  const trendDiff = latest - scores[scores.length - 2];
  const zc = s => s >= 70 ? '#10b981' : s >= 40 ? '#f59e0b' : '#ef4444';
  const lineColor = '#94a3b8';

  const gx = i => PL + (i / (data.length - 1)) * cW;
  const gy = s => PT + cH * (1 - s / 100);
  const pts = scores.map((s, i) => ({ x: gx(i), y: gy(s), s }));

  let linePath = `M${pts[0].x},${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const cx = (pts[i - 1].x + pts[i].x) / 2;
    linePath += ` C${cx},${pts[i - 1].y} ${cx},${pts[i].y} ${pts[i].x},${pts[i].y}`;
  }
  const areaPath = `${linePath} L${pts[pts.length-1].x},${PT+cH} L${pts[0].x},${PT+cH}Z`;

  return (
    <div style={{ backgroundColor: 'var(--color-bg-surface)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--color-border)', marginBottom: '2rem', overflow: 'hidden' }}>

      {/* 헤더 */}
      <div style={{ padding: '1rem 1.375rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)' }}>
        <div>
          <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-text-main)' }}>감정 지수 추이</div>
          <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-light)', marginTop: '0.1rem' }}>최근 {data.length}회 통화</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.375rem' }}>
          <span style={{ fontSize: '1.75rem', fontWeight: 900, color: lineColor, lineHeight: 1 }}>{latest}</span>
          <span style={{ fontSize: '0.875rem', fontWeight: 700, color: trendDiff >= 0 ? '#10b981' : '#ef4444' }}>
            {trendDiff >= 0 ? '↑' : '↓'}{Math.abs(trendDiff)}
          </span>
        </div>
      </div>

      {/* 차트 */}
      <div style={{ padding: '0.75rem 1.375rem 0' }}>
        <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ display: 'block', height: '120px' }}>
          <defs>
            <linearGradient id="slt-g" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={lineColor} stopOpacity="0.18" />
              <stop offset="100%" stopColor={lineColor} stopOpacity="0" />
            </linearGradient>
          </defs>
          <line x1={PL} y1={gy(50)} x2={PL+cW} y2={gy(50)} stroke="var(--color-border)" strokeWidth="1" strokeDasharray="4,3" />
          <path d={areaPath} fill="url(#slt-g)" />
          <path d={linePath} fill="none" stroke={lineColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          {pts.map((pt, i) => {
            const c = zc(pt.s);
            const labelY = pt.s >= 82 ? pt.y + 16 : pt.y - 9;
            return (
              <g key={i}>
                <text x={pt.x} y={labelY} textAnchor="middle" fontSize="11" fontWeight="800" fill={c}>{pt.s}</text>
                <circle cx={pt.x} cy={pt.y} r="5" fill="white" stroke={c} strokeWidth="2.5" />
                <circle cx={pt.x} cy={pt.y} r="2.5" fill={c} />
              </g>
            );
          })}
        </svg>

        {/* 날짜 */}
        <div style={{ position: 'relative', height: '28px', marginTop: '0.25rem' }}>
          {data.map((d, i) => {
            const dt = new Date(d.callTime);
            return (
              <span key={i} style={{
                position: 'absolute',
                left: `${(gx(i) / W * 100).toFixed(1)}%`,
                transform: 'translateX(-50%)',
                fontSize: '0.6875rem',
                fontWeight: 600,
                color: 'var(--color-text-light)',
                whiteSpace: 'nowrap',
              }}>
                {dt.getMonth()+1}/{dt.getDate()}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function RecordingPlayer({ recordingS3Key, recordingS3Bucket }) {
  const [url, setUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [downloadErrorMsg, setDownloadErrorMsg] = useState(null);

  useEffect(() => {
    if (!recordingS3Key) return;
    setLoading(true);
    setErrorMsg(null);
    getRecordingPresignedUrl(recordingS3Key, recordingS3Bucket)
      .then(data => setUrl(data.url))
      .catch(err => setErrorMsg(err.message || '녹음 파일을 불러올 수 없습니다.'))
      .finally(() => setLoading(false));
  }, [recordingS3Key, recordingS3Bucket]);

  const handleDownload = async () => {
    setDownloadErrorMsg(null);
    try {
      const data = await getRecordingPresignedUrl(recordingS3Key, recordingS3Bucket, true);
      window.open(data.url, '_blank');
    } catch (err) {
      setDownloadErrorMsg(err.message || '다운로드 링크 발급에 실패했습니다.');
      setTimeout(() => setDownloadErrorMsg(null), 4000);
    }
  };

  return (
    <div style={{
      padding: '0.875rem 1.5rem',
      borderBottom: '1px solid var(--color-border)',
      backgroundColor: 'var(--color-bg-subtle)',
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
    }}>
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
        <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
        <line x1="12" y1="19" x2="12" y2="23"/>
        <line x1="8" y1="23" x2="16" y2="23"/>
      </svg>
      <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-text-main)', flexShrink: 0 }}>통화 녹음</span>

      <div style={{ flex: 1, minWidth: 0 }}>
        {loading && (
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>불러오는 중...</div>
        )}
        {errorMsg && (
          <div style={{ fontSize: '0.75rem', color: 'var(--color-danger)', fontWeight: 600 }}>{errorMsg}</div>
        )}
        {downloadErrorMsg && (
          <div style={{ fontSize: '0.75rem', color: 'var(--color-danger)', fontWeight: 600 }}>{downloadErrorMsg}</div>
        )}
        {url && !loading && !errorMsg && (
          <audio
            src={url}
            controls
            style={{ width: '100%', height: '32px', accentColor: 'var(--color-primary)' }}
            onError={() => setErrorMsg('재생 중 오류가 발생했습니다. 파일이 만료되었을 수 있습니다.')}
          />
        )}
      </div>

      {url && !errorMsg && (
        <button
          onClick={handleDownload}
          title="녹음 파일 다운로드"
          aria-label="녹음 파일 다운로드"
          style={{
            flexShrink: 0,
            padding: '0.375rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border-dark)',
            backgroundColor: 'transparent',
            cursor: 'pointer',
            color: 'var(--color-text-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.color = 'var(--color-primary)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border-dark)'; e.currentTarget.style.color = 'var(--color-text-muted)'; }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
        </button>
      )}
    </div>
  );
}

function ChatView({ record, recipientName, onBack }) {
  return (
    <div style={{ animation: 'fadeIn 0.3s ease-out', display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: 'var(--color-bg-body)' }}>
      <div style={{ padding: '1.25rem 2rem', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '1.25rem', backgroundColor: 'var(--color-bg-surface)', position: 'sticky', top: 0, zIndex: 10 }}>
        <button className="btn btn-outline" onClick={onBack} style={{ padding: '0.5rem', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
          뒤로가기
        </button>
        <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--color-border)' }}></div>
        <div>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 800, margin: 0 }}>전체 발화 분석 리포트</h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: 0 }}>{recipientName} 님과의 통화 전문</p>
        </div>
      </div>

      {record.recordingS3Key && (
        <RecordingPlayer recordingS3Key={record.recordingS3Key} recordingS3Bucket={record.recordingS3Bucket} />
      )}

      <div style={{ flex: 1, overflowY: 'auto', padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div style={{ alignSelf: 'center', backgroundColor: 'var(--color-bg-surface)', padding: '0.5rem 1.25rem', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', border: '1px solid var(--color-border)', marginBottom: '1rem' }}>
          {new Date(record.callTime).toLocaleString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })} 통화 시작
        </div>

        {record.conversation && record.conversation.map((msg, idx) => (
          <div key={idx} style={{ display: 'flex', gap: '1rem', flexDirection: msg.speaker === 'AI' ? 'row' : 'row-reverse' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '14px', backgroundColor: msg.speaker === 'AI' ? 'var(--color-primary)' : 'var(--color-warning)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 900, flexShrink: 0, boxShadow: 'var(--shadow-sm)' }}>
              {msg.speaker === 'AI' ? 'AI' : 'USR'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: msg.speaker === 'AI' ? 'flex-start' : 'flex-end', maxWidth: '70%' }}>
              <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: '0.375rem', padding: '0 0.5rem' }}>
                {msg.speaker === 'AI' ? 'AI 상담원' : `${recipientName} 님`}
              </span>
              <div style={{ padding: '1rem 1.375rem', borderRadius: '1.5rem', fontSize: '0.9375rem', lineHeight: 1.6, backgroundColor: msg.speaker === 'AI' ? 'var(--color-bg-surface)' : 'var(--color-primary)', color: msg.speaker === 'AI' ? 'var(--color-text-main)' : 'white', border: msg.speaker === 'AI' ? '1px solid var(--color-border)' : 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', borderTopLeftRadius: msg.speaker === 'AI' ? '0.25rem' : '1.5rem', borderTopRightRadius: msg.speaker === 'AI' ? '1.5rem' : '0.25rem' }}>
                {msg.text}
              </div>
            </div>
          </div>
        ))}
        <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--color-text-light)', fontSize: '0.8125rem', fontWeight: 700, letterSpacing: '0.1em' }}>
          • • • 통화 종료 • • •
        </div>
      </div>
    </div>
  );
}

export default function CallTimeline({ history, isLoading, recipientName, onClose, recipientPhoto }) {
  const [selectedRecord, setSelectedRecord] = useState(null);

  if (selectedRecord) {
    return (
      <div className="modal-overlay">
        <div className="modal-content" style={{ maxWidth: '52rem', height: '88vh', overflow: 'hidden', border: 'none' }}>
          <ChatView record={selectedRecord} recipientName={recipientName} onBack={() => setSelectedRecord(null)} />
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '56rem', display: 'flex', flexDirection: 'column', height: '92vh' }}>
        <div style={{ padding: '1.5rem 2.5rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--color-bg-surface)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div style={{ width: '60px', height: '60px', borderRadius: '16px', overflow: 'hidden', backgroundColor: 'var(--color-bg-subtle)', border: '1px solid var(--color-border)', flexShrink: 0 }}>
              <img src={recipientPhoto || DEFAULT_AVATAR} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 900, margin: 0 }}>{recipientName} 이력 상세</h2>
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', margin: '0.25rem 0 0' }}>AI 기반 정밀 분석 히스토리</p>
            </div>
          </div>
          <button className="btn btn-ghost" aria-label="닫기" style={{ padding: '0.5rem', borderRadius: '50%' }} onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '2.5rem', backgroundColor: 'var(--color-bg-body)' }}>
          <SentimentLineChart history={history} isLoading={isLoading} />

          <h3 style={{ fontSize: '1.125rem', fontWeight: 800, marginBottom: '1.5rem', color: 'var(--color-text-main)' }}>타임라인</h3>

          {isLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '4rem 0' }}>
              <div style={{ width: '28px', height: '28px', border: '3px solid var(--color-border)', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            </div>
          ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {history.map((record) => {
              const isUnanswered = record.status === '미응답';
              const sentiment = record.sentiment ? SENTIMENT_LABELS[record.sentiment] : null;
              const scoreOnly = !sentiment && record.sentimentScore != null;

              return (
                <div key={record.contactId} className="card" style={{ padding: '1.75rem', border: '1px solid var(--color-border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: '1.125rem', fontWeight: 900, color: 'var(--color-text-main)' }}>{new Date(record.callTime).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })}</div>
                      <div style={{ display: 'flex', gap: '0.625rem', marginTop: '0.875rem' }}>
                        <span className={`badge ${isUnanswered ? 'badge-neutral' : 'badge-success'}`} style={{ padding: '0.25rem 0.75rem', fontWeight: 800 }}>{record.status}</span>
                        {!isUnanswered && (
                          <>
                            <span className={`badge ${record.riskLevel === '위험' ? 'badge-danger' : record.riskLevel === '주의' ? 'badge-warning' : 'badge-success'}`} style={{ padding: '0.25rem 0.75rem', fontWeight: 800 }}>{record.riskLevel}</span>
                            {sentiment && <span style={{ fontSize: '0.75rem', fontWeight: 800, padding: '0.25rem 0.75rem', borderRadius: '99px', color: sentiment.color, backgroundColor: sentiment.bg, border: `1px solid ${sentiment.color}` }}>{sentiment.label} ({record.sentimentScore}점)</span>}
                            {scoreOnly && <span style={{ fontSize: '0.75rem', fontWeight: 800, padding: '0.25rem 0.75rem', borderRadius: '99px', color: 'var(--color-text-muted)', backgroundColor: 'var(--color-bg-subtle)', border: '1px solid var(--color-border-dark)' }}>{record.sentimentScore}점</span>}
                          </>
                        )}
                      </div>
                    </div>
                    {!isUnanswered && (
                      <button className="btn btn-primary" style={{ padding: '0.625rem 1.25rem', borderRadius: 'var(--radius-lg)', fontWeight: 800, boxShadow: 'var(--shadow-md)' }} onClick={() => setSelectedRecord(record)}>대화 상세 리포트</button>
                    )}
                  </div>

                  {!isUnanswered && (
                    <div style={{ marginTop: '1.5rem', display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.25rem' }}>
                      <div style={{ padding: '1.25rem', backgroundColor: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)' }}>
                        <div style={{ fontSize: '0.6875rem', fontWeight: 900, color: 'var(--color-text-light)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>AI 컨텍스트 요약</div>
                        <p style={{ fontSize: '0.9375rem', color: 'var(--color-text-main)', margin: 0, lineHeight: 1.6, fontWeight: 500 }}>{record.summary}</p>
                      </div>
                      <div style={{ padding: '1.25rem', backgroundColor: record.riskLevel === '정상' ? 'var(--color-success-light)' : 'var(--color-danger-light)', borderRadius: 'var(--radius-lg)', border: `1px solid ${record.riskLevel === '정상' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}` }}>
                        <div style={{ fontSize: '0.6875rem', fontWeight: 900, color: record.riskLevel === '정상' ? 'var(--color-success-hover)' : 'var(--color-danger-hover)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>판단 근거</div>
                        <p style={{ fontSize: '0.9375rem', color: 'var(--color-text-main)', margin: 0, fontWeight: 700 }}>{record.riskReason || '이상 징후 미발견'}</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          )}
        </div>
      </div>
    </div>
  );
}
