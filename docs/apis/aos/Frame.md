# Frame

Represents a document frame. Provides DOM querying and script execution within the frame context.

## Properties

- `url()`, `content()`
- `status()`: `'BeforeNavigate' | 'Committed' | 'DOMContentLoaded' | 'Completed' | 'ErrorOccurred' | 'Removed'`
- `readyState()`: `'loading' | 'interactive' | 'complete'`
- `page()`, `parentFrame()`, `childFrames()`, `ownerElement()`

## Locators

- `element(selector?)`
- `text(selector?)`

## Methods

- `sync(timeout?)`
- `querySelectorAll(selector)`
- `executeScript(func, args?)`

## Examples

```js
await page.navigate('https://sagibrant.github.io/mimic/aut/index.html');
await page.sync();

const mainFrame = await page.mainFrame();
await expect(mainFrame).not.toBeNullOrUndefined();

await mainFrame.sync();
const divs = await mainFrame.querySelectorAll('div');
await expect(divs.length >= 0).toBeTruthy();

const result = await mainFrame.executeScript((a, b) => a + b, [1, 2]);
await expect(result).toBe(3);
```
