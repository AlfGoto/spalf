/**
 * Auth types for the Spalf application.
 */

export interface AuthUser {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  emailVerified: boolean;
  spaId: string | null;
}

export interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface SignUpInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface SignInInput {
  email: string;
  password: string;
}

export interface ConfirmSignUpInput {
  email: string;
  code: string;
}

export type AuthError = {
  code: string;
  message: string;
};
