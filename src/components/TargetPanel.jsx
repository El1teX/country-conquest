import React from 'react';
import { IconSwords, IconDice } from './Icons.jsx';

export default function TargetPanel({
  targetCountry,
  playerCountry,
  playerBasePower,
  enemyBasePower,
  winChance,
  onAttack,
  onReroll,
  formatNumber
}) {
  if (!targetCountry || !playerCountry) return null;

  let winChanceColor = 'var(--accent-player)';
  let winChanceGradient = 'linear-gradient(90deg, #10b981, #059669)';

  if (winChance < 40) {
    winChanceColor = 'var(--accent-enemy)';
    winChanceGradient = 'linear-gradient(90deg, #ef4444, #b91c1c)';
  } else if (winChance < 65) {
    winChanceColor = 'var(--accent-gold)';
    winChanceGradient = 'linear-gradient(90deg, #f59e0b, #d97706)';
  }

  return (
    <div className="floating-conflict-bar">
      {/* Target Identity */}
      <div className="conflict-target-card">
        <div className="conflict-badge">ЦЕЛЬ АТАКИ • СЛУЧАЙНЫЙ СОСЕД</div>
        <div className="conflict-target-header">
          <img
            src={`https://flagcdn.com/w80/${targetCountry.id}.png`}
            alt={targetCountry.nameRu}
            className="conflict-flag-img"
          />
          <div className="conflict-target-details">
            <div className="conflict-target-name">{targetCountry.nameRu.toUpperCase()}</div>
            <div className="conflict-target-sub">
              {targetCountry.region.toUpperCase()} • [{targetCountry.perk.icon}] {targetCountry.perk.name}
            </div>
          </div>
        </div>
      </div>

      {/* VS Comparison Compact */}
      <div className="conflict-vs-metrics">
        <div className="vs-mini-row">
          <div className="vs-stat-col text-left">
            <span className="vs-val player-val">${formatNumber(playerCountry.gdp)}B</span>
            <span className="vs-sub-lbl">ИМПЕРИЯ</span>
          </div>
          <span className="vs-separator">ВВП</span>
          <div className="vs-stat-col text-right">
            <span className="vs-val enemy-val">${formatNumber(targetCountry.gdp)}B</span>
            <span className="vs-sub-lbl">ЦЕЛЬ</span>
          </div>
        </div>

        <div className="vs-mini-row">
          <div className="vs-stat-col text-left">
            <span className="vs-val player-val">{formatNumber(playerCountry.army)}</span>
            <span className="vs-sub-lbl">ИМПЕРИЯ</span>
          </div>
          <span className="vs-separator">АРМИЯ</span>
          <div className="vs-stat-col text-right">
            <span className="vs-val enemy-val">{formatNumber(targetCountry.army)}</span>
            <span className="vs-sub-lbl">ЦЕЛЬ</span>
          </div>
        </div>

        {/* Win Chance Bar */}
        <div className="conflict-chance-box">
          <div className="conflict-chance-labels">
            <span>ШАНС ПОБЕДЫ:</span>
            <strong style={{ color: winChanceColor }}>{winChance}%</strong>
          </div>
          <div className="conflict-chance-track">
            <div
              className="conflict-chance-fill"
              style={{ width: `${winChance}%`, background: winChanceGradient }}
            />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="conflict-actions-cluster">
        <button className="btn-battle-launch" onClick={onAttack}>
          <IconSwords size={18} />
          <span>В БОЙ (d5 × 1.1)</span>
        </button>
        <button className="btn-battle-reroll" onClick={onReroll} title="Выбрать другого случайного соседа">
          <IconDice size={15} />
          <span>ДРУГОЙ СОСЕД</span>
        </button>
      </div>
    </div>
  );
}
