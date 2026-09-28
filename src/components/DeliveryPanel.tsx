import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { TaskMessage } from '../types';

interface DeliveryPanelProps {
  results: TaskMessage[];
}

export default function DeliveryPanel({ results }: DeliveryPanelProps) {
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);

  if (results.length === 0) {
    return (
      <div className="delivery-panel delivery-empty">
        <div className="delivery-header">
          <span className="delivery-icon">📦</span>
          <span className="delivery-title">交付结果</span>
        </div>
        <div className="delivery-placeholder">
          等待 agent 完成任务后，结果将在此展示
        </div>
      </div>
    );
  }

  const handleCopy = (content: string, idx: number) => {
    navigator.clipboard.writeText(content).then(() => {
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 2000);
    });
  };

  // Sort by timestamp descending (newest first), with fallback for equal timestamps
  const sorted = [...results].sort((a, b) => {
    const ta = new Date(a.timestamp).getTime();
    const tb = new Date(b.timestamp).getTime();
    if (ta !== tb) return tb - ta;
    // If timestamps are equal, later array index = newer
    return results.indexOf(b) - results.indexOf(a);
  });
  const latest = sorted[0];
  const history = sorted.slice(1);

  const renderCard = (msg: TaskMessage, idx: number, isLatest: boolean) => {
    const time = new Date(msg.timestamp).toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    return (
      <div key={msg.id || idx} className={`delivery-card ${isLatest ? 'latest' : ''}`}>
        <div className="delivery-card-header">
          {isLatest && <span className="delivery-badge">最新</span>}
          <span className="delivery-from">{msg.from_agent}</span>
          <span className="delivery-time">{time}</span>
          <button className="delivery-copy" onClick={() => handleCopy(msg.content, idx)}>
            {copiedIdx === idx ? '✓ 已复制' : '复制'}
          </button>
        </div>
        <div className="delivery-content">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
        </div>
      </div>
    );
  };

  return (
    <div className="delivery-panel">
      <div className="delivery-header">
        <span className="delivery-icon">📦</span>
        <span className="delivery-title">交付结果</span>
        <span className="delivery-count">{results.length} 条进展</span>
      </div>
      <div className="delivery-body">
        {/* Latest result - always visible */}
        {renderCard(latest, 0, true)}

        {/* History section - collapsible */}
        {history.length > 0 && (
          <div className="delivery-history-section">
            <button
              className="delivery-history-toggle"
              onClick={() => setHistoryOpen(!historyOpen)}
            >
              <span className={`delivery-chevron ${historyOpen ? 'open' : ''}`}>▶</span>
              {historyOpen ? '收起历史交付' : '查看历史交付'}
              <span className="delivery-history-count">({history.length} 条)</span>
            </button>
            {historyOpen && (
              <div className="delivery-history-list">
                {history.map((msg, i) => renderCard(msg, i + 1, false))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
