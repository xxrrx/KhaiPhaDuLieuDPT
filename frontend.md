# Frontend Design - SmartFit

**Framework:** React.js 18+
**Styling:** TailwindCSS
**Routing:** React Router v6
**State:** Zustand
**HTTP:** Axios
**Build Tool:** Vite

---

## 1. Cấu trúc thư mục

```
smartfit-frontend/
├── public/
│   ├── index.html
│   └── favicon.ico
│
├── src/
│   ├── main.jsx                  # Entry point
│   ├── App.jsx                   # Router setup
│   │
│   ├── pages/                    # Trang chính (route-level components)
│   │   ├── HomePage.jsx
│   │   ├── LoginPage.jsx
│   │   ├── RegisterPage.jsx
│   │   ├── ProductsPage.jsx
│   │   ├── ProductDetailPage.jsx
│   │   ├── TryOnPage.jsx
│   │   ├── AIStylistPage.jsx
│   │   ├── WardrobePage.jsx
│   │   ├── TrendsPage.jsx
│   │   ├── SocialFeedPage.jsx
│   │   ├── ProfilePage.jsx
│   │   └── NotFoundPage.jsx
│   │
│   ├── components/               # Shared UI components
│   │   ├── layout/
│   │   │   ├── Navbar.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   └── Footer.jsx
│   │   │
│   │   ├── ui/                   # Generic UI elements
│   │   │   ├── Button.jsx
│   │   │   ├── Input.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── Toast.jsx
│   │   │   ├── LoadingSpinner.jsx
│   │   │   ├── Pagination.jsx
│   │   │   ├── ImageCropper.jsx
│   │   │   └── ThemeToggle.jsx
│   │   │
│   │   ├── product/
│   │   │   ├── ProductCard.jsx
│   │   │   ├── ProductGrid.jsx
│   │   │   ├── ProductFilter.jsx
│   │   │   ├── ProductSearch.jsx
│   │   │   └── SimilarProducts.jsx
│   │   │
│   │   ├── tryon/
│   │   │   ├── TryOnUploader.jsx
│   │   │   ├── TryOnResult.jsx
│   │   │   ├── ARWebcamView.jsx
│   │   │   ├── TryOnHistory.jsx
│   │   │   └── WebcamControls.jsx
│   │   │
│   │   ├── ai-stylist/
│   │   │   ├── AnalysisUploader.jsx
│   │   │   ├── SkinToneResult.jsx
│   │   │   ├── BodyShapeResult.jsx
│   │   │   ├── ColorPalette.jsx
│   │   │   └── OutfitSuggestion.jsx
│   │   │
│   │   ├── wardrobe/
│   │   │   ├── WardrobeGrid.jsx
│   │   │   ├── WardrobeItemCard.jsx
│   │   │   ├── OutfitCard.jsx
│   │   │   ├── OutfitBuilder.jsx
│   │   │   └── OutfitExport.jsx
│   │   │
│   │   ├── social/
│   │   │   ├── PostCard.jsx
│   │   │   ├── PostFeed.jsx
│   │   │   ├── PostComments.jsx
│   │   │   ├── CreatePostModal.jsx
│   │   │   └── UserAvatar.jsx
│   │   │
│   │   └── trends/
│   │       ├── TrendChart.jsx
│   │       ├── TrendFilter.jsx
│   │       ├── ColorTrendCard.jsx
│   │       └── StyleTrendCard.jsx
│   │
│   ├── hooks/                    # Custom React hooks
│   │   ├── useAuth.js
│   │   ├── useWebcam.js
│   │   ├── useMediaPipe.js
│   │   ├── useThreeJS.js
│   │   ├── useDebounce.js
│   │   ├── useInfiniteScroll.js
│   │   └── useToast.js
│   │
│   ├── store/                    # Zustand global state
│   │   ├── authStore.js
│   │   ├── wardrobeStore.js
│   │   ├── tryonStore.js
│   │   └── uiStore.js
│   │
│   ├── services/                 # API calls (Axios)
│   │   ├── api.js                # Axios instance + interceptors
│   │   ├── authService.js
│   │   ├── productService.js
│   │   ├── tryonService.js
│   │   ├── aiStylistService.js
│   │   ├── wardrobeService.js
│   │   ├── socialService.js
│   │   └── trendsService.js
│   │
│   ├── utils/
│   │   ├── imageUtils.js         # Crop, resize, base64
│   │   ├── formatters.js         # Format tiền, ngày, số
│   │   ├── validators.js         # Validate form
│   │   └── constants.js          # API base URL, enums
│   │
│   └── assets/
│       ├── images/
│       └── icons/
│
├── package.json
├── vite.config.js
└── tailwind.config.js
```

---

## 2. Danh sách Pages

### 2.1 `HomePage.jsx`
**Route:** `/`
**Mô tả:** Trang chủ - giới thiệu và điều hướng
**Sections:**
- Hero banner với CTA "Thử đồ ngay"
- Sản phẩm nổi bật (carousel)
- Xu hướng thời trang mini (top 3 styles)
- Tính năng nổi bật (Try-On, AI Stylist, Wardrobe, Social)
- Bài đăng cộng đồng nổi bật

---

### 2.2 `LoginPage.jsx` & `RegisterPage.jsx`
**Routes:** `/login`, `/register`
**Components dùng:** `Input`, `Button`, `Toast`
**Luồng:**
1. Điền form → Validate (client-side)
2. Submit → `authService.login()` / `authService.register()`
3. Lưu token vào `authStore`
4. Redirect sang `/`

---

### 2.3 `ProductsPage.jsx`
**Route:** `/products`
**Components dùng:** `ProductGrid`, `ProductFilter`, `ProductSearch`, `Pagination`
**State:** `selectedFilters`, `searchQuery`, `currentPage`
**Luồng:**
1. Render filter sidebar + search bar
2. Thay đổi filter → debounce 300ms → gọi `GET /products`
3. Hiển thị ProductGrid với skeleton loading
4. Pagination ở cuối

---

### 2.4 `ProductDetailPage.jsx`
**Route:** `/products/:productId`
**Components dùng:** `SimilarProducts`, `Button`
**Luồng:**
1. Fetch `GET /products/:id`
2. Hiển thị ảnh (gallery), thông tin, size options
3. Nút "Thử đồ" → navigate sang `/tryon?product_id=:id`
4. Nút "Thêm vào tủ đồ" → `POST /wardrobe`
5. Section sản phẩm tương tự bên dưới

---

### 2.5 `TryOnPage.jsx`
**Route:** `/tryon`
**Components dùng:** `TryOnUploader`, `TryOnResult`, `ARWebcamView`, `WebcamControls`, `TryOnHistory`
**State:** `activeTab` (upload/webcam), `selectedProduct`, `resultImage`
**Tab Upload:**
1. Chọn sản phẩm (nếu chưa chọn)
2. Upload/crop ảnh bản thân → `POST /tryon/upload`
3. Loading (7-10s) → hiển thị `TryOnResult`
4. Nút: Lưu vào wardrobe / Đăng lên social / Download

**Tab Webcam (AR):**
1. `useWebcam` → bật webcam (WebRTC)
2. `useMediaPipe` → phát hiện pose realtime
3. `useThreeJS` → overlay quần áo 3D lên stream
4. Nút snapshot → `POST /tryon/save-ar-result`

---

### 2.6 `AIStylistPage.jsx`
**Route:** `/ai-stylist`
**Components dùng:** `AnalysisUploader`, `SkinToneResult`, `BodyShapeResult`, `ColorPalette`, `OutfitSuggestion`
**Luồng:**
1. Upload ảnh full body → `POST /ai-stylist/analyze`
2. Loading 5-8s
3. Hiển thị kết quả: skin tone + body shape + recommended colors
4. Chọn dịp (occasion) → `POST /ai-stylist/recommend`
5. Hiển thị danh sách outfit gợi ý
6. Mỗi outfit: xem chi tiết / thử ngay (link sang TryOnPage)

---

### 2.7 `WardrobePage.jsx`
**Route:** `/wardrobe`
**Components dùng:** `WardrobeGrid`, `WardrobeItemCard`, `OutfitCard`, `OutfitBuilder`
**Tabs:** "Tủ đồ của tôi" | "Outfit đã tạo"
**Tab Tủ đồ:**
1. `GET /wardrobe` → hiển thị WardrobeGrid
2. Lọc theo category (áo/quần/váy/giày/phụ kiện)
3. Nút "Tạo outfit" → mở OutfitBuilder

**Tab Outfit:**
1. `GET /wardrobe/outfits` → danh sách OutfitCard
2. Mỗi outfit: Xem chi tiết / Thử ngay / Xóa / Xuất ảnh

---

### 2.8 `TrendsPage.jsx`
**Route:** `/trends`
**Components dùng:** `TrendChart`, `TrendFilter`, `ColorTrendCard`, `StyleTrendCard`
**Luồng:**
1. `GET /trends` → hiển thị overview cards
2. `GET /trends/chart-data` → Chart.js render biểu đồ
3. TrendFilter thay đổi → re-fetch
4. Tab Dự đoán → `GET /trends/predictions`

---

### 2.9 `SocialFeedPage.jsx`
**Route:** `/social`
**Components dùng:** `PostFeed`, `PostCard`, `CreatePostModal`
**Luồng:**
1. `GET /social/feed` → render PostFeed (infinite scroll)
2. Mỗi PostCard: like, comment, share
3. Nút "+" → CreatePostModal → `POST /social/posts`
4. Like → `POST/DELETE /social/posts/:id/like`

---

### 2.10 `ProfilePage.jsx`
**Route:** `/profile/:userId`
**Components dùng:** `PostGrid`, `UserAvatar`, `Button`
**Luồng:**
1. `GET /social/users/:id/profile`
2. Hiển thị: avatar, bio, follower/following count, posts grid
3. Nút Follow/Unfollow → `POST/DELETE /social/follow/:id`
4. Nếu là trang của chính mình: hiển thị nút Edit Profile

---

## 3. Routing (React Router v6)

```jsx
// App.jsx
<BrowserRouter>
  <Routes>
    {/* Public routes */}
    <Route path="/" element={<HomePage />} />
    <Route path="/login" element={<LoginPage />} />
    <Route path="/register" element={<RegisterPage />} />
    <Route path="/products" element={<ProductsPage />} />
    <Route path="/products/:productId" element={<ProductDetailPage />} />
    <Route path="/trends" element={<TrendsPage />} />
    <Route path="/social" element={<SocialFeedPage />} />
    <Route path="/profile/:userId" element={<ProfilePage />} />

    {/* Protected routes (require auth) */}
    <Route element={<ProtectedRoute />}>
      <Route path="/tryon" element={<TryOnPage />} />
      <Route path="/ai-stylist" element={<AIStylistPage />} />
      <Route path="/wardrobe" element={<WardrobePage />} />
    </Route>

    <Route path="*" element={<NotFoundPage />} />
  </Routes>
</BrowserRouter>
```

---

## 4. State Management (Zustand)

### 4.1 `authStore.js`
```js
// State
{
  user: null,           // { id, username, email, full_name, avatar_url, role }
  token: null,          // JWT access token
  isAuthenticated: false
}

// Actions
login(userData, token)
logout()
updateUser(userData)
```

### 4.2 `wardrobeStore.js`
```js
// State
{
  items: [],            // wardrobe items
  outfits: [],          // saved outfits
  selectedItems: []     // items đang được chọn khi tạo outfit
}

// Actions
addItem(item)
removeItem(itemId)
addOutfit(outfit)
removeOutfit(outfitId)
toggleSelectItem(itemId)
clearSelection()
```

### 4.3 `tryonStore.js`
```js
// State
{
  currentResult: null,   // { result_url, history_id, product_id }
  history: [],           // lịch sử try-on
  isProcessing: false,
  selectedProduct: null
}

// Actions
setResult(result)
setSelectedProduct(product)
setProcessing(bool)
addToHistory(item)
```

### 4.4 `uiStore.js`
```js
// State
{
  theme: 'light',        // 'light' | 'dark'
  toasts: [],            // danh sách toast notifications
  isLoading: false
}

// Actions
toggleTheme()
addToast({ type, message, duration })
removeToast(id)
```

---

## 5. Tích hợp thư viện đặc biệt

### 5.1 MediaPipe (Pose Detection - Client Side)

```jsx
// hooks/useMediaPipe.js
import { Pose } from '@mediapipe/pose'

const useMediaPipe = () => {
  const poseRef = useRef(null)

  useEffect(() => {
    const pose = new Pose({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
    })
    pose.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    })
    pose.onResults((results) => {
      // results.poseLandmarks → 33 keypoints
      drawBodyOverlay(results.poseLandmarks)
    })
    poseRef.current = pose
  }, [])

  return { detect: (videoFrame) => poseRef.current.send({ image: videoFrame }) }
}
```

### 5.2 WebRTC (Webcam Access)

```jsx
// hooks/useWebcam.js
const useWebcam = () => {
  const [stream, setStream] = useState(null)
  const videoRef = useRef(null)

  const startCamera = async () => {
    const mediaStream = await navigator.mediaDevices.getUserMedia({
      video: { width: 640, height: 480, facingMode: 'user' }
    })
    videoRef.current.srcObject = mediaStream
    setStream(mediaStream)
  }

  const stopCamera = () => {
    stream?.getTracks().forEach(track => track.stop())
    setStream(null)
  }

  const takeSnapshot = () => {
    const canvas = document.createElement('canvas')
    canvas.width = videoRef.current.videoWidth
    canvas.height = videoRef.current.videoHeight
    canvas.getContext('2d').drawImage(videoRef.current, 0, 0)
    return canvas.toDataURL('image/jpeg', 0.8)
  }

  return { videoRef, stream, startCamera, stopCamera, takeSnapshot }
}
```

### 5.3 Three.js (AR Clothing Overlay)

```jsx
// hooks/useThreeJS.js
import * as THREE from 'three'

const useThreeJS = (canvasRef) => {
  const sceneRef = useRef(null)
  const rendererRef = useRef(null)

  useEffect(() => {
    const scene = new THREE.Scene()
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current, alpha: true
    })
    renderer.setSize(640, 480)
    sceneRef.current = scene
    rendererRef.current = renderer
  }, [])

  // Áp clothing texture lên plane mesh tại vị trí body keypoints
  const overlayClothing = (texture, keypoints) => {
    const geometry = new THREE.PlaneGeometry(1, 1)
    const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true })
    const mesh = new THREE.Mesh(geometry, material)
    // Tính position từ keypoints (shoulders, hips)
    scene.add(mesh)
  }

  return { overlayClothing }
}
```

### 5.4 Chart.js (Trend Visualization)

```jsx
// components/trends/TrendChart.jsx
import { Line, Bar, Radar } from 'react-chartjs-2'
import { Chart, registerables } from 'chart.js'
Chart.register(...registerables)

const TrendChart = ({ type, data }) => {
  const chartData = {
    labels: data.labels,
    datasets: data.datasets.map(ds => ({
      ...ds,
      tension: 0.4,
      fill: false
    }))
  }

  const options = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      tooltip: { mode: 'index', intersect: false }
    }
  }

  if (type === 'line') return <Line data={chartData} options={options} />
  if (type === 'bar') return <Bar data={chartData} options={options} />
  if (type === 'radar') return <Radar data={chartData} options={options} />
}
```

---

## 6. API Service Layer (Axios)

```js
// services/api.js
import axios from 'axios'
import { useAuthStore } from '../store/authStore'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1',
  timeout: 60000
})

// Request interceptor: tự thêm Authorization header
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Response interceptor: xử lý lỗi 401
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
```

---

## 7. Luồng người dùng (User Flow)

### 7.1 Luồng Try-On bằng Upload

```
[Products Page]
  → Click "Thử đồ" trên ProductCard
  → [TryOn Page] (tab Upload)
     → Chọn sản phẩm (nếu chưa chọn)
     → ImageCropper: upload + crop ảnh bản thân
     → Click "Thử ngay"
     → Loading spinner (7-10s)
     → Hiển thị kết quả
     → [Lưu vào Wardrobe] → POST /wardrobe
     → [Đăng lên Social] → CreatePostModal
     → [Download] → tải ảnh về máy
```

### 7.2 Luồng AR Webcam

```
[TryOn Page] (tab Webcam)
  → Click "Bật webcam" → xin quyền camera
  → Video stream hiển thị
  → MediaPipe detect pose (realtime)
  → Chọn sản phẩm từ panel bên cạnh
  → Three.js overlay clothing lên video
  → Click "Chụp ảnh" → snapshot
  → POST /tryon/save-ar-result
  → Hiển thị kết quả giống tab Upload
```

### 7.3 Luồng AI Stylist

```
[AI Stylist Page]
  → Upload ảnh full body
  → POST /ai-stylist/analyze (loading 5-8s)
  → Hiển thị: Skin Tone Card + Body Shape Card
  → ColorPalette: màu sắc gợi ý
  → Chọn dịp: [Đi làm] [Dạo phố] [Tiệc] [Thể thao]
  → POST /ai-stylist/recommend
  → Danh sách outfit gợi ý (5 outfits)
  → Mỗi outfit: xem sản phẩm / click "Thử ngay"
```

### 7.4 Luồng Wardrobe → Tạo Outfit

```
[Wardrobe Page]
  → Tab "Tủ đồ của tôi"
  → Chọn nhiều items (click chọn)
  → Click "Tạo outfit"
  → Modal OutfitBuilder:
     → Đặt tên, chọn dịp
     → Sắp xếp thứ tự layer
     → Click "Lưu outfit"
  → POST /wardrobe/outfits
  → Redirect sang Tab "Outfit đã tạo"
```

### 7.5 Luồng Social

```
[Social Feed Page]
  → Infinite scroll feed
  → Like → click heart icon
  → Comment → click comment icon → mở panel
  → Tạo post → click nút "+"
  → CreatePostModal:
     → Upload ảnh / chọn từ lịch sử try-on
     → Thêm caption + tags
     → POST /social/posts
```
