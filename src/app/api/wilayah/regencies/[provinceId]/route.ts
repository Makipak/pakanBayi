import { auth } from "@/auth";
import { proxyWilayah } from "@/lib/wilayah-server";

export async function GET(
  _req: Request,
  context: { params: Promise<{ provinceId: string }> }
) {
  const session = await auth();
  if (!session) return new Response("Forbidden", { status: 403 });

  const { provinceId } = await context.params;
  return proxyWilayah(`regencies/${provinceId}.json`);
}
