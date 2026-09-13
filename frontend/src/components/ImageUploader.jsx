import React, { useRef, useState } from 'react';
import { UploadCloud, Image as ImageIcon, X, AlertTriangle, Sparkles, Check } from 'lucide-react';

// Preset samples (synthetically generated skin lesion images using HTML5 Canvas)
function createPresetBlob(type) {
  const canvas = document.createElement('canvas');
  canvas.width = 224;
  canvas.height = 224;
  const ctx = canvas.getContext('2d');

  // Background skin tone
  ctx.fillStyle = '#f3c7a2';
  ctx.fillRect(0, 0, 224, 224);

  // Add subtle skin texture noise
  for (let i = 0; i < 400; i++) {
    ctx.fillStyle = Math.random() > 0.5 ? 'rgba(230, 180, 150, 0.4)' : 'rgba(255, 230, 210, 0.4)';
    ctx.fillRect(Math.random() * 224, Math.random() * 224, 2, 2);
  }

  // Draw simulated lesion according to type
  if (type === 'melanoma') {
    // Irregular, asymmetric dark brown/black lesion
    const grad = ctx.createRadialGradient(108, 112, 10, 112, 112, 60);
    grad.addColorStop(0, '#1c1917');
    grad.addColorStop(0.5, '#451a03');
    grad.addColorStop(0.8, '#78350f');
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(112, 112, 55, 42, Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();

    // Jagged border notch
    ctx.fillStyle = '#1c1917';
    ctx.beginPath();
    ctx.arc(85, 95, 18, 0, Math.PI * 2);
    ctx.fill();
  } else if (type === 'nv') {
    // Smooth, round, uniform benign nevus (mole)
    const grad = ctx.createRadialGradient(112, 112, 5, 112, 112, 35);
    grad.addColorStop(0, '#5c2d16');
    grad.addColorStop(0.8, '#78350f');
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(112, 112, 35, 0, Math.PI * 2);
    ctx.fill();
  } else if (type === 'bcc') {
    // Translucent nodule with faint vascular arborization
    const grad = ctx.createRadialGradient(110, 110, 5, 112, 112, 45);
    grad.addColorStop(0, '#fed7aa');
    grad.addColorStop(0.6, '#f43f5e');
    grad.addColorStop(0.8, '#be123c');
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(112, 112, 45, 38, 0, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Vascular lesion (reddish)
    const grad = ctx.createRadialGradient(112, 112, 5, 112, 112, 30);
    grad.addColorStop(0, '#dc2626');
    grad.addColorStop(0.8, '#991b1b');
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(112, 112, 30, 0, Math.PI * 2);
    ctx.fill();
  }

  return new Promise(resolve => {
    canvas.toBlob(blob => {
      resolve(new File([blob], `${type}_sample.jpg`, { type: 'image/jpeg' }));
    }, 'image/jpeg');
  });
}

export function ImageUploader({
  selectedFile,
  previewUrl,
  isLoading,
  error,
  onFileSelect,
  onClearFile,
  onSubmitPrediction,
}) {
  const fileInputRef = useRef(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [localError, setLocalError] = useState(null);

  const handleFile = file => {
    setLocalError(null);
    if (!file) return;

    // Validate type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setLocalError('Invalid file type. Please upload a JPEG, PNG, or WEBP image.');
      return;
    }

    // Validate size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setLocalError('File size exceeds the 10MB limit.');
      return;
    }

    onFileSelect(file);
  };

  const handleDragOver = e => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = e => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = e => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handlePresetSelect = async presetName => {
    try {
      const file = await createPresetBlob(presetName);
      handleFile(file);
    } catch (e) {
      console.error('Failed to create sample image', e);
    }
  };

  const displayError = localError || error;

  return (
    <div className="card uploader-card">
      <div className="card-header">
        <div>
          <h2 className="card-title">1. Upload Skin Lesion Image</h2>
          <p className="card-desc">
            Provide a dermoscopic or high-resolution close-up photo of the affected area
          </p>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/jpeg,image/png,image/webp"
        onChange={e => {
          if (e.target.files && e.target.files.length > 0) {
            handleFile(e.target.files[0]);
          }
        }}
      />

      {/* Dropzone Area */}
      {!previewUrl ? (
        <div
          className={`dropzone ${isDragOver ? 'dropzone-active' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="dropzone-inner">
            <div className="upload-icon-circle">
              <UploadCloud className="w-8 h-8 text-sky-600" />
            </div>
            <div className="dropzone-text">
              <p className="dropzone-primary-text">
                <span className="browse-link">Click to browse</span> or drag & drop image here
              </p>
              <p className="dropzone-hint">
                Supports JPG, JPEG, PNG, WEBP (Max size: 10MB)
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* Image Preview Box */
        <div className="preview-container">
          <div className="preview-image-wrapper">
            <img src={previewUrl} alt="Skin lesion preview" className="preview-image" />
            <button
              type="button"
              className="clear-preview-btn"
              onClick={onClearFile}
              disabled={isLoading}
              title="Remove image"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="preview-meta">
            <div className="meta-item">
              <span className="meta-label">File name:</span>
              <span className="meta-value truncate" title={selectedFile?.name}>
                {selectedFile?.name}
              </span>
            </div>
            <div className="meta-item">
              <span className="meta-label">File size:</span>
              <span className="meta-value">
                {(selectedFile?.size / 1024).toFixed(1)} KB
              </span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Format:</span>
              <span className="meta-value">{selectedFile?.type || 'image/jpeg'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Error alert */}
      {displayError && (
        <div className="alert alert-error">
          <AlertTriangle className="alert-icon" />
          <div className="alert-text">{displayError}</div>
        </div>
      )}

      {/* Quick Test Presets */}
      <div className="presets-section">
        <div className="presets-header">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Quick Test Presets (Instant Dermoscopy Samples):</span>
        </div>
        <div className="presets-buttons">
          <button
            type="button"
            className="preset-pill"
            onClick={() => handlePresetSelect('melanoma')}
            disabled={isLoading}
          >
            Sample: Melanoma
          </button>
          <button
            type="button"
            className="preset-pill"
            onClick={() => handlePresetSelect('nv')}
            disabled={isLoading}
          >
            Sample: Benign Nevus (Mole)
          </button>
          <button
            type="button"
            className="preset-pill"
            onClick={() => handlePresetSelect('bcc')}
            disabled={isLoading}
          >
            Sample: Basal Cell Carcinoma
          </button>
          <button
            type="button"
            className="preset-pill"
            onClick={() => handlePresetSelect('vasc')}
            disabled={isLoading}
          >
            Sample: Vascular Lesion
          </button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="uploader-actions">
        <button
          type="button"
          className="btn btn-primary"
          disabled={!selectedFile || isLoading}
          onClick={onSubmitPrediction}
        >
          {isLoading ? (
            <>
              <span className="spinner" />
              <span>Analyzing Lesion via MobileNetV2...</span>
            </>
          ) : (
            <>
              <Check className="w-4 h-4" />
              <span>Analyze Skin Lesion</span>
            </>
          )}
        </button>

        {previewUrl && (
          <button
            type="button"
            className="btn btn-secondary"
            disabled={isLoading}
            onClick={() => fileInputRef.current?.click()}
          >
            Change Photo
          </button>
        )}
      </div>
    </div>
  );
}

export default ImageUploader;
