import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { ImageUploader } from './components/ImageUploader';
import { PredictionResult } from './components/PredictionResult';
import { DiseaseInfoModal } from './components/DiseaseInfoModal';
import { checkHealth, predictSkinLesion } from './services/api';
import {
  FileQuestion,
  Sparkles,
  ShieldAlert,
  HelpCircle,
  Upload,
  Cpu,
  BarChart2,
  CheckCircle2,
} from 'lucide-react';

export function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [predictionResult, setPredictionResult] = useState(null);
  const [health, setHealth] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalInitialCode, setModalInitialCode] = useState('melanoma');

  // Fetch backend health status
  const fetchHealth = async () => {
    const res = await checkHealth();
    setHealth(res);
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  // Handle file selection
  const handleFileSelect = file => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setError(null);
    setPredictionResult(null); // Reset previous prediction on new image
  };

  // Handle clearing current image
  const handleClearFile = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setError(null);
    setPredictionResult(null);
  };

  // Handle analyze / predict action
  const handleAnalyze = async () => {
    if (!selectedFile) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await predictSkinLesion(selectedFile);
      setPredictionResult(data);
    } catch (err) {
      setError(err.message || 'An error occurred during lesion analysis.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenInfoModal = (code = 'melanoma') => {
    setModalInitialCode(code);
    setIsModalOpen(true);
  };

  return (
    <div className="app-layout">
      {/* Header with Health Pill */}
      <Header
        health={health}
        onRefreshHealth={fetchHealth}
        onOpenReference={() => handleOpenInfoModal('melanoma')}
      />

      {/* Main Container */}
      <main className="main-content">
        <div className="content-container">
          {/* Welcome Banner */}
          <div className="welcome-banner">
            <div className="banner-left">
              <h2 className="banner-heading">AI-Powered Dermatological Lesion Screening</h2>
              <p className="banner-text">
                Upload a dermoscopy image to classify across 7 skin condition types. Powered by MobileNetV2 deep learning architecture, Flask REST API, and interactive probability distribution analysis.
              </p>
              <div className="supported-conditions-bar mt-3 flex flex-wrap gap-1.5 items-center">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mr-1">Trained Categories:</span>
                {['akiec', 'bcc', 'bkl', 'df', 'melanoma', 'nv', 'vasc'].map(code => (
                  <span
                    key={code}
                    onClick={() => handleOpenInfoModal(code)}
                    className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-sky-50 text-sky-700 border border-sky-200 cursor-pointer hover:bg-sky-100 transition-colors"
                    title={`Click to view monograph for ${code}`}
                  >
                    {code}
                  </span>
                ))}
                <span className="text-xs text-amber-600 font-medium ml-2 inline-flex items-center">
                  ⚠️ Note: Vitiligo, Eczema & Acne are outside trained scope.
                </span>
              </div>
            </div>
            <div className="banner-meta">
              <div className="pipeline-step active">
                <span className="step-num">1</span>
                <span>Upload (I)</span>
              </div>
              <div className="pipeline-arrow">→</div>
              <div className="pipeline-step active">
                <span className="step-num">2</span>
                <span>Inference (H)</span>
              </div>
              <div className="pipeline-arrow">→</div>
              <div className="pipeline-step active">
                <span className="step-num">3</span>
                <span>Probability (J)</span>
              </div>
            </div>
          </div>

          {/* Grid Layout: Left (Upload) | Right (Results) */}
          <div className="dashboard-grid">
            {/* Left Column: Image Uploader & Workflow Guide */}
            <div className="grid-column">
              <ImageUploader
                selectedFile={selectedFile}
                previewUrl={previewUrl}
                isLoading={isLoading}
                error={error}
                onFileSelect={handleFileSelect}
                onClearFile={handleClearFile}
                onSubmitPrediction={handleAnalyze}
              />

              {/* How-to Card */}
              <div className="card guide-card">
                <h3 className="guide-title">
                  <HelpCircle className="w-4 h-4 text-sky-600" />
                  Best Practices for Dermoscopy Imaging
                </h3>
                <ul className="guide-list">
                  <li>
                    <CheckCircle2 className="guide-check" />
                    <strong>Even Lighting:</strong> Avoid sharp shadows, high specular reflections, or flash glare.
                  </li>
                  <li>
                    <CheckCircle2 className="guide-check" />
                    <strong>Centered Subject:</strong> Keep the lesion in the center of the frame covering at least 50% of the view.
                  </li>
                  <li>
                    <CheckCircle2 className="guide-check" />
                    <strong>Sharp Focus:</strong> Blurry or out-of-focus photos will trigger the low-confidence guardrail.
                  </li>
                </ul>
              </div>
            </div>

            {/* Right Column: Prediction Results & Member J's Chart */}
            <div className="grid-column">
              {predictionResult ? (
                <PredictionResult
                  result={predictionResult}
                  onSelectDiseaseCode={handleOpenInfoModal}
                />
              ) : (
                /* Awaiting inference placeholder */
                <div className="card empty-results-card">
                  <div className="empty-results-icon-wrap">
                    <FileQuestion className="w-12 h-12 text-slate-400" />
                  </div>
                  <h3 className="empty-results-title">No Analysis Results Yet</h3>
                  <p className="empty-results-text">
                    Select or drop a skin lesion photo on the left, then click <strong>"Analyze Skin Lesion"</strong> to run inference via the neural network.
                  </p>

                  <div className="empty-steps-list">
                    <div className="empty-step">
                      <div className="step-circle">
                        <Upload className="w-4 h-4" />
                      </div>
                      <span>Select skin photograph</span>
                    </div>
                    <div className="empty-step">
                      <div className="step-circle">
                        <Cpu className="w-4 h-4" />
                      </div>
                      <span>POST /api/predict inference</span>
                    </div>
                    <div className="empty-step">
                      <div className="step-circle">
                        <BarChart2 className="w-4 h-4" />
                      </div>
                      <span>Review Member J charts</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <div className="footer-container">
          <p className="footer-text">
            Skin Disease Classification System &bull; Collaborative Engineering Project
          </p>
          <div className="team-credits">
            <span>Model (G)</span>
            <span>&bull;</span>
            <span>Backend API (H)</span>
            <span>&bull;</span>
            <span className="highlight-tag">Frontend UI (I)</span>
            <span>&bull;</span>
            <span className="highlight-tag">Probability Charts (J)</span>
          </div>
        </div>
      </footer>

      {/* Reference Modal */}
      <DiseaseInfoModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialSelectedCode={modalInitialCode}
      />
    </div>
  );
}

export default App;
