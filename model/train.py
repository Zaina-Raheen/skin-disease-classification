import os
import pandas as pd
import tensorflow as tf
from tensorflow.keras import layers, models
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint


# ============================================================
# 1. PROJECT PATHS
# ============================================================

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

TRAIN_DIR = os.path.join(BASE_DIR, "augmented_train")
VAL_DIR = os.path.join(BASE_DIR, "preprocessed_data", "val")

MODEL_DIR = os.path.join(BASE_DIR, "model")

MODEL_PATH = os.path.join(MODEL_DIR, "model.h5")
LOG_PATH = os.path.join(MODEL_DIR, "training_logs.csv")


# ============================================================
# 2. TRAINING SETTINGS
# ============================================================

IMAGE_SIZE = (224, 224)
BATCH_SIZE = 32

# START WITH 1 FOR THE FIRST TEST
EPOCHS = 15

SEED = 42


# ============================================================
# 3. LOAD TRAINING DATA
# ============================================================

print("\nLoading training dataset...")

train_dataset = tf.keras.utils.image_dataset_from_directory(
    TRAIN_DIR,
    image_size=IMAGE_SIZE,
    batch_size=BATCH_SIZE,
    label_mode="categorical",
    shuffle=True,
    seed=SEED
)


# ============================================================
# 4. LOAD VALIDATION DATA
# ============================================================

print("\nLoading validation dataset...")

validation_dataset = tf.keras.utils.image_dataset_from_directory(
    VAL_DIR,
    image_size=IMAGE_SIZE,
    batch_size=BATCH_SIZE,
    label_mode="categorical",
    shuffle=False
)


# ============================================================
# 5. CHECK CLASS NAMES
# ============================================================

class_names = train_dataset.class_names

print("\nClasses detected:")
for i, class_name in enumerate(class_names):
    print(f"{i}: {class_name}")

print(f"\nNumber of classes: {len(class_names)}")


# ============================================================
# 6. VERIFY TRAINING AND VALIDATION CLASSES MATCH
# ============================================================

if class_names != validation_dataset.class_names:
    raise ValueError(
        "Training and validation class names/order do not match!"
    )

print("\nTraining and validation classes match successfully.")


# ============================================================
# 7. OPTIMIZE DATA PIPELINE
# ============================================================

AUTOTUNE = tf.data.AUTOTUNE

train_dataset = train_dataset.prefetch(
    buffer_size=AUTOTUNE
)

validation_dataset = validation_dataset.prefetch(
    buffer_size=AUTOTUNE
)


# ============================================================
# 8. LOAD MOBILENETV2
# ============================================================

print("\nLoading MobileNetV2...")

base_model = MobileNetV2(
    input_shape=(224, 224, 3),
    include_top=False,
    weights="imagenet"
)

# Freeze pretrained layers
base_model.trainable = False


# ============================================================
# 9. BUILD CLASSIFICATION MODEL
# ============================================================

model = models.Sequential([
    base_model,

    layers.GlobalAveragePooling2D(),

    layers.Dense(
        128,
        activation="relu"
    ),

    layers.Dropout(0.3),

    layers.Dense(
        len(class_names),
        activation="softmax"
    )
])


# ============================================================
# 10. COMPILE MODEL
# ============================================================

model.compile(
    optimizer=tf.keras.optimizers.Adam(
        learning_rate=0.001
    ),

    loss="categorical_crossentropy",

    metrics=["accuracy"]
)


# ============================================================
# 11. DISPLAY MODEL
# ============================================================

print("\nModel architecture:")

model.summary()


# ============================================================
# 12. CALLBACKS
# ============================================================

early_stopping = EarlyStopping(
    monitor="val_loss",
    patience=5,
    restore_best_weights=True,
    verbose=1
)

model_checkpoint = ModelCheckpoint(
    MODEL_PATH,
    monitor="val_accuracy",
    save_best_only=True,
    verbose=1
)


# ============================================================
# 13. TRAIN MODEL
# ============================================================

print("\n========================================")
print("STARTING MODEL TRAINING")
print("========================================\n")

history = model.fit(
    train_dataset,

    validation_data=validation_dataset,

    epochs=EPOCHS,

    callbacks=[
        early_stopping,
        model_checkpoint
    ]
)


# ============================================================
# 14. SAVE TRAINING HISTORY
# ============================================================

history_df = pd.DataFrame(history.history)

history_df.insert(
    0,
    "epoch",
    range(1, len(history_df) + 1)
)

history_df.to_csv(
    LOG_PATH,
    index=False
)


# ============================================================
# 15. FINAL STATUS
# ============================================================

print("\n========================================")
print("TRAINING COMPLETED")
print("========================================")

print(f"\nModel saved at:")
print(MODEL_PATH)

print(f"\nTraining logs saved at:")
print(LOG_PATH)

print("\nFinal training metrics:")

for key, values in history.history.items():
    print(f"{key}: {values[-1]:.4f}")