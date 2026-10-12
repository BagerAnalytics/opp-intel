export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL || 'https://opp-intel-backend.onrender.com'
).replace(/\/$/, '');

export const logoutUser = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('oppintel_token');
    localStorage.removeItem('oppintel_user');
    window.location.href = '/login';
  }
};
