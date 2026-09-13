import React, { useState } from 'react';
import { BarChart3, ArrowUpDown, Info } from 'lucide-react';
import { DISEASE_INFO, CLASS_LIST } from '../../constants/diseases';

/**
 * Member J — Chart Component
 * Visualizes the probability distribution across all 7 dermatological classes
 * returned by the inference model.
 *
 * @param {Object} props
 * @param {Object} props.probabilities - Key-value map of { className: floatProbability }
 * @param {string} props.predictedClass - The top predicted class name
 * @param {function} props.onSelectClass - Optional callback when user clicks a disease bar
 */
export function ProbabilityChart({ probabilities = {}, predictedClass = '', onSelectClass }) {
  const [sortBy, setSortBy] = useState('confidence'); // 'confidence' | 'alphabetical'
  const [hoveredClass, setHoveredClass] = useState(null);

  if (!probabilities || Object.keys(probabilities).length === 0) {
    return (
      <div className="chart-empty-state">
        <BarChart3 className="chart-empty-icon" />
        <p>Awaiting inference data to render probability distribution.</p>
      </div>
    );
  }

  // Transform probabilities into array with metadata
  let items = Object.entries(probabilities).map(([code, prob]) => {
    const info = DISEASE_INFO[code] || {
      name: code.toUpperCase(),
      fullName: code,
      riskLevel: 'unknown',
      riskColor: '#64748b',
    };

    const percentage = (prob * 100).toFixed(2);
    const isTop = code === predictedClass;

    return {
      code,
      prob,
      percentage,
      isTop,
      ...info,
    };
  });

  // Sort
  if (sortBy === 'confidence') {
    items.sort((a, b) => b.prob - a.prob);
  } else {
    items.sort((a, b) => a.code.localeCompare(b.code));
  }

  return (
    <div className="chart-container">
      <div className="chart-header">
        <div className="chart-title-wrap">
          <BarChart3 className="w-5 h-5 text-sky-500" />
          <h3 className="chart-title">Class Probabilities (Member J)</h3>
        </div>
        <button
          className="sort-toggle-btn"
          onClick={() => setSortBy(prev => (prev === 'confidence' ? 'alphabetical' : 'confidence'))}
          title="Toggle sorting mode"
        >
          <ArrowUpDown className="w-3.5 h-3.5" />
          <span>{sortBy === 'confidence' ? 'Ranked' : 'A-Z'}</span>
        </button>
      </div>

      <p className="chart-subtitle">
        Confidence distribution across all 7 diagnostic classes (MobileNetV2 Softmax)
      </p>

      <div className="bars-list">
        {items.map(item => {
          const isHighest = item.isTop;
          const widthPercent = Math.max(item.prob * 100, 1.5); // Ensure small sliver is visible

          return (
            <div
              key={item.code}
              className={`bar-row ${isHighest ? 'is-highest' : ''} ${
                hoveredClass === item.code ? 'is-hovered' : ''
              }`}
              onMouseEnter={() => setHoveredClass(item.code)}
              onMouseLeave={() => setHoveredClass(null)}
              onClick={() => onSelectClass && onSelectClass(item.code)}
            >
              <div className="bar-labels">
                <div className="bar-label-left">
                  <span className="bar-code">{item.code}</span>
                  <span className="bar-name">{item.name}</span>
                  {isHighest && <span className="top-badge">Top Match</span>}
                </div>
                <div className="bar-label-right">
                  <span className="bar-percentage">{item.percentage}%</span>
                </div>
              </div>

              <div className="bar-track">
                <div
                  className="bar-fill"
                  style={{
                    width: `${widthPercent}%`,
                    backgroundColor: isHighest ? item.riskColor || '#0284c7' : '#94a3b8',
                    filter: isHighest ? 'drop-shadow(0 2px 4px rgba(2, 132, 199, 0.3))' : 'none',
                  }}
                />
              </div>

              {hoveredClass === item.code && (
                <div className="bar-quick-tooltip">
                  <span className="tooltip-title">{item.fullName}</span>
                  <span className="tooltip-risk" style={{ color: item.riskColor }}>
                    Risk: {item.category}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="chart-footer">
        <span className="chart-legend-item">
          <span className="legend-dot" style={{ backgroundColor: '#dc2626' }} /> Malignant / High Risk
        </span>
        <span className="chart-legend-item">
          <span className="legend-dot" style={{ backgroundColor: '#10b981' }} /> Benign / Low Risk
        </span>
        <span className="chart-legend-item">
          <span className="legend-dot" style={{ backgroundColor: '#94a3b8' }} /> Baseline
        </span>
      </div>
    </div>
  );
}

export default ProbabilityChart;
