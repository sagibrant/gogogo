# Mouse

Mouse controller for a page (coordinate-based input).

## Methods

- `click(x, y, options?)`
- `down(options?)`, `up(options?)`
- `move(x, y, options?)`
- `wheel(deltaX, deltaY)`

## Example

```js
await page.navigate('https://sagibrant.github.io/mimic/aut/mouse.html');
await page.sync();

const mouse = page.mouse();
await mouse.move(300, 200, { steps: 10 });
await mouse.down({ button: 'left' });
await mouse.up({ button: 'left' });
await mouse.wheel(0, 500);
```
