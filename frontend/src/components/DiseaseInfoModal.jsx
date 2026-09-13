import React, { useState } from 'react';
import { X, ShieldAlert, ShieldCheck, AlertTriangle, BookOpen, ExternalLink, ChevronRight } from 'lucide-react';
import { DISEASE_INFO, CLASS_LIST } from '../constants/diseases';

export function DiseaseInfoModal({ isOpen, onClose, initialSelectedCode }) {
  const [selectedCode, setSelectedCode] = useState(initialSelectedCode || 'melanoma');

  if (!isOpen) return null;

  const currentInfo = DISEASE_INFO[selectedCode] || DISEASE_INFO['melanoma'];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-wrap">
            <BookOpen className="w-5 h-5 text-sky-600" />
            <h2 className="modal-title">HAM10000 Dermatological Disease Reference</h2>
          </div>
          <button className="modal-close-btn" onClick={onClose} title="Close guide">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="modal-body">
          {/* Disease Selector Sidebar */}
          <div className="modal-sidebar">
            <div className="sidebar-list">
              {CLASS_LIST.map(code => {
                const item = DISEASE_INFO[code];
                const isSelected = selectedCode === code;
                return (
                  <button
                    key={code}
                    className={`sidebar-item ${isSelected ? 'sidebar-item-active' : ''}`}
                    onClick={() => setSelectedCode(code)}
                  >
                    <div className="sidebar-item-indicator" style={{ backgroundColor: item.riskColor }} />
                    <div className="sidebar-item-content">
                      <span className="sidebar-code">{code}</span>
                      <span className="sidebar-name">{item.name}</span>
                    </div>
                    {isSelected && <ChevronRight className="w-4 h-4 text-sky-600 ml-auto" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Disease Detail Pane */}
          <div className="modal-content-pane">
            <div className="detail-header" style={{ borderBottomColor: currentInfo.riskColor }}>
              <div className="detail-badges">
                <span
                  className="risk-tag"
                  style={{
                    backgroundColor: currentInfo.riskColor,
                    color: '#fff',
                  }}
                >
                  {currentInfo.riskLevel === 'critical' || currentInfo.riskLevel === 'high' ? (
                    <ShieldAlert className="w-3.5 h-3.5 mr-1 inline" />
                  ) : (
                    <ShieldCheck className="w-3.5 h-3.5 mr-1 inline" />
                  )}
                  {currentInfo.category}
                </span>
                <span className="code-tag">Dataset Label: {currentInfo.code}</span>
              </div>

              <h3 className="detail-title">{currentInfo.name}</h3>
              <p className="detail-full-name">{currentInfo.fullName}</p>
            </div>

            <div className="detail-section">
              <h4 className="section-title">Overview & Pathology</h4>
              <p className="section-body">{currentInfo.description}</p>
            </div>

            <div className="detail-section">
              <h4 className="section-title">Dermoscopic Features & Presentation</h4>
              <p className="section-body">{currentInfo.clinicalNotes}</p>
            </div>

            <div className="detail-callout" style={{ backgroundColor: currentInfo.bgColor }}>
              <h4 className="callout-title" style={{ color: currentInfo.riskColor }}>
                Clinical Advisory / Recommended Next Steps:
              </h4>
              <p className="callout-body">{currentInfo.nextStep}</p>
            </div>

            {/* ABCDE Rule Reference Box for Melanoma */}
            {selectedCode === 'melanoma' && (
              <div className="abcde-box">
                <h5 className="abcde-title">The ABCDE Criteria for Melanoma Screening:</h5>
                <ul className="abcde-list">
                  <li><strong>A - Asymmetry:</strong> One half does not match the other half.</li>
                  <li><strong>B - Border:</strong> Edges are irregular, ragged, notched, or blurred.</li>
                  <li><strong>C - Color:</strong> Color is not uniform (shades of brown, black, red, or white).</li>
                  <li><strong>D - Diameter:</strong> Spot is larger than 6mm (approx. pencil eraser), though can be smaller.</li>
                  <li><strong>E - Evolving:</strong> Lesion is visibly changing in size, shape, elevation, or bleeding.</li>
                </ul>
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <p className="modal-footer-disclaimer">
            Source: International Skin Imaging Collaboration (ISIC) / HAM10000 Dataset.
          </p>
          <button className="btn btn-primary btn-sm" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

export default DiseaseInfoModal;
