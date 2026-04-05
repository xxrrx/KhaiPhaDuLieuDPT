"""AI Service — loads and runs AI models from ai_models/ folder."""
import os
import io
import pickle
import numpy as np
from typing import Optional

BASE_DIR = os.path.join(os.path.dirname(__file__), "..", "ai_models")

# Lazy-loaded model globals
_skin_tone_model = None
_skin_kmeans = None
_body_shape_model = None
_outfit_recommender = None
_clothing_classifier = None


FITZPATRICK_MAP = {
    0: {"level": 1, "description": "Rất sáng", "season": "Winter"},
    1: {"level": 2, "description": "Sáng", "season": "Summer"},
    2: {"level": 3, "description": "Trung bình sáng", "season": "Spring"},
    3: {"level": 4, "description": "Trung bình", "season": "Autumn"},
    4: {"level": 5, "description": "Tối", "season": "Autumn"},
    5: {"level": 6, "description": "Rất tối", "season": "Winter"},
}

BODY_SHAPES = ["hourglass", "pear", "apple", "rectangle", "inverted_triangle"]

COLOR_PALETTES = {
    "Winter": ["#000080", "#800000", "#008000", "#FFFFFF", "#C0C0C0"],
    "Summer": ["#FFB6C1", "#E6E6FA", "#B0C4DE", "#F0E68C", "#98FB98"],
    "Spring": ["#FF7F50", "#FFD700", "#90EE90", "#87CEEB", "#DDA0DD"],
    "Autumn": ["#8B4513", "#D2691E", "#DAA520", "#556B2F", "#8B0000"],
}


def _load_skin_tone_model():
    global _skin_tone_model
    if _skin_tone_model is not None:
        return _skin_tone_model
    try:
        import torch
        import torch.nn as nn
        import torchvision.models as models

        model_path = os.path.join(BASE_DIR, "skin_tone_classifier.pth")
        model = models.resnet18(pretrained=False)
        model.fc = nn.Linear(model.fc.in_features, 6)
        checkpoint = torch.load(model_path, map_location="cpu")
        if isinstance(checkpoint, dict) and "state_dict" in checkpoint:
            model.load_state_dict(checkpoint["state_dict"])
        elif isinstance(checkpoint, dict) and "model_state_dict" in checkpoint:
            model.load_state_dict(checkpoint["model_state_dict"])
        else:
            try:
                model.load_state_dict(checkpoint)
            except Exception:
                pass
        model.eval()
        _skin_tone_model = model
    except Exception:
        _skin_tone_model = None
    return _skin_tone_model


def _load_skin_kmeans():
    global _skin_kmeans
    if _skin_kmeans is not None:
        return _skin_kmeans
    try:
        with open(os.path.join(BASE_DIR, "skin_kmeans.pkl"), "rb") as f:
            _skin_kmeans = pickle.load(f)
    except Exception:
        _skin_kmeans = None
    return _skin_kmeans


def _load_body_shape_model():
    global _body_shape_model
    if _body_shape_model is not None:
        return _body_shape_model
    try:
        with open(os.path.join(BASE_DIR, "body_shape_classifier.pkl"), "rb") as f:
            _body_shape_model = pickle.load(f)
    except Exception:
        _body_shape_model = None
    return _body_shape_model


def _load_outfit_recommender():
    global _outfit_recommender
    if _outfit_recommender is not None:
        return _outfit_recommender
    try:
        with open(os.path.join(BASE_DIR, "outfit_recommender.pkl"), "rb") as f:
            _outfit_recommender = pickle.load(f)
    except Exception:
        _outfit_recommender = None
    return _outfit_recommender


def _preprocess_image(image_bytes: bytes):
    """Preprocess image bytes for model input."""
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
    except Exception:
        return None, None


def analyze_skin_tone(image_bytes: bytes) -> dict:
    """Predict Fitzpatrick skin tone level from image bytes."""
    model = _load_skin_tone_model()
    tensor, pil_img = _preprocess_image(image_bytes)

    fitzpatrick_level = 3  # fallback
    color_season = "Spring"

    if model is not None and tensor is not None:
        try:
            import torch
            with torch.no_grad():
                output = model(tensor)
                pred_class = int(torch.argmax(output, dim=1).item())
                info = FITZPATRICK_MAP.get(pred_class, FITZPATRICK_MAP[2])
                fitzpatrick_level = info["level"]
                color_season = info["season"]
        except Exception:
            pass
    else:
        # Try kmeans fallback
        kmeans = _load_skin_kmeans()
        if kmeans is not None and pil_img is not None:
            try:
                import cv2
                import numpy as np
                img_arr = np.array(pil_img.resize((64, 64)))
                pixels = img_arr.reshape(-1, 3).astype(np.float32)
                cluster = int(kmeans.predict(pixels[:1])[0])
                info = FITZPATRICK_MAP.get(cluster % 6, FITZPATRICK_MAP[2])
                fitzpatrick_level = info["level"]
                color_season = info["season"]
            except Exception:
                pass

    recommended_colors = COLOR_PALETTES.get(color_season, COLOR_PALETTES["Spring"])
    return {
        "fitzpatrick_level": fitzpatrick_level,
        "color_season": color_season,
        "recommended_colors": recommended_colors,
        "description": FITZPATRICK_MAP.get(fitzpatrick_level - 1, FITZPATRICK_MAP[2])["description"],
    }


def analyze_body_shape(image_bytes: bytes) -> dict:
    """Predict body shape from image bytes."""
    model = _load_body_shape_model()
    body_shape = "rectangle"  # fallback

    if model is not None:
        try:
            _, pil_img = _preprocess_image(image_bytes)
            if pil_img is not None:
                import numpy as np
                img_arr = np.array(pil_img.resize((128, 128))).flatten().reshape(1, -1)
                pred = model.predict(img_arr)
                if hasattr(pred, "__iter__"):
                    pred_val = pred[0]
                else:
                    pred_val = pred
                if isinstance(pred_val, (int, np.integer)):
                    body_shape = BODY_SHAPES[int(pred_val) % len(BODY_SHAPES)]
                else:
                    body_shape = str(pred_val)
        except Exception:
            pass

    shape_descriptions = {
        "hourglass": "Đồng hồ cát — vai và hông cân đối, eo thon",
        "pear": "Quả lê — hông rộng hơn vai",
        "apple": "Quả táo — vai rộng, phần trên cơ thể to hơn",
        "rectangle": "Hình chữ nhật — vai, eo và hông gần bằng nhau",
        "inverted_triangle": "Tam giác ngược — vai rộng hơn hông",
    }

    return {
        "body_shape": body_shape,
        "description": shape_descriptions.get(body_shape, ""),
    }


def classify_clothing(image_bytes: bytes) -> dict:
    """Classify clothing type from image."""
    try:
        import torch
        import torch.nn as nn
        import torchvision.models as models

        global _clothing_classifier
        if _clothing_classifier is None:
            model_path = os.path.join(BASE_DIR, "clothing_classifier.pth")
            model = models.resnet18(pretrained=False)
            model.fc = nn.Linear(model.fc.in_features, 10)
            checkpoint = torch.load(model_path, map_location="cpu")
            try:
                model.load_state_dict(checkpoint)
            except Exception:
                pass
            model.eval()
            _clothing_classifier = model

        tensor, _ = _preprocess_image(image_bytes)
        if tensor is not None:
            with torch.no_grad():
                output = _clothing_classifier(tensor)
                pred = int(torch.argmax(output, dim=1).item())
                clothing_types = ["áo thun", "áo sơ mi", "quần jeans", "quần tây", "váy", "đầm", "áo khoác", "áo len", "áo blazer", "phụ kiện"]
                return {"category": clothing_types[pred % len(clothing_types)], "confidence": float(torch.softmax(output, dim=1).max().item())}
    except Exception:
        pass
    return {"category": "unknown", "confidence": 0.0}


def recommend_outfits(skin_tone: str, body_shape: str, occasion: str, preferences: dict, db=None) -> list:
    """Generate outfit recommendations."""
    model = _load_outfit_recommender()

    outfits = []
    if model is not None:
        try:
            # Encode inputs
            occasion_map = {"casual": 0, "formal": 1, "party": 2, "sport": 3, "date": 4}
            body_map = {"hourglass": 0, "pear": 1, "apple": 2, "rectangle": 3, "inverted_triangle": 4}
            skin_map = {"Spring": 0, "Summer": 1, "Autumn": 2, "Winter": 3}

            features = np.array([[
                skin_map.get(skin_tone, 0),
                body_map.get(body_shape, 0),
                occasion_map.get(occasion, 0),
            ]])
            result = model.predict(features)
            # Convert result to outfit suggestions
        except Exception:
            pass

    # Always return mock suggestions if model fails or for demo
    if not outfits:
        outfit_templates = {
            "casual": [
                {"name": "Casual Weekend", "items": ["Áo thun trắng", "Quần jeans xanh", "Sneakers trắng"], "colors": ["#FFFFFF", "#1E3A5F", "#F5F5F5"]},
                {"name": "Smart Casual", "items": ["Áo polo navy", "Quần khaki", "Loafers nâu"], "colors": ["#1F305E", "#C8AD7F", "#8B4513"]},
            ],
            "formal": [
                {"name": "Business Professional", "items": ["Áo sơ mi trắng", "Quần tây đen", "Giày da đen"], "colors": ["#FFFFFF", "#1C1C1C", "#2C2C2C"]},
                {"name": "Smart Formal", "items": ["Blazer xanh navy", "Áo sơ mi trắng", "Quần tây xám"], "colors": ["#1F305E", "#FFFFFF", "#808080"]},
            ],
            "party": [
                {"name": "Party Night", "items": ["Váy cocktail đen", "Cao gót vàng", "Clutch nhỏ"], "colors": ["#1C1C1C", "#FFD700", "#C0C0C0"]},
                {"name": "Festive Look", "items": ["Đầm đỏ", "Giày nude", "Trang sức vàng"], "colors": ["#DC143C", "#F5DEB3", "#FFD700"]},
            ],
            "sport": [
                {"name": "Active Wear", "items": ["Áo thể thao màu sắc", "Quần legging đen", "Giày thể thao"], "colors": ["#FF6B35", "#1C1C1C", "#FFFFFF"]},
            ],
            "date": [
                {"name": "Romantic Date", "items": ["Áo blouse hoa", "Quần wide-leg trắng", "Sandal thanh lịch"], "colors": ["#FFB6C1", "#FFFFFF", "#F5DEB3"]},
            ],
        }
        outfits = outfit_templates.get(occasion, outfit_templates["casual"])

    return outfits
