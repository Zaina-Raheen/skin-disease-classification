"""
train_improved.py
-----------------
Upgraded 2-Stage Training Script for Skin Disease Classification.

Features:
1. Stage 1: Warmup of classification head with frozen MobileNetV2 base.
2. Stage 2: Fine-tuning of upper 40 layers of MobileNetV2 with low learning rate (1e-5).
3. Class Weighting: Automatically balances loss contribution across all 7 classes
   to counteract heavy dataset imbalance (e.g. nv mole majority class).
4. Data Augmentation: Random Flip, Rotation, Zoom, and Contrast to improve robustness.
"""

import os
import numpy as np
import tensorflow as tf
from tensorflow.keras import layers, models, callbacks
from sklearn.utils.class_weight import compute_class_weight

# Configuration
DATA_DIR = os.environ.get("DATA_DIR", "augmented_train")
IMAGE_SIZE = (224, 224)
BATCH_SIZE = 32
CLASSES = ["akiec", "bcc", "bkl", "df", "melanoma", "nv", "vasc"]
MODEL_SAVE_PATH = "model/final_model.h5"

def build_improved_model(num_classes=len(CLASSES)):
    base_model = tf.keras.applications.MobileNetV2(
        input_shape=(224, 224, 3),
        include_top=False,
        weights="imagenet"
    )
    
    # Freeze base initially
    base_model.trainable = False

    data_augmentation = models.Sequential([
        layers.RandomFlip("horizontal_and_vertical"),
        layers.RandomRotation(0.2),
        layers.RandomZoom(0.2),
        layers.RandomContrast(0.2),
    ], name="data_augmentation")

    inputs = layers.Input(shape=(224, 224, 3))
    x = data_augmentation(inputs)
    x = base_model(x, training=False)
    x = layers.GlobalAveragePooling2D()(x)
    x = layers.BatchNormalization()(x)
    x = layers.Dense(256, activation="relu")(x)
    x = layers.Dropout(0.4)(x)
    outputs = layers.Dense(num_classes, activation="softmax")(x)

    model = models.Model(inputs, outputs)
    return model, base_model

def get_class_weights(dataset):
    y_labels = []
    for _, labels in dataset:
        y_labels.extend(labels.numpy())
    unique_classes = np.unique(y_labels)
    computed_weights = compute_class_weight(
        class_weight="balanced",
        classes=unique_classes,
        y=y_labels
    )
    return dict(zip(unique_classes, computed_weights))

def train():
    if not os.path.exists(DATA_DIR):
        print(f"Data directory '{DATA_DIR}' not found. Please place dataset in '{DATA_DIR}' to execute training.")
        return

    print("Loading dataset from:", DATA_DIR)
    train_ds = tf.keras.utils.image_dataset_from_directory(
        DATA_DIR,
        validation_split=0.2,
        subset="training",
        seed=123,
        image_size=IMAGE_SIZE,
        batch_size=BATCH_SIZE,
        label_mode="int"
    )
    val_ds = tf.keras.utils.image_dataset_from_directory(
        DATA_DIR,
        validation_split=0.2,
        subset="validation",
        seed=123,
        image_size=IMAGE_SIZE,
        batch_size=BATCH_SIZE,
        label_mode="int"
    )

    class_weights = get_class_weights(train_ds)
    print("Computed Class Weights:", class_weights)

    model, base_model = build_improved_model()

    # --- STAGE 1: Train Head ---
    print("\n--- STAGE 1: Training Classification Head ---")
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=1e-3),
        loss="sparse_categorical_crossentropy",
        metrics=["accuracy"]
    )

    checkpoint_cb = callbacks.ModelCheckpoint(MODEL_SAVE_PATH, save_best_only=True, monitor="val_accuracy")
    early_stop_cb = callbacks.EarlyStopping(patience=5, restore_best_weights=True, monitor="val_accuracy")

    model.fit(
        train_ds,
        validation_data=val_ds,
        epochs=10,
        class_weight=class_weights,
        callbacks=[checkpoint_cb, early_stop_cb]
    )

    # --- STAGE 2: Fine-Tuning ---
    print("\n--- STAGE 2: Fine-Tuning Top Layers ---")
    base_model.trainable = True
    # Freeze initial layers, unfreeze top 40 layers
    for layer in base_model.layers[:-40]:
        layer.trainable = False

    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=1e-5),
        loss="sparse_categorical_crossentropy",
        metrics=["accuracy"]
    )

    reduce_lr = callbacks.ReduceLROnPlateau(monitor="val_loss", factor=0.5, patience=2, min_lr=1e-7)

    model.fit(
        train_ds,
        validation_data=val_ds,
        epochs=20,
        class_weight=class_weights,
        callbacks=[checkpoint_cb, early_stop_cb, reduce_lr]
    )

    print(f"\nTraining Complete. Improved model saved to '{MODEL_SAVE_PATH}'.")

if __name__ == "__main__":
    train()
