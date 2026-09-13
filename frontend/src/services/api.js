/**
 * API service for communicating with the Skin Disease Classification Flask backend.
 * Endpoints:
 *   GET  /api/health
 *   POST /api/predict
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

/**
 * Check backend health & model mode (real vs mock)
 */
export async function checkHealth() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/health`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!res.ok) {
      throw new Error(`Health check failed with status: ${res.status}`);
    }

    const data = await res.json();
    return {
      online: true,
      data,
    };
  } catch (err) {
    return {
      online: false,
      error: err.message,
    };
  }
}

/**
 * Send an image file to /api/predict
 * @param {File} file - The image file from input or drag-and-drop
 * @returns {Promise<Object>} API response object
 */
export async function predictSkinLesion(file) {
  if (!file) {
    throw new Error('No image file selected.');
  }

  // Pre-flight file size check (10MB limit matching backend)
  const MAX_SIZE_BYTES = 10 * 1024 * 1024;
  if (file.size > MAX_SIZE_BYTES) {
    throw new Error('File exceeds 10MB limit. Please upload a smaller image.');
  }

  // Pre-flight extension check
  const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp'];
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (!ext || !allowedExtensions.includes(ext)) {
    throw new Error(`Unsupported file type (.${ext}). Allowed: JPEG, PNG, WEBP.`);
  }

  const formData = new FormData();
  formData.append('image', file);

  let response;
  try {
    response = await fetch(`${API_BASE_URL}/api/predict`, {
      method: 'POST',
      body: formData,
      // Note: Do NOT set Content-Type header; browser must set multipart boundary
    });
  } catch (networkErr) {
    throw new Error(
      'Cannot connect to the prediction server. Please verify the Flask backend is running on http://localhost:5000.'
    );
  }

  let result;
  try {
    result = await response.json();
  } catch (parseErr) {
    throw new Error(`Server returned non-JSON response (status ${response.status}).`);
  }

  if (!response.ok || !result.success) {
    const errorMsg = result.error || `Prediction failed with status code ${response.status}.`;
    throw new Error(errorMsg);
  }

  return result;
}
