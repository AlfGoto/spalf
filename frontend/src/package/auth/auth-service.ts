/**
 * Authentication service wrapping AWS Amplify Auth.
 * Provides a clean interface for auth operations.
 */

import {
  signIn as amplifySignIn,
  signUp as amplifySignUp,
  signOut as amplifySignOut,
  confirmSignUp as amplifyConfirmSignUp,
  getCurrentUser,
  fetchAuthSession,
  fetchUserAttributes,
  resendSignUpCode,
} from "@aws-amplify/auth";
import type {
  AuthUser,
  SignUpInput,
  SignInInput,
  ConfirmSignUpInput,
  AuthError,
} from "./types";

/**
 * Sign in a user with email and password.
 */
export async function signIn(input: SignInInput): Promise<{ success: boolean }> {
  const { email, password } = input;

  const result = await amplifySignIn({
    username: email,
    password,
  });

  if (result.nextStep.signInStep === "CONFIRM_SIGN_UP") {
    throw {
      code: "UserNotConfirmedException",
      message: "Please verify your email address.",
    } as AuthError;
  }

  return { success: result.isSignedIn };
}

/**
 * Sign up a new user with email and password.
 */
export async function signUp(
  input: SignUpInput
): Promise<{ userConfirmed: boolean }> {
  const { email, password, firstName, lastName } = input;

  const result = await amplifySignUp({
    username: email,
    password,
    options: {
      userAttributes: {
        email,
        given_name: firstName,
        family_name: lastName,
      },
    },
  });

  return {
    userConfirmed: result.isSignUpComplete,
  };
}

/**
 * Confirm a user's sign up with verification code.
 */
export async function confirmSignUp(
  input: ConfirmSignUpInput
): Promise<{ success: boolean }> {
  const { email, code } = input;

  const result = await amplifyConfirmSignUp({
    username: email,
    confirmationCode: code,
  });

  return { success: result.isSignUpComplete };
}

/**
 * Resend the sign up verification code.
 */
export async function resendVerificationCode(
  email: string
): Promise<{ success: boolean }> {
  await resendSignUpCode({ username: email });
  return { success: true };
}

/**
 * Sign out the current user.
 */
export async function signOut(): Promise<void> {
  await amplifySignOut();
}

/**
 * Get the current authenticated user.
 */
export async function getUser(): Promise<AuthUser | null> {
  try {
    const user = await getCurrentUser();
    const attributes = await fetchUserAttributes();

    return {
      userId: user.userId,
      email: attributes.email || "",
      firstName: attributes.given_name || "",
      lastName: attributes.family_name || "",
      emailVerified: attributes.email_verified === "true",
      spaId: attributes["custom:spaId"] || null,
    };
  } catch {
    return null;
  }
}

/**
 * Get the current auth session access token.
 */
export async function getAccessToken(): Promise<string | null> {
  try {
    const session = await fetchAuthSession();
    return session.tokens?.accessToken?.toString() || null;
  } catch {
    return null;
  }
}

/**
 * Get the current auth session ID token (for API calls).
 */
export async function getIdToken(): Promise<string | null> {
  try {
    const session = await fetchAuthSession();
    return session.tokens?.idToken?.toString() || null;
  } catch {
    return null;
  }
}

/**
 * Check if the user is authenticated.
 */
export async function isAuthenticated(): Promise<boolean> {
  try {
    await getCurrentUser();
    return true;
  } catch {
    return false;
  }
}
