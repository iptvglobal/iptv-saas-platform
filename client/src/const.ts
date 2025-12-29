export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// API base URL - empty string means same origin
export const API_BASE_URL = "";

// Auth endpoints
export const AUTH_ENDPOINTS = {
  signUp: "/api/auth/signup",
  signIn: "/api/auth/signin",
  signOut: "/api/auth/signout",
  verifyOTP: "/api/auth/verify-otp",
  resendOTP: "/api/auth/resend-otp",
  forgotPasswordOTP: "/api/auth/forgot-password-otp",
  resetPasswordOTP: "/api/auth/reset-password-otp",
  me: "/api/auth/me",
} as const;
