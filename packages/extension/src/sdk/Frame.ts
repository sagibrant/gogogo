/**
 * @copyright 2025 Sagi All Rights Reserved.
 * @author: Sagi <sagibrant@163.com>
 * @license Apache-2.0
 * @file Frame.ts
 * @description 
 * Class for Frame automation
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
import { Element } from "./Element";
import * as api from "@/types/api";
import { IMsgChannel } from "./Channel";
import { Rtid } from "@/types/message";

export class Frame implements api.Frame {
  protected readonly logger: Logger;
  private readonly _browser: api.Browser;
  private readonly _page: api.Page;
  private readonly _rtid: Rtid;
  private readonly _channel: IMsgChannel;

  constructor(browser: api.Browser, page: api.Page, channel: IMsgChannel, rtid: Rtid) {
    const prefix = Utils.isEmpty(this.constructor?.name) ? "Frame" : this.constructor?.name;
    this.logger = new Logger(prefix);
    this._browser = browser;
    this._page = page;
    this._channel = channel;
    this._rtid = rtid;
  }

  /** ==================================================================================================================== */
  /** ==================================================== properties ==================================================== */
  /** ==================================================================================================================== */
  rtid(): Rtid {
    return this._rtid;
  }

  async url(): Promise<string> {
    const tabId = Utils.deepClone(this._rtid);
    tabId.context = 'background';
    tabId.frame = -1;
    const frameInfoList = await this._channel.invokeFunction(tabId, 'frames', []);
    if (Utils.isNullOrUndefined(frameInfoList) || !Array.isArray(frameInfoList)) {
      throw new Error('fail to find the frame information');
    }
    for (const frameInfo of frameInfoList) {
      const { frameId, url } = frameInfo as any;
      if (frameId === this._rtid.frame && !Utils.isNullOrUndefined(url)) {
        return url as string;
      }
    }
    throw new Error('fail to find the frame url');
  }

  page(): api.Page {
    return this._page;
  }

  async removed(): Promise<boolean> {
    const frames = await this.page().frames();
    const frame = frames.find(f => RtidUtil.isRtidEqual(this._rtid, (f as Frame).rtid()));
    if (frame) {
      return false;
    }
    else {
      return true;
    }
  }

  async status(): Promise<'BeforeNavigate' | 'Committed' | 'DOMContentLoaded' | 'Completed' | 'ErrorOccurred' | 'Removed'> {
    const tabId = Utils.deepClone(this._rtid);
    tabId.context = 'background';
    tabId.frame = -1;
    const status = await this._channel.invokeFunction(tabId, 'getFrameStatus', [this._rtid.frame]);
    if (status) {
      return status as 'BeforeNavigate' | 'Committed' | 'DOMContentLoaded' | 'Completed' | 'ErrorOccurred' | 'Removed';
    }
    else {
      return 'ErrorOccurred'
    }
  }

  async readyState(): Promise<'loading' | 'interactive' | 'complete'> {
    // onBeforeNavigate - N/A.   (no frame connected)
    // onCommitted - "loading"   (frame connected Unreliable)
    // onDOMContentLoaded - 'interactive'
    // onCompleted - 'complete'
    const status = await this.status();
    if (status === 'DOMContentLoaded' || status === 'Completed') {
      const propValue = await this._channel.queryProperty(this._rtid, 'readyState');
      return propValue as 'loading' | 'interactive' | 'complete';
    }
    else {
      return 'loading';
    }

  }

  async parentFrame(): Promise<api.Frame | null> {
    if (this._rtid.frame === 0) {
      return null;
    }
    const tabId = Utils.deepClone(this._rtid);
    tabId.context = 'background';
    tabId.frame = -1;
    const frameInfoList = await this._channel.invokeFunction(tabId, 'frames', []);
    if (Utils.isNullOrUndefined(frameInfoList) || !Array.isArray(frameInfoList)) {
      return null;
    }
    for (const frameInfo of frameInfoList) {
      const { frameId, parentFrameId } = frameInfo as any;
      if (frameId === this._rtid.frame && !Utils.isNullOrUndefined(parentFrameId)) {
        if (parentFrameId === -1) {
          return null;
        }
        const parentFrameRtid = Utils.deepClone(this._rtid);
        parentFrameRtid.frame = parentFrameId;
        const parentFrame = new Frame(this._browser, this._page, this._channel, parentFrameRtid);
        return parentFrame;
      }
    }
    return null;
  }

  async childFrames(): Promise<api.Frame[]> {
    const results: api.Frame[] = [];
    const tabId = Utils.deepClone(this._rtid);
    tabId.context = 'background';
    tabId.frame = -1;
    const frameInfoList = await this._channel.invokeFunction(tabId, 'frames', []);
    if (Utils.isNullOrUndefined(frameInfoList) || !Array.isArray(frameInfoList)) {
      return [];
    }
    for (const frameInfo of frameInfoList) {
      const { frameId, parentFrameId } = frameInfo as any;
      if (parentFrameId === this._rtid.frame) {
        const childFrameRtid = Utils.deepClone(this._rtid);
        childFrameRtid.frame = frameId;
        const childFrame = new Frame(this._browser, this._page, this._channel, childFrameRtid);
        results.push(childFrame);
      }
    }
    return results;
  }

  async frameElement(): Promise<api.Element | null> {
    const parentFrame = await this.parentFrame();
    if (parentFrame === null) {
      return null;
    }
    const parentFrameRtid = (parentFrame as Frame).rtid();
    const aos = await this._channel.queryObjects(parentFrameRtid, {
      type: 'element',
      rtids: [this._rtid]
    });
    if (aos.length !== 1) {
      return null;
    }
    const frameElem = new Element(this._browser, this._page, parentFrame, this._channel, aos[0].rtid);
    return frameElem;
  }

  /** ==================================================================================================================== */
  /** ====================================================== methods ===================================================== */
  /** ==================================================================================================================== */

  async sync(timeout: number = 5000): Promise<void> {
    const check = async () => {
      const status = await this.status();
      return status === 'Completed';
    };
    const result = await Utils.wait(check, timeout, 500);
    if (!result) {
      this.logger.warn('sync: status is still not Completed');
    }
  }

  async executeScript(script: string): Promise<any> {
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
      const elem = new Element(this._browser, this._page, this, this._channel, ao.rtid);
      results.push(elem);
    }
    return results;
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

}
