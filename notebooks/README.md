# SmartFit AI - Training Notebooks

## Thứ tự chạy

| # | Notebook | Dataset | Chạy ở đâu | Output |
|---|----------|---------|-------------|--------|
| 1 | `01_clothing_classification.ipynb` | Fashion Product Images (Kaggle) | Kaggle GPU T4 | `clothing_classifier.pth` |
| 2 | `02_skin_tone_analysis.ipynb` | Fitzpatrick17k (GitHub) | Kaggle GPU T4 | `skin_tone_classifier.pth`, `skin_kmeans.pkl` |
| 3 | `03_body_shape_classification.ipynb` | Body Measurements (Kaggle) | Local / Kaggle CPU | `body_shape_classifier.pkl` |
| 4 | `04_outfit_recommendation.ipynb` | Fashion Product Images CSV | Local / Kaggle CPU | `outfit_recommender.pkl` |


## Dataset links

| Dataset | Link |
|---------|------|
| Fashion Product Images (small) | https://www.kaggle.com/datasets/paramaggarwal/fashion-product-images-small |
| Fashion Product Images (full) | https://www.kaggle.com/datasets/paramaggarwal/fashion-product-images-dataset |
| Fitzpatrick17k | https://github.com/mattgroh/fitzpatrick17k |
| Body Measurements | https://www.kaggle.com/datasets/muratkokludataset/body-measurements-dataset |


## Setup Kaggle

1. Tạo tài khoản Kaggle → Settings → API → Create Token → tải `kaggle.json`
2. Upload `kaggle.json` vào Kaggle Notebook hoặc đặt vào `~/.kaggle/`
3. Bật GPU: Notebook Settings → Accelerator → GPU T4

## Output files → đặt vào backend

```
backend/app/ai_models/
├── clothing_classifier.pth
├── skin_tone_classifier.pth
├── skin_kmeans.pkl
├── body_shape_classifier.pkl
├── outfit_recommender.pkl
└── tryon_pipeline/
    └── config.json
```
