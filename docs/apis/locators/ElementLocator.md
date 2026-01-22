# ElementLocator

Locates elements and provides the full Element API plus scoped builder methods.

## Builders

- `element(selector?)`
- `text(selector?)`

## Shadow DOM Targeting (Important)

When elements live inside shadow DOM (including **closed** shadow roots), CSS selectors can be unreliable. Prefer this pattern:

- Start broad: `page.element()` or `frame.element()` or `element.element()`
- Narrow with `filter(...)` (attribute/property/text/function)
- Use `first()/nth()/get()` to pick a single target

Example (attribute filtering works across shadow DOM):

```js
const shadowButton = await page
  .element()
  .filter({ type: 'attribute', name: 'data-test', value: 'shadow-submit' })
  .get();

await shadowButton.click();
```

Example (combine `filter` + `prefer` to avoid “Multiple Located”):

```js
await page
  .element('button')
  .filter({ type: 'property', name: 'disabled', value: false })
  .prefer({ type: 'attribute', name: 'aria-label', value: /submit/i, match: 'regex' })
  .get()
  .then(btn => btn.click());
```
