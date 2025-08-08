/**
 * @copyright 2025 Sagi All Rights Reserved.
 * @author: Sagi <sagibrant@163.com>
 * @license Apache-2.0
 * @file Common.ts
 * @description 
 * Shared utility classes and functions
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

import { RectInfo } from "@/types/api";
import { Action, AODesc, ContextType, Message, MessageData, MessageDataType, Rtid } from "@/types/message";

/**
 * Browser detection result interface
 */
export interface BrowserInfo {
  name: 'chrome' | 'edge' | 'firefox' | 'safari' | 'unknown';
  version: string;
  majorVersion: number;
};

/**
 * Represents a key-value pair, optionally typed.
 */
export class NameValuePair<T = unknown> {
  constructor(
    _name: string | null = null,
    _value: T | null = null
  ) { }
}

/**
 * successCallback wrapper
 */
export type SuccessCallback = (result: any) => {};
/**
 * failCallback wrapper
 */
export type FailCallback = (result: any) => {};

export class Utils {
  /**
   * Checks if the provided value is `null` or `undefined`.
   * @param value The value to check.
   */
  static isNullOrUndefined(value: unknown): value is null | undefined {
    return value === null || value === undefined;
  }
  /**
     * Overload 1: Check for null | undefined (the most basic empty values)
     */
  static isEmpty(value: null | undefined): value is null | undefined;

  /**
   * Overload 2: Check for empty strings (including whitespace-only strings like "  ", "\t", "\n")
   */
  static isEmpty(value: string | null | undefined): value is null | undefined | "" | " " | "\t" | "\n";

  /**
   * Overload 3: Check for empty arrays (arrays with length 0)
   */
  static isEmpty<T>(value?: T[]): value is [] | undefined;

  /**
   * Overload 4: Check for empty Map
   */
  static isEmpty<K, V>(value: Map<K, V>): value is Map<never, never>;

  /**
   * Overload 5: Check for empty Set
   */
  static isEmpty<T>(value: Set<T>): value is Set<never>;

  /**
   * Overload 6: Check for empty objects (plain objects with no own properties, e.g., {})
   */
  static isEmpty(value: object): value is Record<string, never>;

  /**
   * Overload 7: Handle other unknown types (final match, returns whether empty)
   */
  static isEmpty(value: unknown): boolean;


  /**
   * Implementation logic: Determine if a value is "empty"
   * Definition of empty values:
   * - null/undefined
   * - Empty strings or whitespace-only strings (e.g., "", "  ", "\t", "\n")
   * - Empty arrays ([])
   * - Empty Map/Set
   * - Plain objects with no own properties (e.g., {})
   */
  static isEmpty(value: unknown): boolean {
    // 1. Directly treat null/undefined as empty
    if (value === null || value === undefined) {
      return true;
    }

    // 2. Strings: Empty or whitespace-only (length 0 after trim)
    if (typeof value === "string") {
      return value.trim().length === 0;
    }

    // 3. Arrays: Treat arrays with length 0 as empty
    if (Array.isArray(value)) {
      return value.length === 0;
    }

    // 4. Map/Set: Treat those with size 0 as empty
    if (value instanceof Map || value instanceof Set) {
      return value.size === 0;
    }

    // 5. Plain objects: Treat objects with no own properties as empty (null is excluded since checked above)
    if (typeof value === "object") {
      return Object.keys(value).length === 0;
    }

    // Other types (e.g., number, boolean, function, etc.): Not empty
    return false;
  }

  /**
   * Checks if the provided value is `function`.
   * @param value The value to check.
   */
  static isFunction(value: unknown): value is Function {
    return typeof (value as any) === 'function';
  }

  /**
   * Get the last chromium api error
   * @returns last chrome api error
   */
  static getLastError(): chrome.runtime.LastError | chrome.extension.LastError | undefined {
    if (typeof (chrome) === "undefined")
      return undefined;

    if (chrome && chrome.runtime && chrome.runtime.lastError)
      return chrome.runtime.lastError;

    if (chrome && chrome.extension && chrome.extension.lastError)
      return chrome.extension.lastError;

    return undefined;
  }

  /**
   * Generates a UUID using `crypto.randomUUID` if available,
   * otherwise falls back to timestamp-based unique ID.
   */
  static generateUUID(): string {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
    return `uid-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
  }

  /**
   * Deeply clones an object or array, excluding functions by default.
   * Supports circular references.
   * @param src The object to clone.
   * @param includeFunctions Whether to include functions in the clone.
   */
  static deepClone<T>(src: T, includeFunctions = false): T {
    const seen = new WeakMap();

    const clone = (input: unknown): unknown => {
      if (Utils.isNullOrUndefined(input)) return input;

      if (typeof input !== 'object') {
        return includeFunctions || typeof input !== 'function' ? input : undefined;
      }

      if (seen.has(input)) return seen.get(input);

      if (input instanceof Date) return new Date(input.getTime());
      if (input instanceof RegExp) return new RegExp(input);

      const output: unknown = Array.isArray(input) ? [] : {};
      seen.set(input, output);

      for (const [key, value] of Object.entries(input)) {
        if (!includeFunctions && typeof value === 'function') continue;
        (output as Record<string, unknown>)[key] = clone(value);
      }

      return output;
    };

    return clone(src) as T;
  }

  /**
   * get the item from source object
   * @param key item key
   * @param source source data object
   * @returns item value
   */
  static getItem<T>(key: string, source: Record<string, unknown> | undefined): T | undefined {
    if (Utils.isNullOrUndefined(source)) {
      return undefined;
    }
    if (key in source) {
      const value = source[key] as T;
      return value;
    }
    return undefined;
  }
  /**
   * Checks if the given string starts with the specified substring.
   * @param str The full string.
   * @param prefix The prefix to test.
   */
  static startsWith(str: string, prefix: string): boolean {
    return str.startsWith(prefix);
  }

  /**
   * fix the rectange object (fullfill the width, height, right, bottom)
   * @param {Partial<RectInfo>} rect 
   * @returns {RectInfo}
   */
  static fixRectange(rect: Partial<RectInfo>): RectInfo {
    if (!rect) {
      return rect;
    }
    // x + y = z
    const solveEquation = (x?: number, y?: number, z?: number) => {
      if (Utils.isNullOrUndefined(x) && !Utils.isNullOrUndefined(y) && !Utils.isNullOrUndefined(z)) {
        return [z - y, y, z];
      }
      if (!Utils.isNullOrUndefined(x) && Utils.isNullOrUndefined(y) && !Utils.isNullOrUndefined(z)) {
        return [x, z - x, z];
      }
      if (!Utils.isNullOrUndefined(x) && !Utils.isNullOrUndefined(y) && Utils.isNullOrUndefined(z)) {
        return [x, y, x + y];
      }
      return [x, y, z];
    };
    if (Utils.isNullOrUndefined(rect.left) && !Utils.isNullOrUndefined(rect.x)) {
      rect.left = rect.x;
    }
    if (Utils.isNullOrUndefined(rect.top) && !Utils.isNullOrUndefined(rect.y)) {
      rect.top = rect.y;
    }
    const result: Partial<RectInfo> = {};
    let arr = solveEquation(rect.left, rect.width, rect.right);
    result.left = arr[0];
    result.width = arr[1];
    result.right = arr[2];
    arr = solveEquation(rect.top, rect.height, rect.bottom);
    result.top = arr[0];
    result.height = arr[1];
    result.bottom = arr[2];

    result.x = result.left;
    result.y = result.top;
    return result as RectInfo;
  }

  /**
   * Returns all combinations of size k from the input array.
   * 
   * @template T - The type of elements in the array
   * @param arr - Input array of elements
   * @param k - Size of combinations to generate
   * @returns Array of all combinations of size k
   */
  static get_combinations<T>(arr: T[], k: number): T[][] {
    // Handle edge cases
    if (k === 0) return [[]];
    if (k > arr.length) return [];

    // Create sorted copy to handle duplicate elements
    // const sorted = [...arr].sort();
    const sorted = arr;
    const result: T[][] = [];

    /**
     * Backtracking function to generate combinations
     * @param start - Starting index for selection
     * @param current - Current combination being built
     */
    function backtrack(start: number, current: T[]) {
      // When current combination reaches size k, add to results
      if (current.length === k) {
        result.push([...current]);
        return;
      }

      // Iterate through remaining elements
      for (let i = start; i < sorted.length; i++) {
        // Skip duplicates to avoid identical combinations
        if (i > start && sorted[i] === sorted[i - 1]) continue;

        // Include current element
        current.push(sorted[i]);

        // Recurse with next elements
        backtrack(i + 1, current);

        // Backtrack: remove last element
        current.pop();
      }
    }

    backtrack(0, []);
    return result;
  }

  /**
   * wait for the checkFunc to be checked
   * @param checkFunc the check function to validate the requirements
   * @param timeout timeout
   * @param delay delay for each check
   * @returns property value match the expected value
   */
  static async wait(checkFunc: () => Promise<boolean>, timeout: number = 5000, delay: number = 500): Promise<boolean> {
    const end_time = performance.now() + timeout;
    return new Promise((resolve, reject) => {
      // Timer Ids
      let intervalId: any = undefined;
      let timeoutId: any = undefined;
      // Cleanup function to stop timers
      const cleanup = () => {
        clearInterval(intervalId);
        clearTimeout(timeoutId);
      };
      // Timeout: abort after `timeout` ms
      timeoutId = setTimeout(() => {
        cleanup();
        resolve(false);
      }, timeout);
      // Interval check: run every `delay` ms
      // also need to check if timeout, return asap
      intervalId = setInterval(async () => {
        if (performance.now() > end_time) {
          resolve(false);
          return;
        }
        const isMatch = await checkFunc();
        if (isMatch) {
          cleanup();
          resolve(true);
        }
        else if (performance.now() > end_time) {
          cleanup();
          resolve(false);
        }
      }, delay);
      // First check (handled asynchronously without await in the executor)
      checkFunc().then(firstCheck => {
        if (firstCheck) {
          cleanup();
          resolve(true);
        } else if (performance.now() > end_time) {
          cleanup();
          resolve(false);
        }
      }).catch(() => {
        // ignore the errors in the check function
      });
    });
  }

  /**
   * use requestAnimationFrame for wait 
   * @deprecated not working in extension
   * @param checkFunc the check function to validate the requirements
   * @param timeout timeout
   * @param delay delay for each check
   * @returns property value match the expected value
   */
  static async rafWait(checkFunc: () => Promise<boolean>, timeout: number = 5000, delay: number = 500): Promise<boolean> {
    if (typeof requestAnimationFrame !== 'function') {
      throw new Error('requestAnimationFrame is not a valid function');
    }
    const end_time = performance.now() + timeout;
    return new Promise((resolve, reject) => {
      let lastExecution: number | undefined = undefined;
      const rafFunc = async () => {
        // time out
        if (performance.now() >= end_time) {
          resolve(false);
          return;
        }

        try {
          if (Utils.isNullOrUndefined(lastExecution) || performance.now() - lastExecution >= delay) {
            lastExecution = performance.now();
            const isMatch = await checkFunc();
            lastExecution = performance.now();
            if (isMatch) {
              resolve(true);
              return;
            }
            else if (performance.now() >= end_time) {
              resolve(false);
              return;
            }
          }
        }
        catch { }
        requestAnimationFrame(rafFunc);
      };
      requestAnimationFrame(rafFunc);
    });
  }

  /**
   *Generates a timestamp with millisecond precision
   * Format: "YYYY-MM-DD HH:MM:SS.sss"
   * Example output: "2024-05-20 14:35:22.789"
   * @returns Formatted timestamp string
   */
  static getTimeStamp(): string {
    const date = new Date();

    // Extract date components with leading zeros where necessary
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
    const day = String(date.getDate()).padStart(2, '0');

    // Extract time components with leading zeros
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    // Extract milliseconds (0-999) and ensure 3 digits with leading zeros
    const milliseconds = String(date.getMilliseconds()).padStart(3, '0');

    // Combine into human-readable format
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${milliseconds}`;
  }

}

export class MsgUtil {

  static createMessageData(type: MessageDataType, dest: Rtid, action: Action, target?: AODesc) {
    return { type, dest, action, target } as MessageData;
  }

  static createEvent(data: MessageData, correlationId?: string): Message {
    return {
      type: 'event',
      uid: Utils.generateUUID(),
      timestamp: Date.now(),
      data: Utils.deepClone(data),
      correlationId: correlationId,
      syncId: undefined,
    };
  }

  static createRequest(data: MessageData, correlationId?: string): Message {
    return {
      type: 'request',
      uid: Utils.generateUUID(),
      timestamp: Date.now(),
      data: Utils.deepClone(data),
      correlationId: correlationId,
      syncId: Utils.generateUUID(),
    };
  }

  static createResponse(data: MessageData, syncId: string, correlationId?: string): Message {
    return {
      type: 'response',
      uid: Utils.generateUUID(),
      timestamp: Date.now(),
      data: Utils.deepClone(data),
      correlationId: correlationId,
      syncId: syncId,
    };
  }

  static cloneMessage(msg: Message): Message | undefined {
    if (msg.type === 'event') {
      return MsgUtil.createEvent(msg.data, msg.correlationId);
    }
    if (msg.type === 'request') {
      return MsgUtil.createRequest(msg.data, msg.correlationId);
    }
    if (msg.type === 'response') {
      return MsgUtil.createResponse(msg.data, msg.syncId!, msg.correlationId);
    }
    return undefined;
  }

}

export class RtidUtil {

  /**
   * Determines whether an object is an instance of `Rtid` or a compatible shape.
   * @param obj The object to check.
   */
  static isRtid(obj: unknown): obj is Rtid {
    return (
      typeof obj === 'object' &&
      obj !== null &&
      typeof (obj as any).browser === 'number' &&
      typeof (obj as any).tab === 'number' &&
      typeof (obj as any).frame === 'number' &&
      typeof (obj as any).object === 'number'
    );
  }

  /**
   * Compares two Rtid objects for structural equality.
   * @param a First Rtid object
   * @param b Second Rtid object
   */
  static isRtidEqual(a: unknown, b: unknown): boolean {
    return (
      RtidUtil.isRtid(a) &&
      RtidUtil.isRtid(b) &&
      a.object === b.object &&
      a.frame === b.frame &&
      a.tab === b.tab &&
      (a.tab === -1 ? a.window === b.window : true) && // compare window only if both tb === -1
      a.browser === b.browser &&
      a.context === b.context &&
      a.external === b.external
    );
  }

  static getAgentRtid(): Rtid {
    return {
      context: 'background',
      browser: -1,
      window: -1,
      tab: -1,
      frame: -1,
      object: -1
    } as Rtid;
  }

  static getBrowserRtid(browserId: number = 0): Rtid {
    return {
      context: 'background',
      browser: browserId,
      window: -1,
      tab: -1,
      frame: -1,
      object: -1
    } as Rtid;
  }

  static getWindowRtid(windowId: number): Rtid {
    return {
      context: 'background',
      browser: 0,
      window: windowId,
      tab: -1,
      frame: -1,
      object: -1
    } as Rtid;
  }

  static getTabRtid(tabId: number, windowId: number): Rtid {
    return {
      context: 'background',
      browser: 0,
      window: windowId,
      tab: tabId,
      frame: -1,
      object: -1
    } as Rtid;
  }

  static getRtidContextType(rtid: Rtid): ContextType | null {

    // message to the specified context
    if (!Utils.isEmpty(rtid.context)) {
      return rtid.context;
    }

    // message to another browser by native application forwarding
    // todo: currently we do not support multiple browsers
    if (rtid.browser > 0) {
      return 'external';
    }

    // agent rtid 
    if (rtid.browser === -1 && rtid.tab === -1 && rtid.frame === -1) {
      return 'background';
    }

    // current browser rtid 
    if (rtid.browser === 0 && rtid.tab === -1 && rtid.frame === -1) {
      return 'background';
    }

    // tab rtid 
    if (rtid.browser === 0 && rtid.tab >= 0 && rtid.frame === -1) {
      return 'background';
    }

    // frame rtid 
    if (rtid.browser === 0 && rtid.tab >= 0 && rtid.frame >= 0 && rtid.object === -1) {
      return 'content';
    }

    // frame rtid in MAIN WORLD
    if (rtid.browser === 0 && rtid.tab >= 0 && rtid.frame >= 0 && rtid.object === 0) {
      return 'MAIN';
    }

    // object rtid
    if (rtid.browser === 0 && rtid.tab >= 0 && rtid.frame >= 0 && rtid.object > 0) {
      return 'content';
    }

    return null;
  }
}

export class BrowserUtils {
  /** the device scale factor is decided by --force-device-scale-factor or same as the desktop scale */
  static deviceScaleFactor: number | undefined = undefined;
  /**
   * Detects the current browser name and version
   * Compatible with Chrome, Edge, Firefox, and Safari
   * @returns BrowserInfo object containing name, version, and major version
   */
  static getBrowserInfo(): BrowserInfo {
    const result: BrowserInfo = {
      name: 'unknown',
      version: 'unknown',
      majorVersion: 0
    };

    const userAgent = navigator.userAgent.toLowerCase();
    const vendor = navigator.vendor?.toLowerCase() || '';

    // 1. Detect Firefox first
    // Example UA: "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:129.0) Gecko/20100101 Firefox/129.0"
    if (userAgent.includes('firefox')) {
      result.name = 'firefox';
      const match = userAgent.match(/firefox\/(\d+\.\d+)/); // Extracts "129.0"
      if (match?.[1]) {
        result.version = match[1];
      }
      return result;
    }

    // 2. Detect Edge next
    // New Edge example: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 Edg/128.0.2739.50"
    // Legacy Edge example: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/46.0.2486.0 Safari/537.36 Edge/13.10586"
    if (userAgent.includes('edg') || userAgent.includes('edge')) {
      result.name = 'edge';
      // Matches "Edg/128.0.2739.50" or "edge/13.10586"
      const match = userAgent.match(/edg(\/| )(\d+\.\d+)/) ||
        userAgent.match(/edge\/(\d+\.\d+)/);
      if (match?.[2]) {
        result.version = match[2]; // For new Edge: "128.0.2739.50"
      } else if (match?.[1]) {
        result.version = match[1]; // For legacy Edge: "13.10586"
      }
      return result;
    }

    // 3. Detect Safari
    // Example UA: "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Safari/605.1.15"
    if (vendor.includes('apple') && userAgent.includes('safari') && !userAgent.includes('chrome')) {
      result.name = 'safari';
      const match = userAgent.match(/version\/(\d+\.\d+)/); // Extracts "17.6"
      if (match?.[1]) {
        result.version = match[1];
      }
      return result;
    }

    // 4. Finally detect Chrome
    // Example UA: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36"
    if (userAgent.includes('chrome') && vendor.includes('google')) {
      result.name = 'chrome';
      const match = userAgent.match(/chrome\/(\d+\.\d+)/); // Extracts "128.0.0.0"
      if (match?.[1]) {
        result.version = match[1];
      }
      return result;
    }

    // Extract major version
    if (result.version !== 'unknown') {
      result.majorVersion = parseInt(result.version.split('.')[0], 10) || 0;
    }

    return result;
  }
}