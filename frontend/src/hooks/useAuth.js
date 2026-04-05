import useAuthStore from '../store/authStore';

export function useAuth() {
  const { user, token, isAuthenticated, login, logout, updateUser } = useAuthStore();
  return { user, token, isAuthenticated, login, logout, updateUser };
}
