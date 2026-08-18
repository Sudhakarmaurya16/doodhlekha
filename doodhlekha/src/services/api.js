import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

// =====================================================
// REQUEST INTERCEPTOR
// =====================================================

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("doodhlekha_token");

    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

// =====================================================
// RESPONSE INTERCEPTOR
// =====================================================

api.interceptors.response.use(
  (response) => response,

  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("doodhlekha_token");
      localStorage.removeItem("doodhlekha_user");

      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  },
);

export default api;
