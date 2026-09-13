import React from 'react';
import { Activity, ShieldCheck, AlertCircle, BookOpen, RefreshCw } from 'lucide-react';

export function Header({ health, onRefreshHealth, onOpenReference }) {
  const isOnline = health?.online;
  const modelMode = health?.data?.mode;
  const isReal = health?.data?.model_loaded || modelMode === 'real';

  return (
    <header className="app-header">
      <div className="header-container">
        <div className="brand-section">
          <div className="logo-badge">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="brand-row">
              <h1 className="brand-title">DermAI</h1>
              <span className="version-pill">Team Pipeline G→H→I/J</span>
            </div>
            <p className="brand-subtitle">
              Deep Learning Skin Lesion Classifier & Diagnostic Assistant
            </p>
          </div>
        </div>

        <div className="header-actions">
          {/* Reference Modal Button */}
          <button
            type="button"
            className="header-btn secondary-btn"
            onClick={onOpenReference}
            title="View dermatological reference information for all 7 lesion types"
          >
            <BookOpen className="w-4 h-4 text-slate-500" />
            <span>Disease Index</span>
          </button>

          {/* Backend Health Badge */}
          <div className="health-badge-wrap">
            <div className={`health-pill ${isOnline ? (isReal ? 'pill-real' : 'pill-mock') : 'pill-offline'}`}>
              <span className="pulse-dot" />
              <div className="pill-text">
                <span className="status-label">
                  {!isOnline
                    ? 'Backend Offline'
                    : isReal
                    ? 'Backend Online (Real Model)'
                    : 'Backend Online (Mock Mode)'}
                </span>
                <span className="status-sub">
                  {isOnline ? 'localhost:5000' : 'Disconnected'}
                </span>
              </div>
            </div>

            <button
              className="refresh-icon-btn"
              onClick={onRefreshHealth}
              title="Re-check backend health"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
