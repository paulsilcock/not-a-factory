import { BrowserDriver } from "@litmus-ts/test";

import type { AppDriver } from "#acceptance/driver.ts";

/** Drives the app through a real browser (Playwright), as a user would. */
export class BrowserAppDriver extends BrowserDriver implements AppDriver {}
