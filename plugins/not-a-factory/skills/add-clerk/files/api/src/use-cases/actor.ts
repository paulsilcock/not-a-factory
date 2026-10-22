/**
 * Who is using the system: the signed-in person, as the use cases see them.
 * The id is the identity provider's id for the person. Our own data about
 * the person is stored against it.
 */
export interface Actor {
  id: string;
  metadata: ActorMetadata;
}

/**
 * What the identity provider keeps about the person for us (Clerk's public
 * metadata), checked when the request arrives. It starts empty. Add a field
 * here and in `infra/auth/actor-metadata.ts`, for example
 * `role: "staff" | "manager"`.
 */
export type ActorMetadata = Record<string, never>;
