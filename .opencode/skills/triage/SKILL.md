---
name: triage
description: Move issues through a state machine of triage roles, categorise, verify, grill if needed, and write agent-ready briefs on GitHub.
disable-model-invocation: true
---

Output language: Portuguese.

# Triage

Move issues no GitHub de `NEO-Kaizen/backend` through a small state machine of triage roles.

Este repositório **não** trata PRs externos como canal de solicitações (veja `docs/agents/issue-tracker.md`). A triagem cobre apenas issues.

Every comment posted to an issue during triage **must** start with this disclaimer:

```
> *Este comentário foi gerado por IA durante a triagem.*
```

## Reference docs

- [AGENT-BRIEF.md](AGENT-BRIEF.md): how to write durable agent briefs
- [OUT-OF-SCOPE.md](OUT-OF-SCOPE.md): how the `.out-of-scope/` knowledge base works
- `docs/agents/issue-tracker.md`: GitHub operations
- `docs/agents/triage-labels.md`: mapping from the five canonical roles to this repo's labels

## Roles

Two **category** roles (labels que já existem no repositório):

- `bug`: something is broken
- `enhancement`: new feature or improvement

Five **state** roles:

| Papel canônico    | Representação neste repositório                            |
| ----------------- | ---------------------------------------------------------- |
| `needs-triage`    | Issue aberta sem label de estado e sem nota de triagem     |
| `needs-info`      | Issue aberta com uma nota de triagem e sem label de estado |
| `ready-for-agent` | Label `pronto-para-agente`                                 |
| `ready-for-human` | Label `pronto-para-humano`                                 |
| `wontfix`         | Issue fechada com comentário de justificativa              |

Cada issue triada deve ter exatamente um label de categoria (`bug` ou `enhancement`) e uma representação de estado conforme a tabela. Se houver os dois labels de estado ao mesmo tempo, sinalize e pergunte ao mantenedor antes de agir.

State transitions: uma issue sem estado normalmente vai para `needs-triage`; de lá para `needs-info`, `pronto-para-agente`, `pronto-para-humano` ou fechada (`wontfix`). `needs-info` volta para `needs-triage` quando o relator responde. O mantenedor pode sobrepor a qualquer momento; sinalize transições incomuns e pergunte antes de prosseguir.

## Invocation

The maintainer invokes `/triage` and describes what they want in natural language. Interpret the request and act. Examples:

- "Show me anything that needs my attention"
- "Let's look at #42"
- "Move #42 to pronto-para-agente"
- "What's ready for agents to pick up?"

## Show what needs attention

Query o GitHub e apresente três buckets, mais antigos primeiro:

1. **`needs-triage`**: issues abertas sem label de estado e sem nota de triagem.
2. **`needs-info`**: issues abertas com uma nota de triagem (`## Notas de triagem`) e sem label de estado.
3. **`pronto-para-agente` / `pronto-para-humano`**: issues já classificadas.

Use `gh issue list --state open --json number,title,labels,comments,updatedAt --jq ...` para montar os buckets. O label de categoria (`bug`/`enhancement`) não conta como estado.

Show counts and a one-line summary per item. Let the maintainer pick.

## Triage a specific issue

1. **Gather context.** Read the full issue (body, comments, labels, author, dates). Parse any prior triage notes so you don't re-ask resolved questions. Explore the codebase using the project's domain glossary, respecting ADRs in the area. Run two checks against the codebase: (a) **redundancy**: search for an existing implementation of the requested behavior by domain concept (not just the request's wording), and report where you looked. If found, it's an already-implemented `wontfix` (step 5). (b) **prior rejection**: read `.out-of-scope/*.md` and surface any that resembles this request.

2. **Recommend.** Tell the maintainer your category and state recommendation with reasoning, plus a brief codebase summary relevant to the request (including whether it's already implemented). Wait for direction.

3. **Verify the claim.** Before any grilling, check that the claim holds up. For a bug, reproduce it from the reporter's steps. Report what happened: confirmed (with code path), failed, or insufficient detail (a strong `needs-info` signal). A confirmed verification makes a much stronger agent brief.

4. **Grill (if needed).** If the request needs fleshing out, call the Skill tool twice, for "grilling" and "domain-modeling", and grill it into shape a round of questions at a time, sharpening domain terms and updating `GLOSSARY.md`/ADRs inline as decisions land.

5. **Apply the outcome:**
   - `ready-for-agent`: post an agent brief comment ([AGENT-BRIEF.md](AGENT-BRIEF.md)) and add `pronto-para-agente`; remove `pronto-para-humano` if present.
   - `ready-for-human`: same structure as an agent brief, but note why it can't be delegated (judgment calls, external access, design decisions, manual testing), and add `pronto-para-humano`; remove `pronto-para-agente` if present.
   - `needs-info`: post triage notes (template below) and **do not add a state label**.
   - For `wontfix`, close the issue with a justification comment. Do **not** apply a triage state label.
     - **Already implemented**: point to where the behavior already lives in the codebase; do **not** write to `.out-of-scope/`.
     - **Rejected (bug)**: give a polite explanation, then close.
     - **Rejected (enhancement)**: write to `.out-of-scope/`, link to it from a comment, then close ([OUT-OF-SCOPE.md](OUT-OF-SCOPE.md)).
   - `needs-triage`: remove `pronto-para-agente`/`pronto-para-humano` if present. Optional comment if there's partial progress.

## Quick state override

If the maintainer says "move #42 to pronto-para-agente", trust them and apply the label directly, removing the other state label. Confirm what you're about to do, then act. Skip grilling. If moving to `pronto-para-agente` without a grilling session, ask whether they want to write an agent brief.

## Needs-info template

```markdown
> _Este comentário foi gerado por IA durante a triagem._

## Notas de triagem

**O que já estabelecemos:**

- ponto 1
- ponto 2

**O que ainda precisamos de você (@reporter):**

- pergunta 1
- pergunta 2
```

Capture everything resolved during grilling under "O que já estabelecemos" so the work isn't lost. Questions must be specific and actionable, not "please provide more info".

## Resuming a previous session

If prior triage notes exist on the issue, read them, check whether the reporter has answered any outstanding questions, and present an updated picture before continuing. Don't re-ask resolved questions.
