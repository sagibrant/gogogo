# Locator (Base)

The base locator type that supports narrowing matches (`filter`), tie-breaking (`prefer`), and ordinal selection (`first/last/nth`).

## Core Rules

- `get()` resolves **exactly one** match, otherwise it throws (`No X Located` / `Multiple X Located`).
- `filter(...)` adds **mandatory** constraints (hard filters).
- `prefer(...)` adds **assistive** constraints (optional tie-breakers when multiple matches exist).

## Methods

### filter(options?)

Adds mandatory filters that *must* match.

Example (hard filter by attribute):

```js
const loginButton = page
  .element('button')
  .filter({ type: 'attribute', name: 'data-test', value: 'login-button' })
  .get();
```

### prefer(options?)

Adds assistive filters that are used to try to uniquely identify a single match when multiple matches exist.

How `prefer()` behaves:

- If multiple matches exist after `filter(...)`, Mimic tries combinations of `prefer(...)` rules to see if it can narrow to exactly one match.
- If no combination yields exactly one match, Mimic does **not** drop candidates. You still have multiple matches and should use stronger `filter(...)` or an ordinal (`first/last/nth`).

Example (optional tie-breaker):

```js
const button = page
  .element('button')
  .filter({ type: 'property', name: 'disabled', value: false })
  .prefer({ type: 'attribute', name: 'data-primary', value: 'true' })
  .first();

await button.click();
```

### get()

Waits (up to the locator timeout) until there is exactly one match, then returns it.

Example (avoid “Multiple Located”):

```js
const input = await page
  .element('input')
  .filter({ type: 'attribute', name: 'name', value: 'user-name' })
  .get();
```

### count()

Returns the number of matches.

```js
const n = await page.element('button').count();
await expect(n > 0).toBeTruthy();
```

### all()

Returns an array of `nth(i)` locators for all matches.

```js
const items = await page.element('li').all();
for (const item of items) {
  await item.highlight();
}
```

### nth(index)

Returns a locator for a specific match by index (0-based).

```js
await page.element('button').nth(1).click();
```

### first()

Alias for `nth(0)`.

```js
await page.element('button').first().click();
```

### last()

Selects the last match.

```js
await page.element('button').last().click();
```

## Filter Options

`filter()` and `prefer()` accept `LocatorFilterOption`:

- `type`: `'property' | 'attribute' | 'function' | 'text'`
- `name`: the property/attribute/function name (or a well-known virtual key for internals)
- `value`: `string | number | boolean | RegExp`
- `match`: `'has' | 'hasNot' | 'exact' | 'includes' | 'startsWith' | 'endsWith' | 'regex'`

Examples:

```js
page.element().filter({ type: 'attribute', name: 'id', value: 'submit' });
page.element().filter({ type: 'property', name: 'checked', value: true });
page.element().filter({ type: 'attribute', name: 'class', value: /primary/, match: 'regex' });
page.element().filter({ type: 'function', name: 'click', match: 'has' });
page.text().filter({ type: 'text', name: 'nodeType', match: 'has' });
```
