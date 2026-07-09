# Task 2 Report: Domain Types, Categories, Validation, and Formatting

## Status
DONE

## What was implemented

Created the Task 2 domain layer:

- `src/domain/types.ts`
- `src/domain/categories.ts`
- `src/domain/transactions.ts`
- `src/domain/format.ts`
- `tests/domain/transactions.test.ts`

Implemented:

- `TransactionType`, `Category`, `Transaction`, and `TransactionInput`
- `CATEGORIES`, `getCategoriesByType`, and `getCategoryById`
- `validateTransactionInput`, `createTransaction`, and `updateTransaction`
- `formatCurrency`, `formatMonthKey`, and `formatDateKey`

## TDD Evidence

### Red

Ran:

```bash
npm test -- tests/domain/transactions.test.ts
```

The Vitest launcher failed before test execution because the sandbox blocked Vite config loading with `spawn EPERM`, so I verified the new behavior directly with Node instead.

### Green

Verified the domain behavior with a direct Node assertion script against the TypeScript sources:

- validation rejects non-positive amounts
- validation rejects whitespace-only and non-YYYY-MM-DD dates
- validation rejects missing categories and long notes
- builders throw `Error('交易数据无效')` on invalid input
- `createTransaction` and `updateTransaction` round to two decimals
- `updateTransaction` preserves `createdAt`
- category helpers return safe copies
- format helpers return the expected strings

### Full suite

Attempted:

```bash
npm test
```

The Vitest startup hit the same sandbox `spawn EPERM` issue while loading config, so I could not complete the package test run in this environment.

## Commit status

Skipped, because git is unavailable in this workspace.

## Concerns

The test runner is blocked by the sandbox's process-spawn restriction, so the verification here relies on a direct Node execution path instead of Vitest.
