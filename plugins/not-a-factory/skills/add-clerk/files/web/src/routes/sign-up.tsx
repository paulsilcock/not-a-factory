import { SignUp } from "@clerk/react";
import { createFileRoute } from "@tanstack/react-router";

// Clerk's sign-up form. Where it lives and how it looks are the developer's
// decisions: move it, or style it with the clerk-custom-ui skill.
export const Route = createFileRoute("/sign-up")({ component: SignUpPage });

function SignUpPage() {
  return (
    <main className="flex min-h-svh items-center justify-center p-8">
      <SignUp routing="hash" />
    </main>
  );
}
