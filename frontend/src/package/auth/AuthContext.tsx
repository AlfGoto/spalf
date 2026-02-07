"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { configureAuth } from "./config";
import {
  signIn as authSignIn,
  signUp as authSignUp,
  signOut as authSignOut,
  confirmSignUp as authConfirmSignUp,
  resendVerificationCode as authResendCode,
  getUser,
  getIdToken,
} from "./auth-service";
import type {
  AuthState,
  AuthUser,
  SignInInput,
  SignUpInput,
  ConfirmSignUpInput,
} from "./types";

// Configure Amplify on module load
configureAuth();

interface AuthContextValue extends AuthState {
  signIn: (input: SignInInput) => Promise<void>;
  signUp: (input: SignUpInput) => Promise<{ userConfirmed: boolean }>;
  signOut: () => Promise<void>;
  confirmSignUp: (input: ConfirmSignUpInput) => Promise<void>;
  resendVerificationCode: (email: string) => Promise<void>;
  getAuthToken: () => Promise<string | null>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  const refreshUser = useCallback(async () => {
    try {
      const user = await getUser();
      setState({
        user,
        isAuthenticated: !!user,
        isLoading: false,
      });
    } catch {
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const handleSignIn = useCallback(
    async (input: SignInInput) => {
      await authSignIn(input);
      await refreshUser();
    },
    [refreshUser],
  );

  const handleSignUp = useCallback(async (input: SignUpInput) => {
    const result = await authSignUp(input);
    return result;
  }, []);

  const handleSignOut = useCallback(async () => {
    await authSignOut();
    setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
  }, []);

  const handleConfirmSignUp = useCallback(async (input: ConfirmSignUpInput) => {
    await authConfirmSignUp(input);
  }, []);

  const handleResendCode = useCallback(async (email: string) => {
    await authResendCode(email);
  }, []);

  const getAuthToken = useCallback(async () => {
    return getIdToken();
  }, []);

  const value: AuthContextValue = {
    ...state,
    signIn: handleSignIn,
    signUp: handleSignUp,
    signOut: handleSignOut,
    confirmSignUp: handleConfirmSignUp,
    resendVerificationCode: handleResendCode,
    getAuthToken,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

/**
 * Hook to get the current user. Returns null if not authenticated.
 */
export function useUser(): AuthUser | null {
  const { user } = useAuth();
  return user;
}
