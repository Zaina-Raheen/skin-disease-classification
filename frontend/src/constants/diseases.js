/**
 * Clinical metadata for the 7 skin lesion categories in the HAM10000 dataset:
 * akiec, bcc, bkl, df, melanoma, nv, vasc
 */
export const DISEASE_INFO = {
  akiec: {
    code: 'akiec',
    name: "Actinic Keratosis / Bowen's Disease",
    fullName: "Actinic Keratoses and Intraepithelial Carcinoma",
    category: 'Precancerous / Early Malignant',
    riskLevel: 'high', // 'high', 'moderate', 'low'
    riskColor: '#ef4444',
    bgColor: 'rgba(239, 68, 68, 0.1)',
    description:
      "A rough, scaly patch on the skin that develops from years of sun exposure. Left untreated, a small percentage can advance to squamous cell carcinoma.",
    clinicalNotes:
      "Common on sun-exposed areas like face, lips, ears, scalp, and forearms. Dermatological evaluation recommended.",
    nextStep: "Consult a dermatologist for evaluation and cryotherapy or topical treatment."
  },
  bcc: {
    code: 'bcc',
    name: 'Basal Cell Carcinoma',
    fullName: 'Basal Cell Carcinoma',
    category: 'Malignant Skin Cancer',
    riskLevel: 'high',
    riskColor: '#dc2626',
    bgColor: 'rgba(220, 38, 38, 0.1)',
    description:
      "The most common form of skin cancer. Usually appears as a pearly or waxy bump, flesh-colored or brown lesion, or bleeding sore that repeatedly crusts over.",
    clinicalNotes:
      "Slow-growing and rarely metastasizes, but can cause local tissue destruction if left untreated.",
    nextStep: "Urgent dermatological assessment for biopsy and surgical excision."
  },
  bkl: {
    code: 'bkl',
    name: 'Benign Keratosis',
    fullName: 'Benign Keratosis-like Lesions (Solar Lentigines / Seborrheic Keratoses)',
    category: 'Benign (Non-cancerous)',
    riskLevel: 'low',
    riskColor: '#10b981',
    bgColor: 'rgba(16, 185, 129, 0.1)',
    description:
      "Common non-cancerous skin growths that often appear as brown, black, or light tan patches with a 'pasted-on' or warty appearance.",
    clinicalNotes:
      "Extremely common in older adults. Harmless, though they can cosmetically mimic melanoma or basal cell carcinoma.",
    nextStep: "Routine monitoring. Consult a doctor if lesion bleeds, itches, or changes rapidly."
  },
  df: {
    code: 'df',
    name: 'Dermatofibroma',
    fullName: 'Dermatofibroma',
    category: 'Benign (Non-cancerous)',
    riskLevel: 'low',
    riskColor: '#10b981',
    bgColor: 'rgba(16, 185, 129, 0.1)',
    description:
      "A harmless, firm, small fibrous nodule beneath the skin, frequently found on the lower legs of young and middle-aged adults.",
    clinicalNotes:
      "Often displays the characteristic 'dimple sign' (pinching causes it to dimple inward). Does not turn malignant.",
    nextStep: "No treatment required unless symptomatic or cosmetically bothersome."
  },
  melanoma: {
    code: 'melanoma',
    name: 'Melanoma',
    fullName: 'Malignant Melanoma',
    category: 'Highly Malignant',
    riskLevel: 'critical',
    riskColor: '#991b1b',
    bgColor: 'rgba(153, 27, 27, 0.15)',
    description:
      "The most serious type of skin cancer, originating in melanin-producing cells (melanocytes). Characterized by asymmetry, irregular borders, and color variations.",
    clinicalNotes:
      "Early detection is vital: superficial spreading melanoma has a very high cure rate when treated promptly before invasive spread.",
    nextStep: "URGENT: Immediate clinical biopsy and evaluation by an oncologist/dermatologist."
  },
  nv: {
    code: 'nv',
    name: 'Melanocytic Nevus (Mole)',
    fullName: 'Melanocytic Nevus (Common Mole)',
    category: 'Benign (Non-cancerous)',
    riskLevel: 'low',
    riskColor: '#0ea5e9',
    bgColor: 'rgba(14, 165, 233, 0.1)',
    description:
      "Common benign neoplasms composed of melanocytes. They can be flat, elevated, smooth, or rough, ranging from flesh-toned to dark brown.",
    clinicalNotes:
      "The vast majority are completely benign. Watch for standard ABCDE warning signs (Asymmetry, Border, Color, Diameter, Evolving).",
    nextStep: "Normal skin feature. Periodic self-checks using the ABCDE guidelines."
  },
  vasc: {
    code: 'vasc',
    name: 'Vascular Lesion',
    fullName: 'Vascular Lesions (Angiomas, Pyogenic Granulomas, Hemorrhage)',
    category: 'Benign Vascular Growth',
    riskLevel: 'low',
    riskColor: '#8b5cf6',
    bgColor: 'rgba(139, 92, 246, 0.1)',
    description:
      "Lesions arising from blood vessels, including cherry angiomas, angiokeratomas, and pyogenic granulomas. They typically look bright red or purple.",
    clinicalNotes:
      "Usually benign and asymptomatic, though pyogenic granulomas can bleed easily upon minor trauma.",
    nextStep: "Benign in nature. See a specialist if frequent bleeding or ulceration occurs."
  },
  uncertain: {
    code: 'uncertain',
    name: 'Uncertain / Low Confidence',
    fullName: 'Inconclusive Dermatological Analysis',
    category: 'Inconclusive',
    riskLevel: 'moderate',
    riskColor: '#f59e0b',
    bgColor: 'rgba(245, 158, 11, 0.1)',
    description:
      "The predictive model could not achieve sufficient statistical confidence (threshold < 50%) for a decisive classification.",
    clinicalNotes:
      "Could be caused by image blurriness, suboptimal lighting, non-standard angle, or mixed morphological features.",
    nextStep: "Re-take the photo under bright, direct lighting in focus, or consult a medical professional."
  }
};

export const CLASS_LIST = ['akiec', 'bcc', 'bkl', 'df', 'melanoma', 'nv', 'vasc'];
