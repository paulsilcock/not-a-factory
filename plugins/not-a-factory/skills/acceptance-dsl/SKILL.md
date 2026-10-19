---
name: acceptance-dsl
description: Add or change words in the acceptance-test DSL - the vocabulary of the problem domain that acceptance test cases are written in. Use when a new acceptance test uses DSL words that do not exist yet, or when test cases repeat setup or detail.
---

# Acceptance-test DSL

## What the DSL is for

The DSL is the vocabulary of the problem domain, shared by all acceptance tests. It lets a test case say **what** happens in the user's words, and hides **how** the system is reached. It makes test cases:
- **easy to write:** the words already exist, and the DSL fills in the details;
- **easy to read:** a test reads like the criterion;
- **easy to keep working:** when the system changes, the test cases do not;
- **isolated:** the DSL gives every test its own data.

## How to write a DSL word

```ts
export class BooksDsl {
  constructor(
    private readonly driver: AppDriver,
    private readonly context: DslContext,
  ) {}

  async isOnShelf({
    title,
    author = "Any Author",
    copies = 3,
  }: {
    title: string;
    author?: string;
    copies?: number;
  }) {
    await this.driver.addBook({
      title: this.context.alias(title),
      author: this.context.alias(author),
      copies,
    });
  }
}
```

- **Defaults for nearly everything.** A test names only what matters to it; the DSL fills in the rest. Precision where a test needs it, nothing more.
- **Alias every name that the system stores,** with `this.context.alias(name)`, in setup, action and check words alike. Each test then has its own books and members, so the tests can share one system and run in any order.
- **Call the driver,** with every value filled in. The DSL itself knows nothing about HTTP, pages or status codes.
- **No state.** The DSL remembers nothing between calls. The driver holds what it needs.

## Word patterns

- **Setup words** describe the world: `isOnShelf`, `hasJoined`.
- **Action words** are the user's verbs: `borrow`, `return`.
- **Check words** start with `confirm`: `confirmBorrowed`, `confirmRefused`.
- **Common setup** that many tests need gets its own word, so tests do not repeat it.

## Where words live

- One area per concept: `api/test-acceptance/dsl/books.ts`, `dsl/members.ts`, `dsl/loans.ts`.
- Register each area in `dsl.ts`:

  ```ts
  export class AppDsl extends Dsl<AppDriver> {
    readonly books = new BooksDsl(this.driver, this.context);
    readonly loans = new LoansDsl(this.driver, this.context);
  }
  ```
- Add a word, or an area, when the first test needs it. Not before.
- Each new word needs a matching driver method: see `acceptance-driver`.
