# Browser

Represents the current browser instance and provides browser-wide methods (cookies, windows/pages, debugger attach).

## Properties

- `name()`
- `version()`
- `majorVersion()`

## Locators

- `window(selector?)`
- `page(selector?)`

## Methods

- `windows()`, `pages()`, `lastFocusedWindow()`, `lastActivePage()`
- `attachDebugger()`, `detachDebugger()`, `setDefaultTimeout(timeout)`
- `cookies(urls?)`, `addCookies(cookies)`, `clearCookies(options?)`
- `openNewWindow(url?)`, `openNewPage(url?)`, `close()`

## Events

- `on('window', listener)`
- `on('page', listener)`

## Examples

### Get Browser Info

```js
console.log(browser.name(), browser.version(), browser.majorVersion());
```

### Cookies

```js
const url = 'https://juejin.cn/';
await browser.clearCookies({ name: /^test_cookie_/ });
await browser.addCookies({ name: 'test_cookie_name', value: 'test_cookie_value', url });
const cookies = await browser.cookies(url);
await expect(cookies.some(c => c.name === 'test_cookie_name')).toBeTruthy();
```

### Open a New Page

```js
const newPage = await browser.openNewPage('https://sagibrant.github.io/mimic/aut/keyboard.html');
await newPage.sync();
```
