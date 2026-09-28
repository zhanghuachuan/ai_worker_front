import type { AgentState } from '../types';

// Color palette for agent avatars based on agent type.
const AVATAR_COLORS: Record<string, string> = {
  pm: '#3b82f6',
  coder: '#10b981',
  reviewer: '#f59e0b',
  tester: '#ef4444',
  devops: '#8b5cf6',
};

function getInitial(name: string): string {
  if (!name) return '?';
  return name.charAt(0).toUpperCase();
}

function getColor(type: string): string {
  return AVATAR_COLORS[type] || '#06b6d4';
}

function formatTime(ts: string): string {
  if (!ts) return '';
  const d = new Date(ts);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

interface Props {
  agent: AgentState;
  isEntry: boolean;
}

export default function AgentCard({ agent, isEntry }: Props) {
  const isProcessing = agent.status === 'processing';
  const color = getColor(agent.type);

  return (
    <div className={`agent-card ${isProcessing ? 'processing' : ''} ${isEntry ? 'entry' : ''}`}>
      <div className="agent-card-header">
        <div className="agent-avatar" style={{ background: color + '30', color }}>
          {getInitial(agent.display_name || agent.name)}
        </div>
        <div className="agent-info">
          <div className="agent-name">{agent.display_name || agent.name}</div>
          <div className="agent-type">{agent.type}</div>
        </div>
        <span className={`agent-status ${agent.status}`}>{agent.status}</span>
      </div>

      <div className="agent-desc">{agent.description || 'No description'}</div>

      <div className="agent-output">
        <div className="output-label">Last Output</div>
        <div className="output-text">
          {agent.last_output || '(waiting...)'}
        </div>
      </div>

      <div className="agent-footer">
        <span className={`pending-badge ${agent.pending_count > 0 ? 'has-tasks' : ''}`}>
          {agent.pending_count} pending
        </span>
        <span>{formatTime(agent.last_active)}</span>
      </div>
    </div>
  );
}
