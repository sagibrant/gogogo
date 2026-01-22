# Keyboard

Keyboard controller for a page (type, down/up, press).

## Methods

- `type(text, options?)`
- `down(key)`, `up(key)`
- `press(keys, options?)`

## Example

```js
await page.navigate('https://sagibrant.github.io/mimic/aut/keyboard.html');
await page.sync();

const keyboard = page.keyboard();
await keyboard.type('Hello World', { delayBetweenChar: 50 });
await keyboard.press(['Shift', 'KeyA'], { delayBetweenDownUp: 20 });
```
