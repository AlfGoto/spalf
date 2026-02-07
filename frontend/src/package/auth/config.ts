/**
 * AWS Amplify Auth configuration for Cognito.
 *
 * Environment variables required:
 * - NEXT_PUBLIC_COGNITO_USER_POOL_ID: The Cognito User Pool ID
 * - NEXT_PUBLIC_COGNITO_CLIENT_ID: The Cognito User Pool Client ID
 * - NEXT_PUBLIC_AWS_REGION: The AWS region (e.g., 'us-east-1')
 */

import { Amplify, type ResourcesConfig } from "aws-amplify";

const userPoolId = process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID;
const userPoolClientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;
const region = process.env.NEXT_PUBLIC_AWS_REGION || "us-east-1";

if (!userPoolId || !userPoolClientId) {
  console.warn(
    "Cognito environment variables not set. Authentication will not work.",
    "Required: NEXT_PUBLIC_COGNITO_USER_POOL_ID, NEXT_PUBLIC_COGNITO_CLIENT_ID"
  );
}

export const authConfig: ResourcesConfig = {
  Auth: {
    Cognito: {
      userPoolId: userPoolId || "",
      userPoolClientId: userPoolClientId || "",
      signUpVerificationMethod: "code",
    },
  },
};

let configured = false;

export function configureAuth() {
  if (!configured) {
    Amplify.configure(authConfig);
    configured = true;
  }
}

export { userPoolId, userPoolClientId, region };
