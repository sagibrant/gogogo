/**
 * @copyright 2025 Sagi All Rights Reserved.
 * @author: Sagi <sagibrant@163.com>
 * @license Apache-2.0
 * @file types.ts
 * @description 
 * Shared types which observable to end users
 * 
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as playwright from "./playwright/types";

export interface Browser extends Partial<playwright.Browser> {

  name(): string;
  version(): string;
  majorVersion(): number;

  windows(): Promise<Window[]>;
  pages(): Promise<Page[]>;
  lastFocusedWindow(): Promise<Window>;
  lastActivePage(): Promise<Page>;

  enableCDP(): Promise<void>;
  disableCDP(): Promise<void>;
  setDefaultTimeout(timeout: number): void;

  openNewWindow(url?: string): Promise<Window>;
  openNewPage(url?: string): Promise<Page>;
  close(): Promise<void>;
}

export interface Window {

  state(): Promise<'normal' | 'minimized' | 'maximized' | 'fullscreen' | 'locked-fullscreen'>;
  focused(): Promise<boolean>;
  incognito(): Promise<boolean>;

  browser(): Browser;
  pages(): Promise<Page[]>
  activePage(): Promise<Page>;

  openNewPage(url?: string): Promise<Page>;
  focus(): Promise<void>;
  close(): Promise<void>;
  minimize(): Promise<void>;
  maximize(): Promise<void>;
  restore(): Promise<void>;
  fullscreen(toggle: boolean): Promise<void>;

}

export interface Page {

  url(): Promise<string>;
  title(): Promise<string>;
  status(): Promise<'unloaded' | 'loading' | 'complete'>;
  closed(): Promise<boolean>;

  document(): any;

  window(): Promise<Window | null>;
  mainFrame(): Frame;
  frames(): Promise<Frame[]>;

  active(): Promise<void>;
  bringToFront(): Promise<void>;
  sync(timeout: number): Promise<void>;
  openNewPage(url?: string): Promise<Page>;
  navigate(url?: string): Promise<void>;
  refresh(bypassCache?: boolean): Promise<void>;
  back(): Promise<void>;
  forward(): Promise<void>;
  close(): Promise<void>;
  zoom(zoomFactor: number): Promise<void>;
  moveToWindow(window: Window, index: number): Promise<void>;
  captureScreenshot(): Promise<string>;

  executeScript(script: string): Promise<any>;
  querySelectorAll(selector: string): Promise<Element[]>;
}

export interface Frame {

  page(): Page;
  parentFrame(): Promise<Frame | null>;
  childFrames(): Promise<Frame[]>;
  frameElement(): Promise<Element | null>;

  url(): Promise<string>;
  status(): Promise<'BeforeNavigate' | 'Committed' | 'DOMContentLoaded' | 'Completed' | 'ErrorOccurred' | 'Removed'>;
  readyState(): Promise<'loading' | 'interactive' | 'complete'>;
  sync(timeout: number): Promise<void>;

  document(): any;

  executeScript(script: string): Promise<any>;
  querySelectorAll(selector: string): Promise<Element[]>;
}

export interface Element {

  $0(): any;

  contentFrame(): Frame;

  value(): Promise<string>;
  innerHTML(): Promise<string>;
  outerHTML(): Promise<string>;
  innerText(): Promise<string>;
  textContent(): Promise<string>;
  boundingBox(): Promise<RectInfo>;

  getAttribute(): Promise<string | null>;
  getAttributes(): Promise<Record<string, unknown>>;
  setAttribute(): Promise<void>;
  hasAttribute(): Promise<boolean>;
  querySelectorAll(selector: string): Promise<Element[]>;


  click(): Promise<void>;
  dblClick(): Promise<void>;
  focus(): Promise<void>;
  hover(): Promise<void>;
  blur(): Promise<void>;
  check(): Promise<void>;
  uncheck(): Promise<void>;
  clear(): Promise<void>;
  select(): Promise<void>;
  tap(): Promise<void>;
  dragTo(target: Element, options: { sourcePosition: Point, targetPosition: Point }): Promise<void>;
  scrollIntoViewIfNeeded(): Promise<void>;
  dispatchEvent(type: string, options?: object): Promise<void>;

  clickEx(options?: {
    mode?: 'event' | 'cdp';
    button?: "left" | "right" | "middle";
    clickCount?: number;
    moveBeforeClick?: number;
    delayBeforeClick?: number;
    delayBetweenUpDown?: number;
    delayBetweenClick?: number;
    modifiers?: Array<"Alt" | "Control" | "ControlOrMeta" | "Meta" | "Shift">;
    position?: {
      x: number;
      y: number;
    };
  }): Promise<void>;

  setTextEx(text: string,
    options?: {
      mode?: 'event' | 'cdp';
      clickBeforeSet?: boolean;
      delayBeforeSet?: number;
      delayBetweenUpDown?: number;
      delayBetweenChar?: number;
      commitAfterSet?: boolean;
      delayBeforeCommit?: number;
      modifiers?: Array<"Alt" | "Control" | "ControlOrMeta" | "Meta" | "Shift">;
    }
  ): Promise<void>;
}


export interface Point {
  x: number;
  y: number;
}

export interface RectInfo {
  left: number;
  top: number;
  right: number;
  bottom: number;

  width: number;
  height: number;
  x: number;
  y: number;
}