import React, { useState, useRef, useEffect, useCallback, memo } from 'react';
import { IconCrosshair, IconPin } from './Icons.jsx';

function WorldMapComponent({
  countries,
  ownedCountryIds,
  currentTargetId,
  neighborIds,
  playerCountryId,
  onSelectCountry,
  formatNumber
}) {
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const viewportRef = useRef(null);
  const tooltipRef = useRef(null);
  const hasInitializedFocusRef = useRef(false);

  const [tooltipData, setTooltipData] = useState({
    visible: false,
    country: null,
    status: ''
  });

  // Center on a given country path
  const focusOnCountry = useCallback((countryId) => {
    if (!viewportRef.current) return;
    const pathEl = document.getElementById(`country-path-${countryId}`);
    if (!pathEl) return;

    try {
      const bbox = pathEl.getBBox();
      const vpRect = viewportRef.current.getBoundingClientRect();

      const cx = bbox.x + bbox.width / 2;
      const cy = bbox.y + bbox.height / 2;

      const targetScale = Math.min(Math.max(280 / Math.max(bbox.width, bbox.height), 1.5), 4.5);
      const vpW = vpRect.width || 800;
      const vpH = vpRect.height || 600;

      const baseScale = Math.min(vpW / 1010, vpH / 666);

      const newX = vpW / 2 - cx * baseScale * targetScale;
      const newY = vpH / 2 - cy * baseScale * targetScale;

      setTransform({
        x: newX,
        y: newY,
        scale: targetScale
      });
    } catch (e) {}
  }, []);

  // Initial focus on player country strictly once
  useEffect(() => {
    if (playerCountryId && !hasInitializedFocusRef.current) {
      hasInitializedFocusRef.current = true;
      const timer = setTimeout(() => {
        focusOnCountry(playerCountryId);
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [playerCountryId, focusOnCountry]);

  // Window-level dragging for 100% stability
  const handleMouseDown = (e) => {
    if (e.target.closest('.map-floating-controls')) return;
    isDraggingRef.current = true;
    dragStartRef.current = {
      x: e.clientX - transform.x,
      y: e.clientY - transform.y
    };
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDraggingRef.current) return;
      setTransform((prev) => ({
        ...prev,
        x: e.clientX - dragStartRef.current.x,
        y: e.clientY - dragStartRef.current.y
      }));
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  // Direct transform tooltip position (zero React re-renders while moving mouse)
  const handleViewportMouseMove = (e) => {
    if (!tooltipRef.current || !viewportRef.current) return;
    const rect = viewportRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left + 15;
    const y = e.clientY - rect.top + 15;
    tooltipRef.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  };

  // Wheel Zoom
  const handleWheel = (e) => {
    e.preventDefault();
    if (!viewportRef.current) return;

    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;
    const newScale = Math.min(Math.max(transform.scale * zoomFactor, 0.7), 8);

    const rect = viewportRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const newX = mouseX - (mouseX - transform.x) * (newScale / transform.scale);
    const newY = mouseY - (mouseY - transform.y) * (newScale / transform.scale);

    setTransform({
      scale: newScale,
      x: newX,
      y: newY
    });
  };

  const handleResetView = () => {
    setTransform({ x: 0, y: 0, scale: 1 });
  };

  const handleZoomIn = () => {
    setTransform((prev) => ({
      ...prev,
      scale: Math.min(prev.scale * 1.3, 8)
    }));
  };

  const handleZoomOut = () => {
    setTransform((prev) => ({
      ...prev,
      scale: Math.max(prev.scale / 1.3, 0.7)
    }));
  };

  const handlePathMouseEnter = (country) => {
    let status = 'НЕЙТРАЛ';
    if (ownedCountryIds.has(country.id)) status = 'ИМПЕРИЯ';
    else if (country.id === currentTargetId) status = 'ЦЕЛЬ';
    else if (neighborIds.has(country.id)) status = 'СОСЕД';

    setTooltipData({
      visible: true,
      country,
      status
    });
  };

  const handlePathMouseLeave = () => {
    setTooltipData((prev) => ({ ...prev, visible: false }));
  };

  return (
    <section
      className="map-viewport"
      ref={viewportRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleViewportMouseMove}
      onWheel={handleWheel}
    >
      {/* Floating Tactical Navigation Controls */}
      <div className="map-floating-controls">
        <button className="map-control-btn" onClick={handleZoomIn} title="Приблизить">
          +
        </button>
        <button className="map-control-btn" onClick={handleZoomOut} title="Отдалить">
          −
        </button>
        <button className="map-control-btn" onClick={handleResetView} title="Сбросить масштаб">
          RES
        </button>
        <button
          className="map-control-btn"
          onClick={() => currentTargetId && focusOnCountry(currentTargetId)}
          title="Фокус на цели"
        >
          <IconCrosshair size={16} />
        </button>
        <button
          className="map-control-btn"
          onClick={() => playerCountryId && focusOnCountry(playerCountryId)}
          title="Фокус на столице"
        >
          <IconPin size={16} />
        </button>
      </div>

      {/* High-Performance Vector World Map */}
      <svg
        id="world-map-svg"
        viewBox="0 0 1010 666"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          transform: `translate3d(${transform.x}px, ${transform.y}px, 0) scale(${transform.scale})`
        }}
      >
        <defs>
          {/* Tactical Pattern for Player Empire */}
          {playerCountryId && (
            <pattern id="pattern-player-empire" width="80" height="50" patternUnits="userSpaceOnUse">
              <image
                href={`https://flagcdn.com/w160/${playerCountryId}.png`}
                width="80"
                height="50"
                preserveAspectRatio="none"
              />
            </pattern>
          )}

          {/* Tactical Pattern for Target */}
          {currentTargetId && (
            <pattern id="pattern-target-country" width="80" height="50" patternUnits="userSpaceOnUse">
              <image
                href={`https://flagcdn.com/w160/${currentTargetId}.png`}
                width="80"
                height="50"
                preserveAspectRatio="none"
              />
            </pattern>
          )}
        </defs>

        <g id="map-countries-group">
          {Object.values(countries).map((c) => {
            const isPlayer = ownedCountryIds.has(c.id);
            const isTarget = c.id === currentTargetId;
            const isNeighbor = neighborIds.has(c.id);

            let className = 'country-vector-path';
            let fillStyle = '#151d2d';

            if (isPlayer) {
              className += ' path-player';
              fillStyle = 'url(#pattern-player-empire)';
            } else if (isTarget) {
              className += ' path-target';
              fillStyle = 'url(#pattern-target-country)';
            } else if (isNeighbor) {
              className += ' path-neighbor';
              fillStyle = '#262013';
            }

            return (
              <path
                key={c.id}
                id={`country-path-${c.id}`}
                d={c.path}
                className={className}
                fill={fillStyle}
                onMouseEnter={() => handlePathMouseEnter(c)}
                onMouseLeave={handlePathMouseLeave}
                onClick={() => onSelectCountry && onSelectCountry(c.id)}
              />
            );
          })}
        </g>
      </svg>

      {/* Fast Tooltip without re-renders */}
      <div
        ref={tooltipRef}
        className="map-tooltip"
        style={{
          display: tooltipData.visible && tooltipData.country ? 'block' : 'none',
          top: 0,
          left: 0
        }}
      >
        {tooltipData.country && (
          <>
            <div className="tooltip-title">
              <span className="tooltip-country-name">
                <img
                  src={`https://flagcdn.com/w40/${tooltipData.country.id}.png`}
                  alt=""
                  className="tooltip-flag-thumb"
                />
                {tooltipData.country.nameRu}
              </span>
              <span className={`tooltip-tag tag-${tooltipData.status.toLowerCase()}`}>
                {tooltipData.status}
              </span>
            </div>
            <div className="tooltip-row">
              <span>ВВП:</span> <span>${formatNumber(tooltipData.country.gdp)}B</span>
            </div>
            <div className="tooltip-row">
              <span>НАСЕЛЕНИЕ:</span> <span>{formatNumber(tooltipData.country.population)}</span>
            </div>
            <div className="tooltip-row">
              <span>АРМИЯ:</span> <span>{formatNumber(tooltipData.country.army)}</span>
            </div>
            <div className="tooltip-row">
              <span>ОСОБЕННОСТЬ:</span>{' '}
              <span className="tooltip-perk-val">
                [{tooltipData.country.perk.icon}] {tooltipData.country.perk.name}
              </span>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

export default memo(WorldMapComponent);
