import React from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Info,
  Clock,
  ArrowRight,
  Stethoscope,
  HelpCircle,
} from 'lucide-react';
import { DISEASE_INFO } from '../constants/diseases';
import { ProbabilityChart } from './charts'; // Member J's Chart Component!

export function PredictionResult({ result, onSelectDiseaseCode }) {
  if (!result) return null;

  const predictedCode = result.prediction?.class || 'uncertain';
  const confidence = result.prediction?.confidence ?? 0;
  const confidencePercent = (confidence * 100).toFixed(1);
  const probabilities = result.probabilities || {};
  const warning = result.warning;
  const note = result.note;
  const disclaimer =
    result.disclaimer ||
    'This prediction is for educational/research purposes only and is not a medical diagnosis.';

  const info = DISEASE_INFO[predictedCode] || {
    name: predictedCode.toUpperCase(),
    fullName: predictedCode,
    category: 'Unknown Lesion Type',
    riskLevel: 'moderate',
    riskColor: '#f59e0b',
    bgColor: 'rgba(245, 158, 11, 0.1)',
    description: 'No detailed clinical monograph available for this identifier.',
    nextStep: 'Consult a dermatologist for formal in-person examination.',
  };

  const isHighRisk = info.riskLevel === 'high' || info.riskLevel === 'critical';
  const isBenign = info.riskLevel === 'low';
  const isUncertain = result.is_uncertain || predictedCode === 'uncertain' || confidence < 0.65;

  return (
    <div className="card result-card">
      <div className="card-header">
        <div>
          <h2 className="card-title">2. Inference Diagnosis & Analytics</h2>
          <p className="card-desc">
            Output from deep convolutional neural network (HAM10000 7-class classifier)
          </p>
        </div>
      </div>

      {/* Main Top Classification Card */}
      <div
        className="diagnosis-hero"
        style={{
          borderLeftColor: info.riskColor,
          background: `linear-gradient(135deg, ${info.bgColor} 0%, rgba(255, 255, 255, 0.6) 100%)`,
        }}
      >
        <div className="hero-top-row">
          <div className="hero-badge-wrap">
            <span
              className="risk-tag"
              style={{
                backgroundColor: info.riskColor,
                color: '#fff',
              }}
            >
              {isHighRisk ? (
                <ShieldAlert className="w-3.5 h-3.5 mr-1 inline" />
              ) : isBenign ? (
                <ShieldCheck className="w-3.5 h-3.5 mr-1 inline" />
              ) : (
                <AlertTriangle className="w-3.5 h-3.5 mr-1 inline" />
              )}
              {info.category}
            </span>

            {isUncertain && (
              <span className="uncertain-tag">
                <AlertTriangle className="w-3 h-3 mr-1 inline text-amber-600" />
                Low Confidence
              </span>
            )}
          </div>

          <div className="confidence-pill" title="Softmax probability of top class">
            <span className="confidence-label">Confidence:</span>
            <span
              className="confidence-value"
              style={{
                color: isUncertain ? '#d97706' : '#0284c7',
              }}
            >
              {confidencePercent}%
            </span>
          </div>
        </div>

        <div className="hero-main-title">
          <h3 className="disease-name">{info.name}</h3>
          <p className="disease-sub">{info.fullName} ({info.code})</p>
        </div>

        <p className="disease-description">{info.description}</p>

        {/* Clinical next step advisory */}
        <div className="clinical-advisory">
          <div className="advisory-icon">
            <Stethoscope className="w-4 h-4 text-sky-700" />
          </div>
          <div className="advisory-text">
            <strong>Recommended Action:</strong> {info.nextStep}
          </div>
        </div>
      </div>

      {/* Low Confidence Warning */}
      {warning && (
        <div className="alert alert-warning">
          <AlertTriangle className="alert-icon text-amber-600" />
          <div>
            <strong>Low Confidence Warning:</strong> {warning}
            <div className="text-xs mt-1 text-amber-800">
              Please ensure the lesion is clearly centered, well-illuminated, and free of optical glare or hair obstruction.
            </div>
          </div>
        </div>
      )}

      {/* Mock Mode Note */}
      {note && (
        <div className="alert alert-info">
          <Info className="alert-icon text-blue-600" />
          <div>
            <strong>Backend Pipeline Note:</strong> {note}
          </div>
        </div>
      )}

      {/* Embedded Chart Component by Member J */}
      <div className="chart-section-wrapper">
        <ProbabilityChart
          probabilities={probabilities}
          predictedClass={predictedCode}
          onSelectClass={onSelectDiseaseCode}
        />
      </div>

      {/* Medical Disclaimer Banner */}
      <div className="disclaimer-box">
        <AlertTriangle className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
        <p className="disclaimer-text">
          <strong>Clinical Disclaimer:</strong> {disclaimer} Always consult a board-certified dermatologist or licensed physician for clinical diagnosis and dermatoscopic biopsy.
        </p>
      </div>
    </div>
  );
}

export default PredictionResult;
