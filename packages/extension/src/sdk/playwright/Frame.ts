/**
 * @copyright 2025 Sagi All Rights Reserved.
 * @author: Sagi <sagibrant@163.com>
 * @license Apache-2.0
 * @file Frame.ts
 * @description 
 * Class for Frame which implement the playwright types
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
import { Logger } from "@/common/Logger";
import * as api from "@/types/playwright/types";

export type role = "alert" | "alertdialog" | "application" | "article" | "banner" | "blockquote" | "button" | "caption" | "cell" | "checkbox" | "code" | "columnheader" | "combobox" | "complementary" | "contentinfo" | "definition" | "deletion" | "dialog" | "directory" | "document" | "emphasis" | "feed" | "figure" | "form" | "generic" | "grid" | "gridcell" | "group" | "heading" | "img" | "insertion" | "link" | "list" | "listbox" | "listitem" | "log" | "main" | "marquee" | "math" | "meter" | "menu" | "menubar" | "menuitem" | "menuitemcheckbox" | "menuitemradio" | "navigation" | "none" | "note" | "option" | "paragraph" | "presentation" | "progressbar" | "radio" | "radiogroup" | "region" | "row" | "rowgroup" | "rowheader" | "scrollbar" | "search" | "searchbox" | "separator" | "slider" | "spinbutton" | "status" | "strong" | "subscript" | "superscript" | "switch" | "tab" | "table" | "tablist" | "tabpanel" | "term" | "textbox" | "time" | "timer" | "toolbar" | "tooltip" | "tree" | "treegrid" | "treeitem";

export class Frame implements Partial<api.Frame> {

  protected readonly logger: Logger;
  constructor() {
    const prefix = Utils.isEmpty(this.constructor?.name) ? "Frame" : this.constructor?.name;
    this.logger = new Logger(prefix);
  }

  /** ==================================================================================================================== */
  /** ==================================================== properties ==================================================== */
  /** ==================================================================================================================== */

  childFrames(): Array<api.Frame> {
    throw new Error("Method not implemented.");
  }

  async content(): Promise<string> {
    throw new Error("Method not implemented."); 
  }

  name(): string {
    throw new Error("Method not implemented."); 
  }

  page(): api.Page {
    throw new Error("Method not implemented."); 
  }

  parentFrame(): null | api.Frame {
    throw new Error("Method not implemented."); 
  }

  async title(): Promise<string> {
    throw new Error("Method not implemented."); 
  }

  url(): string {
    throw new Error("Method not implemented."); 
  }

  /** ==================================================================================================================== */
  /** ====================================================== methods ===================================================== */
  /** ==================================================================================================================== */

  async dragAndDrop(source: string, target: string, options?: { force?: boolean; noWaitAfter?: boolean; sourcePosition?: { x: number; y: number; }; strict?: boolean; targetPosition?: { x: number; y: number; }; timeout?: number; trial?: boolean; }): Promise<void> {
    throw new Error("Method not implemented.");
  }

  async waitForLoadState(state?: "load" | "domcontentloaded" | "networkidle", options?: { timeout?: number; }): Promise<void> {
    throw new Error("Method not implemented.");
  }

  /** ==================================================================================================================== */
  /** ====================================================== locator ===================================================== */
  /** ==================================================================================================================== */

  getByRole(role: role, options?: {
    checked?: boolean;
    disabled?: boolean;
    exact?: boolean;
    expanded?: boolean;
    includeHidden?: boolean;
    level?: number;
    name?: string | RegExp;
    pressed?: boolean;
    selected?: boolean;
  }): api.Locator {
    throw new Error("Method not implemented.");
  }

  locator(selector: string, options?: {
    has?: api.Locator;
    hasNot?: api.Locator;
    hasNotText?: string | RegExp;
    hasText?: string | RegExp;
  }): api.Locator {
    throw new Error("Method not implemented.");
  }

}