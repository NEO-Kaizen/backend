export function loadEnv(): void {
  const required = ['JWT_SECRET']

  for (const key of required) {
    if (!process.env[key]) {
      throw new Error(`Missing required environment variable: ${key}`)
    }
  }
}
