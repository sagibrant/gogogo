# PageLocator

Locates pages (tabs) and provides page methods and builders.

## Builders

- `frame(selector?)`
- `element(selector?)`
- `text(selector?)`

## Examples

### Get Active Page (Last Focused Window)

```js
const page = await browser.page({ active: true, lastFocusedWindow: true }).get();
await page.bringToFront();
```

### Locate an Element (CSS)

```js
await page.element('#submit-btn').click();
```

### Locate Text

```js
await page.text(/Welcome/i).first().highlight();
```

### Locate an Iframe Then Click Inside It

```js
const frame = await page.frame({ url: /example-frame/ }).get();
await frame.element('button').first().click();
```
