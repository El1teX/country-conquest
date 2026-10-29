import React from 'react';

export default function BattleModal({
  isOpen,
  targetCountry,
  playerCountry,
  playerBasePower,
  enemyBasePower,
  pCoeff,
  eCoeff,
  battleStage,
  pRoll,
  eRoll,
  pTotal,
  eTotal,
  isVictory,
  spoils,
  lostTroops,
  onClose,
  formatNumber
}) {
  if (!isOpen || !targetCountry || !playerCountry) return null;

  const isRolling = battleStage === 'rolling';
  const pMult = (pRoll * pCoeff).toFixed(2);
  const eMult = (eRoll * eCoeff).toFixed(2);

  return (
    <div className="modal-overlay" style={{ zIndex: 2050 }}>
      <div className="modal-box">
        {/* Header */}
        <div className="battle-modal-header">
          <div className="battle-title">
            СРАЖЕНИЕ ЗА: {targetCountry.nameRu.toUpperCase()}
          </div>
          <div className="battle-subtitle">
            РАСЧЕТ БОЯ: БАЗОВАЯ МОЩЬ × (d5 × 1.1)
          </div>
        </div>

        <div className="battle-arena">
          {/* Duel Stage */}
          <div className="dice-stage">
            {/* Player Fighter */}
            <div className="dice-fighter">
              <div className="fighter-flag-box">
                <img
                  src={`https://flagcdn.com/w80/${playerCountry.id}.png`}
                  alt=""
                  className="fighter-flag"
                />
              </div>
              <div className="fighter-name fighter-player">
                {playerCountry.nameRu.toUpperCase()}
              </div>
              <div className={`d5-die die-player ${isRolling ? 'rolling' : ''}`}>
                {pRoll}
              </div>
              <div className="die-multiplier-tag">
                d5 × {pCoeff}
              </div>
            </div>

            <div className="dice-vs-text">VS</div>

            {/* Enemy Fighter */}
            <div className="dice-fighter">
              <div className="fighter-flag-box">
                <img
                  src={`https://flagcdn.com/w80/${targetCountry.id}.png`}
                  alt=""
                  className="fighter-flag"
                />
              </div>
              <div className="fighter-name fighter-enemy">
                {targetCountry.nameRu.toUpperCase()}
              </div>
              <div className={`d5-die die-enemy ${isRolling ? 'rolling' : ''}`}>
                {eRoll}
              </div>
              <div className="die-multiplier-tag">
                d5 × {eCoeff}
              </div>
            </div>
          </div>

          {/* Tactical Breakdown Box */}
          <div className="battle-calc-box">
            <div className="calc-line">
              <span className="text-muted">Базовая мощь империи:</span>
              <span className="font-mono">{formatNumber(playerBasePower)}</span>
            </div>
            <div className="calc-line">
              <span className="text-muted">
                Множитель кубика (d5 [{pRoll}] × {pCoeff}):
              </span>
              <span className="font-mono">{isRolling ? '...' : `x${pMult}`}</span>
            </div>
            <div className="calc-line total">
              <span className="text-player">ИТОГОВАЯ СИЛА ИГРОКА:</span>
              <span className="text-player font-mono">
                {isRolling ? '...' : formatNumber(pTotal)}
              </span>
            </div>

            <div className="calc-divider" />

            <div className="calc-line">
              <span className="text-muted">Базовая мощь противника:</span>
              <span className="font-mono">{formatNumber(enemyBasePower)}</span>
            </div>
            <div className="calc-line">
              <span className="text-muted">
                Множитель противника (d5 [{eRoll}] × {eCoeff}):
              </span>
              <span className="font-mono">{isRolling ? '...' : `x${eMult}`}</span>
            </div>
            <div className="calc-line total">
              <span className="text-enemy">ИТОГОВАЯ СИЛА ВРАГА:</span>
              <span className="text-enemy font-mono">
                {isRolling ? '...' : formatNumber(eTotal)}
              </span>
            </div>
          </div>

          {/* Outcome Result Card */}
          {!isRolling && (
            <div className={`battle-outcome ${isVictory ? 'win' : 'defeat'}`}>
              <div className="outcome-title">
                {isVictory ? 'ПОБЕДА' : 'ПОРАЖЕНИЕ'}
              </div>
              <div className="outcome-desc">
                {isVictory
                  ? `Оборона ${targetCountry.nameRu} прорвана. Территория присоединена к вашей империи.`
                  : `Штурм рубежей ${targetCountry.nameRu} отбит. Армия понесла критические потери.`}
              </div>

              {isVictory && spoils && (
                <div className="outcome-rewards">
                  <div className="reward-heading">ПОГЛОЩЕНИЕ РЕСУРСОВ:</div>
                  <div className="reward-pills">
                    <span>+${formatNumber(spoils.gdp)}B ВВП</span>
                    <span>+{formatNumber(spoils.pop)} НАСЕЛЕНИЯ</span>
                    <span className="text-amber">+{formatNumber(spoils.army)} ВОЙСК</span>
                  </div>
                </div>
              )}

              {!isVictory && lostTroops && (
                <div className="outcome-loss-text">
                  ПОТЕРИ В БОЮ: -{formatNumber(lostTroops)} БОЙЦОВ
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          {!isRolling && (
            <button className="btn-primary" onClick={onClose}>
              {isVictory ? 'ПРОДОЛЖИТЬ ЭКСПАНСИЮ' : 'ОТСТУПИТЬ И ПЕРЕГРУППИРОВАТЬСЯ'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
