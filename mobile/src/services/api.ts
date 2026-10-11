
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { ACCESS_TOKEN_KEY } from "./auth";

const API_URL = "http://192.168.1.69:8000/api";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    Accept: "application/json",
  },
});

api.interceptors.request.use(async (config) => {
  const url = config.url || "";

  // Login and registration do not need an existing token.
  if (
    url.includes("/users/login/") ||
    url.includes("/users/register/")
  ) {
    return config;
  }

  // Keep a token explicitly supplied by the request.
  const suppliedToken = config.headers.get("Authorization");

  if (suppliedToken) {
    return config;
  }

  // Otherwise, retrieve the saved access token.
  const savedToken = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);

  if (savedToken) {
    config.headers.set("Authorization", `Bearer ${savedToken}`);
  }

  return config;
});

export default api;
