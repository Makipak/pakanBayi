"use client";

import { useActionState } from "react";
import { loginAction } from "@/actions/auth.actions";
import { Button, FieldError, Input, Label } from "@/components/ui";

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <Label htmlFor="username">Username</Label>
        <Input id="username" name="username" autoComplete="username" required autoFocus />
      </div>
      <div>
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </div>
      <FieldError>{state?.error}</FieldError>
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Masuk..." : "Masuk"}
      </Button>
    </form>
  );
}
