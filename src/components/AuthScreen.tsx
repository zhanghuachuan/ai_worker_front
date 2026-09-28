import { useState, useRef, useEffect } from 'react';
import { verifyAccessCode, setAccessCode } from '../api';

type Phase = 'input' | 'verifying' | 'success' | 'error';

export default function AuthScreen({ onSuccess }: { onSuccess: () => void }) {
  const [code, setCode] = useState('');
  const [phase, setPhase] = useState<Phase>('input');
  const [errorMsg, setErrorMsg] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || phase === 'verifying') return;

    setPhase('verifying');
    setErrorMsg('');

    try {
      const res = await verifyAccessCode(code.trim());
      if (res.success) {
        setAccessCode(code.trim());
        setPhase('success');
        // Wait for the animation to play, then notify parent.
        setTimeout(() => onSuccess(), 2600);
      } else {
        setPhase('error');
        setErrorMsg(res.error || 'Invalid access code');
      }
    } catch {
      setPhase('error');
      setErrorMsg('Cannot connect to server. Is the backend running?');
    }
  };

  const handleKeyDown = () => {
    if (phase === 'error') {
      setPhase('input');
      setErrorMsg('');
    }
  };

  // ===== Success: "Entering Workspace" animation =====
  if (phase === 'success') {
    return (
      <div className="auth-screen auth-entering">
        <div className="entering-animation">
          <div className="portal-ring ring-1" />
          <div className="portal-ring ring-2" />
          <div className="portal-ring ring-3" />
          <div className="portal-core">
            <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
              <circle cx="30" cy="30" r="28" stroke="currentColor" strokeWidth="2" opacity="0.3" />
              <circle cx="30" cy="30" r="20" stroke="currentColor" strokeWidth="2" opacity="0.5" />
              <circle cx="30" cy="30" r="12" fill="currentColor" opacity="0.8" />
              <circle cx="30" cy="30" r="6" fill="white" />
            </svg>
          </div>
          <div className="entering-text">Entering Workspace</div>
          <div className="entering-dots">
            <span>.</span><span>.</span><span>.</span>
          </div>
        </div>
      </div>
    );
  }

  // ===== Input / Error / Verifying =====
  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="auth-icon">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <rect x="10" y="20" width="28" height="20" rx="3" stroke="var(--accent-blue)" strokeWidth="2" />
            <path d="M16 20V14a8 8 0 0 1 16 0v6" stroke="var(--accent-blue)" strokeWidth="2" strokeLinecap="round" />
            <circle cx="24" cy="30" r="3" fill="var(--accent-yellow)" />
            <path d="M24 33v3" stroke="var(--accent-yellow)" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
        <h1 className="auth-title">AI Worker Workspace</h1>
        <p className="auth-subtitle">Enter your access code to enter the workspace</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <input
            ref={inputRef}
            type="password"
            className={`auth-input ${phase === 'error' ? 'auth-input-error' : ''}`}
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              handleKeyDown();
            }}
            placeholder="Access code"
            disabled={phase === 'verifying'}
            autoComplete="off"
          />
          <button
            type="submit"
            className="auth-button"
            disabled={!code.trim() || phase === 'verifying'}
          >
            {phase === 'verifying' ? 'Verifying...' : 'Enter Workspace'}
          </button>
        </form>

        {phase === 'error' && errorMsg && (
          <div className="auth-error">{errorMsg}</div>
        )}
      </div>

      {/* Decorative floating particles */}
      <div className="auth-particles">
        {Array.from({ length: 12 }).map((_, i) => (
          <span key={i} className="particle" style={{
            '--delay': `${i * 0.5}s`,
            '--duration': `${8 + (i % 4) * 2}s`,
            left: `${(i * 8.3) % 100}%`,
          } as React.CSSProperties} />
        ))}
      </div>
    </div>
  );
}
