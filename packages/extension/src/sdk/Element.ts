/**
 * @copyright 2025 Sagi All Rights Reserved.
 * @author: Sagi <sagibrant@163.com>
 * @license Apache-2.0
 * @file Element.ts
 * @description 
 * Class for Element automation
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
import * as api from "@/types/api";
import { Rtid } from "@/types/message";
import { IMsgChannel } from "./Channel";

export class Element implements api.Element {
  protected readonly logger: Logger;
  private readonly _browser: api.Browser;
  private readonly _page: api.Page;
  private readonly _frame: api.Frame;
  private readonly _rtid: Rtid;
  private readonly _channel: IMsgChannel;

  constructor(browser: api.Browser, page: api.Page, frame: api.Frame, channel: IMsgChannel, rtid: Rtid) {
    const prefix = Utils.isEmpty(this.constructor?.name) ? "Frame" : this.constructor?.name;
    this.logger = new Logger(prefix);
    this._browser = browser;
    this._page = page;
    this._frame = frame;
    this._channel = channel;
    this._rtid = rtid;
  }

  /** ==================================================================================================================== */
  /** ==================================================== properties ==================================================== */
  /** ==================================================================================================================== */
  rtid(): Rtid {
    return this._rtid;
  }

  page(): api.Page {
    return this._page;
  }

  contentFrame(): api.Frame {
    throw new Error("Method not implemented.");
  }
  value(): Promise<string> {
    throw new Error("Method not implemented.");
  }
  innerHTML(): Promise<string> {
    throw new Error("Method not implemented.");
  }
  outerHTML(): Promise<string> {
    throw new Error("Method not implemented.");
  }
  innerText(): Promise<string> {
    throw new Error("Method not implemented.");
  }
  textContent(): Promise<string> {
    throw new Error("Method not implemented.");
  }
  boundingBox(): Promise<api.RectInfo> {
    throw new Error("Method not implemented.");
  }


  /** ==================================================================================================================== */
  /** ====================================================== methods ===================================================== */
  /** ==================================================================================================================== */


  getAttribute(): Promise<string | null> {
    throw new Error("Method not implemented.");
  }
  getAttributes(): Promise<Record<string, unknown>> {
    throw new Error("Method not implemented.");
  }
  setAttribute(): Promise<void> {
    throw new Error("Method not implemented.");
  }
  hasAttribute(): Promise<boolean> {
    throw new Error("Method not implemented.");
  }
  async querySelectorAll(selector: string): Promise<api.Element[]> {
    const aos = await this._channel.queryObjects(this._rtid, {
      type: 'element',
      queryInfo: {
        primary: [
          { name: '#css', value: selector, type: 'property', match: 'exact' }
        ]
      }
    });
    const results: api.Element[] = [];
    for (const ao of aos) {
      const elem = new Element(this._browser, this._page, this._frame, this._channel, ao.rtid);
      results.push(elem);
    }
    return results;
  }

  click(): Promise<void> {
    throw new Error("Method not implemented.");
  }
  dblClick(): Promise<void> {
    throw new Error("Method not implemented.");
  }
  focus(): Promise<void> {
    throw new Error("Method not implemented.");
  }
  hover(): Promise<void> {
    throw new Error("Method not implemented.");
  }
  blur(): Promise<void> {
    throw new Error("Method not implemented.");
  }
  check(): Promise<void> {
    throw new Error("Method not implemented.");
  }
  uncheck(): Promise<void> {
    throw new Error("Method not implemented.");
  }
  clear(): Promise<void> {
    throw new Error("Method not implemented.");
  }
  select(): Promise<void> {
    throw new Error("Method not implemented.");
  }
  tap(): Promise<void> {
    throw new Error("Method not implemented.");
  }
  dragTo(target: api.Element, options: { sourcePosition: api.Point; targetPosition: api.Point; }): Promise<void> {
    throw new Error("Method not implemented.");
  }
  scrollIntoViewIfNeeded(): Promise<void> {
    throw new Error("Method not implemented.");
  }
  dispatchEvent(type: string, options?: object): Promise<void> {
    throw new Error("Method not implemented.");
  }

  async clickEx(options?: {
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
  }): Promise<void> {
    throw new Error("Method not implemented.");
  }

  async setTextEx(text: string,
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
  ): Promise<void> {
    throw new Error("Method not implemented.");
  }

  /** ==================================================================================================================== */
  /** ==================================================== DOM Object ==================================================== */
  /** ==================================================================================================================== */

  $0(): any {
    const rawObj = new Proxy(this, {
      get: async (target, prop) => {
        //console.log(`getting ${prop} from ${target}`);
      },

      set: (target, prop, value, receiver) => {
        //console.log(`setting ${prop} from ${target} to ${value}`);
        return true;
      },
    });

    return rawObj;
  }

}