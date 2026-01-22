# AIClient

The AI client used by Mimic to generate or assist with automation scripts.

## Methods

- `init(options?)`
- `setModel(model)`
- `setSystemPrompt(prompt)`
- `chat(message)`

## Examples

```js
const response = await ai
  .init()
  .setModel('gpt-4o')
  .setSystemPrompt('You are a helpful web automation assistant.')
  .chat('How do I fill a login form?');
```
