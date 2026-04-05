export function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

export function validatePassword(password) {
  if (!password) return 'Mật khẩu không được trống';
  if (password.length < 6) return 'Mật khẩu phải có ít nhất 6 ký tự';
  return null;
}

export function validateUsername(username) {
  if (!username) return 'Tên đăng nhập không được trống';
  if (username.length < 3) return 'Tên đăng nhập phải có ít nhất 3 ký tự';
  if (!/^[a-zA-Z0-9_]+$/.test(username)) return 'Tên đăng nhập chỉ được chứa chữ, số và dấu gạch dưới';
  return null;
}

export function validateRequired(value, fieldName = 'Trường này') {
  if (!value || (typeof value === 'string' && !value.trim())) {
    return `${fieldName} không được trống`;
  }
  return null;
}
