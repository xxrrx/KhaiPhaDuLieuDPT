export const API_BASE_URL = '/api/v1';

export const OCCASION_OPTIONS = [
  { value: 'casual', label: 'Thường ngày' },
  { value: 'formal', label: 'Công sở / Trang trọng' },
  { value: 'party', label: 'Tiệc / Dự sự kiện' },
  { value: 'sport', label: 'Thể thao / Năng động' },
  { value: 'date', label: 'Hẹn hò' },
];

export const GENDER_OPTIONS = [
  { value: 'male', label: 'Nam' },
  { value: 'female', label: 'Nữ' },
  { value: 'unisex', label: 'Unisex' },
];

export const STYLE_OPTIONS = [
  { value: 'casual', label: 'Casual' },
  { value: 'formal', label: 'Formal' },
  { value: 'streetwear', label: 'Streetwear' },
  { value: 'minimalist', label: 'Minimalist' },
  { value: 'bohemian', label: 'Bohemian' },
  { value: 'vintage', label: 'Vintage' },
  { value: 'sporty', label: 'Sporty' },
];

export const SORT_OPTIONS = [
  { value: 'newest', label: 'Mới nhất' },
  { value: 'popular', label: 'Phổ biến nhất' },
  { value: 'price_asc', label: 'Giá tăng dần' },
  { value: 'price_desc', label: 'Giá giảm dần' },
];

export const COLOR_SEASON_LABELS = {
  Winter: 'Mùa Đông',
  Summer: 'Mùa Hè',
  Spring: 'Mùa Xuân',
  Autumn: 'Mùa Thu',
};

export const BODY_SHAPE_LABELS = {
  hourglass: 'Đồng hồ cát',
  pear: 'Quả lê',
  apple: 'Quả táo',
  rectangle: 'Hình chữ nhật',
  inverted_triangle: 'Tam giác ngược',
};
