import os
import numpy as np
import tensorflow as tf


# Project base directory
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


# Model path
MODEL_PATH = os.path.join(
    BASE_DIR,
    "model",
    "final_model.h5"
)


# Class names
CLASS_NAMES = [
    "akiec",
    "bcc",
    "bkl",
    "df",
    "melanoma",
    "nv",
    "vasc"
]


# Image settings
IMAGE_SIZE = (224, 224)


print("Loading model...")

model = tf.keras.models.load_model(MODEL_PATH)

print("Model loaded successfully!")


def predict(image_path):
    """
    Predict skin disease from an image.

    Returns:
        {
            "class": predicted_class,
            "confidence": confidence_percentage
        }
    """

    # Check image exists
    if not os.path.exists(image_path):
        raise FileNotFoundError(
            f"Image not found: {image_path}"
        )

    # Load image
    image = tf.keras.utils.load_img(
        image_path,
        target_size=IMAGE_SIZE
    )

    # Convert image to array
    image_array = tf.keras.utils.img_to_array(image)

    # Add batch dimension
    image_array = np.expand_dims(
        image_array,
        axis=0
    )

    # Prediction
    predictions = model.predict(
        image_array,
        verbose=0
    )

    # Get predicted class
    predicted_index = np.argmax(
        predictions[0]
    )

    predicted_class = CLASS_NAMES[
        predicted_index
    ]

    # Get confidence
    confidence = float(
        predictions[0][predicted_index]
    ) * 100

    return {
        "class": predicted_class,
        "confidence": confidence
    }


if __name__ == "__main__":

    print("\nSkin Disease Prediction")
    print("========================")

    image_path = input(
        "Enter image path: "
    ).strip()

    result = predict(image_path)

    print("\nPrediction Result")
    print("========================")
    print("Class      :", result["class"])
    print(
        "Confidence :",
        f"{result['confidence']:.2f}%"
    )