import os
import json
import numpy as np
import tensorflow as tf
import matplotlib.pyplot as plt
import seaborn as sns

from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix,
    classification_report
)

# ============================================================
# 1. PROJECT PATHS
# ============================================================

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

MODEL_PATH = os.path.join(BASE_DIR, "model", "model.h5")
TEST_DIR = os.path.join(BASE_DIR, "preprocessed_data", "test")

EVALUATION_DIR = os.path.join(BASE_DIR, "evaluation")

METRICS_PATH = os.path.join(EVALUATION_DIR, "metrics.json")
CONFUSION_MATRIX_PATH = os.path.join(
    EVALUATION_DIR,
    "confusion_matrix.png"
)

FINAL_MODEL_PATH = os.path.join(
    BASE_DIR,
    "model",
    "final_model.h5"
)

# ============================================================
# 2. SETTINGS
# ============================================================

IMAGE_SIZE = (224, 224)
BATCH_SIZE = 32

# ============================================================
# 3. CHECK FILES AND FOLDERS
# ============================================================

print("\n========================================")
print("SKIN DISEASE MODEL EVALUATION")
print("========================================")

if not os.path.exists(MODEL_PATH):
    raise FileNotFoundError(
        f"Model not found: {MODEL_PATH}"
    )

if not os.path.exists(TEST_DIR):
    raise FileNotFoundError(
        f"Test dataset not found: {TEST_DIR}"
    )

os.makedirs(EVALUATION_DIR, exist_ok=True)

print("\nModel found:")
print(MODEL_PATH)

print("\nTest dataset found:")
print(TEST_DIR)

# ============================================================
# 4. LOAD TRAINED MODEL
# ============================================================

print("\nLoading trained model...")

model = tf.keras.models.load_model(MODEL_PATH)

print("Model loaded successfully!")

# ============================================================
# 5. LOAD TEST DATASET
# ============================================================

print("\nLoading test dataset...")

test_dataset = tf.keras.utils.image_dataset_from_directory(
    TEST_DIR,
    image_size=IMAGE_SIZE,
    batch_size=BATCH_SIZE,
    label_mode="categorical",
    shuffle=False
)

class_names = test_dataset.class_names

print("\nClasses:")
for i, class_name in enumerate(class_names):
    print(f"{i}: {class_name}")

# ============================================================
# 6. IMPROVE DATA PIPELINE SPEED
# ============================================================

AUTOTUNE = tf.data.AUTOTUNE

test_dataset = test_dataset.prefetch(
    buffer_size=AUTOTUNE
)

# ============================================================
# 7. GET TRUE LABELS AND PREDICTIONS
# ============================================================

print("\nRunning predictions...")

y_true = []
y_pred = []

for images, labels in test_dataset:

    predictions = model.predict(
        images,
        verbose=0
    )

    predicted_classes = np.argmax(
        predictions,
        axis=1
    )

    true_classes = np.argmax(
        labels.numpy(),
        axis=1
    )

    y_true.extend(true_classes)
    y_pred.extend(predicted_classes)

y_true = np.array(y_true)
y_pred = np.array(y_pred)

print("Prediction completed!")

# ============================================================
# 8. CALCULATE METRICS
# ============================================================

accuracy = accuracy_score(
    y_true,
    y_pred
)

precision = precision_score(
    y_true,
    y_pred,
    average="weighted",
    zero_division=0
)

recall = recall_score(
    y_true,
    y_pred,
    average="weighted",
    zero_division=0
)

f1 = f1_score(
    y_true,
    y_pred,
    average="weighted",
    zero_division=0
)

# ============================================================
# 9. PRINT RESULTS
# ============================================================

print("\n========================================")
print("EVALUATION RESULTS")
print("========================================")

print(f"Accuracy  : {accuracy:.4f}")
print(f"Precision : {precision:.4f}")
print(f"Recall    : {recall:.4f}")
print(f"F1 Score  : {f1:.4f}")

# Percentage format

print("\nPercentage:")
print(f"Accuracy  : {accuracy * 100:.2f}%")
print(f"Precision : {precision * 100:.2f}%")
print(f"Recall    : {recall * 100:.2f}%")
print(f"F1 Score  : {f1 * 100:.2f}%")

# ============================================================
# 10. CLASSIFICATION REPORT
# ============================================================

print("\n========================================")
print("CLASSIFICATION REPORT")
print("========================================")

report = classification_report(
    y_true,
    y_pred,
    target_names=class_names,
    zero_division=0
)

print(report)

# ============================================================
# 11. CONFUSION MATRIX
# ============================================================

print("\nGenerating confusion matrix...")

cm = confusion_matrix(
    y_true,
    y_pred
)

plt.figure(
    figsize=(10, 8)
)

sns.heatmap(
    cm,
    annot=True,
    fmt="d",
    cmap="Blues",
    xticklabels=class_names,
    yticklabels=class_names
)

plt.xlabel("Predicted Label")
plt.ylabel("True Label")
plt.title("Skin Disease Classification - Confusion Matrix")

plt.tight_layout()

plt.savefig(
    CONFUSION_MATRIX_PATH,
    dpi=300
)

plt.close()

print("Confusion matrix saved:")
print(CONFUSION_MATRIX_PATH)

# ============================================================
# 12. SAVE METRICS TO JSON
# ============================================================

metrics = {
    "accuracy": float(accuracy),
    "precision": float(precision),
    "recall": float(recall),
    "f1_score": float(f1),
    "accuracy_percentage": float(accuracy * 100),
    "precision_percentage": float(precision * 100),
    "recall_percentage": float(recall * 100),
    "f1_score_percentage": float(f1 * 100),
    "classes": class_names,
    "test_samples": int(len(y_true))
}

with open(
    METRICS_PATH,
    "w"
) as file:

    json.dump(
        metrics,
        file,
        indent=4
    )

print("\nMetrics saved:")
print(METRICS_PATH)

# ============================================================
# 13. SAVE FINAL MODEL
# ============================================================

print("\nSaving final model...")

model.save(
    FINAL_MODEL_PATH
)

print("Final model saved:")
print(FINAL_MODEL_PATH)

# ============================================================
# 14. FINAL STATUS
# ============================================================

print("\n========================================")
print("EVALUATION COMPLETED SUCCESSFULLY")
print("========================================")

print("\nOutput files:")

print("1. final_model.h5")
print("   Location:")
print(FINAL_MODEL_PATH)

print("\n2. metrics.json")
print("   Location:")
print(METRICS_PATH)

print("\n3. confusion_matrix.png")
print("   Location:")
print(CONFUSION_MATRIX_PATH)

print("\n========================================")