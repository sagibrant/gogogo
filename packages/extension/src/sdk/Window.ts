/**
 * @copyright 2025 Sagi All Rights Reserved.
 * @author: Sagi <sagibrant@163.com>
 * @license Apache-2.0
 * @file Window.ts
 * @description 
 * Class for Window automation
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

import { RtidUtil, Utils } from "@/common/Common";
import { Logger } from "@/common/Logger";
import * as api from "@/types/api";
import { IMsgChannel } from "./Channel";
import { Page } from "./Page";
import { Rtid } from "@/types/message";

export class Window implements api.Window {
  protected readonly logger: Logger;
  private readonly _browser: api.Browser;
  private readonly _rtid: Rtid;
  private readonly _channel: IMsgChannel;

  constructor(browser: api.Browser, channel: IMsgChannel, rtid: Rtid) {
    const prefix = Utils.isEmpty(this.constructor?.name) ? "Window" : this.constructor?.name;
    this.logger = new Logger(prefix);
    this._browser = browser;
    this._channel = channel;
    this._rtid = rtid;
  }

  /** ==================================================================================================================== */
  /** ==================================================== properties ==================================================== */
  /** ==================================================================================================================== */

  rtid(): Rtid {
    return this._rtid;
  }

  async state(): Promise<'normal'|'minimized'|'maximized'|'fullscreen'|'locked-fullscreen'> {
    const propValue = await this._channel.queryProperty(this._rtid, 'state');
    return propValue as 'normal'|'minimized'|'maximized'|'fullscreen'|'locked-fullscreen';
  }

  async focused(): Promise<boolean> {
    const propValue = await this._channel.queryProperty(this._rtid, 'focused');
    return propValue as boolean;
  }

  async incognito(): Promise<boolean> {
    const propValue = await this._channel.queryProperty(this._rtid, 'incognito');
    return propValue as boolean;
  }

  browser(): api.Browser {
    return this._browser;
  }
  
  async pages(): Promise<api.Page[]> {
    const result: api.Page[] = [];
    const tabs = await this._channel.queryObjects(this._rtid, { type: 'tab' });
    for (const tab of tabs) {
      const page = new Page(this._browser, this._channel, tab.rtid);
      result.push(page);
    }
    return result;
  }

  async activePage(): Promise<api.Page> {
    const tabs = await this._channel.queryObjects(this._rtid, {
      type: 'tab',
      queryInfo: {
        primary: [
          { name: 'active', value: true, type: 'property', match: 'exact' }
        ]
      }
    });
    if (tabs.length === 1) {
      const page = new Page(this._browser, this._channel, tabs[0].rtid);
      return page;
    }
    else {
      throw new Error('Failed on query the last active page.');
    }
  }

  /** ==================================================================================================================== */
  /** ====================================================== methods ===================================================== */
  /** ==================================================================================================================== */

  async openNewPage(url?: string): Promise<api.Page> {
    const tabInfo = await this._channel.invokeFunction(this._rtid, 'openNewTab', [url]);
    if (tabInfo && !Utils.isNullOrUndefined((tabInfo as any).id)) {
      const tabId = (tabInfo as any).id;
      const tabRtid = RtidUtil.getTabRtid(tabId, -1);
      const page = new Page(this._browser, this._channel, tabRtid);
      return page;
    }
    else {
      throw new Error('Failed on openNewPage.');
    }
  }

  async focus(): Promise<void> {
    await this._channel.invokeFunction(this._rtid, 'focus', []);
  }

  async close(): Promise<void> {
    await this._channel.invokeFunction(this._rtid, 'close', []);
  }

  async minimize(): Promise<void> {
    await this._channel.invokeFunction(this._rtid, 'minimize', []);
  }

  async maximize(): Promise<void> {
    await this._channel.invokeFunction(this._rtid, 'maximize', []);
  }

  async restore(): Promise<void> {
    await this._channel.invokeFunction(this._rtid, 'restore', []);
  }

  async fullscreen(toggle: boolean = true): Promise<void> {
    await this._channel.invokeFunction(this._rtid, 'fullscreen', [toggle]);
  }
}