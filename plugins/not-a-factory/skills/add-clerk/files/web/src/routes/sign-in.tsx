import { SignIn } from "@clerk/react";
import { createFileRoute } from "@tanstack/react-router";

// Clerk's sign-in form. Where it lives and how it looks are the developer's
// decisions: move it, or style it with the clerk-custom-ui skill.
export const Route = createFileRoute("/sign-in")({ component: SignInPage });

function SignInPage() {
  return (
    <main className="flex min-h-svh items-center justify-center p-8">
      <SignIn routing="hash" />
    </main>
  );
}
