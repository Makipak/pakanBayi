import { LoginForm } from "@/components/LoginForm";
import { Card } from "@/components/ui";

export default function LoginPage() {
  return (
    <main className="flex min-h-svh items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <h1 className="text-xl font-semibold text-slate-900">NUTRIMO</h1>
          <p className="mt-1 text-sm text-slate-500">
            Nuget Nutrition Monitoring — studi intervensi nugget zinc, 28 hari
          </p>
        </div>
        <Card>
          <LoginForm />
        </Card>
        <p className="mt-4 text-center text-xs text-slate-400">
          Akun dibuat oleh SPV Kader. Hubungi peneliti jika lupa password.
        </p>
      </div>
    </main>
  );
}
