import type { CognitoUser } from "./cognito"

export type AuthSession = {
  user: CognitoUser
  tokens: {
    idToken: string
    accessToken: string
  }
}
