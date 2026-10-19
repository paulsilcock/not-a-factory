# Walkthrough: one criterion from RED to GREEN

One way the cycle can go, to show the rhythm. It is not a template: follow the failures, and the order will differ.

Criterion: **"A member who has three books out cannot borrow a fourth."** The app has a browser UI, so the tests use the browser driver. Earlier features let the library add books and members, so those DSL words exist.

## 1. The acceptance test

```ts
it("a member who has three books out cannot borrow a fourth", async ({ dsl }) => {
  await dsl.members.hasJoined({ name: "Ada" });
  await dsl.loans.hasBorrowed({ member: "Ada", books: ["Dune", "Emma", "Ulysses"] });
  await dsl.books.isOnShelf({ title: "Beloved" });

  await dsl.loans.borrow({ member: "Ada", book: "Beloved" });

  await dsl.loans.confirmRefused({ reason: "too many books" });
});
```

To make it compile, add the new DSL words. `hasBorrowed` is a setup word built on `borrow`. Then add the driver methods as stubs that throw, because there is no page to drive yet. Run it. It fails in the driver: the borrowing UI is missing.

## 2. Just enough UI, and the driver

The first missing piece is a way for the user to borrow. Build only what the driver needs: a page with "Member" and "Book" fields and a "Borrow" button. It shows a refusal in an alert, and posts to an API route that is a stub (the route, and a use case whose `handle()` only throws). Then implement the driver against the page, with stable locators:

```ts
async borrow({ member, book }: { member: string; book: string }) {
  await this.page.goto("/loans/new");
  await this.page.getByLabel("Member").fill(member);
  await this.page.getByLabel("Book").fill(book);
  await this.page.getByRole("button", { name: "Borrow" }).click();
}
```

Run it. It now fails further in: the API answers with an error, because nothing handles the borrowing.

## 3. The missing use case

From the user's side, borrowing a book is one way the system is used: a member and a book go in, and the loan is recorded or refused. That is a use case, `BorrowBook`, and it is the next missing piece. With `tdd-cycle`, its consumer is the route, and its first test is the behaviour the acceptance test needs:

```ts
it("refuses a member who already has three books", async () => {
  // Ada has three books out
  await expect(borrowBook.handle({ member: "Ada", book: "Beloved" })).rejects.toThrow(TooManyBooks);
});
```

RED: `handle()` throws a plain error.

This test needs one use case, but many acceptance tests need more than one. Each step that the user takes can be a different way of using the system. For example, in a bookshop, "a customer can buy a book they found" can need three use cases: `SearchBooks` (a query), `AddToBasket` and `CheckOut` (commands). Build them one at a time, in the order that the failures show them. The setup words also use the system: here, `hasBorrowed` goes through `BorrowBook` too.

## 4. Its collaborators, domain first

GREEN: what stops it passing? `BorrowBook` must **decide** whether Ada may borrow. That decision is a business rule, so it belongs in the domain, not in the use case. Drop down:

- **Understand the domain first, if needed.** The `model-domain` skill helps the developer explore the rule: who keeps it, which words the business uses, and which examples show it. It is not a required step. Use it when the words or the rule are new or not clear.
- **`Member`** (domain model), with its own `tdd-cycle`. The examples from `model-domain` become its tests: "a member with two books can borrow a third", "a member with three books is refused". `member.borrow(book)` keeps the rule, and throws `TooManyBooks`.
- **`MemberRepository`**, because the use case must load Ada's loans and save the change. It offers only what `BorrowBook` needs.

Back up. `BorrowBook` is now a dumb orchestrator:

```ts
async handle({ member, book }: BorrowBookCommand) {
  const borrower = await this.members.findByName(member);
  borrower.borrow(book);
  await this.members.update(borrower);
}
```

Its tests pass. Refactor.

## 5. Back to the acceptance test

Run it again. Map `TooManyBooks` to an HTTP status in `main.ts`, so that the page can show the refusal. Continue the same way, one missing piece at a time, until the acceptance test passes.

## 6. When it passes

Refactor, including the DSL, the driver and the page. Then go back to `new-feature` for the next criterion.
