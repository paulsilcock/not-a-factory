---
name: decision-review
description: List the choices in the code that the developer did not decide - choices made by the agent that are not in decisions.md. Use when the developer asks what was decided without them, before they explain or review the work, or at the end of a session. Reads only; changes no code.
---

# Decision review

The developer must be able to explain every choice in the code. `decisions.md` holds what they decided. This skill finds the rest.

1. **Ask which commit to start from,** unless the developer said. Default: the first commit of the current branch.
2. **Read `decisions.md`** and `git diff <commit>`.
3. **List each choice in the diff that no entry covers.** Look for:
   - business rules, limits and words: a validation, a status, an error name;
   - names the developer will say aloud: aggregates, use cases, routes, pages;
   - shapes: a table and its columns, an API's input and output, a value object's form;
   - new dependencies or outside services, and how they are used;
   - a rule bent: a `biome-ignore`, a skipped test, an exception in a comment.
4. **For each one, write one line:** the choice, `file:line`, and the question to ask the developer, for example "`Claim` refuses amounts over £10,000 (`api/src/domain/claim.ts:31`). Is that a rule?".
5. **Put the most important first:** business rules, then what users see, then the design.
6. **Change nothing.** Do not write entries in `decisions.md`: only the developer decides. Offer to record each one they agree.

If nothing is missing, say so in one line.
