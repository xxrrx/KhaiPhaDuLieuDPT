# Yêu cầu hệ thống - AR Virtual Try-On Fashion Website

## 1. Tổng quan dự án

**Tên dự án:** SmartFit - Hệ thống thử quần áo ảo thông minh
**Mục tiêu:** Xây dựng website cho phép người dùng thử quần áo ảo thông qua AR/webcam, kết hợp AI gợi ý phong cách và phân tích xu hướng thời trang.
**Đối tượng sử dụng:** Người dùng cá nhân muốn thử đồ trực tuyến, các shop thời trang thương mại điện tử.

---

## 2. Dataset sử dụng

### 2.1 Dataset chính (cho training model Try-On)

| Dataset | Nguồn | Kích thước | Mục đích |
|---|---|---|---|
| ~~**VITON-HD**~~ | ~~HuggingFace~~| ~~13,000 cặp ảnh~~ | ~~Train model~~ → **Không cần** (dùng Replicate API) |
| ~~**DressCode**~~ | ~~HuggingFace~~ | ~~50,000 ảnh~~ | ~~Train model~~ → **Không cần** (dùng Replicate API) |
| **DeepFashion2** | GitHub | ~800,000 ảnh | Nhận diện & phân loại quần áo |

### 2.2 Dataset phụ trợ

| Dataset | Nguồn | Mục đích |
|---|---|---|
| **iMaterialist Fashion** | Kaggle | Phân loại thuộc tính quần áo (màu, kiểu, chất liệu) |
| **Fashion Product Images** | Kaggle | Catalog sản phẩm (~44,000 sản phẩm, có metadata) |
| **Fitzpatrick Skin Tone** | Kaggle / GitHub | Phân loại màu da (6 cấp độ Fitzpatrick scale) |
| **Body Measurement Dataset** | UC Irvine / Kaggle | Phân tích vóc dáng, body shape classification |

---

## 3. Mô hình AI cần train

### 3.1 Try-On (thay thế — không train model)

> **Lý do thay đổi:** Training Try-On model từ đầu (GAN/Diffusion) cần GPU A100+, 3–7 ngày train, chi phí cao — không khả thi. Thay bằng 2 phương án kết hợp:

#### 3.1a Thử đồ từ ảnh upload — Replicate API (IDM-VTON)
- **Phương án:** Gọi model IDM-VTON đã được host sẵn qua [Replicate API](https://replicate.com/cuuupid/idm-vton) — không cần train, không cần GPU
- **Input:** Ảnh người (full body) + ảnh quần áo rời
- **Output:** Ảnh người đã mặc quần áo — chất lượng cao (model IDM-VTON)
- **Chi phí:** ~$0.01–0.05 mỗi lần gọi (dùng free tier để demo)
- **Tích hợp:** Python `replicate` SDK → FastAPI endpoint → React frontend
- **Yêu cầu:** API key Replicate (đăng ký miễn phí)

#### 3.1b Thử đồ AR Webcam thời gian thực — 2D Pose Overlay
- **Phương án:** MediaPipe Pose (JS) nhận diện keypoints vai/hông → warp ảnh quần áo 2D lên vùng torso bằng perspective transform (canvas API / Three.js)
- **Input:** Webcam stream + ảnh quần áo (flat-lay)
- **Output:** Overlay quần áo lên người theo thời gian thực (15+ FPS)
- **Không cần AI training** — chạy hoàn toàn client-side trên trình duyệt
- **Chất lượng:** Đủ dùng cho demo AR; không photorealistic như phương án 3.1a

### 3.2 Model Phân loại quần áo
- **Loại model:** CNN Classification (ResNet50 / EfficientNet)
- **Input:** Ảnh quần áo
- **Output:** Loại (áo, quần, váy, giày...), màu sắc, phong cách (casual, formal, sport...)
- **Dataset train:** DeepFashion2 + iMaterialist Fashion

### 3.3 Model Phân tích màu da
- **Loại model:** CNN hoặc K-Means Clustering
- **Input:** Ảnh khuôn mặt hoặc vùng da
- **Output:** Tone màu da (6 mức Fitzpatrick), mùa màu sắc phù hợp (Spring/Summer/Autumn/Winter)
- **Dataset train:** Fitzpatrick Skin Tone Dataset

### 3.4 Model Phân tích vóc dáng
- **Loại model:** Pose Estimation + Body Shape Classifier
- **Input:** Ảnh full body
- **Output:** Loại vóc dáng (Apple, Pear, Hourglass, Rectangle, Inverted Triangle)
- **Dataset train:** Body Measurement Dataset + DeepFashion2

### 3.5 Model Gợi ý Outfit (Recommendation)
- **Loại model:** Collaborative Filtering hoặc Content-Based Filtering
- **Input:** Màu da + vóc dáng + dịp mặc (casual/formal/party) + sở thích
- **Output:** Danh sách outfit gợi ý phù hợp
- **Dataset train:** Fashion Product Images + luật phối đồ thời trang

---

## 4. Chức năng website

### 4.1 Thử đồ ảo (Core Feature)
- **Upload ảnh:** Người dùng upload ảnh cá nhân (full body) → AI tự động ghép quần áo được chọn lên ảnh
- **Webcam AR thời gian thực:** Bật webcam → thử đồ trực tiếp với hiệu ứng AR overlay
- **Chọn từng phần riêng lẻ:** Thử áo, quần, váy, giày, phụ kiện độc lập hoặc kết hợp
- **Xem đa góc độ:** Xoay 3D để xem trước từ nhiều góc (nếu có ảnh 3D)

### 4.2 AI Stylist - Gợi ý thông minh
- **Phân tích hình ảnh người dùng:** Tự động nhận diện màu da, vóc dáng khi upload ảnh
- **Gợi ý màu sắc phù hợp:** Dựa trên tone da, đề xuất bảng màu trang phục phù hợp
- **Gợi ý kiểu dáng tôn dáng:** Dựa trên body shape, đề xuất kiểu quần áo phù hợp
- **Gợi ý outfit theo dịp:** Người dùng chọn dịp (đi làm, dạo phố, tiệc tùng, thể thao) → AI gợi ý bộ outfit hoàn chỉnh
- **Tìm kiếm đồ tương tự:** Upload ảnh quần áo bất kỳ → tìm các sản phẩm tương tự trong hệ thống

### 4.3 Tủ đồ ảo (Virtual Wardrobe)
- Lưu lại các quần áo đã thử / yêu thích
- Kết hợp các món đồ trong tủ để tạo outfit mới
- Xem trước outfit kết hợp trên ảnh cá nhân đã upload
- Lịch sử thử đồ và outfit đã lưu
- Quản lý tủ đồ theo danh mục (áo, quần, giày, phụ kiện)

### 4.4 Dashboard xu hướng thời trang (Trend Analysis)
- Biểu đồ màu sắc đang trending theo mùa (Xuân/Hạ/Thu/Đông)
- Top phong cách thời trang phổ biến (minimalist, streetwear, vintage...)
- Thống kê theo độ tuổi, giới tính, khu vực địa lý
- Dự đoán xu hướng mùa tới dựa trên dữ liệu lịch sử
- Bộ lọc theo thời gian, khu vực, độ tuổi

### 4.5 Tính năng xã hội (Social Features)
- Chia sẻ ảnh đã thử đồ lên cộng đồng
- Bình chọn outfit (Like / Dislike)
- Bình luận và gợi ý phong cách cho nhau
- Trang cá nhân hiển thị lịch sử outfit & bộ sưu tập
- Follow người dùng khác để xem gợi ý thời trang

---

## 5. Yêu cầu phi chức năng

### 5.1 Hiệu suất
- Thời gian xử lý try-on từ ảnh upload: dưới 10 giây
- AR webcam thời gian thực: tối thiểu 15 FPS
- Tìm kiếm đồ tương tự: dưới 2 giây

### 5.2 Giao diện
- Không cần reponsive chỉ cần chạy tốt trên destop
- Hỗ trợ trình duyệt: Chrome, Firefox, Edge (phiên bản mới nhất)
- Giao diện hiện đại, trực quan, phù hợp với thương hiệu thời trang

### 5.3 Bảo mật & Quyền riêng tư
- Không cần quá phức tạp chỉ cần tên đăng nhập và mật khẩu

---

## 6. Yêu cầu training model

### 6.1 Quy trình training

| Model | Bước 1 | Bước 2 | Bước 3 |
|---|---|---|---|
| Try-On (upload) | Đăng ký Replicate API key | Tích hợp `replicate` SDK vào FastAPI | Test kết quả với 10 ảnh mẫu |
| Try-On (webcam AR) | Tích hợp MediaPipe Pose JS | Implement cloth warp bằng canvas/Three.js | Kiểm tra FPS ≥ 15 |
| Phân loại quần áo | Chuẩn hóa nhãn từ DeepFashion2 | Train ResNet50/EfficientNet | Đánh giá độ chính xác |
| Phân tích màu da | Gom nhãn Fitzpatrick | Train CNN classifier | Kiểm tra với ảnh thực tế |
| Phân tích vóc dáng | Kết hợp Pose Estimation + body keypoints | Train classifier | Validate với body measurement |
| Gợi ý outfit | Xây dựng ma trận phối đồ | Train recommendation model | A/B test gợi ý |

### 6.2 Đánh giá model

| Model | Metric đánh giá |
|---|---|
| Try-On (upload via API) | SSIM ≥ 0.75 so với ground truth, kiểm tra thủ công 10 ảnh mẫu |
| Try-On (webcam AR) | FPS ≥ 15, overlay đúng vị trí torso trên 5 người thử |
| Phân loại quần áo | Accuracy, F1-score |
| Phân tích màu da | Accuracy theo Fitzpatrick scale |
| Vóc dáng | Accuracy, Confusion matrix |
| Gợi ý outfit | Precision@K, Recall@K |

---

## 7. Công nghệ sử dụng

### 7.1 Frontend (Giao diện người dùng)

| Công nghệ | Vai trò | Lý do chọn |
|---|---|---|
| **React.js** | Xây dựng giao diện web | Phổ biến, nhiều tài liệu, dễ học |
| **TailwindCSS** | Thiết kế UI | Nhanh, không cần viết CSS nhiều |
| **Three.js** | Hiển thị 3D / AR overlay trên web | Thư viện 3D phổ biến nhất cho trình duyệt |
| **MediaPipe (JS)** | Nhận diện pose/body trực tiếp trên trình duyệt | Chạy client-side, không cần gửi lên server |
| **WebRTC** | Truy cập webcam thời gian thực | Chuẩn web, hỗ trợ mọi trình duyệt hiện đại |
| **Chart.js** | Vẽ biểu đồ trend | Đơn giản, dễ tích hợp với React |

### 7.2 Backend (Máy chủ xử lý)

| Công nghệ | Vai trò | Lý do chọn |
|---|---|---|
| **Python** | Ngôn ngữ chính cho AI & server | Mạnh nhất cho AI/ML, nhiều thư viện hỗ trợ |
| **FastAPI** | Xây dựng REST API | Đơn giản hơn Django, nhanh, tự tạo docs |
| **OpenCV** | Xử lý ảnh (tách nền, chuẩn hóa) | Thư viện xử lý ảnh tiêu chuẩn |
| **MediaPipe (Python)** | Pose estimation, body segmentation | Dễ dùng, không cần GPU mạnh |
| **DeepFace** | Phân tích màu da từ ảnh khuôn mặt | Cài đặt 1 dòng lệnh, dùng ngay |
| **Replicate Python SDK** | Gọi IDM-VTON API cho try-on từ ảnh upload | Không cần GPU, không cần train model, ~3 dòng code |

### 7.3 AI / Machine Learning

| Công nghệ | Vai trò | Lý do chọn |
|---|---|---|
| **PyTorch** | Framework train model chính | Phổ biến trong nghiên cứu, dễ debug |
| **Torchvision** | Các model CNN có sẵn (ResNet, EfficientNet) | Tích hợp sẵn với PyTorch |
| **Hugging Face Transformers** | Load model Try-On (OOTDiffusion/CatVTON) | Tải model có sẵn, dễ fine-tune |
| **Scikit-learn** | Train model recommendation, clustering | Đơn giản, phù hợp cho sinh viên |
| **FAISS** | Tìm kiếm ảnh tương tự (vector search) | Nhanh, dễ tích hợp với Python |
| **Google Colab / Kaggle Notebook** | Môi trường train model | Miễn phí GPU, không cần máy mạnh |

### 7.4 Cơ sở dữ liệu & Lưu trữ

| Công nghệ | Vai trò | Lý do chọn |
|---|---|---|
| **MySQL** | Lưu thông tin người dùng, outfit, wardrobe | Phổ biến, dễ học, nhiều tài liệu tiếng Việt |
| **Cloudinary** | Lưu trữ & quản lý ảnh người dùng | Miễn phí 25GB, có API Python/JS sẵn, dễ tích hợp |

### 7.5 Công cụ hỗ trợ phát triển

| Công nghệ | Vai trò |
|---|---|
| **Git + GitHub** | Quản lý source code, làm việc nhóm |
| **Postman** | Test API trong quá trình phát triển |
| **Jupyter Notebook** | Phân tích dữ liệu, thử nghiệm model |
| **Roboflow** | Tiền xử lý và augment dataset ảnh |

---

## 8. Phạm vi dự án (Scope)

### Trong phạm vi (In-scope)
- Train và tích hợp 5 model AI nêu trên
- Website đầy đủ 5 nhóm chức năng
- Xử lý ảnh tĩnh (upload) và webcam thời gian thực
- Giao diện người dùng hoàn chỉnh

### Ngoài phạm vi (Out-of-scope)
- Tích hợp thanh toán / mua hàng thật
- Ứng dụng mobile native (iOS/Android)
- Headset VR (chỉ AR trên trình duyệt)
- Đa ngôn ngữ (chỉ Tiếng Việt + Tiếng Anh)

---

## 9. Thứ tự triển khai theo giai đoạn

> Mỗi giai đoạn có thể test độc lập, không cần chờ giai đoạn khác hoàn thành.

### Giai đoạn 1: Backend API + Database + Lưu trữ
- Cài đặt MySQL, tạo bảng dữ liệu (users, outfits, wardrobe, products)
- Kết nối Cloudinary, test upload/lấy ảnh
- Xây dựng các API cơ bản: đăng ký, đăng nhập, upload ảnh, lấy danh sách sản phẩm
- **Test bằng:** Postman gọi trực tiếp từng API

### Giai đoạn 2: Train & kiểm thử từng model AI
- Train lần lượt từng model trên Colab/Kaggle
- Mỗi model train xong → test riêng với ảnh mẫu trên Jupyter Notebook
- Xuất model thành file `.pth` hoặc `.pkl`
- Tích hợp từng model vào API endpoint riêng
- **Test bằng:** Jupyter Notebook + Postman gọi endpoint từng model

### Giai đoạn 3: Frontend kết nối API
- Xây dựng từng trang giao diện: trang chủ, trang thử đồ, trang wardrobe, dashboard trend, trang social
- Kết nối từng trang với API tương ứng ở Giai đoạn 1 & 2
- Dùng dữ liệu giả (mock data) cho phần AI nếu model chưa sẵn sàng
- **Test bằng:** Chạy React local, kiểm tra từng trang trên trình duyệt

### Giai đoạn 4: Tích hợp AR/Webcam + Hoàn thiện
- Tích hợp MediaPipe + Three.js cho chức năng AR webcam
- Kết nối toàn bộ luồng: webcam → pose detection → try-on AI → hiển thị kết quả
- Kiểm tra toàn bộ luồng end-to-end
- Tối ưu hiệu suất, giao diện, xử lý lỗi
- **Test bằng:** Chạy toàn bộ hệ thống, test thủ công từng chức năng

---

## 10. Tiêu chí kiểm thử từng khâu

### Giai đoạn 1 - Backend & Database

| Hạng mục | Tiêu chí Pass |
|---|---|
| Kết nối MySQL | Tạo, đọc, cập nhật, xóa dữ liệu thành công |
| Upload ảnh Cloudinary | Trả về URL ảnh hợp lệ trong < 3 giây |
| API đăng ký / đăng nhập | Trả về token xác thực, từ chối sai mật khẩu |
| API lấy danh sách sản phẩm | Trả về JSON đúng cấu trúc, có phân trang |
| API upload ảnh người dùng | Lưu được ảnh, trả về URL trong < 3 giây |

### Giai đoạn 2 - Từng Model AI

| Model | Tiêu chí Pass |
|---|---|
| Try-On (Replicate API) | Gọi API thành công, nhận ảnh kết quả trong < 30 giây, không bị méo mặt trên 10 ảnh mẫu |
| Try-On (AR Webcam) | Overlay quần áo đúng vùng torso, FPS ≥ 15, hoạt động trên Chrome mới nhất |
| Phân loại quần áo | Accuracy > 80% trên tập test |
| Phân tích màu da | Phân loại đúng tone da > 85% trên 20 ảnh thử |
| Phân tích vóc dáng | Nhận diện đúng body shape > 80% trên tập test |
| Gợi ý outfit | Gợi ý ra ít nhất 5 outfit phù hợp với input đầu vào |
| API từng model | Nhận ảnh, trả kết quả JSON đúng trong < 10 giây |

### Giai đoạn 3 - Frontend

| Trang | Tiêu chí Pass |
|---|---|
| Đăng ký / Đăng nhập | Form hoạt động, thông báo lỗi rõ ràng |
| Trang thử đồ (upload ảnh) | Upload ảnh → hiển thị kết quả try-on đúng |
| Trang AI Stylist | Phân tích ảnh → hiển thị gợi ý màu & vóc dáng |
| Tủ đồ ảo | Lưu / xóa / kết hợp outfit hoạt động đúng |
| Dashboard trend | Biểu đồ hiển thị đúng dữ liệu, bộ lọc hoạt động |
| Trang social | Đăng ảnh, like, bình luận hoạt động đúng |

### Giai đoạn 4 - AR Webcam & End-to-End

| Hạng mục | Tiêu chí Pass |
|---|---|
| AR Webcam | Nhận diện pose trong điều kiện ánh sáng bình thường |
| AR Webcam FPS | Duy trì tối thiểu 15 FPS trên máy tính thông thường |
| Luồng end-to-end | Upload ảnh → AI xử lý → hiển thị kết quả không bị lỗi |
| Xử lý lỗi | Hiển thị thông báo lỗi thân thiện khi ảnh không hợp lệ |
| Responsive | Giao diện hiển thị đúng trên màn hình 1366px và 1920px |

---

## 11. Rủi ro & Giải pháp dự phòng

| Rủi ro | Khả năng xảy ra | Giải pháp |
|---|---|---|
| ~~GPU không đủ để train Try-On model~~ | ~~Cao~~ | **Đã giải quyết:** Dùng Replicate API, không cần GPU |
| Replicate API hết free tier | Thấp | Dùng tài khoản mới (free $5 credit) hoặc mock response khi demo |
| AR webcam overlay lệch vị trí | Trung bình | Tinh chỉnh landmark mapping của MediaPipe, thêm smoothing filter |
| Chất lượng try-on API không tốt | Thấp | IDM-VTON là SOTA — fallback sang fashn.ai hoặc Klingai API |
| Dataset quá lớn, khó xử lý | Trung bình | Lấy subset đại diện (~10-20%) để train |
| AR webcam lag trên máy yếu | Cao | Tối ưu model, giảm độ phân giải xử lý |
