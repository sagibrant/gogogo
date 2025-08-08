/**
 * @copyright 2025 Sagi All Rights Reserved.
 * @author: Sagi <sagibrant@163.com>
 * @license Apache-2.0
 * @file EventSimulator.ts
 * @description 
 * Shared utility classes and functions for event based simulator
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

import { KeyDefinitionUtils } from "@/common/KeyDefinitions";
import { Point } from "@/types/api";

/**
 * Enum for mouse button identifiers (matches W3C standards)
 */
export enum MouseButton {
  Left = 0,    // Primary button (left-click)
  Middle = 1,  // Middle button (wheel click)
  Right = 2    // Secondary button (right-click)
}

/**
 * Simulates various mouse and pointer events for testing/interaction automation
 */
export class EventSimulator {

  /**
   * Dispatches a PointerEvent
   * @param type - Type of pointer event (pointerdown, pointerup, etc.)
   * @param target - The HTML element to dispatch the event on.
   * @param x - X coordinate RELATIVE to the target element's top-left corner. 
   *            Defaults to the target's horizontal center if undefined.
   * @param y - Y coordinate RELATIVE to the target element's top-left corner. 
   *            Defaults to the target's vertical center if undefined.
   * @param button - Mouse button associated with the event
   * @param buttons - Bitmask of currently pressed buttons
   * @param pointerType - Type of input device triggering the event (default: 'mouse').
   * @param pressure - Pressure applied to the device (0-1 range). (default: 0 for mouse, 0.5 for pen/touch)
   * @returns Boolean indicating if the event was not canceled (true = no preventDefault(), false = prevented).
   */
  static dispatchPointerEvent(
    type: 'pointerover' | 'pointerenter'
      | 'pointerdown' | 'pointermove' | 'pointerup'
      | 'pointercancel' | 'pointerout' | 'pointerleave',
    target: HTMLElement,
    x: number | undefined = undefined,
    y: number | undefined = undefined,
    button: MouseButton = MouseButton.Left,
    buttons: number = 1 << button,
    pointerType: 'mouse' | 'pen' | 'touch' = 'mouse',
    pressure: number = pointerType === 'mouse' ? 0 : 0.5
  ): boolean {
    // Get target's position and dimensions relative to viewport
    const rect = target.getBoundingClientRect();

    // Calculate coordinates: default to center if x/y are undefined
    const clientX = x === undefined ? rect.left + (rect.width / 2) : rect.left + x;
    const clientY = y === undefined ? rect.top + (rect.height / 2) : rect.top + y;

    const event = new PointerEvent(type, {
      bubbles: true,
      cancelable: true,
      clientX: clientX,
      clientY: clientY,
      pointerType,
      button,
      buttons,
      pressure,
      view: window
      // Omitted screenX/screenY to avoid scale-related inaccuracies
    });
    const result = target.dispatchEvent(event);
    return result;
  }

  /**
   * Dispatches a MouseEvent
   * @param type - Type of mouse event to dispatch (e.g., 'mousedown', 'click', 'dblclick').
   * @param targetEl - The HTML element to dispatch the event on.
   * @param x - X coordinate RELATIVE to the target element's top-left corner. 
   *            Defaults to the target's horizontal center if undefined.
   * @param y - Y coordinate RELATIVE to the target element's top-left corner. 
   *            Defaults to the target's vertical center if undefined.
   * @param button - Specific mouse button triggering the event (default: Left button).
   *                 Uses MouseButton enum (Left=0, Right=2, Middle=1).
   * @param buttons - Bitmask of all currently pressed buttons (default: only the active `button`).
   *                  Each bit represents a button (e.g., 1 << Left = 1 for left button pressed).
   * @param modifiers - Optional modifier keys (Ctrl, Shift, Alt, Meta) pressed during the event.
   * @returns Boolean indicating if the event was not canceled (true = no preventDefault(), false = prevented).
   */
  static dispatchMouseEvent(
    type: 'click' | 'dblclick'
      | 'mousedown' | 'mouseenter' | 'mouseover' | 'mousemove'
      | 'mouseup' | 'mouseleave' | 'mouseout',
    target: HTMLElement,
    x: number | undefined = undefined,
    y: number | undefined = undefined,
    button: MouseButton = MouseButton.Left,
    buttons: number = 1 << button,
    modifiers: {
      ctrlKey?: boolean;
      shiftKey?: boolean;
      altKey?: boolean;
      metaKey?: boolean;
    } = {}
  ): boolean {
    // Get target's position and dimensions relative to viewport
    const rect = target.getBoundingClientRect();

    // Calculate coordinates: default to center if x/y are undefined
    const clientX = x === undefined ? rect.left + (rect.width / 2) : rect.left + x;
    const clientY = y === undefined ? rect.top + (rect.height / 2) : rect.top + y;

    // Destructure modifier keys with defaults (all false if not specified)
    const {
      ctrlKey = false,
      shiftKey = false,
      altKey = false,
      metaKey = false
    } = modifiers;

    // 'mouseenter' and 'mouseleave' do NOT bubble (unlike other mouse events)
    const bubbles = !['mouseenter', 'mouseleave'].includes(type);

    const event = new MouseEvent(type, {
      bubbles: bubbles,
      cancelable: true,
      clientX: clientX,
      clientY: clientY,
      button,
      buttons,
      // Modifier key states (common in interactions like Ctrl+click)
      ctrlKey,
      shiftKey,
      altKey,
      metaKey,
      // Detail: Number of clicks for click/dblclick (1 for single, 2 for double)
      detail: type === 'dblclick' ? 2 : 1, // detail=2 for double clicks
      view: window
      // Omitted screenX/screenY to avoid scale-related inaccuracies
    });
    const result = target.dispatchEvent(event);
    return result;
  }

  /**
   * Dispatches a simulated DragEvent 
   * @param type - Type of drag event to dispatch (e.g., 'dragstart', 'dragover', 'drop').
   * @param target - The HTML element to dispatch the event on.
   * @param x - X coordinate RELATIVE to the target element's top-left corner. 
   *            Defaults to the target's horizontal center if undefined.
   * @param y - Y coordinate RELATIVE to the target element's top-left corner. 
   *            Defaults to the target's vertical center if undefined.
   * @param dataTransfer - DataTransfer object containing drag data (default: new empty DataTransfer).
   * @returns Boolean indicating if the event was not canceled (true = no preventDefault(), false = prevented).
   */
  static dispatchDragEvent(
    type: 'dragstart' | 'dragenter'
      | 'drag' | 'dragover'
      | 'drop' | 'dragend' | 'dragleave',
    target: HTMLElement,
    x: number | undefined = undefined,
    y: number | undefined = undefined,
    dataTransfer: DataTransfer = new DataTransfer()
  ): boolean {
    // Get target's position and dimensions relative to viewport
    const rect = target.getBoundingClientRect();

    // Calculate coordinates: default to center if x/y are undefined
    const clientX = x === undefined ? rect.left + (rect.width / 2) : rect.left + x;
    const clientY = y === undefined ? rect.top + (rect.height / 2) : rect.top + y;


    // Determine cancelable behavior per spec:
    // - dragover/dragstart/drag are cancelable (critical for drop permissions)
    // - drop/dragend are not cancelable
    const cancelable = ['dragstart', 'drag', 'dragover'].includes(type);

    const event = new DragEvent(type, {
      bubbles: true, // All drag events bubble per spec
      cancelable,
      clientX,
      clientY,
      dataTransfer,
      view: window, // Maintain UIEvent compliance
      // Omitted screenX/screenY to avoid scale-related inaccuracies
    });

    // Dispatch and return cancellation status
    return target.dispatchEvent(event);
  }

  /**
   * Dispatches a mouse wheel event (separate from button interactions)
   * @param target - The HTML element to dispatch the event on.
   * @param x - X coordinate RELATIVE to the target element's top-left corner. 
   *            Defaults to the target's horizontal center if undefined.
   * @param y - Y coordinate RELATIVE to the target element's top-left corner. 
   *            Defaults to the target's vertical center if undefined.
   * @param deltaY - Vertical scroll amount (positive = scroll down, negative = scroll up). Default: 100.
   * @param deltaX - Horizontal scroll amount (positive = scroll right, negative = scroll left). Default: 0.
   * @param deltaMode - Unit for delta values (pixel, line, or page). 
   *                    Uses WheelEvent constants (DOM_DELTA_PIXEL, DOM_DELTA_LINE, DOM_DELTA_PAGE). 
   *                    Default: DOM_DELTA_PIXEL (0).
   * @param modifiers - Optional modifier keys (Ctrl, Shift, Alt, Meta) pressed during scrolling.
   * @returns Boolean indicating if the event was not canceled (true = no preventDefault(), false = prevented).
   */
  static dispatchWheelEvent(
    target: HTMLElement,
    x: number | undefined = undefined,
    y: number | undefined = undefined,
    deltaY: number = 100,
    deltaX: number = 0,
    deltaMode: WheelEvent['deltaMode'] = WheelEvent.DOM_DELTA_PIXEL,
    modifiers: {
      ctrlKey?: boolean;
      shiftKey?: boolean;
      altKey?: boolean;
      metaKey?: boolean;
    } = {}
  ): boolean {
    // Get target's position and dimensions relative to viewport
    const rect = target.getBoundingClientRect();

    // Calculate coordinates: default to center if x/y are undefined
    const clientX = x === undefined ? rect.left + (rect.width / 2) : rect.left + x;
    const clientY = y === undefined ? rect.top + (rect.height / 2) : rect.top + y;

    // Destructure modifier keys with safe defaults
    const {
      ctrlKey = false,
      shiftKey = false,
      altKey = false,
      metaKey = false
    } = modifiers;

    const event = new WheelEvent('wheel', {
      bubbles: true,
      cancelable: true,
      clientX: clientX,
      clientY: clientY,
      deltaX,
      deltaY,
      deltaMode,
      deltaZ: 0,  // 3D scroll (z-axis) - default to 0 as it's less common
      view: window,  // Maintain UIEvent compliance
      ctrlKey,
      shiftKey,
      altKey,
      metaKey,
      // Omitted screenX/screenY to avoid scale-related inaccuracies
    });
    const result = target.dispatchEvent(event);
    return result;
  }

  /**
   * Dispatches a simulated KeyboardEvent to mimic real keyboard interactions, suitable for testing or interaction simulation.
   * 
   * @param type - Type of keyboard event (keydown/keyup/keypress)
   * @param target - The HTML element to dispatch the event on
   * @param key - String representation of the key (e.g., 'Enter', 'a', 'ArrowLeft' as per spec definitions)
   * @param code - Physical key position code (e.g., 'Enter', 'KeyA', 'ArrowLeft', layout-agnostic)
   * @param modifiers - Optional modifier key (Ctrl/Shift/Alt/Meta) states
   * @param repeat - Whether the event is a repeated trigger (e.g., from holding a key, default: false)
   * @param isComposing - Whether the event occurs during input method composition (e.g., Chinese input, default: false)
   * @returns Boolean indicating if the event was not canceled (true = preventDefault() not called, false = default behavior blocked)
   */
  static dispatchKeyboardEvent(
    type: 'keydown' | 'keyup' | 'keypress',
    target: HTMLElement,
    key: string,
    code: string,
    modifiers: {
      ctrlKey?: boolean;
      shiftKey?: boolean;
      altKey?: boolean;
      metaKey?: boolean;
    } = {},
    repeat: boolean = false,
    isComposing: boolean = false
  ): boolean {
    // Destructure modifier keys with default values (false if unspecified)
    const {
      ctrlKey = false,
      shiftKey = false,
      altKey = false,
      metaKey = false
    } = modifiers;

    // Create keyboard event with properties following W3C specifications
    const event = new KeyboardEvent(type, {
      bubbles: true,  // Keyboard events bubble by default
      cancelable: true,  // Most keyboard events are cancelable (e.g., preventing default key behavior)
      key,  // Logical key value (affected by Shift/input methods, e.g., 'A' vs 'a')
      code,  // Physical key code (unaffected by Shift, e.g., always 'KeyA')
      ctrlKey,
      shiftKey,
      altKey,
      metaKey,
      repeat,  // Whether triggered by long key press repetition
      isComposing,  // Whether in input method composition (e.g., during Chinese pinyin input)
      view: window,  // Associate with current window, compliant with UIEvent spec
      charCode: type === 'keypress' ? key.charCodeAt(0) : 0,  // charCode only relevant for keypress
      keyCode: code ? (code.startsWith('Key') ? code.charCodeAt(3) : 0) : 0,  // Legacy property (prefer key/code in modern code)
      which: code ? (code.startsWith('Key') ? code.charCodeAt(3) : 0) : 0  // Legacy API compatibility (e.g., jQuery events)
    });

    // Dispatch event and return cancellation status
    return target.dispatchEvent(event);
  }

  /**
   * Simulates a realistic mouse click (single or double) on a target element,
   * including full event sequence and timing for natural interaction.
   * 
   * @param target - The HTML element to click on
   * @param x - X coordinate RELATIVE to target's top-left corner (defaults to center)
   * @param y - Y coordinate RELATIVE to target's top-left corner (defaults to center)
   * @param button - Mouse button to use (default: Left)
   * @param clickCount - Number of clicks (1 = single, 2 = double; default: 1)
   * @param clickDuration - Time (ms) to hold the button down (default: 50ms for natural feel)
   * @returns Promise that resolves when the click sequence completes
   */
  static async simulateClick(
    target: HTMLElement,
    x: number | undefined = undefined,
    y: number | undefined = undefined,
    button: MouseButton = MouseButton.Left,
    clickCount: number = 1,
    clickDuration: number | undefined = undefined
  ): Promise<void> {
    // Validate click count (only 1 or 2 clicks supported)
    if (![1, 2].includes(clickCount)) {
      throw new Error(`Invalid clickCount: ${clickCount}. Must be 1 or 2.`);
    }

    // Default timing parameters for natural interaction
    const holdDuration = clickDuration ?? 50; // ms to hold button down
    const doubleClickDelay = 50; // ms between clicks for double click

    // Helper to wait for a specified duration (async/await compatible)
    const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    // Calculate button states (bitmask)
    const buttonsDown = 1 << button; // Button pressed state
    const buttonsUp = 0; // Button released state

    // Core click phase: simulates pressing and releasing the button
    const performClickCycle = async () => {
      // 1. Pointer moves over the target (pre-click hover)
      this.dispatchPointerEvent('pointerover', target, x, y, button, buttonsDown);
      this.dispatchMouseEvent('mouseover', target, x, y, button, buttonsDown);

      // 2. Pointer enters the target (for boundary-sensitive logic)
      this.dispatchPointerEvent('pointerenter', target, x, y, button, buttonsDown);
      this.dispatchMouseEvent('mouseenter', target, x, y, button, buttonsDown);

      // 3. Press the button down
      this.dispatchPointerEvent('pointerdown', target, x, y, button, buttonsDown);
      this.dispatchMouseEvent('mousedown', target, x, y, button, buttonsDown);

      // 4. Hold the button for specified duration (mimics physical click delay)
      await wait(holdDuration);

      // 5. Release the button
      this.dispatchPointerEvent('pointerup', target, x, y, button, buttonsUp);
      this.dispatchMouseEvent('mouseup', target, x, y, button, buttonsUp);
    };

    // Execute click cycles (1 for single, 2 for double)
    await performClickCycle();
    if (clickCount === 2) {
      // Short delay between clicks (matches OS double-click timing expectations)
      await wait(doubleClickDelay);
      await performClickCycle();
    }

    // 6. Trigger standard click/dblclick events (dispatched by browser after up)
    this.dispatchMouseEvent(clickCount === 1 ? 'click' : 'dblclick', target, x, y, button, buttonsUp);

    // 7. Pointer exits the target (post-click movement)
    this.dispatchPointerEvent('pointerout', target, x, y, button, buttonsUp);
    this.dispatchMouseEvent('mouseout', target, x, y, button, buttonsUp);

    this.dispatchPointerEvent('pointerleave', target, x, y, button, buttonsUp);
    this.dispatchMouseEvent('mouseleave', target, x, y, button, buttonsUp);
  }

  /**
   * Simulates typing text into a target element using realistic keyboard events,
   * leveraging KeyDefinitionUtils for accurate key code mapping.
   * 
   * @param target - The input/textarea element to receive the text
   * @param text - The text to be typed into the target
   * @param replaceExisting - Whether to clear existing content before typing (default: true)
   */
  static simulateSetText(
    target: HTMLElement,
    text: string,
    replaceExisting: boolean = true
  ): void {
    // Clear existing content if requested (for input-like elements)
    if (replaceExisting && 'value' in target) {
      (target as HTMLInputElement | HTMLTextAreaElement).value = '';
    }

    // Helper to get key metadata from KeyDefinitionUtils
    const getKeyInfo = (char: string) => {
      // Look up the character in the key definitions
      if (!(char in KeyDefinitionUtils.KeyDefinitions)) {
        throw new Error(`Unsupported character: '${char}'. Not in KeyDefinitionUtils.KeyDefinitions.`);
      }

      const keyDef = (KeyDefinitionUtils.KeyDefinitions as any)[char];

      // Get the base key definition for the code (e.g., 'KeyA' for 'a' or 'A')
      const baseKeyDef = (KeyDefinitionUtils.KeyDefinitions as any)[keyDef.code];

      // Determine if Shift is required (if char matches the base key's shiftKey)
      const shiftRequired = baseKeyDef?.shiftKey === char;

      return {
        key: keyDef.key,
        code: keyDef.code,
        shiftRequired
      };
    };

    // Simulate typing each character
    for (const char of text) {
      const { key, code, shiftRequired } = getKeyInfo(char);

      // Press Shift if required
      if (shiftRequired) {
        this.dispatchKeyboardEvent('keydown', target, 'Shift', 'ShiftLeft', { shiftKey: true });
      }

      // Dispatch standard key events in sequence
      this.dispatchKeyboardEvent('keydown', target, key, code, { shiftKey: shiftRequired });
      if (key.length === 1) { // Only dispatch keypress for printable characters
        this.dispatchKeyboardEvent('keypress', target, key, code, { shiftKey: shiftRequired });
      }
      this.dispatchKeyboardEvent('keyup', target, key, code, { shiftKey: shiftRequired });

      // Release Shift if it was pressed
      if (shiftRequired) {
        this.dispatchKeyboardEvent('keyup', target, 'Shift', 'ShiftLeft', { shiftKey: false });
      }

      // Sync element value and trigger input event (mimics browser behavior)
      if ('value' in target) {
        (target as HTMLInputElement | HTMLTextAreaElement).value += char;
        target.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }

    // Trigger change event to complete the input sequence
    target.dispatchEvent(new Event('change', { bubbles: true }));
  }

  /**
   * Simulates a complete drag-and-drop operation with viewport-relative coordinates
   * @param startPoint - Starting coordinates (VIEWPORT-RELATIVE). Defaults to source's center if undefined.
   * @param endPoint - Ending coordinates (VIEWPORT-RELATIVE). Defaults to target's center if undefined.
   * @param totalDuration - Total time for the drag (ms)
   * @param stepInterval - Time between movement steps (ms)
   * @param source - Optional source element to drag from (required if startPoint is undefined)
   * @param target - Optional target element to drop on (required if endPoint is undefined)
   * @param data - Data to transfer during drag (format → value)
   * @param button - Mouse button to use for the drag
   * @param buttons - Bitmask of pressed buttons
   * @returns Promise that resolves when drag completes
   */
  static async simulateDragDrop(
    startPoint?: Point,
    endPoint?: Point,
    totalDuration: number = 800,
    stepInterval: number = 30,
    source?: HTMLElement,
    target?: HTMLElement,
    data: Record<string, string> = { 'text/plain': 'dragged-data' },
    button: MouseButton = MouseButton.Left,
    buttons: number = 1 << button,
  ): Promise<void> {
    // Validate core parameters
    if (totalDuration <= 0) {
      throw new Error('Total duration must be a positive number');
    }

    if (stepInterval <= 0 || stepInterval > totalDuration) {
      throw new Error('Step interval must be positive and less than total duration');
    }

    // Set default start point: use source's center if startPoint is undefined
    if (!startPoint) {
      if (!source) {
        throw new Error('Either startPoint or source must be provided');
      }
      const sourceRect = source.getBoundingClientRect();
      startPoint = {
        x: sourceRect.left + sourceRect.width / 2,  // Center X (viewport-relative)
        y: sourceRect.top + sourceRect.height / 2   // Center Y (viewport-relative)
      };
    }

    // Set default end point: use target's center if endPoint is undefined
    if (!endPoint) {
      if (!target) {
        throw new Error('Either endPoint or target must be provided');
      }
      const targetRect = target.getBoundingClientRect();
      endPoint = {
        x: targetRect.left + targetRect.width / 2,  // Center X (viewport-relative)
        y: targetRect.top + targetRect.height / 2   // Center Y (viewport-relative)
      };
    }

    // Default to document element for fallback
    const defaultElement = document.documentElement;

    // Infer source/target from coordinates if not explicitly provided
    const dragSource = source
      || (document.elementFromPoint(startPoint.x, startPoint.y) as HTMLElement)
      || defaultElement;
    const dropTarget = target
      || (document.elementFromPoint(endPoint.x, endPoint.y) as HTMLElement)
      || defaultElement;

    // Create data transfer object
    const dataTransfer = this.createDataTransfer();
    Object.entries(data).forEach(([format, value]) => {
      dataTransfer.setData(format, value);
    });

    // Calculate movement parameters
    const steps = Math.ceil(totalDuration / stepInterval);
    const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    // Convert viewport-relative start point to source-relative for event dispatch
    const sourceRect = dragSource.getBoundingClientRect();
    const startRelativeX = startPoint.x - sourceRect.left;
    const startRelativeY = startPoint.y - sourceRect.top;

    // 1. Initial hover and press events on source
    this.dispatchPointerEvent('pointerover', dragSource, startRelativeX, startRelativeY, button, buttons);
    this.dispatchMouseEvent('mouseover', dragSource, startRelativeX, startRelativeY, button, buttons);

    this.dispatchPointerEvent('pointerenter', dragSource, startRelativeX, startRelativeY, button, buttons);
    this.dispatchMouseEvent('mouseenter', dragSource, startRelativeX, startRelativeY, button, buttons);

    this.dispatchPointerEvent('pointerdown', dragSource, startRelativeX, startRelativeY, button, buttons);
    this.dispatchMouseEvent('mousedown', dragSource, startRelativeX, startRelativeY, button, buttons);

    await wait(50); // Natural delay after press

    // 2. Start drag operation
    this.dispatchDragEvent('dragstart', dragSource, startRelativeX, startRelativeY, dataTransfer);

    // 3. Simulate movement along viewport-relative path
    let lastElement: HTMLElement = dragSource;
    let currentX = startPoint.x; // Viewport-relative X
    let currentY = startPoint.y; // Viewport-relative Y

    for (let i = 1; i <= steps; i++) {
      // Easing for natural acceleration/deceleration
      const t = i / steps;
      const easeT = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

      // Update viewport-relative position
      currentX = startPoint.x + (endPoint.x - startPoint.x) * easeT;
      currentY = startPoint.y + (endPoint.y - startPoint.y) * easeT;

      // Find element under current viewport position
      const currentElement = document.elementFromPoint(currentX, currentY) as HTMLElement || defaultElement;

      // Convert viewport coords to current element's relative coords
      const currentRect = currentElement.getBoundingClientRect();
      const relativeX = currentX - currentRect.left;
      const relativeY = currentY - currentRect.top;

      // Dispatch movement events
      this.dispatchPointerEvent('pointermove', currentElement, relativeX, relativeY, button, buttons);
      this.dispatchMouseEvent('mousemove', currentElement, relativeX, relativeY, button, buttons);
      this.dispatchDragEvent('drag', currentElement, relativeX, relativeY, dataTransfer);

      // Handle element transitions
      if (currentElement !== lastElement) {
        // Leave previous element
        const lastRect = lastElement.getBoundingClientRect();
        const lastRelativeX = currentX - lastRect.left;
        const lastRelativeY = currentY - lastRect.top;

        this.dispatchDragEvent('dragleave', lastElement, lastRelativeX, lastRelativeY, dataTransfer);
        this.dispatchPointerEvent('pointerout', lastElement, lastRelativeX, lastRelativeY, button, buttons);
        this.dispatchMouseEvent('mouseout', lastElement, lastRelativeX, lastRelativeY, button, buttons);

        // Enter new element
        this.dispatchDragEvent('dragenter', currentElement, relativeX, relativeY, dataTransfer);
        this.dispatchPointerEvent('pointerover', currentElement, relativeX, relativeY, button, buttons);
        this.dispatchMouseEvent('mouseover', currentElement, relativeX, relativeY, button, buttons);

        lastElement = currentElement;
      }

      // Special handling for target element
      if (currentElement === dropTarget) {
        this.dispatchDragEvent('dragover', dropTarget, relativeX, relativeY, dataTransfer);
      }

      await wait(stepInterval);
    }

    // 4. Final drop on target (convert viewport to target-relative)
    const targetRect = dropTarget.getBoundingClientRect();
    const endRelativeX = currentX - targetRect.left;
    const endRelativeY = currentY - targetRect.top;

    this.dispatchDragEvent('drop', dropTarget, endRelativeX, endRelativeY, dataTransfer);

    // 5. Release mouse button
    this.dispatchPointerEvent('pointerup', dropTarget, endRelativeX, endRelativeY, button, 0);
    this.dispatchMouseEvent('mouseup', dropTarget, endRelativeX, endRelativeY, button, 0);

    // 6. Complete drag operation
    this.dispatchDragEvent('dragend', dragSource, startRelativeX, startRelativeY, dataTransfer);

    // 7. Cleanup events
    this.dispatchPointerEvent('pointerout', dropTarget, endRelativeX, endRelativeY, button, 0);
    this.dispatchMouseEvent('mouseout', dropTarget, endRelativeX, endRelativeY, button, 0);

    this.dispatchPointerEvent('pointerleave', dropTarget, endRelativeX, endRelativeY, button, 0);
    this.dispatchMouseEvent('mouseleave', dropTarget, endRelativeX, endRelativeY, button, 0);
  }

  /**
   * Creates a simplified DataTransfer object with zero type errors
   * Focuses on core drag-drop functionality without unnecessary complexity
   */
  private static createDataTransfer(): DataTransfer {
    const stringData = new Map<string, string>(); // Stores string data (format → value)
    const types: string[] = []; // Tracks unique data formats

    // Simplified DataTransferItemList implementation (matches DOM interface)
    const items: DataTransferItemList = {
      // Read-only length property
      get length(): number {
        return types.length;
      },

      // Add data (handles both string and File without overloads to avoid type issues)
      add: function (dataOrFile: string | File, type?: string): DataTransferItem | null {
        // Handle File input (type is optional here, uses File's type)
        if (dataOrFile instanceof File) {
          const file = dataOrFile;
          const fileType = file.type || 'application/octet-stream';
          if (!types.includes(fileType)) {
            types.push(fileType);
          }
          return {
            kind: 'file',
            type: fileType,
            getAsFile: () => file,
            // Fix: Check if callback exists before invoking
            getAsString: (callback) => {
              if (callback) callback(file.name);
            }
          } as DataTransferItem;
        }

        // Handle string data input (requires type parameter)
        if (typeof dataOrFile === 'string' && type) {
          stringData.set(type, dataOrFile);
          if (!types.includes(type)) {
            types.push(type);
          }
          return {
            kind: 'string',
            type,
            getAsFile: () => null,
            // Fix: Check if callback exists before invoking
            getAsString: (callback) => {
              if (callback) callback(stringData.get(type) || '');
            }
          } as DataTransferItem;
        }

        return null; // Invalid input
      },

      // Remove item by index
      remove: (index: number): void => {
        if (index >= 0 && index < types.length) {
          const removedType = types.splice(index, 1)[0];
          stringData.delete(removedType);
        }
      },

      // Clear all items
      clear: (): void => {
        stringData.clear();
        types.length = 0;
      }

      // Fix: Removed [Symbol.iterator] as it's not required for basic functionality
      // and was causing "unknown property" errors
    };

    // Complete DataTransfer object
    return {
      dropEffect: 'move',
      effectAllowed: 'all',
      files: new FileList(),
      items,
      // Read-only types array
      get types(): string[] {
        return [...types];
      },
      // Clear data by format (or all data)
      clearData: (format?: string): void => {
        if (format) {
          stringData.delete(format);
          const index = types.indexOf(format);
          if (index !== -1) types.splice(index, 1);
        } else {
          stringData.clear();
          types.length = 0;
        }
      },
      // Get data by format
      getData: (format: string): string => {
        return stringData.get(format) || '';
      },
      // Set string data
      setData: (format: string, data: string): void => {
        stringData.set(format, data);
        if (!types.includes(format)) {
          types.push(format);
        }
      },
      // Stub for drag image (not needed for simulation)
      setDragImage: (img: Element | null, x: number, y: number): void => { }
    } as DataTransfer;
  }
}
