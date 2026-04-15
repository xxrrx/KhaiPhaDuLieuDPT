"""Test nhanh clothing_classifier.pth"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

import torch
import torch.nn as nn
from torchvision.models import efficientnet_b0

MODEL_PATH = os.path.join(os.path.dirname(__file__), "app", "ai_models", "clothing_classifier.pth")

print("=== Kiểm tra checkpoint ===")
ckpt = torch.load(MODEL_PATH, map_location="cpu")
print("Keys trong checkpoint:", list(ckpt.keys()) if isinstance(ckpt, dict) else type(ckpt))

if isinstance(ckpt, dict):
    print("idx2label:", ckpt.get("idx2label"))
    print("label2idx:", ckpt.get("label2idx"))
    print("val_acc:", ckpt.get("val_acc"))

print("\n=== Test predict với ảnh ngẫu nhiên ===")
idx2label = ckpt.get("idx2label", {}) if isinstance(ckpt, dict) else {}
num_classes = len(idx2label) if idx2label else 10

model = efficientnet_b0(weights=None)
model.classifier = nn.Sequential(
    nn.Dropout(p=0.3),
    nn.Linear(model.classifier[1].in_features, num_classes),
)
state = ckpt["model_state_dict"] if isinstance(ckpt, dict) and "model_state_dict" in ckpt else ckpt
model.load_state_dict(state)
model.eval()

import torch.nn.functional as F
# Test 5 ảnh random — nếu model bình thường thì kết quả phải khác nhau
for i in range(5):
    x = torch.randn(1, 3, 224, 224)
    with torch.no_grad():
        out = model(x)
        probs = F.softmax(out, dim=1)[0]
        pred = int(probs.argmax())
    print(f"  Random input {i+1}: pred={pred} ({idx2label.get(pred, pred)}) conf={probs[pred]:.3f}")

print("\nNếu 5 dòng trên đều ra cùng 1 label → model bị overfit hoặc weights lỗi")
print("Nếu ra khác nhau → model load đúng, vấn đề là ảnh thực tế không giống ảnh train")
