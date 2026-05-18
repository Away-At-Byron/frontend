// Liveness — process is up. Used by Uptime Kuma + Dokploy (vps-services.md).
export const dynamic = "force-dynamic"

export function GET() {
  return Response.json({ ok: true, service: "aab-pms", ts: new Date().toISOString() })
}
