---
name: implement
description: "Implement a piece of work based on a spec or set of tickets."
disable-model-invocation: true
---

Implement the work described by the user in the spec or tickets.

O tracker é o GitHub deste repositório; leia `docs/agents/issue-tracker.md`. Se o usuário passar uma referência de ticket, busque com `gh issue view <n> --comments` e informe o título antes de começar. Se a referência for ambígua, pergunte.

Call the Skill tool with "tdd" where possible, at pre-agreed seams.

Run typechecking regularly, single test files regularly, and the full test suite once at the end.

Once done, call the Skill tool with "code-review" to review the work.

Commit your work to the current branch.
