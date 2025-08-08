/**
 * @copyright 2025 Sagi All Rights Reserved.
 * @author: Sagi <sagibrant@163.com>
 * @license Apache-2.0
 * @file Browser.ts
 * @description 
 * Class for Browser automation
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

import { BrowserUtils, RtidUtil, Utils } from "@/common/Common";
import { Logger } from "@/common/Logger";
import * as api from "@/types/api";
import { IMsgChannel } from "./Channel";
import { Window } from "./Window";
import { Page } from "./Page";
import { Rtid } from "@/types/message";

export class Browser implements api.Browser {
  protected readonly logger: Logger;
  private readonly _channel: IMsgChannel;
  private readonly _rtid: Rtid;

  constructor(channel: IMsgChannel, rtid: Rtid) {
    const prefix = Utils.isEmpty(this.constructor?.name) ? "Browser" : this.constructor?.name;
    this.logger = new Logger(prefix);
    this._channel = channel;
    this._rtid = rtid;
  }

  /** ==================================================================================================================== */
  /** ==================================================== properties ==================================================== */
  /** ==================================================================================================================== */

  rtid(): Rtid {
    return this._rtid;
  }

  name(): string {
    const info = BrowserUtils.getBrowserInfo();
    return info.name;
  }

  version(): string {
    const info = BrowserUtils.getBrowserInfo();
    return info.version;
  }

  majorVersion(): number {
    const info = BrowserUtils.getBrowserInfo();
    return info.majorVersion;
  }

  async windows(): Promise<api.Window[]> {
    const result: api.Window[] = [];
    const windowObjs = await this._channel.queryObjects(this._rtid, { type: 'window' });
    for (const win of windowObjs) {
      const window = new Window(this, this._channel, win.rtid);
      result.push(window);
    }
    return result;
  }

  async pages(): Promise<api.Page[]> {
    const result: api.Page[] = [];
    const tabObjs = await this._channel.queryObjects(this._rtid, { type: 'tab' });
    for (const tab of tabObjs) {
      const page = new Page(this, this._channel, tab.rtid);
      result.push(page);
    }
    return result;
  }

  async lastFocusedWindow(): Promise<api.Window> {
    const windowObjs = await this._channel.queryObjects(this._rtid, {
      type: 'window',
      queryInfo: { primary: [{ name: 'lastFocused', value: true, type: 'property', match: 'exact' }] }
    });
    if (windowObjs.length === 1) {
      const window = new Window(this, this._channel, windowObjs[0].rtid);
      return window;
    }
    else {
      throw new Error('Failed on query the last focused window.');
    }
  }

  async lastActivePage(): Promise<api.Page> {
    const tabs = await this._channel.queryObjects(this._rtid, {
      type: 'tab',
      queryInfo: {
        primary: [
          { name: 'active', value: true, type: 'property', match: 'exact' },
          { name: 'lastFocusedWindow', value: true, type: 'property', match: 'exact' }]
      }
    });
    if (tabs.length === 1) {
      const page = new Page(this, this._channel, tabs[0].rtid);
      return page;
    }
    else {
      throw new Error('Failed on query the last active page.');
    }
  }


  /** ==================================================================================================================== */
  /** ====================================================== methods ===================================================== */
  /** ==================================================================================================================== */

  async enableCDP(): Promise<void> {
    await this._channel.invokeFunction(this._rtid, 'enableCDP', []);
  }

  async disableCDP(): Promise<void> {
    await this._channel.invokeFunction(this._rtid, 'disableCDP', []);
  }

  async setDefaultTimeout(timeout: number): Promise<void> {
    this._channel.setDefaultTimeout(timeout);
  }

  async openNewWindow(url?: string): Promise<api.Window> {
    const windowInfo = await this._channel.invokeFunction(this._rtid, 'openNewWindow', [url]);
    if (windowInfo && !Utils.isNullOrUndefined((windowInfo as any).id)) {
      const windowId = (windowInfo as any).id;
      const windowRtid = RtidUtil.getWindowRtid(windowId);
      const window = new Window(this, this._channel, windowRtid);
      return window;
    }
    else {
      throw new Error('Failed on open new window.');
    }
  }

  async openNewPage(url?: string): Promise<api.Page> {
    const lastFocusedWindow = await this.lastFocusedWindow();
    return await lastFocusedWindow.openNewPage(url);
  }

  async close(): Promise<void> {
    await this._channel.invokeFunction(this._rtid, 'close', []);
  }
}