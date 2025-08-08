/**
 * @copyright 2025 Sagi All Rights Reserved.
 * @author: Sagi <sagibrant@163.com>
 * @license Apache-2.0
 * @file CDPDOM.ts
 * @description 
 * Provide wrapper class for DOM in Chrome DevTool Protocol APIs
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

import { ChromeDevToolsProtocol } from "./ChromeDevToolsProtocol";

/**
 * Wrapper for CDP DOM operations.
 * Provides methods for highlighting DOM elements.
 */
export class CDPDOM {
  private _tabId: number;
  private _cdp: ChromeDevToolsProtocol;

  /**
   * Create a DOM controller for a tab.
   * @param tabId - Tab ID to control
   * @param cdp - CDP instance
   */
  constructor(tabId: number, cdp: ChromeDevToolsProtocol) {
    this._tabId = tabId;
    this._cdp = cdp;
  }


  /**
   * Highlight a rectangle on the page.
   * @param rect - Rectangle coordinates and style
   * @param successCallback - Called on success
   * @param failCallback - Called on error
   */
  async highlightRect(
    rect: unknown,
  ): Promise<void> {
    await this._cdp.attachTab(this._tabId);
    const rectWithDefaults = {
      outlineColor: { r: 18, g: 110, b: 198, a: 0 },
      color: { r: 18, g: 110, b: 198, a: 0.4 },
      ...(rect as any)
    };
    await this._cdp.sendCommand(this._tabId, "DOM.highlightRect", rectWithDefaults);
  }

  /**
   * Hide any active DOM highlight.
   * @param successCallback - Called on success
   * @param failCallback - Called on error
   */
  async hideHighlight(): Promise<void> {
    await this._cdp.attachTab(this._tabId);
    await this._cdp.sendCommand(this._tabId, "DOM.hideHighlight", undefined);
  }
};