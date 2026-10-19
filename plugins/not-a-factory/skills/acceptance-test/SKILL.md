---
name: acceptance-test
description: Write one acceptance test and make it pass with ATDD (Dave Farley) - an executable specification of one acceptance criterion, written before the code, from the user's point of view. Use when new-feature picks an acceptance criterion, or when an acceptance test fails. For the DSL use acceptance-dsl; for drivers use acceptance-driver.
---

# Acceptance test (ATDD)

> The paths below are for a project created by `not-a-factory`. In any other project, use its own layout. The cycle stays the same.

## What it is, and why

An acceptance test is an **executable specification** of one acceptance criterion: an automated definition of done. It says what the system must do for a user, in the user's words, and it is written **before** the code.

- **It ring-fences what is built.** The work is done when the test passes, and nothing outside the criterion gets built.
- **It guides the work.** Each failure names the next missing piece.
- **It protects the behaviour.** It keeps checking the criterion after every later change.
- **It catches building the wrong thing,** not only building it wrong. Together with TDD, Farley reports defects falling by "often two orders of magnitude".

A good acceptance test says **what, not how**, in the **language of the problem domain**. It is **isolated** from other tests, it is **repeatable**, and it reaches the system **only through its public interfaces**, with the app deployed like production.

One test per acceptance criterion. A test may have several `confirm...` steps when together they check that one criterion.

**Would the test pass if the system did nothing?** A confirmation message alone often proves nothing. Confirm the outcome the user relies on, through the public interface ("the order appears in my orders"). If no interface shows it yet, say so, and add the missing view to the criteria list for the developer to decide.

## The four layers

```
test case     what the user does, and what must then be true
DSL           the words of the problem domain        → acceptance-dsl skill
driver        how the system is reached (HTTP, UI)   → acceptance-driver skill
system        the app, deployed like production (Docker)
```

Each layer calls only the layer below it.

## The ATDD cycle

1. **Write the test case first.** Write it as if the DSL already has every word you need. Invent the words from the criterion, and do not think about the implementation.
2. **Make it compile without building the feature.** Add the new DSL words (`acceptance-dsl`) and the driver methods (`acceptance-driver`). Where the app does not offer what the driver calls, add a stub that only throws.
3. **Run it and read the failure.** `pnpm test:acceptance`. It must fail **because the behaviour is missing**, not because of a type error, a broken setup or a typo. Say in one sentence why it fails, and what the first missing piece is.
4. **Make it pass from the inside,** one missing piece at a time, with `tdd-cycle`. Run the acceptance test again after each piece. Do not change the test to make it pass; if the criterion turns out to be wrong, ask the developer.
5. **Refactor,** including the DSL and the driver.
6. **Go back to `new-feature`** for the next criterion.

To see the whole rhythm once, from the acceptance test down through use cases and their collaborators and back up, read `walkthrough.md` in this skill's folder.

## Writing the test case

Check it two ways:
- Could **the least technical person who knows the business** read it, and agree that it is right?
- Would it still make sense if the system were replaced by something completely different with the same purpose, for example **a person at a desk**? If not, it says how, not what.

```ts
it("a member cannot borrow a book when every copy is out", async ({ dsl }) => {
  await dsl.books.isOnShelf({ title: "Dune", copies: 1 });
  await dsl.members.hasJoined({ name: "Ada" });
  await dsl.members.hasJoined({ name: "Grace" });
  await dsl.loans.borrow({ member: "Ada", book: "Dune" });

  await dsl.loans.borrow({ member: "Grace", book: "Dune" });

  await dsl.loans.confirmRefused({ reason: "no copy available" });
});
```

| Bad (how) | Good (what) |
|---|---|
| `dsl.fillIn("title", "Dune")`, `dsl.click("Add")` | `dsl.books.isOnShelf({ title: "Dune" })` |
| `dsl.post("/loans", { memberId: 4 })` | `dsl.loans.borrow({ member: "Ada", book: "Dune" })` |
| `dsl.loans.confirmStatus(409)` | `dsl.loans.confirmRefused({ reason: "no copy available" })` |

Set up the world, then act, then confirm, with a blank line between. Only the details that matter to this criterion appear in the test.

Sources: Dave Farley, [Acceptance Testing for Continuous Delivery](https://edinburgh.bcs.org/events/2015/acceptance_testing_for_continuous_delivery.pdf) (slides) and [ATDD how-to guide](https://continuous-delivery.co.uk/downloads/ATDD%20Guide%2026-03-21.pdf).
