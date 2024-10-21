import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import Cookies from "js-cookie"; // Use cookies to store tokens securely

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8003";

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Debugging function to safely stringify objects
  const debugStringify = (obj) => {
    try {
      return JSON.stringify(obj, null, 2);
    } catch (e) {
      return `[Error stringifying: ${e.message}]`;
    }
  };

  // Set base URL for Axios
  axios.defaults.baseURL = API_URL;

  // Interceptor to include access token in requests
  axios.interceptors.request.use((config) => {
    const accessToken = Cookies.get("accessToken");
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  });

  // Interceptor to handle errors and refresh tokens
  axios.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      // Check for token expiration (401 error) and attempt to refresh
      if (error.response && error.response.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;
        const refreshToken = Cookies.get("refreshToken");
        if (refreshToken) {
          try {
            const response = await axios.post("/auth/refresh_token", { token: refreshToken });
            const { access_token } = response.data;

            // Store new access token
            Cookies.set("accessToken", access_token, { secure: true, sameSite: "Strict" });
            originalRequest.headers.Authorization = `Bearer ${access_token}`;
            return axios(originalRequest);
          } catch (refreshError) {
            console.error("🔥 Token refresh failed:", refreshError);
            signOut(); // Log out if the token refresh fails
          }
        }
      }

      return Promise.reject(error);
    }
  );

  // Load user from cookies on initial load
  useEffect(() => {
    const loadUserFromCookies = () => {
      const storedUser = Cookies.get("user");

      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
        } catch (error) {
          console.error("Error parsing stored user:", error);
          Cookies.remove("user");
          Cookies.remove("accessToken");
          Cookies.remove("refreshToken");
        }
      }
      setLoading(false);
    };

    loadUserFromCookies();
  }, []);

  // Helper to save user data and tokens securely in cookies
  const saveUserToCookies = (userData) => {
    Cookies.set("user", JSON.stringify(userData), { secure: true, sameSite: "Strict" });
    Cookies.set("accessToken", userData.access_token, { secure: true, sameSite: "Strict" });
    Cookies.set("refreshToken", userData.refresh_token, { secure: true, sameSite: "Strict" });
  };

  // Sign In function with corrected response structure handling
  const signIn = useCallback(
    async (email, password) => {
      setLoading(true);
      try {
        console.debug('🔑 Attempting sign in for email:', email);

        const response = await axios.post("/auth/sign_in", { email, password });

        // Log the full response for debugging
        console.debug('👉 Full sign-in response:', debugStringify(response.data));

        // Corrected extraction of userData and accessToken
        const userData = response.data?.data?.data?.user;
        const accessToken = userData?.access_token;

        // Log the extracted user and token data
        console.debug('🔍 Extracted userData:', debugStringify(userData));
        console.debug('🔍 Extracted accessToken:', accessToken);

        if (!userData || !accessToken) {
          console.error('❌ Invalid user data or missing access token');
          console.debug('🔍 Response structure:', debugStringify(response.data));
          throw new Error("Invalid user data or missing access token");
        }

        // Store user data and tokens in cookies
        saveUserToCookies(userData);
        setUser(userData);

        return userData;
      } catch (error) {
        console.error("🔥 Sign in error:", error);
        console.debug('🔍 Full error response:', debugStringify(error.response?.data));
        throw new Error(error.response?.data?.error || "Sign in failed");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Sign Up function with error handling and debugging
  const signUp = useCallback(
    async (email, password) => {
      setLoading(true);
      try {
        console.debug('📝 Attempting sign up for email:', email);

        const response = await axios.post("/auth/sign_up", { email, password });

        console.debug('👉 Full sign-up response:', debugStringify(response.data));

        if (!response.data) {
          throw new Error("Invalid sign-up response");
        }

        return response.data;
      } catch (error) {
        console.error("❌ Sign up error:", error);
        console.debug('🔍 Full error response:', debugStringify(error.response?.data));
        throw new Error(error.response?.data?.error || "Sign up failed");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Sign Out function to clear cookies and log out user
  const signOut = useCallback(() => {
    console.debug('👋 Signing out user');
    Cookies.remove("user");
    Cookies.remove("accessToken");
    Cookies.remove("refreshToken");
    setUser(null);
  }, []);

return {
  user,
  setUser,
  loading,
  signIn,
  signUp,
  signOut,
};

};
