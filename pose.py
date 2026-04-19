"""
pose.py — Test MediaPipe Pose Detection (v0.10+) với webcam
Chạy: python pose.py
Thoát: nhấn Q
"""

import cv2
import mediapipe as mp
from mediapipe.tasks import python as mp_python
from mediapipe.tasks.python import vision
import urllib.request, os, math

# ── Tải model nếu chưa có ────────────────────────────────────────────────────
MODEL_PATH = "pose_landmarker_full.task"
MODEL_URL  = "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/latest/pose_landmarker_full.task"

if not os.path.exists(MODEL_PATH):
    print("Dang tai model pose (~30MB)...")
    urllib.request.urlretrieve(MODEL_URL, MODEL_PATH)
    print("Tai xong!")

# ── Các landmark quan trọng cho try-on ───────────────────────────────────────
IMPORTANT = {
    11: "L.Shoulder",
    12: "R.Shoulder",
    23: "L.Hip",
    24: "R.Hip",
    25: "L.Knee",
    26: "R.Knee",
    27: "L.Ankle",
    28: "R.Ankle",
}

CONNECTIONS = [
    (11,12),(11,13),(13,15),(12,14),(14,16),
    (11,23),(12,24),(23,24),
    (23,25),(25,27),(24,26),(26,28),
]

# ── Khởi tạo detector ────────────────────────────────────────────────────────
options = vision.PoseLandmarkerOptions(
    base_options=mp_python.BaseOptions(model_asset_path=MODEL_PATH),
    running_mode=vision.RunningMode.IMAGE,
    num_poses=1,
    min_pose_detection_confidence=0.5,
    min_pose_presence_confidence=0.5,
    min_tracking_confidence=0.5,
)

cap = cv2.VideoCapture(0)
print("Camera bat! Nhan Q de thoat.")

with vision.PoseLandmarker.create_from_options(options) as detector:
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break

        frame = cv2.flip(frame, 1)
        h, w = frame.shape[:2]

        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
        result = detector.detect(mp_image)

        if result.pose_landmarks:
            lms = result.pose_landmarks[0]

            # Vẽ skeleton
            for a, b in CONNECTIONS:
                if a < len(lms) and b < len(lms):
                    ax, ay = int(lms[a].x * w), int(lms[a].y * h)
                    bx, by = int(lms[b].x * w), int(lms[b].y * h)
                    cv2.line(frame, (ax, ay), (bx, by), (0, 200, 255), 2)

            # Highlight landmark quan trọng
            for idx, name in IMPORTANT.items():
                if idx >= len(lms): continue
                lm = lms[idx]
                px, py = int(lm.x * w), int(lm.y * h)
                vis = lm.visibility
                color = (0,255,0) if vis>=0.7 else (0,165,255) if vis>=0.4 else (0,0,255)
                cv2.circle(frame, (px, py), 8, color, -1)
                cv2.putText(frame, f"{name} {vis:.2f}", (px+10, py),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.38, color, 1)

            # Bounding box quần áo (vai → hông)
            ls = lms[11]; rs = lms[12]
            lh = lms[23]; rh = lms[24]
            min_vis = min(ls.visibility, rs.visibility, lh.visibility, rh.visibility)

            if min_vis >= 0.3:
                lsx, lsy = int((1-ls.x)*w), int(ls.y*h)
                rsx, rsy = int((1-rs.x)*w), int(rs.y*h)
                lhx, lhy = int((1-lh.x)*w), int(lh.y*h)
                rhx, rhy = int((1-rh.x)*w), int(rh.y*h)

                shoulder_cx = (lsx + rsx) // 2
                shoulder_cy = (lsy + rsy) // 2
                hip_cy      = (lhy + rhy) // 2
                shoulder_dist = math.hypot(rsx-lsx, rsy-lsy)
                torso_h = hip_cy - shoulder_cy

                padding_x      = 1.3
                padding_top    = 0.12
                padding_bottom = 0.15

                bw = int(shoulder_dist * padding_x)
                bh = int(torso_h * (1 + padding_bottom))
                bx = shoulder_cx - bw // 2
                by = shoulder_cy - int(torso_h * padding_top)

                cv2.rectangle(frame, (bx, by), (bx+bw, by+bh), (139, 92, 246), 2)
                cv2.putText(frame, "Clothing Box", (bx, by-6),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.5, (139,92,246), 1)

            avg_vis = sum(lms[i].visibility for i in IMPORTANT if i < len(lms)) / len(IMPORTANT)
            color_bar = (0,255,0) if avg_vis>=0.7 else (0,165,255) if avg_vis>=0.4 else (0,0,255)
            cv2.putText(frame, f"Pose: {avg_vis:.0%}", (10, 30),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.8, color_bar, 2)
        else:
            cv2.putText(frame, "Khong phat hien pose", (10, 30),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0,0,255), 2)

        cv2.putText(frame, "Q: Thoat", (w-100, 30),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (200,200,200), 1)
        cv2.imshow("Pose Test - SmartFit", frame)

        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

cap.release()
cv2.destroyAllWindows()
