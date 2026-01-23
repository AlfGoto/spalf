/**
 * Auth package exports.
 */

export { AuthProvider, useAuth, useUser } from "./AuthContext";
export { configureAuth } from "./config";
export {
  signIn,
  signUp,
  signOut,
  confirmSignUp,
  resendVerificationCode,
  getUser,
  getAccessToken,
  getIdToken,
  isAuthenticated,
} from "./auth-service";
export type {
  AuthUser,
  AuthState,
  SignUpInput,
  SignInInput,
  ConfirmSignUpInput,
  AuthError,
} from "./types";
