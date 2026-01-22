# Window

Represents a browser window and provides window management APIs (focus, minimize/maximize/fullscreen, open pages).

## Locators

- `page(selector?)`

## Properties

- `state()`, `focused()`, `incognito()`, `closed()`
- `browser()`, `pages()`, `activePage()`

## Methods

- `openNewPage(url?)`
- `focus()`, `close()`
- `minimize()`, `maximize()`, `restore()`
- `fullscreen(toggle?)`

## Events

- `on('page', listener)`
- `on('close', listener)`

## Examples

### Open a New Window (via Browser) and Operate It

```js
const win = await browser.openNewWindow('https://sagibrant.github.io/mimic/aut/mouse.html');
await expect(await win.focused()).toBeTruthy();

await win.maximize();
await expect(['normal', 'maximized']).toContain(await win.state());

await win.fullscreen(false);
await expect(await win.state()).toBe('fullscreen');

await win.fullscreen();
await expect(await win.state()).toBe('normal');

await win.close();
```
