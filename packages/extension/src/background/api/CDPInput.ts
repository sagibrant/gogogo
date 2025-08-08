/**
 * @copyright 2025 Sagi All Rights Reserved.
 * @author: Sagi <sagibrant@163.com>
 * @license Apache-2.0
 * @file CDPInput.ts
 * @description 
 * Provide wrapper class for mouse and keyboard in Chrome DevTool Protocol APIs
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

import { Utils } from "@/common/Common";
import { ChromeDevToolsProtocol } from "./ChromeDevToolsProtocol";
import { KeyDefinitionUtils } from "@/common/KeyDefinitions";

export type CDPMouseEventType = 'mousePressed' | 'mouseReleased' | 'mouseMoved' | 'mouseWheel';

export enum CDPModifiers {
  None = 0,
  Alt = 1,
  Ctrl = 2,
  Meta_Command = 4,
  Shift = 8
};

export type CDPMouseButton = 'none' | 'left' | 'middle' | 'right' | 'back' | 'forward';

/**
 * Options for configuring a CDP mouse event.
 * Used with Input.dispatchMouseEvent.
 */
export class CDPMouseEventOption {
  /** 
   * Type of the mouse event. 
   * Allowed Values: mousePressed, mouseReleased, mouseMoved, mouseWheel
   */
  type: CDPMouseEventType = 'mouseMoved';
  /**
   * X coordinate of the event relative to the main frame's viewport in CSS pixels.
   */
  x: number;
  /**
   * Y coordinate of the event relative to the main frame's viewport in CSS pixels. 0 refers to the top of the viewport and Y increases as it proceeds towards the bottom of the viewport.
   */
  y: number;
  /**
   * Bit field representing pressed modifier keys. 
   * Alt=1, Ctrl=2, Meta/Command=4, Shift=8 (default: 0).
   * @defaultValue 0
   */
  modifiers?: CDPModifiers = CDPModifiers.None;
  /**
   * Mouse button (default: "none"). 
   * Allowed Values: none, left, middle, right, back, forward
   * @defaultValue "none"
   */
  button: CDPMouseButton = 'none';
  /**
   * A number indicating which buttons are pressed on the mouse when a mouse event is triggered. 
   * Left=1, Right=2, Middle=4, Back=8, Forward=16, None=0.
   */
  buttons?: number = 0;
  /**
   * Number of times the mouse button was clicked (default: 0).
   * @defaultValue 0
   */
  clickCount: number = 0;
  /**
   * X delta in CSS pixels for mouse wheel event (default: 0).
   * @defaultValue 0
   */
  deltaX?: number;
  /**
   * Y delta in CSS pixels for mouse wheel event (default: 0).
   * @defaultValue 0
   */
  deltaY?: number;
  /**
   * Pointer type (default: "mouse"). Allowed Values: mouse, pen
   * @defaultValue "mouse"
   */
  pointerType: 'mouse' | 'pen' = 'mouse';

  /**
   * Create mouse event options.
   * @param type - Type of mouse event
   * @param x - X coordinate (CSS pixels)
   * @param y - Y coordinate (CSS pixels)
   */
  constructor(type: CDPMouseEventType, x: number, y: number) {
    this.type = type;
    this.x = x;
    this.y = y;
  }
};

/**
 * Wrapper for CDP mouse operations.
 * Provides high-level methods for simulating mouse input.
 */
export class CDPMouse {
  private _tabId: number;
  private _cdp: ChromeDevToolsProtocol;

  /**
   * Create a mouse controller for a tab.
   * @param tabId - Tab ID to control
   * @param cdp - CDP instance
   */
  constructor(tabId: number, cdp: ChromeDevToolsProtocol) {
    this._tabId = tabId;
    this._cdp = cdp;
  }

  /**
   * Reset mouse position to (0,0).
   */
  async reset(): Promise<void> {
    await this.move(0, 0);
  }

  /**
   * Move the mouse to coordinates.
   * @param x - Target X coordinate
   * @param y - Target Y coordinate
   */
  async move(x: number, y: number): Promise<void> {
    const options = new CDPMouseEventOption("mouseMoved", x, y);
    await this.dispatchEvent(options);
  }

  /**
   * Simulate mouse down event.
   * @param x - X coordinate
   * @param y - Y coordinate
   * @param button - Mouse button
   * @param clickCount - Number of clicks
   */
  async down(
    x: number,
    y: number,
    button: CDPMouseButton,
    clickCount: number
  ): Promise<void> {
    const options = new CDPMouseEventOption("mousePressed", x, y);
    options.button = button;
    options.clickCount = clickCount;
    await this.dispatchEvent(options);
  }

  /**
   * Simulate mouse up event.
   * @param x - X coordinate
   * @param y - Y coordinate
   * @param button - Mouse button
   * @param clickCount - Number of clicks
   */
  async up(
    x: number,
    y: number,
    button: CDPMouseButton,
    clickCount: number
  ): Promise<void> {
    const options = new CDPMouseEventOption("mouseReleased", x, y);
    options.button = button;
    options.clickCount = clickCount;
    await this.dispatchEvent(options);
  }

  /**
   * Simulate a complete mouse click (down + up).
   * @param x - X coordinate
   * @param y - Y coordinate
   * @param button - Mouse button
   * @param clickCount - Number of clicks
   * @param duration - Delay between down and up (ms)
   */
  async click(
    x: number,
    y: number,
    button: CDPMouseButton,
    clickCount: number,
    duration: number = 0
  ): Promise<void> {
    await this.move(x, y);
    await this.down(x, y, button, clickCount);
    const delay = duration || 0;
    if (delay > 0) {
      setTimeout(async () => {
        await this.up(x, y, button, clickCount);
      }, delay);
    } else {
      await this.up(x, y, button, clickCount);
    }
  }

  /**
   * Simulate mouse wheel event.
   * @param x - X coordinate
   * @param y - Y coordinate
   * @param deltaX - Horizontal scroll delta
   * @param deltaY - Vertical scroll delta
   */
  async wheel(
    x: number,
    y: number,
    deltaX: number,
    deltaY: number
  ): Promise<void> {
    const options = new CDPMouseEventOption("mouseWheel", x, y);
    options.button = "middle";
    options.deltaX = deltaX;
    options.deltaY = deltaY;
    await this.dispatchEvent(options);
  }

  /**
   * Dispatch a raw mouse event via CDP.
   * @param options - Mouse event options
   */
  async dispatchEvent(
    options: CDPMouseEventOption
  ): Promise<void> {
    await this._cdp.attachTab(this._tabId);
    await this.dispatchMouseEvent(this._tabId, options);
  }

  /**
   * Dispatch a mouse event via CDP.
   * @param tabId - Tab ID to dispatch event to
   * @param options - Mouse event options
   */
  async dispatchMouseEvent(
    tabId: number,
    options: CDPMouseEventOption,
  ): Promise<void> {
    const eventParams = Utils.deepClone(options);
    await this._cdp.sendCommand(tabId, "Input.dispatchMouseEvent", eventParams);
  }
};


type CDPKeyEventType = 'keyDown' | 'keyUp' | 'rawKeyDown' | 'char';
/**
 * Options for configuring a CDP keyboard event.
 * Used with Input.dispatchKeyEvent.
 */
export class CDPKeyEventOption {
  /**
   * Type of the key event.  
   * Allowed Values: keyDown, keyUp, rawKeyDown, char
   */
  type: CDPKeyEventType;
  /**
   * Bit field representing pressed modifier keys. 
   * Alt=1, Ctrl=2, Meta/Command=4, Shift=8 (default: 0).
   * @defaultValue 0
   */
  modifiers?: CDPModifiers = CDPModifiers.None;
  /**
   * Text as generated by processing a virtual key code with a keyboard layout. 
   * Not needed for for keyUp and rawKeyDown events (default: "")
   * @defaultValue ""
   */
  text: string = '';
  /**
   * Text that would have been generated by the keyboard if no modifiers were pressed (except for shift). 
   * Useful for shortcut (accelerator) key handling (default: "").
   * @defaultValue ""
   */
  unmodifiedText: string = '';
  /**
   * Unique key identifier (e.g., 'U+0041') (default: "").
   */
  keyIdentifier?: string = '';
  /**
   * Unique DOM defined string value for each physical key (e.g., 'KeyA') (default: "").
   * @defaultValue ""
   */
  code?: string = '';
  /**
   * Unique DOM defined string value describing the meaning of the key in the context of active modifiers, keyboard layout, etc (e.g., 'AltGr') (default: "").
   * @defaultValue ""
   */
  key?: string = '';
  /**
   * Windows virtual key code (default: 0).
   * @defaultValue 0
   */
  windowsVirtualKeyCode?: number = 0;
  /**
   * Native virtual key code (default: 0).
   * @defaultValue 0
   */
  nativeVirtualKeyCode?: number = 0;
  /**
   * Whether the event was generated from auto repeat (default: false).
   * @defaultValue false
   */
  autoRepeat?: boolean = false;
  /**
   * Whether the event was generated from the keypad (default: false).
   * @defaultValue false
   */
  isKeypad?: boolean = false;
  /**
   * Whether the event was a system key event (default: false).
   * @defaultValue false
   */
  isSystemKey?: boolean = false;
  /**
   * Whether the event was from the left or right side of the keyboard. 
   * 1=Left, 2=Right (default: 0).
   * @defaultValue 0
   */
  location?: number = 0;

  /**
   * Create keyboard event options.
   * @param type - Type of key event
   */
  constructor(type: CDPKeyEventType) {
    this.type = type;
  }
};

/**
 * Wrapper for CDP keyboard operations.
 * Provides high-level methods for simulating keyboard input.
 */
export class CDPKeyboard {
  private _tabId: number;
  private _cdp: ChromeDevToolsProtocol;

  /**
   * Create a keyboard controller for a tab.
   * @param tabId - Tab ID to control
   * @param cdp - CDP instance
   */
  constructor(tabId: number, cdp: ChromeDevToolsProtocol) {
    this._tabId = tabId;
    this._cdp = cdp;
  }

  /**
   * Input text into the active element.
   * @param text - Text to input
   * @param clearTextBefore - Clear existing text first
   * @param performCommit - Press Enter after input
   */
  async setText(
    text: string,
    clearTextBefore: boolean,
    performCommit: boolean,
  ): Promise<void> {
    if (Utils.isNullOrUndefined(this._cdp)) {
      return;
    }

    // Clear text using Ctrl+A + Delete
    const clearTextFunc = async () => {
      await this._dispatchKeyEvent("rawKeyDown", "a", false, true, false, false);
      await this._dispatchKeyEvent("keyUp", "a", false, true, false, false);
      await this._dispatchKeyEvent("rawKeyDown", "Delete", false, false, false, false);
      await this._dispatchKeyEvent("keyUp", "Delete", false, false, false, false,);
    };

    // Move cursor to end with End key
    const setCursorToTextEndFunc = async () => {
      await this._dispatchKeyEvent("rawKeyDown", "End", false, false, false, false);
      await this._dispatchKeyEvent("keyUp", "End", false, false, false, false);
    };

    // Type each character sequentially
    const pressKeyFunc = async (keys: string[], index: number) => {
      if (index >= keys.length || Utils.isNullOrUndefined(keys[index])) {
        return Promise.resolve();
      }
      await this._dispatchKeyEvent("char", keys[index], false, false, false, false);
      await pressKeyFunc(keys, index + 1);
    };

    // Main text input logic
    const setTextFunc = async (inputText: string) => {
      const keys = inputText.split('');
      for (const textChar of keys) {
        await this._dispatchKeyEvent("char", textChar, false, false, false, false);
      }
      if (performCommit) {
        await this._dispatchKeyEvent("rawKeyDown", "Enter", false, false, false, false);
        await this._dispatchKeyEvent("keyUp", "Enter", false, false, false, false);
      }
    };

    if (clearTextBefore) {
      await clearTextFunc();
      await setTextFunc(text);
    } else {
      await setCursorToTextEndFunc();
      await setTextFunc(text);
    }
  }

  /**
   * Dispatch a keyboard event with modifiers.
   * @param event - Event type
   * @param key - Key name (from KeyDefinitionUtils.KeyDefinitions)
   * @param alt - Alt modifier
   * @param ctrl - Ctrl modifier
   * @param cmd - Meta/Command modifier
   * @param shift - Shift modifier
   */
  private async _dispatchKeyEvent(
    event: string,
    key: string,
    alt: boolean,
    ctrl: boolean,
    cmd: boolean,
    shift: boolean
  ): Promise<void> {
    if (
      Utils.isNullOrUndefined(this._cdp) ||
      Utils.isNullOrUndefined(event) ||
      Utils.isNullOrUndefined(key)
    ) {
      return Promise.reject(new Error('Invalid arguments or environment.'));
    }

    const keyInfo = (KeyDefinitionUtils.KeyDefinitions as any)[key];
    if (Utils.isNullOrUndefined(keyInfo)) {
      return Promise.reject(new Error(`Invalid KeyDefinition - ${key}`));
    }

    const normalizedEvent = event.toLowerCase();
    const eventTypeMapping: Record<string, CDPKeyEventType> = {
      "keyup": "keyUp",
      "keydown": "keyDown",
      "rawkeydown": "rawKeyDown",
      "char": "char"
    };

    const type = eventTypeMapping[normalizedEvent] || "char";
    let text: string | undefined = key;
    if (type === "keyUp" || type === "rawKeyDown") {
      text = undefined;
    }

    let modifiers = 0;
    if (alt) modifiers += 1;
    if (ctrl) modifiers += 2;
    if (cmd) modifiers += 4;
    if (shift) modifiers += 8;

    const options = new CDPKeyEventOption(type);
    if (modifiers > 0) options.modifiers = modifiers;
    if (text) options.text = text;
    if (keyInfo.code) options.code = keyInfo.code;
    if (keyInfo.key) options.key = keyInfo.key;
    if (keyInfo.keyCode) options.windowsVirtualKeyCode = keyInfo.keyCode;
    if (keyInfo.location) options.location = keyInfo.location;

    await this.dispatchEvent(options);
  }

  /**
   * Dispatch a raw keyboard event via CDP.
   * @param options - Keyboard event options
   */
  async dispatchEvent(
    options: CDPKeyEventOption
  ): Promise<void> {
    await this._cdp.attachTab(this._tabId);
    await this.dispatchKeyEvent(this._tabId, options);
  }

  /**
   * Dispatch a keyboard event via CDP.
   * @param tabId - Tab ID to dispatch event to
   * @param options - Keyboard event options
   */
  async dispatchKeyEvent(
    tabId: number,
    options: CDPKeyEventOption
  ): Promise<void> {
    const eventParams = Utils.deepClone(options);
    await this._cdp.sendCommand(tabId, "Input.dispatchKeyEvent", eventParams);
  }
};