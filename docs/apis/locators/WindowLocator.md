# WindowLocator

Locates browser windows and provides window methods and builders.

## Builders

- `page(selector?)`

## Examples

### Get Last Focused Window

```js
const win = await browser.window({ lastFocused: true }).get();
await win.focus();
```

### Find Active Page Within a Window

```js
const win = await browser.window({ lastFocused: true }).get();
const activePage = await win.page({ active: true }).get();
await activePage.bringToFront();
```
