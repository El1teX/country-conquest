import React from 'react';
import { IconCrown, IconRefresh } from './Icons.jsx';

export default function VictoryModal({ isOpen, onRestart }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={{ zIndex: 2100 }}>
      <div className="modal-box text-center">
        <div className="modal-alert-body">
          <div className="modal-icon-badge text-gold">
            <IconCrown size={48} />
          </div>
          <h2 className="modal-alert-title text-gold">
            МИРОВОЕ ГОСПОДСТВО
          </h2>
          <p className="modal-alert-desc">
            Триумф! Ваша империя объединила под своим знаменем все 256 государств планеты. На Земле установлен абсолютный миропорядок под вашим командованием.
          </p>

          <button
            className="btn-primary"
            onClick={onRestart}
          >
            <IconRefresh size={16} />
            <span>НАЧАТЬ НОВУЮ КАМПАНИЮ</span>
          </button>
        </div>
      </div>
    </div>
  );
}
