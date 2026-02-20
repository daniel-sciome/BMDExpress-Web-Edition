Add or improve comments on recently changed or specified code.

## What to comment

Comments explain **why**, not **what**. The code says what it does. A comment should exist when:
- The reason for a design choice isn't obvious
- A workaround or non-obvious constraint is in play
- A function's purpose isn't clear from its name and signature alone
- A block of code handles an edge case that a reader might not expect

Do not comment self-evident code. `// increment counter` above `counter++` adds nothing.

## Format

Use JSDoc `/** */` for:
- File-level headers (brief purpose, not a novel)
- Exported functions, classes, interfaces, and type aliases
- React component props interfaces
- Redux slice descriptions

Use inline `//` for:
- Why-comments inside function bodies
- Edge case explanations
- Workaround annotations

## Java

Use Javadoc `/** */` for public classes, methods, and fields that aren't self-documenting. Use `@param`, `@return`, `@throws` only when the name alone is ambiguous.

## Behavior

If the user points at specific files or a recent diff:
1. Read the code
2. Identify places where intent is unclear, a workaround exists, or a design choice deserves explanation
3. Add JSDoc/Javadoc headers where missing on exports and public APIs
4. Add inline why-comments where the logic isn't self-evident
5. Do not add comments to trivial getters/setters, obvious variable declarations, or standard boilerplate

If the user asks for an audit:
1. Look at recently modified files (`git diff --name-only HEAD~5`) or files the user specifies
2. Flag functions and blocks that would benefit from a why-comment
3. Suggest or apply the comments

Keep comments concise. One line is better than three.
