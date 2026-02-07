/**
 * Cognito Post-Confirmation Lambda Trigger
 * 
 * This Lambda is triggered after a user confirms their email.
 * It creates a new spa for the user and sets the custom:spaId attribute.
 */

import type { PostConfirmationTriggerEvent, Context, Callback } from "aws-lambda";
import { CognitoIdentityProviderClient, AdminUpdateUserAttributesCommand } from "@aws-sdk/client-cognito-identity-provider";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { ulid } from "ulid";

const cognitoClient = new CognitoIdentityProviderClient({});
const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const TABLE_NAME = process.env.TABLE_NAME || "spalf-table";

export async function handler(
  event: PostConfirmationTriggerEvent,
  _context: Context,
  callback: Callback
): Promise<PostConfirmationTriggerEvent> {
  console.log("Post-confirmation trigger:", JSON.stringify(event, null, 2));

  // Only run for confirmed signups (not forgot password confirmations)
  if (event.triggerSource !== "PostConfirmation_ConfirmSignUp") {
    return event;
  }

  const { userPoolId, userName } = event;
  const { email, given_name, family_name } = event.request.userAttributes;

  try {
    // Generate a new spa ID
    const spaId = ulid();
    const now = new Date().toISOString();

    // Create the spa name from the user's name
    const spaName = `${given_name}'s Spa`;

    // Create the spa in DynamoDB
    await docClient.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        PK: `SPA#${spaId}`,
        SK: "METADATA",
        spaId,
        name: spaName,
        ownerEmail: email,
        timeSlotGranularity: 15, // Default 15-minute slots
        GSI1PK: `SPA#${spaId}`,
        GSI1SK: "METADATA",
        createdAt: now,
        updatedAt: now,
      },
    }));

    console.log(`Created spa ${spaId} for user ${email}`);

    // Update the user's custom:spaId attribute in Cognito
    await cognitoClient.send(new AdminUpdateUserAttributesCommand({
      UserPoolId: userPoolId,
      Username: userName,
      UserAttributes: [
        {
          Name: "custom:spaId",
          Value: spaId,
        },
      ],
    }));

    console.log(`Set custom:spaId=${spaId} for user ${userName}`);

    // Return the event (required for Cognito triggers)
    return event;
  } catch (error) {
    console.error("Error in post-confirmation trigger:", error);
    // Don't fail the confirmation, just log the error
    // The user can be assigned to a spa later
    callback(null, event);
    return event;
  }
}
