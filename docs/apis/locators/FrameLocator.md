# FrameLocator

Locates frames and provides frame methods and builders.

## Builders

- `element(selector?)`
- `text(selector?)`

## Examples

```js
const frame = await page.frame({ url: /embedded/ }).get();
await frame.element('input').first().fill('hello');
await frame.text(/submit/i).first().click();
```
