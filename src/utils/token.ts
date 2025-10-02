// Unified token management - end localStorage chaos
const KEY = "auth_token";

export const setToken = (token: string) => localStorage.setItem(KEY, token);
export const getToken = () => localStorage.getItem(KEY);
export const clearToken = () => localStorage.removeItem(KEY);

export default { setToken, getToken, clearToken };