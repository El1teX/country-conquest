import React, { useState, useEffect, useRef } from 'react';
import { sound } from '../audio.js';
import { IconCrown, IconRefresh } from './Icons.jsx';

export default function RouletteModal({ isOpen, countries, onSelectCountry, formatNumber }) {
  const [spinning, setSpinning] = useState(false);
  const [targetCountry, setTargetCountry] = useState(null);
  const [reelCountries, setReelCountries] = useState([]);
  const [reelTranslate, setReelTranslate] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const containerRef = useRef(null);
  const CARD_WIDTH = 140;

  const allCountries = Object.values(countries);

  useEffect(() => {
    if (!isOpen) return;

    const winner = allCountries[Math.floor(Math.random() * allCountries.length)];
    setTargetCountry(winner);
    setIsFinished(false);

    const WINNER_INDEX = 38;
    const items = [];
    for (let i = 0; i < 48; i++) {
      if (i === WINNER_INDEX) {
        items.push(winner);
      } else {
        const rand = allCountries[Math.floor(Math.random() * allCountries.length)];
        items.push(rand);
      }
    }
    setReelCountries(items);
    setReelTranslate(0);

    const startTimer = setTimeout(() => {
      startSpin(WINNER_INDEX);
    }, 350);

    return () => clearTimeout(startTimer);
  }, [isOpen]);

  const startSpin = (winnerIdx) => {
    setSpinning(true);
    sound.init();

    let tickCount = 0;
    const maxTicks = 35;
    const tickInterval = setInterval(() => {
      sound.rouletteTick();
      tickCount++;
      if (tickCount >= maxTicks) clearInterval(tickInterval);
    }, 110);

    const containerW = containerRef.current ? containerRef.current.clientWidth : 600;
    const targetOffset = winnerIdx * CARD_WIDTH + CARD_WIDTH / 2 - containerW / 2;

    setReelTranslate(targetOffset);

    setTimeout(() => {
      setSpinning(false);
      setIsFinished(true);
      sound.rouletteWin();
    }, 4500);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={{ zIndex: 2000 }}>
      <div className="roulette-box">
        <div className="roulette-header">
          <div className="roulette-badge">ТАКТИЧЕСКОЕ РАЗВЕРТЫВАНИЕ • СТАРТОВАЯ ДЕРЖАВА</div>
          <h2>РУЛЕТКА ВЫБОРА ГОСУДАРСТВА</h2>
          <p>Случайный генератор определяет отправную точку для экспансии</p>
        </div>

        {/* Carousel Reel */}
        <div className="roulette-reel-container" ref={containerRef}>
          <div className="roulette-pointer">▼</div>

          <div
            className="roulette-track"
            style={{
              transform: `translateX(-${reelTranslate}px)`,
              transition: spinning
                ? 'transform 4.5s cubic-bezier(0.12, 0.8, 0.15, 1)'
                : 'none'
            }}
          >
            {reelCountries.map((c, i) => (
              <div
                key={i}
                className={`roulette-card ${isFinished && i === 38 ? 'winner' : ''}`}
              >
                <div className="roulette-flag-wrapper">
                  <img
                    src={`https://flagcdn.com/w160/${c.id}.png`}
                    alt={c.nameRu}
                    className="roulette-flag-img"
                    loading="lazy"
                  />
                </div>
                <div className="roulette-card-name">{c.nameRu}</div>
                <div className="roulette-card-perk">
                  [{c.perk.icon}] {c.perk.name}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Winner Announcement Card */}
        {isFinished && targetCountry && (
          <div className="roulette-winner-panel">
            <div className="winner-flag-box">
              <img
                src={`https://flagcdn.com/w320/${targetCountry.id}.png`}
                alt={targetCountry.nameRu}
                className="winner-flag-large"
              />
            </div>
            <div className="winner-info">
              <div className="winner-title">
                Ваша держава: <span>{targetCountry.nameRu.toUpperCase()}</span> ({targetCountry.name})
              </div>
              <div className="winner-stats-grid">
                <div className="wstat-item">
                  <span className="wstat-label">ВВП:</span>
                  <span className="wstat-val">${formatNumber(targetCountry.gdp)}B</span>
                </div>
                <div className="wstat-item">
                  <span className="wstat-label">НАСЕЛЕНИЕ:</span>
                  <span className="wstat-val">{formatNumber(targetCountry.population)}</span>
                </div>
                <div className="wstat-item">
                  <span className="wstat-label">АРМИЯ:</span>
                  <span className="wstat-val">{formatNumber(targetCountry.army)}</span>
                </div>
                <div className="wstat-item" style={{ gridColumn: 'span 3' }}>
                  <span className="wstat-label">ОСОБЕННОСТЬ:</span>
                  <span className="wstat-val text-amber">
                    [{targetCountry.perk.icon}] {targetCountry.perk.name} — {targetCountry.perk.desc}
                  </span>
                </div>
              </div>
            </div>

            <button
              className="btn-start-conquest"
              onClick={() => onSelectCountry(targetCountry.id)}
            >
              <IconCrown size={18} />
              <span>ПРИНЯТЬ КОМАНДОВАНИЕ</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
