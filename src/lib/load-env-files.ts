import { readFileSync, existsSync } from "node:fs"
import { resolve } from "node:path"

/**
 * Load `.env` / `.env.local` for standalone CLIs (drizzle-kit, seed).
 * Values in later files override earlier ones and always override `process.env`
 * so a stale shell DATABASE_URL does not win over `.env.local`.
 */
export function loadEnvFiles(cwd = process.cwd()): void {
  for (const name of [".env", ".env.local"]) {
    const path = resolve(cwd, name)
    if (!existsSync(path)) continue
    const text = readFileSync(path, "utf8")
    for (const line of text.split(/\r?\n/)) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith("#")) continue
      const eq = trimmed.indexOf("=")
      if (eq < 1) continue
      const key = trimmed.slice(0, eq).trim()
      let value = trimmed.slice(eq + 1).trim()
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1)
      }
      process.env[key] = value
    }
  }
}
