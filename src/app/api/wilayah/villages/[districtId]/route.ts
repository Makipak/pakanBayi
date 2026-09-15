import { auth } from "@/auth";
import { proxyWilayah } from "@/lib/wilayah-server";

export async function GET(
  _req: Request,
  context: { params: Promise<{ districtId: string }> }
) {
  const session = await auth();
  if (!session) return new Response("Forbidden", { status: 403 });

  const { districtId } = await context.params;
  return proxyWilayah(`villages/${districtId}.json`);
}
