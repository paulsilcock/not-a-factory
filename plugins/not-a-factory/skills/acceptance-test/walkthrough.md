# Walkthrough: one criterion from RED to GREEN

One way the cycle can go, to show the rhythm. It is not a template: follow the failures, and the order will differ.

Criterion: **"A member can borrow a book that is on the shelf."** Earlier features already let the library add books and members, so those DSL words exist.

## 1. The acceptance test

```ts
it("a member can borrow a book that is on the shelf", async ({ dsl }) => {
  await dsl.books.isOnShelf({ title: "Dune" });
  await dsl.members.hasJoined({ name: "Ada" });

  await dsl.loans.borrow({ member: "Ada", book: "Dune" });

  await dsl.loans.confirmBorrowed({ member: "Ada", book: "Dune" });
});
```

To make it compile: the new DSL words `borrow` and `confirmBorrowed`, the matching driver methods, and stubs in the app for the two routes the driver calls. Each stub is a route plus a use case whose `handle()` only throws.

Run it. It fails with `Borrowing failed: 500`. The behaviour is missing, which is the right reason. **The first missing piece is the `BorrowBook` use case.**

## 2. Drop into the use case

With `tdd-cycle`: the component is `BorrowBook` (a command), and its consumer is the route. Its test list starts with one behaviour.

```ts
describe("borrowing a book", () => {
  setupTestDb({ schema });

  it("records a loan for the member", async () => {
    await container.resolve(BorrowBook).handle({ member: "Ada", book: "Dune" });

    const loans = await container.resolve(LoanRepository).forMember("Ada");
    expect(loans.map((loan) => loan.book)).toEqual(["Dune"]);
  });
});
```

To compile, `LoanRepository` gets a stub. RED: `handle()` throws.

## 3. Missing collaborators

GREEN: what stops it passing? `BorrowBook` has nowhere to record a loan. That collaborator is missing, so drop down again:

- **`LoanRepository`,** with its own `tdd-cycle`, tested against PGlite: "a saved loan can be found by member". Its consumer is `BorrowBook`, so it gets only `add` and `forMember`.
- That test needs something to save: a **`Loan`** domain model. This criterion has no rule yet, so the model is thin. The rules arrive with later criteria, through `model-domain`.

When the repository passes, go back up. `BorrowBook.handle()` creates a `Loan` and adds it. Its test passes. Refactor.

## 4. Back to the acceptance test

Run it again. It now gets further, and fails in `confirmBorrowed`: the driver cannot list Ada's loans. **The next missing piece is the `ListMemberLoans` use case:** a query, with no side effects, that reuses `LoanRepository.forMember`.

Build it with the same cycle, and continue until the acceptance test passes.

## 5. When it passes

Refactor, including the DSL and the driver. Then back to `new-feature`. The next criterion, "a member cannot borrow a book when every copy is out", brings the first real rule, so it starts with `model-domain`.
