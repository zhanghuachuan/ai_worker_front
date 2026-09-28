import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { TaskMessage } from '../types';

function formatTime(ts: string): string {
  if (!ts) return '';
  const d = new Date(ts);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function getIcon(msg: TaskMessage): string {
  switch (msg.type) {
    case 'assign': return '>>';
    case 'result': return 'OK';
    case 'reply': return '<-';
    case 'feedback': return '!!';
    case 'request_clarify': return '?';
    case 'notify': return '~';
    default: return '*';
  }
}

function getIconColor(msg: TaskMessage): string {
  switch (msg.type) {
    case 'assign': return '#3b82f6';
    case 'result': return '#10b981';
    case 'reply': return '#8b5cf6';
    case 'feedback': return '#f59e0b';
    case 'request_clarify': return '#ef4444';
    case 'notify': return '#6b7280';
    default: return '#06b6d4';
  }
}

interface Props {
  messages: TaskMessage[];
}

export default function Timeline({ messages }: Props) {
  if (messages.length === 0) {
    return (
      <div className="timeline-empty">
        No messages yet. Send a message below to start.
      </div>
    );
  }

  return (
    <div className="timeline-list">
      {messages.map((msg) => {
        const iconColor = getIconColor(msg);
        return (
          <div className="timeline-item" key={msg.id}>
            <div
              className="timeline-icon"
              style={{ background: iconColor + '25', color: iconColor }}
            >
              {getIcon(msg)}
            </div>
            <div className="timeline-content">
              <div className="timeline-route">
                <span className="from">{msg.from_agent || 'user'}</span>
                <span className="arrow">{'->'}</span>
                <span className="to">{msg.to_agent}</span>
              </div>
              <div className="timeline-meta">
                <span className={`tag type-${msg.type}`}>{msg.type}</span>
                <span className={`tag priority-${msg.priority}`}>{msg.priority}</span>
                <span className={`tag status-${msg.status}`}>{msg.status}</span>
              </div>
              <div className="timeline-text">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
              </div>
              <div className="timeline-time">{formatTime(msg.timestamp)}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
