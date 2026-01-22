# Element

Represents a DOM element with properties, DOM helpers, and user-like actions (click/fill/press/drag/etc).

## How To Get an Element

```js
const submit = await page.element('#submit-btn').get();
await submit.click();
```

Shadow DOM friendly pattern:

```js
const submit = await page
  .element()
  .filter({ type: 'attribute', name: 'data-test', value: 'shadow-submit' })
  .get();

await submit.click();
```

## Common Properties

```js
const tagName = await submit.tagName();
const id = await submit.id();
const visible = await submit.visible();
const box = await submit.boundingBox();
```

## DOM Helpers

```js
await submit.highlight();

const attrs = await submit.getAttributes();
const ariaLabel = await submit.getAttribute('aria-label');

await submit.setAttribute('data-qa', 'submit');
await expect(await submit.hasAttribute('data-qa')).toBeTruthy();

await submit.scrollIntoViewIfNeeded();
const rect = await submit.getBoundingClientRect();
```

## Pointer Actions

```js
await submit.hover();
await submit.click();
await submit.dblclick();
await submit.wheel({ deltaY: 120 });
```

Drag and drop:

```js
const source = await page.element('#drag-source').get();
const target = await page.element('#drop-target').get();
await source.dragTo(target);
```

## Text Input

`fill/clear/press` support input/textarea/contenteditable. You can choose input mode via `ActionOptions`.

```js
const input = await page.element('#input_fill').get();

await input.clear();
await input.fill('Hello');
await input.press('Tab');

await input.fill('Hello with CDP', { mode: 'cdp' });
```

## Form Controls

Checkboxes:

```js
const checkbox = await page.element('input[type="checkbox"]').first().get();
await checkbox.check();
await expect(await checkbox.checked()).toBeTruthy();
await checkbox.uncheck();
```

Select:

```js
const select = await page.element('select').first().get();
await select.selectOption('value1');
```

File input:

```js
const file = await page.element('input[type="file"]').get();
await file.setFileInputFiles(['/path/to/file.png']);
```

## Low-Level Events and CDP

Dispatch DOM events:

```js
await submit.dispatchEvent('mousemove');
await submit.dispatchEvent('click');
```

Send raw DevTools protocol commands (typically requires `await browser.attachDebugger()` first):

```js
await browser.attachDebugger();
await submit.sendCDPCommand('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 100, y: 200 });
```

## Scoped Locators (Search Within an Element)

```js
const list = await page.element('#list').get();
await list.element('li').first().click();
await list.text(/Item \\d+/).first().highlight();
```
