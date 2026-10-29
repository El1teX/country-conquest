import React, { useState, useMemo, useCallback } from 'react';
import { COUNTRIES_DATA } from './worldData.js';
import { sound } from './audio.js';

import Header from './components/Header.jsx';
import WorldMap from './components/WorldMap.jsx';
import TargetPanel from './components/TargetPanel.jsx';
import RouletteModal from './components/RouletteModal.jsx';
import BattleModal from './components/BattleModal.jsx';
import GameOverModal from './components/GameOverModal.jsx';
import VictoryModal from './components/VictoryModal.jsx';

export default function App() {
  const countries = COUNTRIES_DATA;
  const countryIds = useMemo(() => Object.keys(countries), [countries]);

  // Core Game State
  const [playerCountryId, setPlayerCountryId] = useState(null);
  const [ownedCountryIds, setOwnedCountryIds] = useState(new Set());
  const [currentTargetId, setCurrentTargetId] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Dynamic Player Stats (Empire Snowball)
  const [empireStats, setEmpireStats] = useState({
    gdp: 0,
    pop: 0,
    army: 0
  });

  // Modal States
  const [isRouletteOpen, setIsRouletteOpen] = useState(true);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isVictoryModalOpen, setIsVictoryModalOpen] = useState(false);

  const [battleState, setBattleState] = useState({
    isOpen: false,
    stage: 'rolling', // 'rolling' | 'finished'
    pRoll: 1,
    eRoll: 1,
    pTotal: 0,
    eTotal: 0,
    isVictory: false,
    spoils: null,
    lostTroops: 0
  });

  const playerCountry = countries[playerCountryId];
  const targetCountry = currentTargetId ? countries[currentTargetId] : null;

  // Bordering Neighbors Set
  const neighborIds = useMemo(() => {
    const set = new Set();
    for (const ownedId of ownedCountryIds) {
      const c = countries[ownedId];
      if (c && c.neighbors) {
        for (const nId of c.neighbors) {
          if (!ownedCountryIds.has(nId) && countries[nId]) {
            set.add(nId);
          }
        }
      }
    }
    return set;
  }, [countries, ownedCountryIds]);

  // Pick Next Random Neighbor
  const pickNextRandomNeighbor = useCallback(
    (currentOwned = ownedCountryIds) => {
      const candidateNeighbors = new Set();
      for (const ownedId of currentOwned) {
        const c = countries[ownedId];
        if (c && c.neighbors) {
          for (const nId of c.neighbors) {
            if (!currentOwned.has(nId) && countries[nId]) {
              candidateNeighbors.add(nId);
            }
          }
        }
      }

      if (candidateNeighbors.size === 0) {
        setIsVictoryModalOpen(true);
        sound.victory();
        return;
      }

      const arr = Array.from(candidateNeighbors);
      const chosen = arr[Math.floor(Math.random() * arr.length)];
      setCurrentTargetId(chosen);
    },
    [countries, ownedCountryIds]
  );

  // Start Game with chosen country from Roulette
  const handleSelectFromRoulette = (startId) => {
    setIsRouletteOpen(false);
    setIsGameOver(false);
    setIsVictoryModalOpen(false);

    const c = countries[startId];
    setPlayerCountryId(startId);

    const initialOwned = new Set([startId]);
    setOwnedCountryIds(initialOwned);

    setEmpireStats({
      gdp: c.gdp,
      pop: c.population,
      army: c.army
    });

    pickNextRandomNeighbor(initialOwned);
  };

  // Base Combat Power Calculator
  const calcBasePower = useCallback((army, gdp, pop, perk = {}) => {
    const armyMult = perk.armyPowerMult || 1;
    const gdpMult = perk.gdpPowerMult || 1;

    const power =
      army * armyMult +
      gdp * 150 * gdpMult +
      (pop / 1000) * 25;

    return Math.round(power);
  }, []);

  const playerBasePower = useMemo(() => {
    if (!playerCountry) return 0;
    return calcBasePower(
      empireStats.army,
      empireStats.gdp,
      empireStats.pop,
      playerCountry.perk
    );
  }, [calcBasePower, empireStats, playerCountry]);

  const enemyBasePower = useMemo(() => {
    if (!targetCountry) return 0;
    return calcBasePower(
      targetCountry.army,
      targetCountry.gdp,
      targetCountry.population,
      targetCountry.perk
    );
  }, [calcBasePower, targetCountry]);

  // Monte Carlo Win Chance Estimate
  const winChance = useMemo(() => {
    if (!targetCountry || playerBasePower <= 0) return 50;

    let pWins = 0;
    const trials = 300;
    const pMin = playerCountry?.perk?.minDice || 1;
    const eMin = targetCountry?.perk?.minDice || 1;
    const pCoeff = playerCountry?.perk?.diceMultiplierCoeff || 1.1;
    const eCoeff = targetCountry?.perk?.diceMultiplierCoeff || 1.1;

    for (let i = 0; i < trials; i++) {
      const pRoll = Math.max(pMin, Math.floor(Math.random() * 5) + 1);
      const eRoll = Math.max(eMin, Math.floor(Math.random() * 5) + 1);
      const pScore = playerBasePower * (pRoll * pCoeff);
      const eScore = enemyBasePower * (eRoll * eCoeff);
      if (pScore >= eScore) pWins++;
    }

    return Math.round((pWins / trials) * 100);
  }, [playerBasePower, enemyBasePower, playerCountry, targetCountry]);

  // Launch Battle
  const handleStartBattle = () => {
    if (!targetCountry || battleState.isOpen) return;

    sound.warHorn();

    setBattleState({
      isOpen: true,
      stage: 'rolling',
      pRoll: 1,
      eRoll: 1,
      pTotal: 0,
      eTotal: 0,
      isVictory: false,
      spoils: null,
      lostTroops: 0
    });

    let rollTicks = 0;
    const rollInterval = setInterval(() => {
      setBattleState((prev) => ({
        ...prev,
        pRoll: Math.floor(Math.random() * 5) + 1,
        eRoll: Math.floor(Math.random() * 5) + 1
      }));
      sound.diceRoll();
      rollTicks++;

      if (rollTicks >= 12) {
        clearInterval(rollInterval);
        resolveBattleOutcome();
      }
    }, 90);
  };

  // Resolve Battle with d5 dice & 1.1x multiplier
  const resolveBattleOutcome = () => {
    const pMin = playerCountry?.perk?.minDice || 1;
    const eMin = targetCountry?.perk?.minDice || 1;

    const pRoll = Math.max(pMin, Math.floor(Math.random() * 5) + 1);
    const eRoll = Math.max(eMin, Math.floor(Math.random() * 5) + 1);

    const pCoeff = playerCountry?.perk?.diceMultiplierCoeff || 1.1;
    const eCoeff = targetCountry?.perk?.diceMultiplierCoeff || 1.1;

    const pMult = +(pRoll * pCoeff).toFixed(2);
    const eMult = +(eRoll * eCoeff).toFixed(2);

    const pTotal = Math.round(playerBasePower * pMult);
    const eTotal = Math.round(enemyBasePower * eMult);

    const isVictory = pTotal >= eTotal;

    if (isVictory) {
      sound.victory();

      // Absorb conquered resources (Snowball Effect)
      const spoilsArmy = Math.round(targetCountry.army * 0.35);
      const spoilsGdp = Math.round(targetCountry.gdp * 0.4);
      const spoilsPop = Math.round(targetCountry.population * 0.4);

      setEmpireStats((prev) => ({
        army: prev.army + spoilsArmy,
        gdp: prev.gdp + spoilsGdp,
        pop: prev.pop + spoilsPop
      }));

      setOwnedCountryIds((prev) => new Set([...prev, targetCountry.id]));

      setBattleState({
        isOpen: true,
        stage: 'finished',
        pRoll,
        eRoll,
        pTotal,
        eTotal,
        isVictory: true,
        spoils: { army: spoilsArmy, gdp: spoilsGdp, pop: spoilsPop },
        lostTroops: 0
      });
    } else {
      sound.defeat();

      // Army Casualties (Loss Condition)
      const lossRate = playerCountry?.perk?.casualtyDiscount ? 0.2 : 0.4;
      const lostTroops = Math.round(empireStats.army * lossRate);
      const remainingArmy = Math.max(0, empireStats.army - lostTroops);

      setEmpireStats((prev) => ({
        ...prev,
        army: remainingArmy
      }));

      setBattleState({
        isOpen: true,
        stage: 'finished',
        pRoll,
        eRoll,
        pTotal,
        eTotal,
        isVictory: false,
        spoils: null,
        lostTroops
      });
    }
  };

  // Close Battle Modal
  const handleCloseBattle = () => {
    setBattleState((prev) => ({ ...prev, isOpen: false }));
    sound.click();

    // Check Loss Condition: Army destroyed
    if (empireStats.army <= 1000) {
      setIsGameOver(true);
      sound.defeat();
      return;
    }

    // Check Win Condition: All countries conquered
    if (ownedCountryIds.size >= countryIds.length) {
      setIsVictoryModalOpen(true);
      sound.victory();
      return;
    }

    // Select next neighboring conflict target
    pickNextRandomNeighbor();
  };

  // Reroll Target
  const handleRerollTarget = () => {
    sound.click();
    pickNextRandomNeighbor();
  };

  // Number Formatter Helper
  const formatNumber = useCallback((num) => {
    if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(1) + 'k';
    return (num || 0).toLocaleString('ru-RU');
  }, []);

  return (
    <div className="game-root-viewport">
      {/* Sleek Floating Header */}
      <Header
        playerCountry={playerCountry}
        gdp={empireStats.gdp}
        pop={empireStats.pop}
        army={empireStats.army}
        ownedCount={ownedCountryIds.size}
        totalCountries={countryIds.length}
        soundEnabled={soundEnabled}
        onToggleSound={() => {
          const enabled = sound.toggle();
          setSoundEnabled(enabled);
        }}
        onOpenRoulette={() => setIsRouletteOpen(true)}
        formatNumber={formatNumber}
      />

      {/* Fullscreen Interactive SVG Map with Flag Textures */}
      <WorldMap
        countries={countries}
        ownedCountryIds={ownedCountryIds}
        currentTargetId={currentTargetId}
        neighborIds={neighborIds}
        playerCountryId={playerCountryId}
        onSelectCountry={() => {}}
        formatNumber={formatNumber}
      />

      {/* Floating Bottom Conflict Target Card */}
      {targetCountry && playerCountry && !isRouletteOpen && (
        <TargetPanel
          targetCountry={targetCountry}
          playerCountry={{
            ...playerCountry,
            gdp: empireStats.gdp,
            population: empireStats.pop,
            army: empireStats.army
          }}
          playerBasePower={playerBasePower}
          enemyBasePower={enemyBasePower}
          winChance={winChance}
          onAttack={handleStartBattle}
          onReroll={handleRerollTarget}
          formatNumber={formatNumber}
        />
      )}

      {/* Start Country Roulette Modal */}
      <RouletteModal
        isOpen={isRouletteOpen}
        countries={countries}
        onSelectCountry={handleSelectFromRoulette}
        formatNumber={formatNumber}
      />

      {/* Dice Duel Battle Modal */}
      <BattleModal
        isOpen={battleState.isOpen}
        targetCountry={targetCountry}
        playerCountry={playerCountry}
        playerBasePower={playerBasePower}
        enemyBasePower={enemyBasePower}
        pCoeff={playerCountry?.perk?.diceMultiplierCoeff || 1.1}
        eCoeff={targetCountry?.perk?.diceMultiplierCoeff || 1.1}
        battleStage={battleState.stage}
        pRoll={battleState.pRoll}
        eRoll={battleState.eRoll}
        pTotal={battleState.pTotal}
        eTotal={battleState.eTotal}
        isVictory={battleState.isVictory}
        spoils={battleState.spoils}
        lostTroops={battleState.lostTroops}
        onClose={handleCloseBattle}
        formatNumber={formatNumber}
      />

      {/* Game Over Modal (Army Exhausted) */}
      <GameOverModal
        isOpen={isGameOver}
        conqueredCount={ownedCountryIds.size}
        onRestart={() => setIsRouletteOpen(true)}
      />

      {/* World Domination Victory Modal */}
      <VictoryModal
        isOpen={isVictoryModalOpen}
        onRestart={() => setIsRouletteOpen(true)}
      />
    </div>
  );
}
