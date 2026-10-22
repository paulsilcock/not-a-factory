# Decision log

`decisions.md` in the project root records what the developer decided, and why. It stops questions being asked twice, and settled questions being reopened.

1. **Record only the developer's decisions:** an answer to a question you asked, or a yes to something you proposed. Never record your own choices; they are not decisions.
2. **What counts:** an agreed business rule or word (`domain-discovery`); scope (what is in, what is deferred); where a feature lives and how it looks; a dependency, outside service, or Docker, CI or `.env` change that the developer approved; a trade-off they chose; an exception to a rule they allowed.
3. **Write the entry as soon as they decide,** before you act on it, and show it in your reply. Keep it to the format below, 3 to 5 lines.
4. **Before you ask the developer anything,** read `decisions.md`. If an entry answers it, follow the entry and say which one.
5. **Never edit or delete an entry.** When the developer changes their mind, add a new entry with `Replaces: #N`, and add `Replaced by #M` to the old one.
6. Not here: test steps (`tdd-log.md`) and tests still to write (`pending-tests.md`).

```
## 3. An amount is pounds, more than 0, exactly 2 decimals (2026-05-04)
Decided: "12.30" is accepted; "12.3", "0.00" and "-5.00" are refused.
Why: claims are paid in pounds and pence, and a claim of nothing is a mistake.
Not chosen: any number of decimals, rounded to pence.
Replaces: none
```
