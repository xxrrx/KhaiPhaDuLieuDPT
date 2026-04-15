"""AI Service — loads and runs AI models from ai_models/ folder."""
import os
import io
import pickle
import logging
import numpy as np
from typing import Optional

logger = logging.getLogger(__name__)

BASE_DIR = os.path.join(os.path.dirname(__file__), "..", "ai_models")

# Lazy-loaded model globals
_skin_tone_model = None
_skin_kmeans = None
_body_shape_model = None
_outfit_recommender = None
_clothing_classifier = None

# EfficientNet-B0 trained with 3 classes: 0=Light, 1=Medium, 2=Dark
TONE_LABELS = ["Light", "Medium", "Dark"]

# Light → Summer, Medium → Autumn, Dark → Winter  (from notebook CELL 7)
TONE_TO_INFO = {
    0: {"level": 2, "description": "Sáng",         "season": "Summer"},
    1: {"level": 3, "description": "Trung bình",   "season": "Autumn"},
    2: {"level": 5, "description": "Tối",           "season": "Winter"},
}

BODY_SHAPES = ["hourglass", "pear", "apple", "rectangle", "inverted_triangle"]

COLOR_PALETTES = {
    "Winter": ["#000080", "#4169E1", "#DC143C", "#FFFFFF", "#C0C0C0", "#8B008B", "#006400"],
    "Summer": ["#FFB6C1", "#E6E6FA", "#B0C4DE", "#98FB98", "#F0E68C", "#ADD8E6", "#DDA0DD"],
    "Spring": ["#FF7F50", "#FFD700", "#90EE90", "#87CEEB", "#DDA0DD", "#FF6347", "#98FF98"],
    "Autumn": ["#8B4513", "#D2691E", "#DAA520", "#556B2F", "#8B0000", "#CD853F", "#B8860B"],
}

# Season descriptions in Vietnamese
SEASON_DESC = {
    "Winter": "Mùa Đông — màu sắc tương phản mạnh, lạnh và sáng",
    "Summer": "Mùa Hè — màu pastel nhẹ nhàng, mát mẻ",
    "Spring": "Mùa Xuân — màu tươi sáng, ấm áp",
    "Autumn": "Mùa Thu — màu đất, ấm trầm",
}


def _load_skin_tone_model():
    """Load EfficientNet-B0 with 3-class custom head (matches notebook training)."""
    global _skin_tone_model
    if _skin_tone_model is not None:
        return _skin_tone_model
    try:
        import torch
        import torch.nn as nn
        from torchvision.models import efficientnet_b0

        model_path = os.path.join(BASE_DIR, "skin_tone_classifier.pth")
        if not os.path.exists(model_path):
            logger.warning("skin_tone_classifier.pth not found")
            return None

        model = efficientnet_b0(weights=None)
        in_features = model.classifier[1].in_features  # 1280
        model.classifier = nn.Sequential(
            nn.Dropout(p=0.4),
            nn.Linear(in_features, 256),
            nn.ReLU(),
            nn.Dropout(p=0.2),
            nn.Linear(256, 3),  # 3 classes: Light / Medium / Dark
        )

        checkpoint = torch.load(model_path, map_location="cpu")
        if isinstance(checkpoint, dict) and "model_state_dict" in checkpoint:
            model.load_state_dict(checkpoint["model_state_dict"])
        elif isinstance(checkpoint, dict) and "state_dict" in checkpoint:
            model.load_state_dict(checkpoint["state_dict"])
        else:
            model.load_state_dict(checkpoint)

        model.eval()
        _skin_tone_model = model
        logger.info("skin_tone_classifier loaded (EfficientNet-B0, 3 class)")
    except Exception as e:
        logger.warning(f"skin_tone_classifier load failed: {e}")
        _skin_tone_model = None
    return _skin_tone_model


def _load_skin_kmeans():
    """Load skin kmeans dict: {'kmeans': KMeans, 'tone_labels': [...], 'season_map': {...}, ...}"""
    global _skin_kmeans
    if _skin_kmeans is not None:
        return _skin_kmeans
    try:
        with open(os.path.join(BASE_DIR, "skin_kmeans.pkl"), "rb") as f:
            data = pickle.load(f)
        # data is a dict with 'kmeans' key (from notebook CELL 7)
        if isinstance(data, dict) and "kmeans" in data:
            _skin_kmeans = data
        else:
            # Fallback: maybe saved as raw KMeans object
            _skin_kmeans = {"kmeans": data, "tone_labels": TONE_LABELS,
                            "season_map": {"Light": "Summer", "Medium": "Autumn", "Dark": "Winter"}}
        logger.info("skin_kmeans loaded")
    except Exception as e:
        logger.warning(f"skin_kmeans load failed: {e}")
        _skin_kmeans = None
    return _skin_kmeans


def _load_body_shape_model():
    global _body_shape_model
    if _body_shape_model is not None:
        return _body_shape_model
    try:
        with open(os.path.join(BASE_DIR, "body_shape_classifier.pkl"), "rb") as f:
            _body_shape_model = pickle.load(f)
        logger.info("body_shape_classifier loaded")
    except Exception as e:
        logger.warning(f"body_shape_classifier load failed: {e}")
        _body_shape_model = None
    return _body_shape_model


def _load_outfit_recommender():
    global _outfit_recommender
    if _outfit_recommender is not None:
        return _outfit_recommender
    try:
        with open(os.path.join(BASE_DIR, "outfit_recommender.pkl"), "rb") as f:
            _outfit_recommender = pickle.load(f)
        logger.info("outfit_recommender loaded")
    except Exception as e:
        logger.warning(f"outfit_recommender load failed: {e}")
        _outfit_recommender = None
    return _outfit_recommender


def _preprocess_image(image_bytes: bytes):
    """Preprocess image bytes for EfficientNet input."""
    try:
        import torch
        from torchvision import transforms
        from PIL import Image

        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
        ])
        return transform(img).unsqueeze(0), img
    except Exception as e:
        logger.warning(f"Image preprocess failed: {e}")
        return None, None


def _analyze_skin_tone_from_pixels(pil_img) -> Optional[int]:
    """
    Fallback: estimate skin tone (0=Light, 1=Medium, 2=Dark) from image
    by analyzing HSV brightness of the image.
    Returns 0/1/2 or None if fails.
    """
    try:
        import numpy as np
        from PIL import Image

        # Resize for speed
        img_small = pil_img.resize((100, 100)).convert("RGB")
        arr = np.array(img_small, dtype=np.float32)

        # Convert RGB to HSV-like value (V channel = brightness proxy)
        r, g, b = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2]
        # Simple skin mask: skin tones have R > G > B roughly, R > 60
        skin_mask = (r > 60) & (r > g) & (r > b) & ((r - g) < 100) & ((r - b) < 120)
        if skin_mask.sum() < 50:
            # Not enough skin pixels, use overall brightness
            brightness = arr.mean()
        else:
            brightness = arr[skin_mask].mean()

        # Map brightness to tone class
        if brightness > 180:
            return 0  # Light
        elif brightness > 120:
            return 1  # Medium
        else:
            return 2  # Dark
    except Exception as e:
        logger.warning(f"Pixel skin tone analysis failed: {e}")
        return None


def analyze_skin_tone(image_bytes: bytes) -> dict:
    """Predict Fitzpatrick skin tone level from image bytes."""
    model = _load_skin_tone_model()
    tensor, pil_img = _preprocess_image(image_bytes)

    tone_class = None  # 0=Light, 1=Medium, 2=Dark

    # 1. Try CNN model (EfficientNet-B0, 3 class)
    if model is not None and tensor is not None:
        try:
            import torch
            with torch.no_grad():
                output = model(tensor)
                probs = torch.softmax(output, dim=1)[0]
                tone_class = int(torch.argmax(probs).item())
                logger.info(f"CNN skin tone: {TONE_LABELS[tone_class]} (probs={probs.numpy().round(3)})")
        except Exception as e:
            logger.warning(f"CNN skin tone inference failed: {e}")
            tone_class = None

    # 2. Try KMeans fallback
    if tone_class is None:
        kmeans_data = _load_skin_kmeans()
        if kmeans_data is not None and pil_img is not None:
            try:
                img_arr = np.array(pil_img.resize((60, 60))).reshape(-1, 3).astype(np.float32)
                avg_color = img_arr.mean(axis=0).reshape(1, -1)
                km = kmeans_data["kmeans"]
                cluster = int(km.predict(avg_color)[0])
                tone_labels = kmeans_data.get("tone_labels", TONE_LABELS)
                tone_label = tone_labels[cluster % len(tone_labels)]
                season_map = kmeans_data.get("season_map", {"Light": "Summer", "Medium": "Autumn", "Dark": "Winter"})
                # Map label to tone class index
                label_to_class = {"Light": 0, "Medium": 1, "Dark": 2}
                tone_class = label_to_class.get(tone_label, 1)
                logger.info(f"KMeans skin tone: {tone_label} → class {tone_class}")
            except Exception as e:
                logger.warning(f"KMeans fallback failed: {e}")

    # 3. Pixel brightness fallback (always works if we have image)
    if tone_class is None and pil_img is not None:
        tone_class = _analyze_skin_tone_from_pixels(pil_img)
        if tone_class is not None:
            logger.info(f"Pixel fallback skin tone: class {tone_class} ({TONE_LABELS[tone_class]})")

    # 4. Hard fallback
    if tone_class is None:
        tone_class = 1  # Medium

    info = TONE_TO_INFO[tone_class]
    recommended_colors = COLOR_PALETTES.get(info["season"], COLOR_PALETTES["Autumn"])[:5]

    return {
        "fitzpatrick_level": info["level"],
        "color_season": info["season"],
        "season_description": SEASON_DESC.get(info["season"], ""),
        "recommended_colors": recommended_colors,
        "description": info["description"],
        "tone_class": TONE_LABELS[tone_class],
    }


def _extract_body_measurements_mediapipe(image_bytes: bytes) -> Optional[np.ndarray]:
    """
    Use MediaPipe Pose to extract body landmarks and estimate measurements.
    Supports both legacy (solutions) and new Tasks API (0.10+).
    Returns (1, 12) ndarray for XGBoost, or None if fails.
    """
    try:
        import mediapipe as mp
        from PIL import Image

        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        img_w, img_h = img.size
        img_arr = np.array(img)

        landmarks = None

        # Try legacy solutions API first (mediapipe < 0.10 or some builds)
        if hasattr(mp, "solutions") and hasattr(mp.solutions, "pose"):
            try:
                mp_pose = mp.solutions.pose
                with mp_pose.Pose(static_image_mode=True, model_complexity=1,
                                  min_detection_confidence=0.5) as pose:
                    results = pose.process(img_arr)
                if results.pose_landmarks:
                    lm = results.pose_landmarks.landmark
                    # landmark indices: LEFT_SHOULDER=11, RIGHT_SHOULDER=12,
                    #                   LEFT_HIP=23, RIGHT_HIP=24
                    #                   LEFT_ANKLE=27, RIGHT_ANKLE=28
                    landmarks = {
                        "ls": (lm[11].x * img_w, lm[11].y * img_h),
                        "rs": (lm[12].x * img_w, lm[12].y * img_h),
                        "lh": (lm[23].x * img_w, lm[23].y * img_h),
                        "rh": (lm[24].x * img_w, lm[24].y * img_h),
                        "la": (lm[27].x * img_w, lm[27].y * img_h),
                        "ra": (lm[28].x * img_w, lm[28].y * img_h),
                    }
            except Exception as e:
                logger.debug(f"MediaPipe solutions API failed: {e}")

        # Try Tasks API (mediapipe 0.10+)
        if landmarks is None:
            try:
                from mediapipe.tasks import python as mp_tasks
                from mediapipe.tasks.python import vision as mp_vision
                import urllib.request, tempfile, os as _os

                model_path = _os.path.join(_os.path.dirname(__file__), "..", "ai_models", "pose_landmarker_lite.task")
                if not _os.path.exists(model_path):
                    # Download lite model (~5MB)
                    url = "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task"
                    logger.info("Downloading MediaPipe pose model...")
                    urllib.request.urlretrieve(url, model_path)

                base_opts = mp_tasks.BaseOptions(model_asset_path=model_path)
                opts = mp_vision.PoseLandmarkerOptions(
                    base_options=base_opts,
                    running_mode=mp_vision.RunningMode.IMAGE,
                )
                with mp_vision.PoseLandmarker.create_from_options(opts) as landmarker:
                    mp_img = mp.Image(image_format=mp.ImageFormat.SRGB, data=img_arr)
                    result = landmarker.detect(mp_img)

                if result.pose_landmarks and len(result.pose_landmarks) > 0:
                    lm = result.pose_landmarks[0]
                    landmarks = {
                        "ls": (lm[11].x * img_w, lm[11].y * img_h),
                        "rs": (lm[12].x * img_w, lm[12].y * img_h),
                        "lh": (lm[23].x * img_w, lm[23].y * img_h),
                        "rh": (lm[24].x * img_w, lm[24].y * img_h),
                        "la": (lm[27].x * img_w, lm[27].y * img_h),
                        "ra": (lm[28].x * img_w, lm[28].y * img_h),
                    }
            except Exception as e:
                logger.debug(f"MediaPipe Tasks API failed: {e}")

        if landmarks is None:
            return None

        ls = np.array(landmarks["ls"])
        rs = np.array(landmarks["rs"])
        lh = np.array(landmarks["lh"])
        rh = np.array(landmarks["rh"])
        la = np.array(landmarks["la"])
        ra = np.array(landmarks["ra"])

        shoulder_w_px = np.linalg.norm(ls - rs)
        hip_w_px      = np.linalg.norm(lh - rh)
        height_px     = abs((la[1] + ra[1]) / 2 - (ls[1] + rs[1]) / 2)

        if shoulder_w_px < 1:
            return None

        scale       = 40.0 / shoulder_w_px   # shoulder ≈ 40cm
        shoulder_cm = shoulder_w_px * scale
        hip_cm      = hip_w_px * scale
        height_cm   = height_px * scale + 30  # +30 for head/feet

        bust       = shoulder_cm * 0.9
        waist      = hip_cm * 0.75
        hip        = hip_cm
        weight_est = (height_cm - 100) * 0.9

        waist_hip    = waist / hip if hip > 0 else 0
        bust_hip     = bust / hip if hip > 0 else 0
        waist_bust   = waist / bust if bust > 0 else 0
        bust_hip_d   = bust - hip
        hip_waist_d  = hip - waist
        bust_waist_d = bust - waist
        bmi = weight_est / ((height_cm / 100) ** 2) if height_cm > 0 else 22

        logger.info(f"MediaPipe: shoulder={shoulder_cm:.1f}cm hip={hip_cm:.1f}cm h={height_cm:.1f}cm")
        return np.array([[bust, waist, hip, height_cm, weight_est,
                          waist_hip, bust_hip, waist_bust,
                          bust_hip_d, hip_waist_d, bust_waist_d, bmi]])

    except Exception as e:
        logger.warning(f"MediaPipe body shape extraction failed: {e}")
        return None


def _infer_body_shape_from_image(image_bytes: bytes) -> Optional[str]:
    """
    Simple heuristic body shape from image when ML model/mediapipe unavailable.
    Uses shoulder vs hip pixel ratio as a rough proxy.
    """
    try:
        from PIL import Image
        import numpy as np

        img = Image.open(io.BytesIO(image_bytes)).convert("L")  # grayscale
        img = img.resize((64, 128))
        arr = np.array(img, dtype=np.float32)

        # Upper body = top 40%, lower body = bottom 40%
        upper_row = arr[:int(128 * 0.40), :]
        lower_row = arr[int(128 * 0.60):, :]

        # Measure horizontal "spread" — non-background pixels
        threshold = arr.mean()
        upper_spread = (upper_row < threshold).sum(axis=1).mean()
        lower_spread = (lower_row < threshold).sum(axis=1).mean()

        ratio = upper_spread / (lower_spread + 1e-6)

        if ratio > 1.2:
            return "inverted_triangle"
        elif ratio < 0.8:
            return "pear"
        else:
            return "rectangle"
    except Exception as e:
        logger.warning(f"Heuristic body shape failed: {e}")
        return None


def analyze_body_shape(image_bytes: bytes) -> dict:
    """Predict body shape from image bytes."""
    body_shape = None
    model = _load_body_shape_model()

    # 1. Try MediaPipe + XGBoost
    if model is not None:
        features = _extract_body_measurements_mediapipe(image_bytes)
        if features is not None:
            try:
                pred = model.predict(features)
                pred_val = pred[0] if hasattr(pred, "__iter__") else pred
                if isinstance(pred_val, (int, np.integer)):
                    body_shape = BODY_SHAPES[int(pred_val) % len(BODY_SHAPES)]
                else:
                    body_shape = str(pred_val)
                logger.info(f"XGBoost body shape: {body_shape}")
            except Exception as e:
                logger.warning(f"XGBoost body shape inference failed: {e}")

    # 2. Heuristic fallback
    if body_shape is None:
        body_shape = _infer_body_shape_from_image(image_bytes)
        if body_shape:
            logger.info(f"Heuristic body shape: {body_shape}")

    # 3. Hard fallback
    if body_shape is None:
        body_shape = "rectangle"

    shape_descriptions = {
        "hourglass":          "Đồng hồ cát — vai và hông cân đối, eo thon",
        "pear":               "Quả lê — hông rộng hơn vai",
        "apple":              "Quả táo — vai rộng, phần trên cơ thể to hơn",
        "rectangle":          "Hình chữ nhật — vai, eo và hông gần bằng nhau",
        "inverted_triangle":  "Tam giác ngược — vai rộng hơn hông",
    }

    style_tips = {
        "hourglass":         ["Váy wrap", "Blazer ôm", "Quần high-waist", "Váy bút chì"],
        "pear":              ["Áo off-shoulder", "Váy A-line", "Quần wide-leg", "Áo có chi tiết cổ"],
        "apple":             ["Áo empire waist", "Áo cổ V", "Váy maxi", "Quần wide-leg"],
        "rectangle":         ["Tạo đường cong với belt", "Áo ruffled", "Chân váy peplum", "Quần boyfriend"],
        "inverted_triangle": ["Váy A-line", "Quần flared", "Váy xòe", "Áo cổ tròn nhỏ"],
    }

    return {
        "body_shape": body_shape,
        "description": shape_descriptions.get(body_shape, ""),
        "style_tips": style_tips.get(body_shape, []),
    }


def classify_clothing(image_bytes: bytes) -> dict:
    """Classify clothing type from image using EfficientNet-B0 (matches notebook training)."""
    try:
        import torch
        import torch.nn as nn
        from torchvision.models import efficientnet_b0

        global _clothing_classifier
        idx2label = None

        if _clothing_classifier is None:
            model_path = os.path.join(BASE_DIR, "clothing_classifier.pth")
            if not os.path.exists(model_path):
                logger.warning("clothing_classifier.pth not found")
                return {"category": "unknown", "confidence": 0.0}

            checkpoint = torch.load(model_path, map_location="cpu")

            # Load label mapping saved by notebook
            idx2label = checkpoint.get("idx2label", {})
            num_classes = len(idx2label) if idx2label else 10

            model = efficientnet_b0(weights=None)
            in_features = model.classifier[1].in_features
            model.classifier = nn.Sequential(
                nn.Dropout(p=0.3),
                nn.Linear(in_features, num_classes),
            )
            model.load_state_dict(checkpoint["model_state_dict"])
            model.eval()

            # Store both model and label map
            _clothing_classifier = {"model": model, "idx2label": idx2label}
            logger.info(f"clothing_classifier loaded — {num_classes} classes: {list(idx2label.values())}")

        model = _clothing_classifier["model"]
        idx2label = _clothing_classifier["idx2label"]

        tensor, _ = _preprocess_image(image_bytes)
        if tensor is not None:
            with torch.no_grad():
                output = model(tensor)
                probs = torch.softmax(output, dim=1)[0]
                pred = int(torch.argmax(probs).item())
                label = idx2label.get(pred, str(pred))
                return {
                    "category": label,
                    "confidence": float(probs[pred].item()),
                }

    except Exception as e:
        logger.warning(f"classify_clothing failed: {e}")
    return {"category": "unknown", "confidence": 0.0}


def recommend_outfits(skin_tone: str, body_shape: str, occasion: str, gender: str = "female", preferences: dict = None, db=None) -> list:
    """Recommend products from database filtered by occasion, gender, and skin tone season."""

    # Map occasion → style value in products table
    OCCASION_TO_STYLE = {
        "casual": ["casual"],
        "formal": ["formal"],
        "party": ["party"],
        "sport": ["sport"],
        "date": ["casual", "formal"],
    }

    # Map skin tone season → preferred primary_color values in products table
    SEASON_TO_COLORS = {
        "Summer": ["pink", "white", "light blue", "lavender", "beige", "cream"],
        "Autumn": ["brown", "olive", "khaki", "beige", "cream", "orange"],
        "Winter": ["black", "white", "navy", "blue", "grey"],
        "Spring": ["white", "pink", "light blue", "floral", "beige", "cream"],
    }

    preferred_colors = SEASON_TO_COLORS.get(skin_tone, SEASON_TO_COLORS["Autumn"])
    styles = OCCASION_TO_STYLE.get(occasion, ["casual"])

    # Query from database
    if db is not None:
        try:
            cursor = db.cursor(dictionary=True)

            # Build style placeholders
            style_placeholders = ",".join(["%s"] * len(styles))
            color_placeholders = ",".join(["%s"] * len(preferred_colors))

            # Priority query: match both style AND preferred color
            cursor.execute(
                f"""SELECT p.id, p.name, p.brand, p.price, p.image_url,
                           p.primary_color, p.color_hex, p.style, p.description,
                           c.name AS category
                    FROM products p
                    JOIN categories c ON c.id = p.category_id
                    WHERE p.is_available = 1
                      AND p.gender IN (%s, 'unisex')
                      AND p.style IN ({style_placeholders})
                      AND p.primary_color IN ({color_placeholders})
                    ORDER BY p.view_count DESC
                    LIMIT 6""",
                (gender, *styles, *preferred_colors)
            )
            rows = cursor.fetchall()

            # Fallback: style match only (if not enough color-matched products)
            if len(rows) < 3:
                cursor.execute(
                    f"""SELECT p.id, p.name, p.brand, p.price, p.image_url,
                               p.primary_color, p.color_hex, p.style, p.description,
                               c.name AS category
                        FROM products p
                        JOIN categories c ON c.id = p.category_id
                        WHERE p.is_available = 1
                          AND p.gender IN (%s, 'unisex')
                          AND p.style IN ({style_placeholders})
                        ORDER BY p.view_count DESC
                        LIMIT 6""",
                    (gender, *styles)
                )
                rows = cursor.fetchall()

            cursor.close()

            if rows:
                return [{
                    "id": r["id"],
                    "name": r["name"],
                    "brand": r["brand"],
                    "price": float(r["price"]),
                    "image_url": r["image_url"],
                    "primary_color": r["primary_color"],
                    "color_hex": r["color_hex"],
                    "style": r["style"],
                    "category": r["category"],
                    "description": r.get("description", ""),
                } for r in rows]

        except Exception as e:
            logger.warning(f"DB recommend_outfits failed: {e}")

    return []
