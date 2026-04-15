"""
Test script: kiểm tra từng AI model có load và inference được không.
Chạy từ thư mục backend/:
    python test_models.py
    python test_models.py --image path/to/photo.jpg   # test với ảnh thật
"""
import os
import sys
import io
import argparse
import urllib.request

# Đảm bảo import đúng app package
sys.path.insert(0, os.path.dirname(__file__))

PASS = "\033[92m[PASS]\033[0m"
FAIL = "\033[91m[FAIL]\033[0m"
INFO = "\033[94m[INFO]\033[0m"
WARN = "\033[93m[WARN]\033[0m"

def section(title):
    print(f"\n{'='*55}")
    print(f"  {title}")
    print('='*55)


# ─────────────────────────────────────────────
# 1. Kiểm tra thư viện cần thiết
# ─────────────────────────────────────────────
def check_dependencies():
    section("1. Kiểm tra thư viện")
    libs = {
        "torch":        "PyTorch",
        "torchvision":  "TorchVision",
        "PIL":          "Pillow",
        "sklearn":      "scikit-learn",
        "numpy":        "NumPy",
        "mediapipe":    "MediaPipe (optional)",
        "cv2":          "OpenCV (optional)",
    }
    results = {}
    for mod, name in libs.items():
        try:
            m = __import__(mod)
            ver = getattr(m, "__version__", "?")
            print(f"  {PASS} {name:25s} v{ver}")
            results[mod] = True
        except ImportError:
            optional = "(optional)" in name
            mark = WARN if optional else FAIL
            print(f"  {mark} {name:25s} NOT INSTALLED")
            results[mod] = False
    return results


# ─────────────────────────────────────────────
# 2. Kiểm tra file model tồn tại
# ─────────────────────────────────────────────
def check_model_files():
    section("2. Kiểm tra file model")
    base = os.path.join(os.path.dirname(__file__), "app", "ai_models")
    files = {
        "skin_tone_classifier.pth":  "Skin Tone (EfficientNet-B0)",
        "skin_kmeans.pkl":           "Skin KMeans fallback",
        "body_shape_classifier.pkl": "Body Shape (XGBoost)",
        "clothing_classifier.pth":   "Clothing Classifier (ResNet18)",
        "outfit_recommender.pkl":    "Outfit Recommender (TF-IDF)",
    }
    all_ok = True
    for fname, desc in files.items():
        path = os.path.join(base, fname)
        if os.path.exists(path):
            size_kb = os.path.getsize(path) / 1024
            print(f"  {PASS} {desc:40s} {size_kb:,.0f} KB")
        else:
            print(f"  {FAIL} {desc:40s} FILE MISSING: {path}")
            all_ok = False
    return all_ok


# ─────────────────────────────────────────────
# 3. Kiểm tra load model
# ─────────────────────────────────────────────
def check_model_loading():
    section("3. Kiểm tra load model vào bộ nhớ")
    from app.services import ai_service

    tests = [
        ("Skin Tone CNN",      ai_service._load_skin_tone_model),
        ("Skin KMeans",        ai_service._load_skin_kmeans),
        ("Body Shape XGBoost", ai_service._load_body_shape_model),
        ("Outfit Recommender", ai_service._load_outfit_recommender),
    ]
    results = {}
    for name, fn in tests:
        try:
            model = fn()
            if model is not None:
                print(f"  {PASS} {name:30s} loaded OK  → {type(model).__name__}")
                results[name] = True
            else:
                print(f"  {FAIL} {name:30s} returned None (load failed)")
                results[name] = False
        except Exception as e:
            print(f"  {FAIL} {name:30s} Exception: {e}")
            results[name] = False
    return results


# ─────────────────────────────────────────────
# 4. Kiểm tra inference với ảnh
# ─────────────────────────────────────────────
def get_test_image(image_path=None):
    """Trả về image bytes để test. Dùng ảnh được cung cấp hoặc tạo ảnh giả."""
    if image_path and os.path.exists(image_path):
        with open(image_path, "rb") as f:
            data = f.read()
        print(f"  {INFO} Dùng ảnh thật: {image_path} ({len(data)//1024} KB)")
        return data

    # Tạo ảnh test màu da trung bình (skin-tone-like)
    try:
        from PIL import Image
        import numpy as np
        # Ảnh 224x224, màu da sáng (RGB ~ 200, 160, 130)
        arr = np.full((224, 224, 3), [200, 160, 130], dtype=np.uint8)
        # Thêm ít noise để không hoàn toàn đồng nhất
        noise = np.random.randint(-20, 20, arr.shape, dtype=np.int16)
        arr = np.clip(arr.astype(np.int16) + noise, 0, 255).astype(np.uint8)
        img = Image.fromarray(arr)
        buf = io.BytesIO()
        img.save(buf, format="JPEG")
        data = buf.getvalue()
        print(f"  {WARN} Không có ảnh thật → dùng ảnh synthetic (màu da sáng, {len(data)//1024} KB)")
        return data
    except Exception as e:
        print(f"  {FAIL} Không tạo được ảnh test: {e}")
        return None


def check_skin_tone_inference(image_bytes):
    section("4a. Test inference: Skin Tone Analysis")
    try:
        from app.services.ai_service import analyze_skin_tone
        result = analyze_skin_tone(image_bytes)

        fitz = result.get("fitzpatrick_level")
        season = result.get("color_season")
        desc = result.get("description")
        colors = result.get("recommended_colors", [])
        tone_class = result.get("tone_class", "?")

        print(f"  {PASS} Kết quả nhận được:")
        print(f"         Fitzpatrick  : F{fitz}")
        print(f"         Tone class   : {tone_class}")
        print(f"         Mô tả        : {desc}")
        print(f"         Mùa          : {season}")
        print(f"         Màu gợi ý    : {colors}")

        # Kiểm tra tính hợp lệ
        warnings = []
        if fitz == 3 and season == "Spring":
            warnings.append("Kết quả là F3/Spring — có thể đang dùng hardcoded fallback!")
        if len(colors) == 0:
            warnings.append("Không có màu gợi ý!")
        if fitz not in range(1, 7):
            warnings.append(f"Fitzpatrick level không hợp lệ: {fitz}")

        for w in warnings:
            print(f"  {WARN} {w}")
        if not warnings:
            print(f"  {PASS} Kết quả có vẻ hợp lệ")
        return result
    except Exception as e:
        print(f"  {FAIL} Exception: {e}")
        import traceback; traceback.print_exc()
        return None


def check_body_shape_inference(image_bytes):
    section("4b. Test inference: Body Shape Analysis")
    try:
        from app.services.ai_service import analyze_body_shape
        result = analyze_body_shape(image_bytes)

        shape = result.get("body_shape")
        desc = result.get("description")
        tips = result.get("style_tips", [])

        print(f"  {PASS} Kết quả nhận được:")
        print(f"         Vóc dáng   : {shape}")
        print(f"         Mô tả      : {desc}")
        print(f"         Style tips : {tips[:2]}...")

        VALID_SHAPES = ["hourglass", "pear", "apple", "rectangle", "inverted_triangle"]
        if shape not in VALID_SHAPES:
            print(f"  {FAIL} Body shape không hợp lệ: {shape}")
        elif shape == "rectangle":
            print(f"  {WARN} Kết quả là 'rectangle' — có thể là fallback (MediaPipe không detect được người trong ảnh)")
        else:
            print(f"  {PASS} Kết quả hợp lệ")
        return result
    except Exception as e:
        print(f"  {FAIL} Exception: {e}")
        import traceback; traceback.print_exc()
        return None


def check_skin_tone_with_multiple_images():
    """Test với nhiều màu nền khác nhau để xem model có trả kết quả đa dạng không."""
    section("5. Kiểm tra tính đa dạng kết quả (3 tone khác nhau)")
    try:
        from PIL import Image
        import numpy as np
        from app.services.ai_service import analyze_skin_tone

        test_cases = [
            ("Tone sáng (Light)",  [230, 195, 165]),  # light skin
            ("Tone trung bình (Medium)", [180, 130, 95]),  # medium skin
            ("Tone tối (Dark)",    [110, 75, 55]),   # dark skin
        ]

        results = []
        for label, rgb in test_cases:
            arr = np.full((224, 224, 3), rgb, dtype=np.uint8)
            img = Image.fromarray(arr)
            buf = io.BytesIO()
            img.save(buf, format="JPEG")
            result = analyze_skin_tone(buf.getvalue())
            season = result.get("color_season")
            fitz = result.get("fitzpatrick_level")
            tone = result.get("tone_class")
            print(f"  {label:35s} → F{fitz}, {tone}, {season}")
            results.append(result)

        # Kiểm tra xem kết quả có đa dạng không
        seasons = [r.get("color_season") for r in results]
        if len(set(seasons)) < 2:
            print(f"  {WARN} Tất cả đều trả về cùng mùa ({seasons[0]}) — model chưa hoạt động đúng")
        else:
            print(f"  {PASS} Kết quả đa dạng: {set(seasons)}")
    except Exception as e:
        print(f"  {FAIL} Exception: {e}")
        import traceback; traceback.print_exc()


# ─────────────────────────────────────────────
# Main
# ─────────────────────────────────────────────
if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--image", type=str, default=None,
                        help="Đường dẫn ảnh thật để test (JPG/PNG)")
    args = parser.parse_args()

    print("\n" + "="*55)
    print("  SmartFit AI Model Test Suite")
    print("="*55)

    deps = check_dependencies()
    check_model_files()
    load_results = check_model_loading()

    section("4. Chuẩn bị ảnh test")
    image_bytes = get_test_image(args.image)

    if image_bytes:
        check_skin_tone_inference(image_bytes)
        check_body_shape_inference(image_bytes)

    check_skin_tone_with_multiple_images()

    # ── Tổng kết ──
    section("TỔNG KẾT")
    ok_count = sum(v for v in load_results.values())
    total = len(load_results)
    print(f"  Models loaded: {ok_count}/{total}")
    for name, ok in load_results.items():
        mark = PASS if ok else FAIL
        print(f"    {mark} {name}")

    if ok_count == total:
        print(f"\n  {PASS} Tất cả model load thành công!")
    else:
        failed = [n for n, ok in load_results.items() if not ok]
        print(f"\n  {WARN} {total - ok_count} model load thất bại: {failed}")
        print(f"       → Sẽ dùng fallback algorithm (pixel analysis) thay thế")

    print(f"\n  Tip: chạy với ảnh thật để kết quả chính xác hơn:")
    print(f"       python test_models.py --image path/to/person.jpg\n")
