import type { Plugin, Config } from "@opencode-ai/plugin"
import { getTokenProvider } from "@aws/bedrock-token-generator"
import { fromNodeProviderChain } from "@aws-sdk/credential-providers"

const TTL_MS = 11 * 60 * 60 * 1000
let cached: { token: string; expires: number } | null = null
let provideToken: (() => Promise<string>) | null = null

function initTokenProvider(region: string, profile?: string) {
  console.error("[opencode-bedrock-token] initializing", { region, profile })
  provideToken = getTokenProvider({
    region,
    credentials: fromNodeProviderChain(profile ? { profile } : {}),
  })
  cached = null
}

const freshToken = async () => {
  if (!provideToken) {
    initTokenProvider(
      process.env.AWS_REGION ?? "us-east-1",
      process.env.AWS_PROFILE,
    )
  }
  const now = Date.now()
  if (cached && now < cached.expires) return cached.token
  const token = await provideToken!()
  cached = { token, expires: now + TTL_MS }
  return token
}

export default (async (input) => {
  // Seed auth.json so the auth.loader hook is invoked during provider resolution
  await input.client.auth.set({
    path: { id: "bedrock-openai" },
    body: {
      type: "api",
      key: "bedrock-managed",
    },
  })

  return {
    config: async (cfg: Config) => {
      const opts = (cfg as any).provider?.["bedrock-openai"]?.options ?? {}
      const region = opts.region ?? process.env.AWS_REGION ?? "us-east-1"
      const profile = opts.profile ?? process.env.AWS_PROFILE
      initTokenProvider(region, profile)
    },
    auth: {
      provider: "bedrock-openai",
      methods: [],
      loader: async () => {
        return {
          apiKey: await freshToken(),
        }
      },
    },
    "chat.headers": async (input, output) => {
      if (input.provider?.info?.id === "bedrock-openai") {
        output.headers["Authorization"] = `Bearer ${await freshToken()}`
      }
    },
  }
}) satisfies Plugin
