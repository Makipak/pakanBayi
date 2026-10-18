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
    // Checkbox HTML: ada di FormData ("on") kalau dicentang, tidak ada sama sekali kalau tidak.
    const remember = formData.get("remember") === "on";
    await signIn("credentials", {
      username,
      password,
      remember: remember ? "true" : "false",
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
