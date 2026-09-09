"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/auth";

export async function loginAction(
  _prevState: { error: string } | undefined,
  formData: FormData
): Promise<{ error: string } | undefined> {
  try {
    const username = String(formData.get("username") ?? "");
    const password = String(formData.get("password") ?? "");
    await signIn("credentials", {
      username,
      password,
      redirectTo: "/",
    });
  } catch (e) {
    if (e instanceof AuthError) {
      return { error: "Username atau password salah" };
    }
    // NEXT_REDIRECT dilempar next-auth saat sukses login — lempar ulang agar redirect jalan
    throw e;
  }
}
