import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const API_URL = process.env.EXPO_PUBLIC_API_URL || "https://evsmith-rental-backend.onrender.com/api";
export const api = axios.create({ 
  baseURL: API_URL, 
  timeout: 30000 // 30s to allow for Render free tier spin-up
});

api.interceptors.request.use(async config => {
  const token = await AsyncStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Automatic retry on cold-start timeout or network hiccup
api.interceptors.response.use(
  res => res,
  async err => {
    const config = err.config;
    if (config && !config._retry && (!err.response || err.code === "ECONNABORTED" || err.message?.includes("Network Error"))) {
      config._retry = true;
      return api.request(config);
    }
    if (err.response?.status === 401 && config && !config.url?.includes("/auth/")) {
      await clearAuth();
    }
    return Promise.reject(err);
  }
);

export async function saveAuth(token: string, role: "USER"|"ADMIN") {
  await AsyncStorage.multiSet([["token", token], ["role", role]]);
}
export async function clearAuth() {
  await AsyncStorage.multiRemove(["token", "role"]);
}
