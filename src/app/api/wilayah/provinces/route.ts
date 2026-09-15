import { auth } from "@/auth";
import { proxyWilayah } from "@/lib/wilayah-server";

export async function GET() {
  const session = await auth();
  if (!session) return new Response("Forbidden", { status: 403 });

  return proxyWilayah("provinces.json");
}
