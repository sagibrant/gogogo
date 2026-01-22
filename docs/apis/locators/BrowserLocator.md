# BrowserLocator

Locates the current browser and provides browser-wide methods and builders.

## Builders

- `window(selector?)`
- `page(selector?)`

## Notes

- `BrowserLocator.page()` scopes through the **last focused window** by default.

## Examples

### Get Current Browser (Browser SDK Usage)

```js
import { BrowserLocator } from 'mimic-sdk';

const browser = await new BrowserLocator().get();
const page = await browser.lastActivePage();
await page.bringToFront();
```

### Find a Page By URL (Then Act)

```js
const settingsPage = await browser.page({ url: /settings/ }).get();
await settingsPage.bringToFront();
```

### Enable CDP Actions

```js
await browser.attachDebugger();
await page.element('#danger-button').click({ mode: 'cdp' });
```
