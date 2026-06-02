# opencode-bedrock-openai-token

OpenCode plugin that authenticates requests to AWS Bedrock's OpenAI-compatible endpoint using short-lived tokens from the [Bedrock Token Generator](https://github.com/aws/bedrock-token-generator-js).

## Install

Add the plugin to your `opencode.json`:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["opencode-bedrock-openai-token"]
}
```

Add the the following to `~/.local/share/opencode/auth.json`

```json
{
  "bedrock-openai": { "type": "api", "key": "placeholder-overridden-by-plugin" }
}
```

## Configure the provider

Define a `bedrock-openai` provider in your `opencode.json`:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["opencode-bedrock-openai-token"],
  "provider": {
    "bedrock-openai": {
      "npm": "@ai-sdk/openai",
      "name": "OpenAI on Bedrock",
      "options": {
        "baseURL": "https://bedrock-mantle.us-east-1.api.aws/openai/v1",
        "awsRegion": "us-east-1",
        "awsProfile": "my-profile"
      },
      "models": {
        "openai.gpt-5.5": { "name": "GPT-5.5 (Bedrock)" }
      }
    }
  }
}
```

### Provider options

| Option       | Description                          | Default                           |
| ------------ | ------------------------------------ | --------------------------------- |
| `baseURL`    | Bedrock OpenAI-compatible endpoint   | (required)                        |
| `awsRegion`  | AWS region for token generation      | `$AWS_REGION` or `us-east-1`      |
| `awsProfile` | AWS credentials profile              | `$AWS_PROFILE` or default chain   |

## Authentication

The plugin uses the [AWS Node Provider Chain](https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/setting-credentials-node.html) to resolve credentials. It supports:

- Environment variables (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`)
- Shared credentials file (`~/.aws/credentials`)
- SSO profiles
- IAM roles (EC2, ECS, Lambda)

If `awsProfile` is set in the provider options (or `AWS_PROFILE` is set in the environment), that named profile is used.

Tokens are cached for 11 hours and refreshed automatically.

## How it works

1. On startup, the `config` hook reads `awsRegion` and `awsProfile` from your provider config.
2. The `auth.loader` hook provides an initial `apiKey` (bearer token) to the provider.
3. The `chat.headers` hook injects a fresh `Authorization: Bearer <token>` header on every request to the `bedrock-openai` provider.

## Local development

To use as a local plugin instead of installing from npm, copy `src/index.ts` to your plugins directory:

```
~/.config/opencode/plugins/bedrock-token.ts
```

And add the dependencies to `~/.config/opencode/package.json`:

```json
{
  "dependencies": {
    "@aws-sdk/credential-providers": "^3.0.0",
    "@aws/bedrock-token-generator": "^1.1.0"
  }
}
```

## License

MIT
