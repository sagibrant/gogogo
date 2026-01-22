# Dialog

Represents the most recent dialog on a page (`alert/confirm/prompt/beforeunload`).

## Methods

- `page()`
- `opened()`
- `type()`
- `defaultValue()`
- `message()`
- `accept(promptText?)`
- `dismiss()`

## Example

```js
await browser.attachDebugger();

const onDialog = async (dialog) => {
  await expect(await dialog.opened()).toBeTruthy();
  console.log(await dialog.type(), await dialog.message());
  await dialog.accept();
  page.off('dialog', onDialog);
};

page.on('dialog', onDialog);
await page.element('#alert_button').click({ mode: 'cdp' });
```
