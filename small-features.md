# Small Features - SmartFit

Tài liệu này mô tả các tính năng nhỏ, tiện ích và tối ưu hóa trong SmartFit.

---

## 1. Tìm kiếm & Lọc sản phẩm

### 1.1 Search Bar

**Vị trí:** Navbar (toàn cục) + ProductsPage (inline)

**Cơ chế:**
```js
// hooks/useDebounce.js
const useDebounce = (value, delay = 300) => {
  const [debouncedValue, setDebouncedValue] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debouncedValue
}

// ProductSearch.jsx
const debouncedQuery = useDebounce(searchInput, 300)
useEffect(() => {
  if (debouncedQuery) fetchProducts({ search: debouncedQuery })
}, [debouncedQuery])
```

**Backend:** MySQL FULLTEXT index trên `products(name, description)`
```sql
SELECT * FROM products
WHERE MATCH(name, description) AGAINST(? IN BOOLEAN MODE)
  AND is_available = 1
LIMIT 20;
```

---

### 1.2 Bộ lọc sản phẩm (Filter)

**Các bộ lọc có sẵn:**

| Filter | Loại | Giá trị |
|--------|------|---------|
| Danh mục | Multi-select checkbox | Các categories từ DB |
| Giới tính | Radio | male / female / unisex |
| Phong cách | Multi-select | casual, formal, sport, streetwear, vintage, party |
| Màu sắc | Color picker chips | Danh sách màu phổ biến |
| Khoảng giá | Range slider | 0 – 5,000,000 VNĐ |
| Sắp xếp | Dropdown | Mới nhất / Phổ biến / Giá tăng / Giá giảm |

**UI Pattern:**
- Filter sidebar bên trái (desktop)
- Filter state lưu vào URL params: `/products?style=casual&color=blue&page=2`
- Nút "Xóa bộ lọc" reset tất cả về mặc định
- Số lượng filter đang áp dụng hiển thị trên nút filter (badge count)

**Backend query:**
```python
# Xây dựng query động theo filter
filters = []
if category_id: filters.append("category_id = %s")
if gender: filters.append("gender = %s")
if style: filters.append("style = %s")
if color: filters.append("primary_color = %s")
if min_price: filters.append("price >= %s")
if max_price: filters.append("price <= %s")
```

---

## 2. Phân trang (Pagination)

### 2.1 Offset Pagination (Products, Wardrobe)

**Component `Pagination.jsx`:**
```jsx
const Pagination = ({ page, totalPages, onPageChange }) => (
  <div className="flex items-center gap-2">
    <button onClick={() => onPageChange(page - 1)} disabled={page === 1}>←</button>
    {/* Hiển thị tối đa 5 trang, dấu ... cho các trang bị ẩn */}
    {generatePageNumbers(page, totalPages).map(p =>
      p === '...'
        ? <span key={p}>...</span>
        : <button key={p} className={p === page ? 'active' : ''} onClick={() => onPageChange(p)}>{p}</button>
    )}
    <button onClick={() => onPageChange(page + 1)} disabled={page === totalPages}>→</button>
  </div>
)
```

**Backend:** `LIMIT :limit OFFSET (:page - 1) * :limit`

---

### 2.2 Cursor Pagination (Social Feed)

Dùng cho Social Feed để tránh duplicate khi có post mới được thêm trong khi scroll.

```js
// hooks/useInfiniteScroll.js
const useInfiniteScroll = (fetchFn) => {
  const [posts, setPosts] = useState([])
  const [cursor, setCursor] = useState(null)
  const [hasMore, setHasMore] = useState(true)

  const loadMore = async () => {
    const { posts: newPosts, next_cursor } = await fetchFn(cursor)
    setPosts(prev => [...prev, ...newPosts])
    setCursor(next_cursor)
    if (!next_cursor) setHasMore(false)
  }

  // Intersection Observer để auto-load khi scroll đến cuối
  const sentinelRef = useCallback((node) => {
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) loadMore()
    })
    if (node) observer.observe(node)
  }, [hasMore, cursor])

  return { posts, sentinelRef, hasMore }
}
```

---

## 3. Toast Notifications & Loading States

### 3.1 Toast System

**Store (`uiStore.js`):**
```js
const useUiStore = create((set) => ({
  toasts: [],
  addToast: ({ type, message, duration = 3000 }) => {
    const id = Date.now()
    set(state => ({ toasts: [...state.toasts, { id, type, message }] }))
    setTimeout(() => set(state => ({
      toasts: state.toasts.filter(t => t.id !== id)
    })), duration)
  },
  removeToast: (id) => set(state => ({
    toasts: state.toasts.filter(t => t.id !== id)
  }))
}))
```

**Component `Toast.jsx`:**
- Hiển thị ở góc trên phải màn hình
- 4 loại: `success` (xanh), `error` (đỏ), `warning` (vàng), `info` (xanh dương)
- Auto dismiss sau 3 giây
- Click để đóng sớm
- Animation slide-in từ phải

**Hook `useToast.js`:**
```js
const useToast = () => {
  const addToast = useUiStore(s => s.addToast)
  return {
    success: (msg) => addToast({ type: 'success', message: msg }),
    error: (msg) => addToast({ type: 'error', message: msg }),
    warning: (msg) => addToast({ type: 'warning', message: msg }),
    info: (msg) => addToast({ type: 'info', message: msg })
  }
}
```

---

### 3.2 Loading States

**Skeleton Loading** (thay placeholder khi đang fetch):
```jsx
// ProductCard skeleton
const ProductCardSkeleton = () => (
  <div className="animate-pulse">
    <div className="bg-gray-200 h-64 rounded-lg mb-3" />
    <div className="bg-gray-200 h-4 rounded w-3/4 mb-2" />
    <div className="bg-gray-200 h-4 rounded w-1/2" />
  </div>
)
```

**Global Loading Spinner** cho AI processing:
```jsx
// LoadingSpinner.jsx với progress text
const LoadingSpinner = ({ message }) => (
  <div className="flex flex-col items-center gap-3">
    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    <p className="text-gray-600">{message || 'Đang xử lý...'}</p>
  </div>
)
```

**Các trường hợp loading:**
- Fetch sản phẩm: Skeleton grid (12 cards)
- Try-on AI: Full screen overlay với spinner + "Đang thử đồ... (~7 giây)"
- AI Stylist: Progress steps indicator
- Upload ảnh: Progress bar % upload

---

## 4. Tối ưu ảnh

### 4.1 Lazy Loading

```jsx
// ProductCard.jsx - native lazy loading
<img
  src={product.image_url}
  alt={product.name}
  loading="lazy"
  className="w-full h-64 object-cover"
/>

// Hoặc dùng Intersection Observer cho control tốt hơn
const LazyImage = ({ src, alt, ...props }) => {
  const [isVisible, setIsVisible] = useState(false)
  const imgRef = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true)
        observer.disconnect()
      }
    }, { threshold: 0.1 })
    if (imgRef.current) observer.observe(imgRef.current)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={imgRef} {...props}>
      {isVisible ? <img src={src} alt={alt} /> : <div className="bg-gray-100 animate-pulse" />}
    </div>
  )
}
```

---

### 4.2 Cloudinary Transformations

Cloudinary cho phép transform ảnh qua URL, không cần xử lý phía client:

```js
// utils/imageUtils.js
const CLOUDINARY_BASE = 'https://res.cloudinary.com/{cloud_name}/image/upload'

export const getProductThumbnail = (publicId) =>
  `${CLOUDINARY_BASE}/w_400,h_400,c_fill,f_auto,q_auto/${publicId}`

export const getProductPreview = (publicId) =>
  `${CLOUDINARY_BASE}/w_800,h_800,c_limit,f_auto,q_auto/${publicId}`

export const getUserAvatar = (publicId) =>
  `${CLOUDINARY_BASE}/w_100,h_100,c_fill,g_face,r_max,f_auto,q_auto/${publicId}`

export const getTryOnResult = (publicId) =>
  `${CLOUDINARY_BASE}/w_600,f_auto,q_85/${publicId}`
```

**Quy tắc tối ưu:**
- Product grid: `w_400,h_400,c_fill` (ảnh vuông, crop center)
- Product detail: `w_800,c_limit` (giữ tỉ lệ, max 800px)
- Avatar: `w_100,r_max` (tròn, nhỏ)
- Try-on result: `q_85` (giảm quality 15%, không ảnh hưởng visual)
- Format: `f_auto` (Cloudinary chọn WebP/AVIF tự động)

---

## 5. Dark/Light Mode

### 5.1 Implementation

```js
// store/uiStore.js
const useUiStore = create(
  persist(
    (set) => ({
      theme: 'light',  // localStorage persist
      toggleTheme: () => set(state => ({
        theme: state.theme === 'light' ? 'dark' : 'light'
      }))
    }),
    { name: 'smartfit-ui' }
  )
)
```

```jsx
// App.jsx - apply theme to root
const App = () => {
  const theme = useUiStore(s => s.theme)
  return (
    <div className={theme === 'dark' ? 'dark' : ''}>
      <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        {/* ... */}
      </div>
    </div>
  )
}
```

**TailwindCSS config:**
```js
// tailwind.config.js
module.exports = {
  darkMode: 'class',  // Toggle qua class 'dark' trên root element
  // ...
}
```

**ThemeToggle Component:**
```jsx
// Sun icon (light) / Moon icon (dark)
const ThemeToggle = () => {
  const { theme, toggleTheme } = useUiStore()
  return (
    <button onClick={toggleTheme} aria-label="Toggle theme">
      {theme === 'light' ? <MoonIcon /> : <SunIcon />}
    </button>
  )
}
```

---

## 6. Image Crop/Resize trước khi Upload

### 6.1 Sử dụng `react-image-crop`

```jsx
// components/ui/ImageCropper.jsx
import ReactCrop from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'

const ImageCropper = ({ onCropComplete }) => {
  const [src, setSrc] = useState(null)
  const [crop, setCrop] = useState({ aspect: 3/4 })  // Tỉ lệ 3:4 cho ảnh người
  const imgRef = useRef(null)

  const onSelectFile = (e) => {
    const file = e.target.files[0]
    // Validate: chỉ chấp nhận jpg/png/webp, tối đa 10MB
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Chỉ chấp nhận ảnh JPG, PNG, WebP')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Ảnh tối đa 10MB')
      return
    }
    const reader = new FileReader()
    reader.onload = () => setSrc(reader.result)
    reader.readAsDataURL(file)
  }

  const getCroppedImage = async () => {
    const canvas = document.createElement('canvas')
    // ... vẽ vùng crop lên canvas
    canvas.toBlob((blob) => onCropComplete(blob), 'image/jpeg', 0.9)
  }

  return (
    <div>
      <input type="file" accept="image/*" onChange={onSelectFile} />
      {src && (
        <ReactCrop crop={crop} onChange={setCrop} aspect={3/4}>
          <img ref={imgRef} src={src} />
        </ReactCrop>
      )}
      {src && <button onClick={getCroppedImage}>Xác nhận</button>}
    </div>
  )
}
```

**Resize trước khi upload** (giảm tải server):
```js
// utils/imageUtils.js
export const resizeImage = (file, maxWidth = 1024, maxHeight = 1365) => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas')
    const img = new Image()
    img.onload = () => {
      let { width, height } = img
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height)
        width *= ratio
        height *= ratio
      }
      canvas.width = width
      canvas.height = height
      canvas.getContext('2d').drawImage(img, 0, 0, width, height)
      canvas.toBlob(resolve, 'image/jpeg', 0.85)
    }
    img.src = URL.createObjectURL(file)
  })
}
```

---

## 7. Similar Product Search (FAISS Vector Search)

### 7.1 Backend Setup

```python
# Khi khởi động server, load FAISS index vào memory
import faiss
import numpy as np

class FAISSSearchService:
    def __init__(self):
        self.index = None
        self.product_ids = []

    def load_index(self, index_path: str, ids_path: str):
        self.index = faiss.read_index(index_path)
        self.product_ids = np.load(ids_path).tolist()

    def search(self, query_vector: np.ndarray, top_k: int = 10):
        query = query_vector.reshape(1, -1).astype('float32')
        faiss.normalize_L2(query)
        distances, indices = self.index.search(query, top_k)
        results = []
        for dist, idx in zip(distances[0], indices[0]):
            if idx != -1:
                results.append({
                    "product_id": self.product_ids[idx],
                    "similarity_score": float(1 - dist)
                })
        return results

faiss_service = FAISSSearchService()

# Trong lifespan event của FastAPI
@asynccontextmanager
async def lifespan(app: FastAPI):
    faiss_service.load_index("models/product_index.faiss", "models/product_ids.npy")
    yield
```

**Tìm kiếm bằng ảnh upload:**
```python
@router.post("/products/search-by-image")
async def search_by_image(image: UploadFile):
    # 1. Extract feature vector từ ảnh bằng CNN encoder (ResNet50 không có FC layer)
    img_array = preprocess_image(await image.read())
    query_vector = clothing_encoder.extract_features(img_array)
    # 2. FAISS search
    results = faiss_service.search(query_vector, top_k=10)
    # 3. Lấy product details từ MySQL
    product_ids = [r["product_id"] for r in results]
    products = await db.fetch_products_by_ids(product_ids)
    return {"similar_products": products, "search_time_ms": elapsed_ms}
```

---

## 8. Export Outfit as Image/PDF

### 8.1 Export ảnh (Frontend Canvas)

```js
// utils/exportUtils.js
export const exportOutfitAsImage = async (outfit) => {
  const canvas = document.createElement('canvas')
  canvas.width = 800
  canvas.height = 1000
  const ctx = canvas.getContext('2d')

  // Background
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  // Header: Outfit name + watermark
  ctx.font = 'bold 24px Inter'
  ctx.fillStyle = '#1a1a1a'
  ctx.fillText(outfit.name, 40, 50)

  ctx.font = '14px Inter'
  ctx.fillStyle = '#666'
  ctx.fillText('SmartFit - Tạo bởi AI', 40, 75)

  // Vẽ từng item theo grid
  const items = outfit.items
  const itemsPerRow = 3
  const cellWidth = 240
  const cellHeight = 280
  for (let i = 0; i < items.length; i++) {
    const col = i % itemsPerRow
    const row = Math.floor(i / itemsPerRow)
    const x = 40 + col * cellWidth
    const y = 100 + row * cellHeight

    const img = await loadImage(items[i].product.image_url)
    ctx.drawImage(img, x, y, 200, 200)
    ctx.font = '12px Inter'
    ctx.fillStyle = '#333'
    ctx.fillText(items[i].product.name, x, y + 220)
  }

  // Download
  const link = document.createElement('a')
  link.download = `${outfit.name}_SmartFit.jpg`
  link.href = canvas.toDataURL('image/jpeg', 0.9)
  link.click()
}
```

### 8.2 Export PDF (Backend)

```python
# POST /wardrobe/outfits/{id}/export với format="pdf"
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4

def generate_outfit_pdf(outfit: dict, items: list) -> bytes:
    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4

    # Header
    c.setFont("Helvetica-Bold", 20)
    c.drawString(50, height - 50, f"Outfit: {outfit['name']}")
    c.setFont("Helvetica", 12)
    c.drawString(50, height - 75, f"Dịp: {outfit['occasion']}")

    # Items grid (tải ảnh từ Cloudinary URL)
    for i, item in enumerate(items):
        # ... vẽ ảnh + tên sản phẩm
        pass

    c.save()
    buffer.seek(0)
    return buffer.read()
```

---

## 9. Keyboard Shortcuts

### 9.1 Global Shortcuts

| Phím | Hành động |
|------|-----------|
| `Ctrl + /` | Mở search bar |
| `T` | Navigate sang TryOn page (khi không focus input) |
| `W` | Navigate sang Wardrobe page |
| `S` | Navigate sang Social Feed |
| `Esc` | Đóng modal/popup đang mở |
| `D` | Toggle Dark/Light mode |

### 9.2 TryOn Page Shortcuts

| Phím | Hành động |
|------|-----------|
| `Space` | Chụp ảnh (khi đang dùng webcam) |
| `R` | Retry / Thử lại |
| `Enter` | Xác nhận / Submit |

### 9.3 Implementation

```js
// hooks/useKeyboardShortcuts.js
const useKeyboardShortcuts = (shortcuts) => {
  useEffect(() => {
    const handler = (e) => {
      // Bỏ qua khi đang focus vào input/textarea
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return

      const key = [
        e.ctrlKey && 'Ctrl',
        e.shiftKey && 'Shift',
        e.key
      ].filter(Boolean).join('+')

      if (shortcuts[key]) {
        e.preventDefault()
        shortcuts[key]()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [shortcuts])
}

// Dùng trong App.jsx
useKeyboardShortcuts({
  'Ctrl+/': () => searchRef.current?.focus(),
  't': () => navigate('/tryon'),
  'w': () => navigate('/wardrobe'),
  's': () => navigate('/social'),
  'd': () => toggleTheme(),
})
```

---

## 10. Accessibility (A11y)

### 10.1 Alt Text cho ảnh

```jsx
// ProductCard.jsx
<img
  src={product.image_url}
  alt={`${product.name} - ${product.brand} - ${product.primary_color}`}
  loading="lazy"
/>

// Avatar
<img
  src={user.avatar_url}
  alt={`Ảnh đại diện của ${user.full_name}`}
/>

// Try-on result
<img
  src={result.result_url}
  alt={`Kết quả thử đồ: ${product.name}`}
/>
```

### 10.2 ARIA Labels

```jsx
// Buttons không có text
<button aria-label="Thích bài đăng">
  <HeartIcon />
</button>

<button aria-label="Xóa sản phẩm khỏi tủ đồ">
  <TrashIcon />
</button>

// Loading states
<div role="status" aria-live="polite">
  {isLoading && <span>Đang xử lý, vui lòng đợi...</span>}
</div>

// Modal
<div role="dialog" aria-modal="true" aria-labelledby="modal-title">
  <h2 id="modal-title">Tạo outfit mới</h2>
</div>

// Tab navigation
<div role="tablist">
  <button role="tab" aria-selected={activeTab === 'upload'}>Upload ảnh</button>
  <button role="tab" aria-selected={activeTab === 'webcam'}>AR Webcam</button>
</div>
```

### 10.3 Focus Management

```jsx
// Modal: trap focus bên trong khi mở
// Khi đóng modal: trả focus về element đã trigger mở modal

// Custom hook
const useFocusTrap = (isActive) => {
  const containerRef = useRef(null)
  useEffect(() => {
    if (!isActive) return
    const focusableElements = containerRef.current.querySelectorAll(
      'button, input, select, textarea, a[href], [tabindex]:not([tabindex="-1"])'
    )
    const firstEl = focusableElements[0]
    const lastEl = focusableElements[focusableElements.length - 1]
    firstEl?.focus()
    const handler = (e) => {
      if (e.key !== 'Tab') return
      if (e.shiftKey) {
        if (document.activeElement === firstEl) { e.preventDefault(); lastEl.focus() }
      } else {
        if (document.activeElement === lastEl) { e.preventDefault(); firstEl.focus() }
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isActive])
  return containerRef
}
```

### 10.4 Color Contrast & Semantic HTML

- Đảm bảo contrast ratio tối thiểu 4.5:1 (WCAG AA) cho text
- Dùng `<nav>`, `<main>`, `<aside>`, `<header>`, `<footer>` thay vì toàn `<div>`
- Form inputs có `<label>` liên kết đúng qua `htmlFor`
- Error messages liên kết với input qua `aria-describedby`

```jsx
// Form input có accessibility đầy đủ
<div>
  <label htmlFor="username">Tên đăng nhập</label>
  <input
    id="username"
    name="username"
    type="text"
    aria-required="true"
    aria-invalid={!!errors.username}
    aria-describedby={errors.username ? "username-error" : undefined}
  />
  {errors.username && (
    <p id="username-error" role="alert" className="text-red-500">
      {errors.username}
    </p>
  )}
</div>
```
