# TextLocator

Locates text nodes and provides Node/Text actions (click/hover/drag/etc) plus text input helpers.

## Examples

```js
const label = page.text(/sign in/i).first();
await label.highlight();
await label.click();
```
