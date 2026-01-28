import {
  CognitoIdentityProviderClient,
  GetUserCommand,
  InitiateAuthCommand,
  RespondToAuthChallengeCommand,
  SignUpCommand,
  ConfirmSignUpCommand,
} from "@aws-sdk/client-cognito-identity-provider"
import { createHmac } from "crypto"

export type CognitoConfig = {
  region: string
  clientId: string
}

export type CognitoTokens = {
  accessToken: string
  idToken: string
  refreshToken: string
}

export type CognitoUser = {
  email: string
  name?: string
  sub: string
  [key: string]: string | undefined
}

export class Cognito {
  private client: CognitoIdentityProviderClient

  constructor(public config: CognitoConfig) {
    this.client = new CognitoIdentityProviderClient({
      region: this.config.region,
    })
  }

  private calculateSecretHash(username: string): string {
    const clientSecret = process.env.COGNITO_CLIENT_SECRET
    if (!clientSecret) {
      throw new Error("COGNITO_CLIENT_SECRET environment variable is required")
    }
    return createHmac("SHA256", clientSecret)
      .update(username + this.config.clientId)
      .digest("base64")
  }

  async getUserAttributes(accessToken: string): Promise<CognitoUser> {
    const { UserAttributes } = await this.client.send(
      new GetUserCommand({
        AccessToken: accessToken,
      })
    )

    const attributes: Record<string, string> = {}
    if (UserAttributes) {
      for (const attribute of UserAttributes) {
        if (attribute.Name && attribute.Value !== undefined) {
          attributes[attribute.Name] = attribute.Value
        }
      }
    }

    return {
      sub: attributes.sub,
      email: attributes.email,
      name: attributes.name || attributes.given_name,
      ...attributes,
    }
  }

  async signIn(credentials: { username: string; password: string }): Promise<
    | { tokens: CognitoTokens; user: CognitoUser }
    | { challengeName: string; session: string; username: string }
  > {
    const secretHash = this.calculateSecretHash(credentials.username)

    const { AuthenticationResult, ChallengeName, Session } = await this.client
      .send(
        new InitiateAuthCommand({
          AuthFlow: "USER_PASSWORD_AUTH",
          ClientId: this.config.clientId,
          AuthParameters: {
            USERNAME: credentials.username,
            PASSWORD: credentials.password,
            SECRET_HASH: secretHash,
          },
        })
      )
      .catch((error) => {
        console.error("Error authenticating user:", error)
        throw new Error(error.name)
      })

    // Handle NEW_PASSWORD_REQUIRED challenge
    if (ChallengeName === "NEW_PASSWORD_REQUIRED") {
      return {
        challengeName: ChallengeName,
        session: Session!,
        username: credentials.username,
      }
    }

    if (!AuthenticationResult) {
      throw new Error("No authentication result")
    }

    const tokens: CognitoTokens = {
      accessToken: AuthenticationResult.AccessToken!,
      idToken: AuthenticationResult.IdToken!,
      refreshToken: AuthenticationResult.RefreshToken!,
    }

    const user = await this.getUserAttributes(tokens.accessToken)

    return { tokens, user }
  }

  async completeNewPasswordChallenge({
    username,
    session,
    newPassword,
  }: {
    username: string
    session: string
    newPassword: string
  }): Promise<{ tokens: CognitoTokens; user: CognitoUser }> {
    const secretHash = this.calculateSecretHash(username)

    const response = await this.client.send(
      new RespondToAuthChallengeCommand({
        ClientId: this.config.clientId,
        ChallengeName: "NEW_PASSWORD_REQUIRED",
        Session: session,
        ChallengeResponses: {
          USERNAME: username,
          NEW_PASSWORD: newPassword,
          SECRET_HASH: secretHash,
        },
      })
    )

    if (!response.AuthenticationResult) {
      throw new Error("No authentication result in response")
    }

    const tokens: CognitoTokens = {
      accessToken: response.AuthenticationResult.AccessToken!,
      idToken: response.AuthenticationResult.IdToken!,
      refreshToken: response.AuthenticationResult.RefreshToken!,
    }

    const user = await this.getUserAttributes(tokens.accessToken)

    return { tokens, user }
  }

  async refreshToken(params: {
    refreshToken: string
    username: string
  }): Promise<{ accessToken: string; idToken: string }> {
    const secretHash = this.calculateSecretHash(params.username)

    const { AuthenticationResult } = await this.client
      .send(
        new InitiateAuthCommand({
          AuthFlow: "REFRESH_TOKEN_AUTH",
          ClientId: this.config.clientId,
          AuthParameters: {
            REFRESH_TOKEN: params.refreshToken,
            USERNAME: params.username,
            SECRET_HASH: secretHash,
          },
        })
      )
      .catch((error) => {
        console.error("Error refreshing token:", error)
        throw new Error(error.name)
      })

    if (!AuthenticationResult) {
      throw new Error("No authentication result")
    }

    return {
      accessToken: AuthenticationResult.AccessToken!,
      idToken: AuthenticationResult.IdToken!,
    }
  }

  async signUp(params: {
    email: string
    password: string
    givenName: string
    familyName: string
  }): Promise<{ userConfirmed: boolean; userSub: string }> {
    const secretHash = this.calculateSecretHash(params.email)

    const response = await this.client
      .send(
        new SignUpCommand({
          ClientId: this.config.clientId,
          Username: params.email,
          Password: params.password,
          SecretHash: secretHash,
          UserAttributes: [
            { Name: "email", Value: params.email },
            { Name: "given_name", Value: params.givenName },
            { Name: "family_name", Value: params.familyName },
          ],
        })
      )
      .catch((error) => {
        console.error("Error signing up user:", error)
        throw new Error(error.name)
      })

    return {
      userConfirmed: response.UserConfirmed ?? false,
      userSub: response.UserSub!,
    }
  }

  async confirmSignUp(params: {
    email: string
    code: string
  }): Promise<void> {
    const secretHash = this.calculateSecretHash(params.email)

    await this.client
      .send(
        new ConfirmSignUpCommand({
          ClientId: this.config.clientId,
          Username: params.email,
          ConfirmationCode: params.code,
          SecretHash: secretHash,
        })
      )
      .catch((error) => {
        console.error("Error confirming sign up:", error)
        throw new Error(error.name)
      })
  }
}

// Lazy initialization
let cognitoInstance: Cognito | null = null

export function getCognito(): Cognito {
  if (!cognitoInstance) {
    const region = process.env.COGNITO_REGION || "eu-central-1"
    const clientId = process.env.COGNITO_CLIENT_ID

    if (!clientId) {
      throw new Error("COGNITO_CLIENT_ID environment variable is required")
    }

    cognitoInstance = new Cognito({ region, clientId })
  }
  return cognitoInstance
}
