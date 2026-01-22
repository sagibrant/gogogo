# Expect

Assertion helper returned by `expect(actual)`.

## Usage

```js
await expect(2 + 2).toBe(4);
await expect([1, 2]).toEqual([1, 2]);
await expect('hello world').toMatch(/world/);
```

## Methods

- `not`: negates the next assertion
- `toBe(expected)`
- `toEqual(expected)`
- `toBeTruthy()`, `toBeFalsy()`
- `toBeNaN()`
- `toBeNull()`, `toBeUndefined()`, `toBeDefined()`, `toBeNullOrUndefined()`
- `toHaveLength(n)`
- `toContain(value)`
- `toMatch(regexpOrString)`
- `toThrow(expectedErrorMsg?)`

Example (`not`):

```js
await expect(await page.closed()).not.toBeTruthy();
```
