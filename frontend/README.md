# Skin Disease Classification — Frontend (Member I & J)

React + Vite web application for dermatological skin lesion screening and inference visualization.

- **Member I Deliverable:** Upload UI (drag-and-drop, preview, `/api/predict` caller, diagnosis & confidence indicators, guardrails).
- **Member J Deliverable:** Chart components (`ProbabilityChart.jsx`) visualizing softmax distribution across all 7 disease classes.
- **Port:** Configured to run on `http://localhost:3000`.

---

## 1. Quick Start

### Install Dependencies
```bash
npm install
```
*(On Windows PowerShell, use `npm.cmd install` if script execution policies apply).*

### Start the Development Server
```bash
npm run dev
```
The application will start at **`http://localhost:3000`**.

### Production Build & Preview
```bash
npm run build
npm run preview
```

---

## 2. API Integration

The app connects to the Flask backend running on `http://localhost:5000`:
- **`GET /api/health`**: Checks if the backend is online and verifies whether the real neural network model or mock predictor is loaded.
- **`POST /api/predict`**: Sends the uploaded skin photo as `multipart/form-data` under the field name `image`.

---

## 3. Supported Classes (HAM10000 Dataset)

1. `akiec` — Actinic Keratoses and Intraepithelial Carcinoma (Precancerous)
2. `bcc` — Basal Cell Carcinoma (Malignant)
3. `bkl` — Benign Keratosis-like Lesions (Solar Lentigines / Seborrheic Keratoses)
4. `df` — Dermatofibroma (Benign)
5. `melanoma` — Malignant Melanoma (High Risk)
6. `nv` — Melanocytic Nevus (Common Mole)
7. `vasc` — Vascular Lesions (Angiomas, Pyogenic Granulomas)

---

## 4. Architecture & Component Structure

```text
src/
├── components/
│   ├── Header.jsx              # Navbar with system health status & disease index trigger
│   ├── ImageUploader.jsx       # Drag & drop, file picker, preview, dermoscopy sample presets
│   ├── PredictionResult.jsx    # Primary diagnosis, confidence metric, clinical advisory
│   ├── DiseaseInfoModal.jsx    # Complete clinical guide for all 7 lesion categories + ABCDE rule
│   └── charts/                 # [Member J's Modular Package]
│       ├── ProbabilityChart.jsx# Bar chart showing class distributions, ranked/A-Z toggle
│       └── index.js            # Module barrel export
├── constants/
│   └── diseases.js             # Clinical metadata, risk categories, and color schemes
├── services/
│   └── api.js                  # Fetch wrapper for /api/health and /api/predict
├── App.jsx                     # Root application container
├── main.jsx                    # React 18 DOM mount
└── index.css                   # Custom responsive styling and theme
```
