import type { AgentState, TaskMessage } from '../types';

// Agent type -> color theme
const TYPE_THEME: Record<string, { color: string; emoji: string; desk: string }> = {
  project_manager: { color: '#3b82f6', emoji: '📋', desk: '#1e3a5f' },
  product_manager: { color: '#8b5cf6', emoji: '📝', desk: '#3a1e5f' },
  developer:      { color: '#10b981', emoji: '💻', desk: '#1e3a2f' },
  code_reviewer:  { color: '#f59e0b', emoji: '🔍', desk: '#3a2e1e' },
  tester:         { color: '#ef4444', emoji: '🧪', desk: '#3a1e1e' },
  default:        { color: '#06b6d4', emoji: '🤖', desk: '#1e2e3a' },
};

function getTheme(type: string) {
  return TYPE_THEME[type] || TYPE_THEME.default;
}

function shortName(name: string): string {
  return name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
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
  recentMessages: TaskMessage[]; // messages involving this agent
}

export default function Workstation({ agent, isEntry, recentMessages }: Props) {
  const theme = getTheme(agent.type);
  const isProcessing = agent.status === 'processing';
  const hasPending = agent.pending_count > 0;

  // Latest message content for speech bubble
  const latestMsg = recentMessages[0];
  const bubbleText = isProcessing && latestMsg
    ? latestMsg.content.slice(0, 60) + (latestMsg.content.length > 60 ? '...' : '')
    : agent.last_output
      ? agent.last_output.slice(0, 60) + (agent.last_output.length > 60 ? '...' : '')
      : '';

  return (
    <div className={`workstation ${isProcessing ? 'processing' : ''} ${isEntry ? 'entry' : ''}`}>
      {/* Speech bubble */}
      {bubbleText && (
        <div className="speech-bubble" style={{ borderColor: theme.color }}>
          <div className="bubble-text">{bubbleText}</div>
          <div className="bubble-tail" style={{ borderTopColor: theme.color + '20' }} />
        </div>
      )}

      {/* Character */}
      <div className="character-area">
        <svg className="character" viewBox="0 0 120 140" width="90" height="105">
          {/* Chair back */}
          <rect x="35" y="95" width="50" height="35" rx="6" fill="#2d3142" />

          {/* Body */}
          <rect x="38" y="60" width="44" height="45" rx="8" fill={theme.color} opacity="0.85" />

          {/* Head */}
          <circle cx="60" cy="42" r="18" fill="#f0c090" />
          {/* Hair */}
          <path d="M 42 42 Q 42 26 60 24 Q 78 26 78 42 L 78 36 Q 70 30 60 30 Q 50 30 42 36 Z" fill="#3d2914" />
          {/* Eyes */}
          {isProcessing ? (
            <>
              <circle cx="53" cy="44" r="2" fill="#333" className="eye-blink" />
              <circle cx="67" cy="44" r="2" fill="#333" className="eye-blink" />
            </>
          ) : (
            <>
              <line x1="50" y1="44" x2="56" y2="44" stroke="#333" strokeWidth="2" strokeLinecap="round" />
              <line x1="64" y1="44" x2="70" y2="44" stroke="#333" strokeWidth="2" strokeLinecap="round" />
            </>
          )}
          {/* Mouth */}
          {isProcessing ? (
            <ellipse cx="60" cy="50" rx="4" ry="3" fill="#663" />
          ) : (
            <path d="M 55 50 Q 60 53 65 50" stroke="#663" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          )}

          {/* Arms */}
          <rect x="28" y="68" width="14" height="30" rx="6" fill={theme.color} />
          <rect x="78" y="68" width="14" height="30" rx="6" fill={theme.color} />

          {/* Desk */}
          <rect x="10" y="100" width="100" height="8" rx="2" fill={theme.desk} />
          <rect x="15" y="108" width="6" height="25" fill={theme.desk} />
          <rect x="99" y="108" width="6" height="25" fill={theme.desk} />

          {/* Monitor */}
          <rect x="35" y="78" width="50" height="32" rx="3" fill="#0f1117" stroke={theme.color} strokeWidth="1.5" />
          <rect x="38" y="81" width="44" height="26" rx="1" fill="#1a1d28" />
          {/* Screen content lines */}
          {isProcessing && (
            <>
              <rect x="41" y="84" width="20" height="2" rx="1" fill={theme.color} opacity="0.8">
                <animate attributeName="width" values="10;30;10" dur="1.5s" repeatCount="indefinite" />
              </rect>
              <rect x="41" y="89" width="30" height="2" rx="1" fill={theme.color} opacity="0.5">
                <animate attributeName="width" values="25;15;25" dur="1.5s" repeatCount="indefinite" />
              </rect>
              <rect x="41" y="94" width="15" height="2" rx="1" fill={theme.color} opacity="0.6">
                <animate attributeName="width" values="5;25;5" dur="1.5s" repeatCount="indefinite" />
              </rect>
            </>
          )}
          {!isProcessing && (
            <>
              <rect x="41" y="84" width="25" height="2" rx="1" fill="#3d4150" />
              <rect x="41" y="89" width="18" height="2" rx="1" fill="#3d4150" />
              <rect x="41" y="94" width="22" height="2" rx="1" fill="#3d4150" />
            </>
          )}
          {/* Monitor stand */}
          <rect x="57" y="110" width="6" height="4" fill={theme.desk} />

          {/* Emoji badge */}
          <circle cx="95" cy="80" r="10" fill={theme.color} opacity="0.9" />
          <text x="95" y="84" textAnchor="middle" fontSize="11">{theme.emoji}</text>
        </svg>
      </div>

      {/* Name plate on desk */}
      <div className="name-plate" style={{ background: theme.color + '20', borderColor: theme.color }}>
        <span className="plate-name">{shortName(agent.display_name || agent.name)}</span>
        {isEntry && <span className="entry-tag">ENTRY</span>}
      </div>

      {/* Status indicators */}
      <div className="ws-status">
        <span className={`ws-dot ${agent.status}`} style={isProcessing ? { background: theme.color } : {}} />
        <span className="ws-status-text">{agent.status}</span>
        {hasPending && (
          <span className="ws-pending" style={{ background: theme.color + '30', color: theme.color }}>
            {agent.pending_count} pending
          </span>
        )}
        {agent.last_active && agent.last_active !== '0001-01-01T00:00:00Z' && (
          <span className="ws-time">{formatTime(agent.last_active)}</span>
        )}
      </div>
    </div>
  );
}
