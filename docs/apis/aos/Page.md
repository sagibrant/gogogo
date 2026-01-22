# Page

Represents a tab/page. Provides navigation, readiness (`sync`), DOM querying, input devices, and events.

## Properties

- `url()`, `title()`, `content()`
- `status()`: `'unloaded' | 'loading' | 'complete'`
- `active()`, `closed()`
- `window()`, `mainFrame()`, `frames()`
- `mouse()`, `keyboard()`, `dialog()`

## Locators

- `frame(selector?)`
- `element(selector?)`
- `text(selector?)`

## Methods

- `activate()`, `bringToFront()`, `sync(timeout?)`
- `openNewPage(url?)`
- `navigate(url?)`, `refresh(bypassCache?)`, `back()`, `forward()`
- `zoom(zoomFactor)`, `moveToWindow(window, index?)`, `close()`
- `captureScreenshot()`
- `querySelectorAll(selector)`
- `executeScript(func, args?)`

## Events

- `on('dialog' | 'domcontentloaded' | 'close', listener)`
- `off(event, listener)`

## Examples

### Navigate + Sync

```js
await page.navigate('https://sagibrant.github.io/mimic/aut/mouse.html');
await page.sync();
await expect(await page.status()).toBe('complete');
```

### History Navigation (Requires CDP)

```js
await browser.attachDebugger();
await page.navigate('https://sagibrant.github.io/mimic/aut/keyboard.html');
await page.sync();

await page.navigate('https://sagibrant.github.io/mimic/aut/mouse.html');
await page.sync();

await page.back();
await page.sync();

await page.forward();
await page.sync();

await browser.detachDebugger();
```

### Query Elements

```js
await page.sync();
const divs = await page.querySelectorAll('div');
await expect(divs.length > 0).toBeTruthy();
```

### Execute Script (Sync and Async)

```js
const result = await page.executeScript((a, b) => ({ sum: a + b }), [1, 2]);
await expect(result).toEqual({ sum: 3 });

const asyncResult = await page.executeScript(async () => Promise.resolve({ ok: true }));
await expect(asyncResult).toEqual({ ok: true });
```

### Dialog Handling

```js
await browser.attachDebugger();

const onDialog = async (dialog) => {
  await expect(await dialog.opened()).toBeTruthy();
  await dialog.accept();
  page.off('dialog', onDialog);
};

page.on('dialog', onDialog);
await page.element('#alert_button').click({ mode: 'cdp' });
```
