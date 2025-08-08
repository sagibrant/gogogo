/**
 * @copyright 2025 Sagi All Rights Reserved.
 * @author: Sagi <sagibrant@163.com>
 * @license Apache-2.0
 * @file Agent.ts
 * @description 
 * Support the general automation actions which not in a specific browser tab 
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

import { BrowserUtils, RtidUtil } from "../../common/Common";
import { AODesc, AutomationObject, MessageData } from "../../types/message";
import { ChromiumExtensionAPI } from "../api/ChromiumExtensionAPI";
import { SettingUtils, Settings } from "@/common/Settings";
import { MsgDataHandlerBase } from "@/common/Messaging/MsgDataHandler";
import { Browser } from "./Browser";

interface AgentEvent {
  browserCreated: { browser: Browser };
  browserRemoved: { browser: Browser };
}

export class Agent extends MsgDataHandlerBase<AgentEvent> {
  private readonly _browserAPI: ChromiumExtensionAPI;
  private readonly _browsers: Record<number, Browser>;
  // todo: support multiple browsers if we can support multi-browser in the future

  constructor(browserAPI: ChromiumExtensionAPI) {
    const rtid = RtidUtil.getAgentRtid();
    super(rtid);
    this._browserAPI = browserAPI;
    this._browsers = {};
  }

  /**
   * init the agent
   * start listening on the window, tab and cdp events
   */
  async init(): Promise<void> {
    const browser = new Browser(this._browserAPI);
    this._browsers[browser.id.browser] = browser;
    this.emit('browserCreated', { browser });
  }

  /**
   * query property value 
   * @param propName property name
   * @returns property value
   */
  async queryProperty(propName: string): Promise<unknown> {
    if (propName === 'rtid') {
      return this.id;
    }
    else if (propName === 'settings') {
      return this.settings;
    }
    else if (propName === 'id') {
      return chrome.runtime.id;
    }
    else if (propName === 'name') {
      return chrome.runtime.getManifest().name;
    }
    else if (propName === 'version') {
      return chrome.runtime.getManifest().version;
    }
    throw new Error(`queryProperty: unexpected property name ${propName}`);
  }

  /**
   * query automation objects
   * @param desc description for objects
   * @returns automation objects
   */
  async queryObjects(desc: AODesc): Promise<AutomationObject[]> {
    if (desc.type === 'browser') {
      const objects = [{
        type: "browser" as const,
        name: 'browser',
        rtid: RtidUtil.getBrowserRtid(),
        runtimeInfo: { ...BrowserUtils.getBrowserInfo() },
        metaData: undefined
      }];
      return objects;
    }
    throw new Error(`queryObjects: unexpected description type ${desc.type}`);
  }

  /** ==================================================================================================================== */
  /** ================================================= Agent properties ================================================= */
  /** ==================================================================================================================== */

  /** agent settings */
  get settings(): Settings {
    return SettingUtils.getSettings();
  }

  get currentBrowser(): Browser {
    //current browser's rtid.browser = 0
    return this._browsers[0];
  }

  /** ==================================================================================================================== */
  /** =================================================== Agent methods ================================================== */
  /** ==================================================================================================================== */


  /** ==================================================================================================================== **/
  /** ================================================== Helper methods ================================================== **/
  /** ==================================================================================================================== **/

  protected async _handleCommandActions(data: MessageData): Promise<MessageData | undefined> {
    throw new Error("Method not implemented.");
  }

  protected async _handleRecordActions(data: MessageData): Promise<MessageData | undefined> {
    throw new Error("Method not implemented.");
  }
}