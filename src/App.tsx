import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { AgentState, TaskMessage } from './types';
import { fetchAgents, fetchMessages, sendChat, getAccessCode, clearAccessCode } from './api';
import Workstation from './components/Workstation';
import Timeline from './components/Timeline';
import DeliveryPanel from './components/DeliveryPanel';
import AuthScreen from './components/AuthScreen';

const POLL_INTERVAL = 2000; // 2 seconds

// Stable display order for agent types (matches backend).
const TYPE_ORDER: Record<string, number> = {
  project_manager: 0,
  product_manager: 1,
  developer: 2,
  code_reviewer: 3,
  tester: 4,
};

function sortAgents(arr: AgentState[]): AgentState[] {
  return [...arr].sort((a, b) => {
    const ta = TYPE_ORDER[a.type] ?? 99;
    const tb = TYPE_ORDER[b.type] ?? 99;
    if (ta !== tb) return ta - tb;
    return a.name < b.name ? -1 : a.name > b.name ? 1 : 0;
  });
}

export default function App() {
  const [authenticated, setAuthenticated] = useState(() => !!getAccessCode());
  const [agents, setAgents] = useState<AgentState[]>([]);
  const [entryAgent, setEntryAgent] = useState('');
  const [messages, setMessages] = useState<TaskMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [lastTaskId, setLastTaskId] = useState('');
  const [connected, setConnected] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const poll = useCallback(async () => {
    try {
      const [agentsRes, msgsRes] = await Promise.all([
        fetchAgents(),
        fetchMessages(100),
      ]);
      setAgents(agentsRes.agents || []);
      setEntryAgent(agentsRes.entry_agent || '');
      setMessages(msgsRes.messages || []);
      setConnected(true);
      setError('');
    } catch (e) {
      setConnected(false);
      setError(String(e));
    }
  }, []);

  // Only start polling when authenticated.
  useEffect(() => {
    if (!authenticated) return;
    poll();
    intervalRef.current = setInterval(poll, POLL_INTERVAL);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [poll, authenticated]);

  const handleSend = async () => {
    if (!input.trim() || sending) return;
    setSending(true);
    setError('');
    try {
      const res = await sendChat(input.trim());
      if (res.success && res.task_id) {
        setLastTaskId(res.task_id);
        setInput('');
      } else {
        setError(res.error || 'Failed to send message');
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Group recent messages by agent name for speech bubbles
  const agentMessages = useMemo(() => {
    const map: Record<string, TaskMessage[]> = {};
    for (const msg of messages) {
      const names = [msg.from_agent, msg.to_agent].filter(Boolean);
      for (const n of names) {
        if (!map[n]) map[n] = [];
        if (map[n].length < 3) map[n].push(msg);
      }
    }
    return map;
  }, [messages]);

  // Stable-sorted agents so positions don't jump between polls.
  const sortedAgents = useMemo(() => sortAgents(agents), [agents]);

  // All result messages delivered to "user", newest last.
  const deliveryResults = useMemo(() => {
    return messages.filter(
      (m) => m.type === 'result' && m.to_agent === 'user' && m.status === 'done'
    );
  }, [messages]);

  // Show auth screen if not authenticated (after all hooks).
  if (!authenticated) {
    return <AuthScreen onSuccess={() => setAuthenticated(true)} />;
  }

  const handleLogout = () => {
    clearAccessCode();
    setAuthenticated(false);
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>
          <span className={`dot ${connected ? '' : 'disconnected'}`}
            style={!connected ? { background: 'var(--accent-red)' } : {}}
          />
          AI Worker Dashboard
        </h1>
        <div className="header-info">
          {entryAgent && <span>Entry: <strong>{entryAgent}</strong></span>}
          {lastTaskId && <span>Task: <strong>{lastTaskId}</strong></span>}
          <span>{connected ? 'Connected' : 'Disconnected'}</span>
          <button className="logout-btn" onClick={handleLogout}>Exit</button>
        </div>
      </header>

      <div className="app-body">
        <div className="agent-panel">
          {agents.length === 0 ? (
            <div className="timeline-empty">
              {connected ? 'Loading agents...' : 'Cannot connect to backend. Is the server running?'}
            </div>
          ) : (
            <div className="agent-grid">
              {sortedAgents.map((agent) => (
                <Workstation
                  key={agent.name}
                  agent={agent}
                  isEntry={agent.name === entryAgent}
                  recentMessages={agentMessages[agent.name] || []}
                />
              ))}
            </div>
          )}
        </div>

        <div className="timeline-panel">
          <DeliveryPanel results={deliveryResults} />
          <div className="timeline-header">
            <h2>Processing Chain</h2>
            <span className="timeline-filter">{messages.length} messages</span>
          </div>
          <Timeline messages={messages} />
        </div>
      </div>

      <div className="input-bar">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            entryAgent
              ? `Send message to ${entryAgent}...`
              : 'Type a message...'
          }
          disabled={sending}
        />
        <button onClick={handleSend} disabled={sending || !input.trim()}>
          {sending ? 'Sending...' : 'Send'}
        </button>
      </div>

      {error && (
        <div style={{
          position: 'fixed',
          bottom: 70,
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(239, 68, 68, 0.9)',
          color: 'white',
          padding: '6px 16px',
          borderRadius: 6,
          fontSize: 13,
          zIndex: 100,
        }}>
          {error}
        </div>
      )}
    </div>
  );
}
