import { Dsl } from "@litmus-ts/test";

import type { AppDriver } from "./driver.ts";

/**
 * The business vocabulary for acceptance tests.
 * Add an area (for example `readonly orders: OrdersDsl`) when a test first needs it.
 */
export class AppDsl extends Dsl<AppDriver> {}
