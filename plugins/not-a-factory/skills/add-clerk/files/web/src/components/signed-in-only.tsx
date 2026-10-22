import { useAuth } from "@clerk/react";
import { Navigate, useLocation } from "@tanstack/react-router";
import type { ReactNode } from "react";

// The pages that a person who is not signed in may see.
const publicPaths = ["/sign-in", "/sign-up"];

/**
 * Shows the page only to a signed-in person. Anyone else goes to /sign-in.
 * The API checks again: this only decides what the web app shows.
 */
export function SignedInOnly({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  const { pathname } = useLocation();
  if (publicPaths.includes(pathname)) return children;
  if (!isLoaded) return null;
  if (!isSignedIn) return <Navigate to="/sign-in" />;
  return children;
}
