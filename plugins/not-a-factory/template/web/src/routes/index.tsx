import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { api } from "@/lib/api";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const health = useQuery({
    queryKey: ["health"],
    queryFn: async () => (await api.health.$get()).json(),
  });

  return (
    <main className="p-8">
      <h1 className="text-4xl font-bold">{{APP_NAME}}</h1>
      <p className="mt-4 text-muted-foreground">
        API: {health.data?.status ?? (health.isError ? "down" : "…")}
      </p>
    </main>
  );
}
