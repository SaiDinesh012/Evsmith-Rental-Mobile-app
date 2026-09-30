import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://192.168.0.42:5000/api";
export const api = axios.create({ baseURL: API_URL, timeout: 10000 });

api.interceptors.request.use(async config => {
  const token = await AsyncStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Automatic fallback between Wi-Fi IP and ADB localhost if one fails
api.interceptors.response.use(
  res => res,
  async err => {
    const config = err.config;
    if (config && !config._retry && (!err.response || err.code === "ECONNABORTED" || err.message.includes("Network Error"))) {
      config._retry = true;
      const currentUrl = config.baseURL || API_URL;
      const fallbackUrl = currentUrl.includes("10.0.2.2")
        ? "http://192.168.0.42:5000/api"
        : currentUrl.includes("192.168.0.42")
        ? "http://10.0.2.2:5000/api"
        : "http://localhost:5000/api";
      config.baseURL = fallbackUrl;
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
