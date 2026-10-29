import React from 'react';
import {
  IconChart,
  IconUsers,
  IconShield,
  IconGlobe,
  IconSoundOn,
  IconSoundOff,
  IconRefresh
} from './Icons.jsx';

export default function Header({
  playerCountry,
  gdp,
  pop,
  army,
  ownedCount,
  totalCountries,
  soundEnabled,
  onToggleSound,
  onOpenRoulette,
  formatNumber
}) {
  const pct = ((ownedCount / totalCountries) * 100).toFixed(1);

  return (
    <header className="header-clean">
      {/* Left: Player Empire Identity */}
      <div className="player-identity">
        {playerCountry && (
          <>
            <img
              src={`https://flagcdn.com/w80/${playerCountry.id}.png`}
              alt={playerCountry.nameRu}
              className="player-flag-badge"
            />
            <div className="player-info-box">
              <div className="player-country-name">{playerCountry.nameRu.toUpperCase()}</div>
              <div className="player-perk-chip">
                <span className="perk-tag">[{playerCountry.perk.icon}]</span>
                <span>{playerCountry.perk.name}</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Center: Tactical Telemetry Gauges */}
      <div className="stats-badges-cluster">
        <div className="stat-pill" title="Совокупный ВВП вашей империи">
          <IconChart size={16} className="stat-icon-svg text-blue" />
          <div className="stat-text">
            <span className="stat-label">ВВП</span>
            <span className="stat-val">${formatNumber(gdp)}B</span>
          </div>
        </div>

        <div className="stat-pill" title="Население империи">
          <IconUsers size={16} className="stat-icon-svg text-purple" />
          <div className="stat-text">
            <span className="stat-label">НАСЕЛЕНИЕ</span>
            <span className="stat-val">{formatNumber(pop)}</span>
          </div>
        </div>

        <div className="stat-pill highlight-army" title="Численность армии. При падении до нуля — поражение!">
          <IconShield size={16} className="stat-icon-svg text-amber" />
          <div className="stat-text">
            <span className="stat-label">АРМИЯ</span>
            <span className="stat-val">{formatNumber(army)}</span>
          </div>
        </div>

        <div className="stat-pill" title="Прогресс мирового господства">
          <IconGlobe size={16} className="stat-icon-svg text-green" />
          <div className="stat-text">
            <span className="stat-label">ГОСПОДСТВО</span>
            <span className="stat-val">{ownedCount} / {totalCountries} ({pct}%)</span>
          </div>
        </div>
      </div>

      {/* Right: Controls */}
      <div className="header-controls">
        <button
          className="btn-round-control"
          onClick={onToggleSound}
          title={soundEnabled ? 'Выключить звук' : 'Включить звук'}
        >
          {soundEnabled ? <IconSoundOn size={16} /> : <IconSoundOff size={16} />}
        </button>

        <button
          className="btn-roulette-trigger"
          onClick={onOpenRoulette}
          title="Запустить рулетку заново и выбрать новую державу"
        >
          <IconRefresh size={14} />
          <span>РУЛЕТКА</span>
        </button>
      </div>
    </header>
  );
}
