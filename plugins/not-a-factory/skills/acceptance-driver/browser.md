# Browser driver

A flaky browser driver makes people give up on ATDD. These rules keep it stable.

```ts
import { BrowserDriver } from "@litmus-ts/test";

export class BrowserAppDriver extends BrowserDriver implements AppDriver {
  async borrow({ member, book }: { member: string; book: string }) {
    await this.page.goto("/loans/new");
    await this.page.getByLabel("Member").fill(member);
    await this.page.getByLabel("Book").fill(book);
    await this.page.getByRole("button", { name: "Borrow" }).click();
  }

  async confirmRefused({ reason }: { reason: "no copy available" }) {
    const message = this.page.getByRole("alert").filter({ hasText: messages[reason] });
    await message.waitFor().catch(() => {
      throw new Error(`Expected the message "${messages[reason]}" on the page`);
    });
  }
}
```

## Finding elements

Find elements the way a user does, in this order:

1. `getByRole` with the accessible name: `getByRole("button", { name: "Borrow" })`.
2. `getByLabel` for form fields.
3. `getByText` for content.
4. `getByTestId` only as a last resort.

Never use CSS classes, XPath or element positions. Tailwind and shadcn class names change all the time.

Stable selectors come from accessible markup: real buttons, labels and headings, which also help users. If the driver cannot find something by role or label, fix the UI, not the selector.

## Waiting

- Wait for what the user would see. Playwright's locators wait by themselves (`click`, `fill`, `waitFor`).
- Never use a fixed wait or sleep (Farley).
- When a test fails, debug it with Playwright traces and screenshots, not by adding waits.

## Structure and setup

- Each test gets its own browser context; `BrowserDriver` does this.
- Group methods by page or area once the driver grows.
- A project created by not-a-factory already has Playwright and Chromium, and a `BrowserAppDriver` in `acceptance-tests/driver/browser.ts`. In other projects: Playwright is a peer dependency of `@litmus-ts/test`; add `playwright` to the acceptance tests' dev dependencies, and install the browser with `playwright install chromium`.
