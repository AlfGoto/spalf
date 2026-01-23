import * as cdk from "aws-cdk-lib";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as lambdaNode from "aws-cdk-lib/aws-lambda-nodejs";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as events from "aws-cdk-lib/aws-events";
import * as targets from "aws-cdk-lib/aws-events-targets";
import { Construct } from "constructs";
import * as path from "path";

export class SpalfStack extends cdk.Stack {
  public readonly table: dynamodb.Table;
  public readonly spaUserPool: cognito.UserPool;
  public readonly integrationUserPool: cognito.UserPool;
  public readonly frontendApi: apigateway.RestApi;
  public readonly integrationApi: apigateway.RestApi;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // ===== DynamoDB Table =====
    this.table = new dynamodb.Table(this, "SpalfTable", {
      tableName: "spalf-table",
      partitionKey: { name: "PK", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "SK", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      pointInTimeRecovery: true,
    });

    // GSI1: Query by Spa
    this.table.addGlobalSecondaryIndex({
      indexName: "GSI1",
      partitionKey: { name: "GSI1PK", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "GSI1SK", type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // GSI2: Query by Date
    this.table.addGlobalSecondaryIndex({
      indexName: "GSI2",
      partitionKey: { name: "GSI2PK", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "GSI2SK", type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // ===== Cognito User Pool for Spa Users =====
    this.spaUserPool = new cognito.UserPool(this, "SpaUserPool", {
      userPoolName: "spalf-spa-users",
      selfSignUpEnabled: true,
      signInAliases: { email: true },
      autoVerify: { email: true },
      standardAttributes: {
        email: { required: true, mutable: true },
        givenName: { required: true, mutable: true },
        familyName: { required: true, mutable: true },
      },
      customAttributes: {
        spaId: new cognito.StringAttribute({ mutable: true }),
      },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: false,
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // ===== Post-Confirmation Lambda Trigger =====
    // Creates a spa for new users and sets their custom:spaId attribute
    const postConfirmationFunction = new lambdaNode.NodejsFunction(this, "PostConfirmationFunction", {
      functionName: "spalf-post-confirmation",
      entry: path.join(__dirname, "functions/auth/post-confirmation.ts"),
      handler: "handler",
      runtime: lambda.Runtime.NODEJS_20_X,
      timeout: cdk.Duration.seconds(10),
      memorySize: 256,
      environment: {
        TABLE_NAME: this.table.tableName,
        NODE_OPTIONS: "--enable-source-maps",
      },
      bundling: {
        minify: true,
        sourceMap: true,
        target: "node20",
        format: lambdaNode.OutputFormat.ESM,
        mainFields: ["module", "main"],
        esbuildArgs: {
          "--tree-shaking": "true",
        },
      },
    });

    // Grant the post-confirmation Lambda write access to DynamoDB
    this.table.grantWriteData(postConfirmationFunction);

    // Grant the Lambda permission to update user attributes
    // Use a constructed ARN pattern to avoid circular dependency
    postConfirmationFunction.addToRolePolicy(new cdk.aws_iam.PolicyStatement({
      actions: ["cognito-idp:AdminUpdateUserAttributes"],
      resources: [
        cdk.Arn.format({
          service: "cognito-idp",
          resource: "userpool",
          resourceName: "*",
        }, this),
      ],
    }));

    // Add the Lambda as a Cognito trigger (must be after granting permissions)
    this.spaUserPool.addTrigger(cognito.UserPoolOperation.POST_CONFIRMATION, postConfirmationFunction);

    const spaUserPoolClient = this.spaUserPool.addClient("SpaUserPoolClient", {
      authFlows: {
        userPassword: true,
        userSrp: true,
      },
      oAuth: {
        flows: { authorizationCodeGrant: true },
        scopes: [cognito.OAuthScope.EMAIL, cognito.OAuthScope.OPENID, cognito.OAuthScope.PROFILE],
      },
    });

    // ===== Cognito User Pool for Integrations =====
    this.integrationUserPool = new cognito.UserPool(this, "IntegrationUserPool", {
      userPoolName: "spalf-integration-users",
      selfSignUpEnabled: false,
      signInAliases: { username: true },
      passwordPolicy: {
        minLength: 32,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: true,
      },
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    const integrationUserPoolClient = this.integrationUserPool.addClient("IntegrationUserPoolClient", {
      authFlows: {
        userPassword: true,
        userSrp: true,
      },
    });

    // ===== API Gateway for Frontend =====
    this.frontendApi = new apigateway.RestApi(this, "FrontendApi", {
      restApiName: "Spalf Frontend API",
      description: "API for Spalf web application",
      deployOptions: {
        stageName: "v1",
        throttlingBurstLimit: 100,
        throttlingRateLimit: 50,
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ["Content-Type", "Authorization"],
      },
    });

    // Cognito Authorizer for Frontend API
    const spaAuthorizer = new apigateway.CognitoUserPoolsAuthorizer(this, "SpaAuthorizer", {
      cognitoUserPools: [this.spaUserPool],
      identitySource: "method.request.header.Authorization",
    });

    // ===== API Lambda Function =====
    const apiFunction = new lambdaNode.NodejsFunction(this, "ApiFunction", {
      functionName: "spalf-api",
      entry: path.join(__dirname, "functions/api/index.ts"),
      handler: "handler",
      runtime: lambda.Runtime.NODEJS_20_X,
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      environment: {
        TABLE_NAME: this.table.tableName,
        NODE_OPTIONS: "--enable-source-maps",
      },
      bundling: {
        minify: true,
        sourceMap: true,
        target: "node20",
        format: lambdaNode.OutputFormat.ESM,
        mainFields: ["module", "main"],
        esbuildArgs: {
          "--tree-shaking": "true",
        },
      },
    });

    // Grant the API Lambda read/write access to DynamoDB
    this.table.grantReadWriteData(apiFunction);

    // API Gateway integration
    const apiIntegration = new apigateway.LambdaIntegration(apiFunction);

    // Add proxy resource to handle all API routes
    const apiResource = this.frontendApi.root.addResource("api");
    const proxyResource = apiResource.addProxy({
      defaultIntegration: apiIntegration,
      defaultMethodOptions: {
        authorizer: spaAuthorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
      },
      anyMethod: true,
    });

    // ===== Integration API Gateway =====
    this.integrationApi = new apigateway.RestApi(this, "IntegrationApi", {
      restApiName: "Spalf Integration API",
      description: "API for external system integrations",
      deployOptions: {
        stageName: "v1",
        throttlingBurstLimit: 50,
        throttlingRateLimit: 25,
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ["Content-Type", "Authorization", "X-Webhook-Signature"],
      },
    });

    // ===== Integration API Lambda Function =====
    const integrationApiFunction = new lambdaNode.NodejsFunction(this, "IntegrationApiFunction", {
      functionName: "spalf-integration-api",
      entry: path.join(__dirname, "functions/integration-api/index.ts"),
      handler: "handler",
      runtime: lambda.Runtime.NODEJS_20_X,
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      environment: {
        TABLE_NAME: this.table.tableName,
        NODE_OPTIONS: "--enable-source-maps",
      },
      bundling: {
        minify: true,
        sourceMap: true,
        target: "node20",
        format: lambdaNode.OutputFormat.ESM,
        mainFields: ["module", "main"],
        esbuildArgs: {
          "--tree-shaking": "true",
        },
      },
    });

    // Grant the Integration API Lambda read/write access to DynamoDB
    this.table.grantReadWriteData(integrationApiFunction);

    // Integration API Gateway integration
    const integrationApiIntegration = new apigateway.LambdaIntegration(integrationApiFunction);

    // Add integration resource (no Cognito auth - uses token-based auth in Lambda)
    const integrationResource = this.integrationApi.root.addResource("integration");
    integrationResource.addProxy({
      defaultIntegration: integrationApiIntegration,
      anyMethod: true,
    });

    // ===== Trigger Lambda for Outbound Webhooks =====
    const triggerFunction = new lambdaNode.NodejsFunction(this, "TriggerFunction", {
      functionName: "spalf-trigger",
      entry: path.join(__dirname, "functions/trigger/index.ts"),
      handler: "handler",
      runtime: lambda.Runtime.NODEJS_20_X,
      timeout: cdk.Duration.seconds(60),
      memorySize: 256,
      environment: {
        TABLE_NAME: this.table.tableName,
        NODE_OPTIONS: "--enable-source-maps",
      },
      bundling: {
        minify: true,
        sourceMap: true,
        target: "node20",
        format: lambdaNode.OutputFormat.ESM,
        mainFields: ["module", "main"],
        esbuildArgs: {
          "--tree-shaking": "true",
        },
      },
    });

    // Grant the Trigger Lambda read access to DynamoDB (to query integrations)
    this.table.grantReadData(triggerFunction);

    // ===== EventBridge Rule for Webhooks =====
    const webhookEventBus = new events.EventBus(this, "WebhookEventBus", {
      eventBusName: "spalf-webhooks",
    });

    // Rule to trigger webhook Lambda for all spalf events
    new events.Rule(this, "WebhookTriggerRule", {
      eventBus: webhookEventBus,
      eventPattern: {
        source: ["spalf"],
      },
      targets: [new targets.LambdaFunction(triggerFunction)],
    });

    // ===== Outputs =====
    new cdk.CfnOutput(this, "TableName", {
      value: this.table.tableName,
      description: "DynamoDB Table Name",
    });

    new cdk.CfnOutput(this, "SpaUserPoolId", {
      value: this.spaUserPool.userPoolId,
      description: "Spa User Pool ID",
    });

    new cdk.CfnOutput(this, "SpaUserPoolClientId", {
      value: spaUserPoolClient.userPoolClientId,
      description: "Spa User Pool Client ID",
    });

    new cdk.CfnOutput(this, "IntegrationUserPoolId", {
      value: this.integrationUserPool.userPoolId,
      description: "Integration User Pool ID",
    });

    new cdk.CfnOutput(this, "FrontendApiUrl", {
      value: this.frontendApi.url,
      description: "Frontend API URL",
    });

    new cdk.CfnOutput(this, "IntegrationApiUrl", {
      value: this.integrationApi.url,
      description: "Integration API URL",
    });

    new cdk.CfnOutput(this, "IntegrationUserPoolClientId", {
      value: integrationUserPoolClient.userPoolClientId,
      description: "Integration User Pool Client ID",
    });

    new cdk.CfnOutput(this, "WebhookEventBusName", {
      value: webhookEventBus.eventBusName,
      description: "EventBridge bus for webhook events",
    });
  }
}
