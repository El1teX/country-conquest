import React from 'react';
import { IconSkull, IconRefresh } from './Icons.jsx';

export default function GameOverModal({ isOpen, conqueredCount, onRestart }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={{ zIndex: 2100 }}>
      <div className="modal-box text-center">
        <div className="modal-alert-body">
          <div className="modal-icon-badge text-enemy">
            <IconSkull size={48} />
          </div>
          <h2 className="modal-alert-title text-enemy">
            КРАХ ИМПЕРИИ
          </h2>
          <p className="modal-alert-desc">
            Ваша армия полностью разбита и рассеяна в сражениях. Не осталось сил для защиты суверенитета — ваше государство пало.
          </p>

          <div className="modal-stat-summary">
            <span className="summary-label">РЕЗУЛЬТАТ КАМПАНИИ:</span>
            <div className="summary-value">
              ЗАХВАЧЕНО: <span className="text-amber font-mono">{conqueredCount}</span> ИЗ 256 СТРАН
            </div>
          </div>

          <button
            className="btn-primary btn-enemy"
            onClick={onRestart}
          >
            <IconRefresh size={16} />
            <span>ПЕРЕЗАПУСТИТЬ РУЛЕТКУ</span>
          </button>
        </div>
      </div>
    </div>
  );
}
