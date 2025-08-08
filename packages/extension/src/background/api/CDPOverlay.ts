/**
 * @copyright 2025 Sagi All Rights Reserved.
 * @author: Sagi <sagibrant@163.com>
 * @license Apache-2.0
 * @file CDPOverlay.ts
 * @description 
 * Provide wrapper class for Overlay in Chrome DevTool Protocol APIs
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
 * Wrapper for CDP Overlay operations.
 * Provides methods for visual overlays (e.g., highlighting).
 */
export class CDPOverlay {
  private _tabId: number;
  private _cdp: ChromeDevToolsProtocol;

  /**
   * Create an overlay controller for a tab.
   * @param tabId - Tab ID to control
   * @param cdp - CDP instance
   */
  constructor(tabId: number, cdp: ChromeDevToolsProtocol) {
    this._tabId = tabId;
    this._cdp = cdp;
  }

  /**
   * Highlight a rectangle using the Overlay domain.
   * @param rect - Rectangle coordinates and style
   * @param successCallback - Called on success
   * @param failCallback - Called on error
   */
  async highlightRect(
    rect: unknown
  ): Promise<void> {
    await this._cdp.attachTab(this._tabId);
    // default color picked from chrome:
    // Formula for foreground color: 
    // c_final = (1-a)*c_background + a*c_forground
    // c_background = #FFFFFF = rgb(255, 255, 255)
    // c_forground = (c_final - (1-a)*c_background)/a
    // 1. inspected item:c_final = #A0C5E8 rgb(160, 197, 232), c_forground = rgba(18, 110, 198, 0.4)
    // 2: padding: c_final = #C4DDB8 rgb(196, 221, 184), c_forground = rgba(108, 170, 78, 0.4)
    // 3: border: c_final = #FFEDBC rgb(255, 237, 188) , c_forground = rgba(255, 210, 88, 0.4)
    // 4: marging: c_final = #F9CB9D rgb(249, 203, 157), c_forground = rgba(240, 125, 10, 0.4)
    const rectWithDefaults = {
      outlineColor: { r: 18, g: 110, b: 198, a: 0 },
      color: { r: 18, g: 110, b: 198, a: 0.4 },
      ...rect as any
    };
    await this._cdp.sendCommand(this._tabId, "Overlay.highlightRect", rectWithDefaults);
  }

  /**
   * Hide any active overlay highlight.
   * @param successCallback - Called on success
   * @param failCallback - Called on error
   */
  async hideHighlight(): Promise<void> {
    await this._cdp.attachTab(this._tabId);
    await this._cdp.sendCommand(this._tabId, "Overlay.hideHighlight", undefined);
  }
};