/**
 * @copyright 2025 Sagi All Rights Reserved.
 * @author: Sagi <sagibrant@163.com>
 * @license Apache-2.0
 * @file Page.ts
 * @description 
 * Class for Page automation
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
import { Window } from "./Window";
import { Element } from "./Element";
import * as api from "@/types/api";
import { IMsgChannel } from "./Channel";
import { Rtid } from "@/types/message";
import { Frame } from "./Frame";

export class Page implements api.Page {
  protected readonly logger: Logger;
  private readonly _browser: api.Browser;
  private readonly _rtid: Rtid;
  private readonly _channel: IMsgChannel;
  constructor(browser: api.Browser, channel: IMsgChannel, rtid: Rtid) {
    const prefix = Utils.isEmpty(this.constructor?.name) ? "Page" : this.constructor?.name;
    this.logger = new Logger(prefix);
    this._browser = browser;
    this._channel = channel;
    this._rtid = rtid;
    this._rtid.window = -1; // windowId may be changed
  }

  /** ==================================================================================================================== */
  /** ==================================================== properties ==================================================== */
  /** ==================================================================================================================== */
  rtid(): Rtid {
    return this._rtid;
  }

  async url(): Promise<string> {
    const propValue = await this._channel.queryProperty(this._rtid, 'url');
    return propValue as string;
  }

  async title(): Promise<string> {
    const propValue = await this._channel.queryProperty(this._rtid, 'title');
    return propValue as string;
  }

  async status(): Promise<'unloaded' | 'loading' | 'complete'> {
    const propValue = await this._channel.queryProperty(this._rtid, 'status');
    return propValue as 'unloaded' | 'loading' | 'complete';
  }

  async closed(): Promise<boolean> {
    const pages = this._browser.pages();
    const page = (await pages).find(p => RtidUtil.isRtidEqual((p as Page).rtid(), this._rtid));
    if (page) {
      return false;
    }
    else {
      return true;
    }
  }

  async window(): Promise<api.Window | null> {
    const aos = await this._channel.queryObjects(this._rtid, { type: 'window' });
    if (aos.length === 1) {
      const window = new Window(this._browser, this._channel, aos[0].rtid);
      return window;
    }
    else {
      return null;
    }
  }

  mainFrame(): api.Frame {
    const rtid = Utils.deepClone(this._rtid);
    rtid.context = 'content';
    rtid.frame = 0;
    const frame = new Frame(this._browser, this, this._channel, rtid);
    return frame;
  }

  async frames(): Promise<api.Frame[]> {
    const result: api.Frame[] = [];
    const aos = await this._channel.queryObjects(this._rtid, { type: 'frame' });
    for (const ao of aos) {
      const frame = new Frame(this._browser, this, this._channel, ao.rtid);
      result.push(frame);
    }
    return result;
  }

  /** ==================================================================================================================== */
  /** ====================================================== methods ===================================================== */
  /** ==================================================================================================================== */

  async active(): Promise<void> {
    await this._channel.invokeFunction(this._rtid, 'active', []);
  }

  async bringToFront(): Promise<void> {
    const window = await this.window();
    if (window) {
      await window.focus();
    }
    await this.active();
  }

  async sync(timeout: number = 5000): Promise<void> {
    const check = async () => {
      const status = await this.status();
      return status === 'complete';
    };
    const result = await Utils.wait(check, timeout, 500);
    if(!result) {
      this.logger.warn('sync: status is still not complete');
    }
  }

  async openNewPage(url?: string): Promise<api.Page> {
    const tabInfo = await this._channel.invokeFunction(this._rtid, 'openNewTab', [url]);
    if (tabInfo && !Utils.isNullOrUndefined((tabInfo as any).id)) {
      const tabId = (tabInfo as any).id;
      const tabRtid = RtidUtil.getTabRtid(tabId, -1);
      const newPage = new Page(this._browser, this._channel, tabRtid);
      return newPage;
    }
    else {
      throw new Error('Failed on open new page');
    }
  }

  async navigate(url?: string): Promise<void> {
    await this._channel.invokeFunction(this._rtid, 'navigate', [url]);
  }

  async refresh(bypassCache: boolean = false): Promise<void> {
    await this._channel.invokeFunction(this._rtid, 'reload', [bypassCache]);
  }

  async back(): Promise<void> {
    await this._channel.invokeFunction(this._rtid, 'goBack', []);
  }

  async forward(): Promise<void> {
    await this._channel.invokeFunction(this._rtid, 'goForward', []);
  }

  async close(): Promise<void> {
    await this._channel.invokeFunction(this._rtid, 'close', []);
  }

  async zoom(zoomFactor: number): Promise<void> {
    await this._channel.invokeFunction(this._rtid, 'zoom', [zoomFactor]);
  }

  async moveToWindow(window: api.Window, index?: number): Promise<void> {
    const windowId = (window as Window).rtid().window;
    await this._channel.invokeFunction(this._rtid, 'moveToWindow', [windowId, index]);
  }

  async captureScreenshot(): Promise<string> {
    const base64ImgString = await this._channel.invokeFunction(this._rtid, 'capturePage', []);
    return base64ImgString as string;
  }

  /** ==================================================================================================================== */
  /** ==================================================== DOM Object ==================================================== */
  /** ==================================================================================================================== */

  document(): any {
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

  /** ==================================================================================================================== */
  /** ====================================================== methods ===================================================== */
  /** ==================================================================================================================== */

  async executeScript(script: string): Promise<any> {
    const result = await this._channel.invokeFunction(this._rtid, 'executeScript', [script]);
    return result;
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
      const elem = new Element(this._browser, this, this.mainFrame(), this._channel, ao.rtid);
      results.push(elem);
    }
    return results;
  }

}
