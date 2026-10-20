import { Dsl } from "@litmus-ts/test";

import type { AppDriver } from "./driver.ts";

/**
 * The business vocabulary for acceptance tests.
 * Rename it after the problem domain (for example `PizzaDeliveryDsl`), and add
 * words here when a test first needs them. Split off areas when it grows.
 */
export class AppDsl extends Dsl<AppDriver> {}
