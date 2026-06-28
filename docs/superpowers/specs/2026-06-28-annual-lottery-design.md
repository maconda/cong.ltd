# Annual Lottery Tool Design

## Goal

Add a year-end party lottery tool to `tools.html`. The tool builds an employee pool from manual text or Excel rows, builds a prize pool from manual text or Excel rows, and performs staged, fully random drawing without duplicate winners.

## Data Model

Employees contain:

- `name`: required display name.
- `department`: optional department.

Prizes contain:

- `level`: required award level, such as `一等奖`.
- `gift`: required gift name.
- `quantity`: required positive integer winner count for that prize row.

Manual input accepts one record per line. Employee lines use `姓名,部门` or tab-separated values. Prize lines use `奖项,礼品,数量` or tab-separated values.

Excel import accepts `.xlsx` and `.xls` files through SheetJS in the browser. Header names are matched by logical aliases:

- Employee name: `姓名`, `员工`, `name`
- Department: `部门`, `department`, `dept`
- Prize level: `奖项`, `等级`, `level`
- Gift: `礼品`, `奖品`, `gift`, `prize`
- Quantity: `数量`, `名额`, `count`, `quantity`

If a file has no recognized headers, the parser falls back to column order.

## User Experience

The tool appears as item `03` on the existing small tools page and uses the current card, input, button, and result styling. It has four areas:

- Employee pool: manual textarea, Excel upload, loaded count, and preview.
- Prize pool: manual textarea, Excel upload, loaded prize count, total winner count, and preview.
- Live stage: current award selector, rolling candidate display, progress bar, remaining employee count, and pending round count.
- Drawing results: actions for draw and reset, status messages, and completed results grouped by award level.

The draw button is disabled by validation only through messaging, not by hiding controls. Empty pools, invalid prize quantities, or insufficient employees show clear inline status text.

## Randomness

The draw engine uses `crypto.getRandomValues` when available to generate random indexes. It falls back to `Math.random` only if browser crypto is unavailable. Winners are removed from the available employee pool after each prize round, so a person can win at most once per event.

## Architecture

Create `assets/js/annual-lottery.js` for parsing, validation, random selection, staged session management, and browser UI initialization. The file exposes pure functions for Node tests and attaches an initializer to `window` for browser use. Keep `assets/js/script.js` focused on existing site behavior and call the lottery initializer on page load.

Use CDN SheetJS only for Excel parsing in the browser. The core lottery logic must not depend on SheetJS so it can be tested without browser APIs.

## Error Handling

- Missing employee names are ignored during parsing.
- Missing prize level or gift is ignored.
- Non-positive prize quantities are ignored.
- Duplicate employees with the same `name + department` are deduplicated.
- If a selected prize round requires more people than remain in the employee pool, drawing stops before mutation and reports the shortage.
- Excel parsing failures show an inline status message and preserve the current manual data.
- Any data change resets the staged event session so results cannot mix old and new pools.

## Testing

Add Node tests for:

- Employee manual parsing and deduplication.
- Prize manual parsing and quantity normalization.
- Header-based row parsing with Chinese headers.
- Drawing exact winner counts without duplicate employees.
- Drawing selected prize rounds, removing winners from the remaining pool, and moving completed rounds into history.
- Rejecting a draw when prize quantities exceed employee count.

Tests run with Node's built-in test runner and do not require npm dependencies.
