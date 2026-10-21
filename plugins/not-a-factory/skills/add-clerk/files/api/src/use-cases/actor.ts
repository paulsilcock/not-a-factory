/**
 * Who is using the system: the signed-in person, as the use cases see them.
 * The id is the identity provider's id for the person. Our own data about
 * the person (name, roles) is stored against it.
 */
export interface Actor {
  id: string;
}
