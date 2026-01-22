# Types

Public option objects and shared types exposed to end users (locators, filters, input options, etc).

## LocatorFilterOption

Used by `locator.filter(...)` and `locator.prefer(...)`.

- `name: string`
- `value?: string | number | boolean | RegExp`
- `type?: 'property' | 'attribute' | 'function' | 'text'` (default: `'property'`)
- `match?: 'has' | 'hasNot' | 'exact' | 'includes' | 'startsWith' | 'endsWith' | 'regex'` (default: `'exact'` unless value is a RegExp)

Examples:

```js
page.element().filter({ type: 'attribute', name: 'id', value: 'login-button' });
page.element().filter({ type: 'property', name: 'disabled', value: false });
page.element().filter({ type: 'attribute', name: 'class', value: /primary/i, match: 'regex' });
page.element().filter({ type: 'attribute', name: 'data-test', match: 'has' });
page.element().filter({ type: 'function', name: 'click', match: 'has' });
```

## ActionOptions

Many actions accept `ActionOptions`:

- `mode?: 'event' | 'cdp'`
- `force?: boolean`

Example:

```js
await browser.attachDebugger();
await page.element('#submit').click({ mode: 'cdp' });
```

## ClickOptions

- `button?: 'left' | 'right' | 'middle'`
- `clickCount?: number`
- `position?: { x: number, y: number }`
- `modifiers?: Array<'Alt' | 'Control' | 'ControlOrMeta' | 'Meta' | 'Shift'>`
- `delayBetweenDownUp?: number`
- `delayBetweenClick?: number`

## TextInputOptions

- `delayBetweenDownUp?: number`
- `delayBetweenChar?: number`

## Locator Option Objects

- `WindowLocatorOptions`: `{ lastFocused?: boolean }`
- `PageLocatorOptions`: `{ url?: string|RegExp, title?: string|RegExp, active?: boolean, lastFocusedWindow?: boolean, index?: number }`
- `FrameLocatorOptions`: `{ url?: string|RegExp, selector?: string }`
- `ElementLocatorOptions`: `{ selector?: string, xpath?: string }`
- `TextLocatorOptions`: `{ text?: string|RegExp }`

