"""
utils/preprocessing.py
-----------------------
Validates an uploaded file before it's ever handed to the model.

Checks, in order:
    1. Extension is one of ALLOWED_EXTENSIONS.
    2. File isn't empty (0 bytes).
    3. File content is actually a readable image (PIL can open + verify it) —
       this catches renamed non-image files, e.g. a .txt renamed to .jpg.

Returns (is_valid, error_message, pil_image):
    - On success: (True, None, PIL.Image.Image)
    - On failure: (False, "reason", None)
"""

import io
from PIL import Image, UnidentifiedImageError

ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png", "webp"}


def _has_allowed_extension(filename: str) -> bool:
    if "." not in filename:
        return False
    ext = filename.rsplit(".", 1)[1].lower()
    return ext in ALLOWED_EXTENSIONS


def validate_upload(file_storage):
    """
    file_storage: a werkzeug FileStorage object (request.files['image']).
    """
    filename = file_storage.filename

    if not _has_allowed_extension(filename):
        return False, f"Unsupported file extension. Allowed: {', '.join(sorted(ALLOWED_EXTENSIONS))}", None

    raw_bytes = file_storage.read()
    file_storage.seek(0)  # reset stream pointer in case anything downstream re-reads it

    if len(raw_bytes) == 0:
        return False, "Uploaded file is empty", None

    try:
        image = Image.open(io.BytesIO(raw_bytes))
        image.verify()  # checks the file isn't truncated/corrupt
        # re-open after verify() — verify() leaves the image object unusable for further ops
        image = Image.open(io.BytesIO(raw_bytes))
        image.load()
    except (UnidentifiedImageError, OSError):
        return False, "Invalid image file", None

    return True, None, image
