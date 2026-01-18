import React from 'react';
import { Section, Paragraph, List } from './components/Common';
import type { Entry } from './components/Common';

export default function TypesDoc() {
  return (
    <Section title="Types">
      <Paragraph>Core types used across Gogogo. Reference for method parameters and return values.</Paragraph>
      <h2 style={{ fontSize: '1.5rem', margin: '1rem 0' }}>Locator and Filters</h2>
      <List
        items={[
          { name: 'LocatorOptions', kind: 'property', returns: 'BrowserLocatorOptions | WindowLocatorOptions | PageLocatorOptions | FrameLocatorOptions | ElementLocatorOptions | TextLocatorOptions', desc: 'Primary selector options type union.' },
          { name: 'LocatorFilterOption', kind: 'property', returns: '{ name: string; value?: string|number|boolean|RegExp; type?: "property"|"attribute"|"function"|"text"; match?: "has"|"hasNot"|"exact"|"includes"|"startsWith"|"endsWith"|"regex"; }', desc: 'Filter option for Locators.' },
          { name: 'BrowserLocatorOptions', kind: 'property', returns: '{ name?: string; version?: string; processId?: number; }', desc: 'Browser locator primary options.' },
          { name: 'WindowLocatorOptions', kind: 'property', returns: '{ lastFocused?: boolean }', desc: 'Window locator primary options.' },
          { name: 'PageLocatorOptions', kind: 'property', returns: '{ url?: string|RegExp; title?: string|RegExp; active?: boolean; lastFocusedWindow?: boolean; index?: number; }', desc: 'Page locator primary options.' },
          { name: 'FrameLocatorOptions', kind: 'property', returns: '{ url?: string|RegExp; selector?: string }', desc: 'Frame locator primary options.' },
          { name: 'ElementLocatorOptions', kind: 'property', returns: '{ selector?: string; xpath?: string }', desc: 'Element locator primary options.' },
          { name: 'TextLocatorOptions', kind: 'property', returns: '{ text?: string | RegExp }', desc: 'Text locator primary options.' },
        ]}
      />
      <h2 style={{ fontSize: '1.5rem', margin: '1rem 0' }}>Actions and Input</h2>
      <List
        items={[
          { name: 'ActionOptions', kind: 'property', returns: '{ mode?: "event" | "cdp"; force?: boolean; }', desc: 'Common action options.' },
          { name: 'ClickOptions', kind: 'property', returns: '{ button?: "left"|"right"|"middle"; clickCount?: number; position?: Point; modifiers?: Array<"Alt"|"Control"|"ControlOrMeta"|"Meta"|"Shift">; delayBetweenDownUp?: number; delayBetweenClick?: number; }', desc: 'Mouse click options.' },
          { name: 'TextInputOptions', kind: 'property', returns: '{ delayBetweenDownUp?: number; delayBetweenChar?: number; }', desc: 'Typing options.' },
        ]}
      />
      <h2 style={{ fontSize: '1.5rem', margin: '1rem 0' }}>Geometry and Data</h2>
      <List
        items={[
          { name: 'Point', kind: 'property', returns: '{ x: number; y: number }', desc: 'Coordinates.' },
          { name: 'RectInfo', kind: 'property', returns: '{ left:number; top:number; right:number; bottom:number; width:number; height:number; x:number; y:number }', desc: 'Rectangle bounds.' },
          { name: 'Cookie', kind: 'property', returns: '{ name:string; value:string; domain?:string; path?:string; expires?:number; httpOnly?:boolean; secure?:boolean; session?:boolean; sameSite?: "Strict"|"Lax"|"None"; partitionKey?: string; }', desc: 'Cookie record.' },
          { name: 'JSObject', kind: 'property', returns: 'Record<string, unknown>', desc: 'Generic JS object proxy.' },
        ]}
      />
      <h2 style={{ fontSize: '1.5rem', margin: '1rem 0' }}>Dialog</h2>
      <List
        items={[
          { name: 'Dialog', kind: 'property', returns: 'interface', desc: 'dialog.page(): Promise<Page>; dialog.opened(): Promise<boolean>; dialog.type(): Promise<...>; dialog.defaultValue(): Promise<string>; dialog.message(): Promise<string>; dialog.accept(promptText?): Promise<void>; dialog.dismiss(): Promise<void>.' },
        ]}
      />
    </Section>
  );
}
