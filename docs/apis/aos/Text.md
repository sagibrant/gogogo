# Text

Represents a text node. Supports node inspection, highlighting, and pointer actions.

## How To Get a Text Node

```js
const label = await page.text(/Move mouse to me!/).get();
await label.highlight();
```

## Relationship APIs

```js
const frame = await label.ownerFrame();
const owner = await label.ownerElement(); // may be null
```

## Node Inspection

```js
const name = await label.nodeName();
const type = await label.nodeType();
const textContent = await label.textContent();
const box = await label.boundingBox();
```

## Pointer Actions

```js
await label.hover();
await label.click();
await label.dblclick();
await label.wheel({ deltaY: 120 });
```

## Low-Level Events and CDP

```js
await label.dispatchEvent('mousemove');

await browser.attachDebugger();
await label.sendCDPCommand('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 100, y: 200 });
```
