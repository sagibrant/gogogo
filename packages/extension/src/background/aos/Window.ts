/**
 * @copyright 2025 Sagi All Rights Reserved.
 * @author: Sagi <sagibrant@163.com>
 * @license Apache-2.0
 * @file Window.ts
 * @description 
 * Support the automation actions on a specific Window
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

import { BrowserUtils, MsgUtil, RtidUtil, Utils } from "@/common/Common";
import { AODesc, AutomationObject, MessageData, QueryInfo } from "@/types/message";
import { ChromiumExtensionAPI } from "@/background/api/ChromiumExtensionAPI";
import { TabInfo, WindowInfo } from "../api/BrowserWrapperTypes";
import { RectInfo } from "@/types/api";
import { LocatorUtils } from "@/common/LocatorUtils";
import { MsgDataHandlerBase } from "@/common/Messaging/MsgDataHandler";

export class Window extends MsgDataHandlerBase {
  private readonly _windowId: number;
  private readonly _browserAPI: ChromiumExtensionAPI;

  constructor(windowId: number, browserAPI: ChromiumExtensionAPI) {
    const rtid = RtidUtil.getWindowRtid(windowId);
    super(rtid);
    this._windowId = windowId;
    this._browserAPI = browserAPI;
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
    else if (propName === 'parent_rtid') {
      let parentRtid = RtidUtil.getBrowserRtid();
      return parentRtid;
    }

    const window = await this.windowInfo();
    if (propName === 'rect') {
      let rect = { left: window.left, top: window.top, width: window.width, height: window.height };
      rect = Utils.fixRectange(rect);
      return rect;
    }
    else if (propName === 'screen_rect') {
      const rect = (await this.queryProperty('rect')) as RectInfo;
      let deviceScaleFactor = BrowserUtils.deviceScaleFactor;
      if (Utils.isNullOrUndefined(deviceScaleFactor)) {
        // query for deviceScaleFactor
        const activeTab = await this.activeTab();
        const activeTabId = activeTab?.id;
        if (!Utils.isNullOrUndefined(activeTabId)) {
          const rtid = Utils.deepClone(this.id);
          rtid.window = -1;
          rtid.tab = activeTabId;
          const queryMsgData = MsgUtil.createMessageData('query', rtid, { name: 'query_property', params: { name: 'device_scale_factor' } });
          const resMsgData = await self.gogogo.dispatcher.sendRequest(queryMsgData);
          const propValue = Utils.getItem('device_scale_factor', resMsgData.result as Record<string, unknown>);
          deviceScaleFactor = typeof (propValue) === 'number' ? propValue as number : undefined;

          if (!Utils.isNullOrUndefined(deviceScaleFactor)) {
            BrowserUtils.deviceScaleFactor = deviceScaleFactor;
          }
        }
      }
      if (!Utils.isNullOrUndefined(deviceScaleFactor)) {
        rect.left *= deviceScaleFactor;
        rect.top *= deviceScaleFactor;
        rect.right *= deviceScaleFactor;
        rect.bottom *= deviceScaleFactor;
        rect.x *= deviceScaleFactor;
        rect.y *= deviceScaleFactor;
      }
      return rect;
    }
    else {
      if (propName in window) {
        const propValue = (window as any)[propName];
        return propValue;
      }
    }
    throw new Error(`queryProperty: unexpected property name ${propName}`);
  }

  /**
   * query automation objects
   * @param desc description for objects
   * @returns automation objects
   */
  async queryObjects(desc: AODesc): Promise<AutomationObject[]> {
    // window.pages({ url: 'https://*/*', active: true, title: 'xxx', index: 1})
    if (desc.type === 'tab') {
      const tabs = await this._queryTabs(desc);
      return tabs;
    }
    throw new Error(`queryObjects: unexpected description type ${desc.type}`);
  }

  /** ==================================================================================================================== */
  /** ================================================= Window properties ================================================ */
  /** ==================================================================================================================== */
  get windowId(): number {
    return this._windowId;
  }

  async windowInfo(): Promise<WindowInfo> {
    const window = await this._browserAPI.windowAPI.get(this._windowId);
    return Utils.deepClone(window);
  }

  async tabs(): Promise<TabInfo[]> {
    const window = await this._browserAPI.windowAPI.get(this._windowId, true);
    const tabInfos = window.tabs?.map(t => Utils.deepClone(t)) || [];
    return tabInfos;
  }

  async activeTab(): Promise<TabInfo | undefined> {
    const window = await this._browserAPI.windowAPI.get(this._windowId, true);
    const tabInfos = window.tabs?.map(t => Utils.deepClone(t)) || [];
    const activedTab = tabInfos.find(t => t.active);
    return activedTab;
  }

  /** ==================================================================================================================== */
  /** ==================================================== Tab methods =================================================== */
  /** ==================================================================================================================== */

  async openNewTab(url?: string): Promise<TabInfo | undefined> {
    const tab = await this._browserAPI.tabAPI.openNewTab(url, this._windowId);
    const tabInfo = Utils.deepClone(tab);
    return tabInfo;
  }

  async focus(): Promise<WindowInfo> {
    const window = await this._browserAPI.windowAPI.focus(this._windowId);
    const windowInfo = Utils.deepClone(window);
    return windowInfo;
  }

  async close(): Promise<void> {
    await this._browserAPI.windowAPI.remove(this._windowId);
  }

  async minimize(): Promise<WindowInfo> {
    const window = await this._browserAPI.windowAPI.minimize(this._windowId);
    const windowInfo = Utils.deepClone(window);
    return windowInfo;
  }

  async maximize(): Promise<WindowInfo> {
    const window = await this._browserAPI.windowAPI.maximize(this._windowId);
    const windowInfo = Utils.deepClone(window);
    return windowInfo;
  }

  async restore(): Promise<WindowInfo> {
    const window = await this._browserAPI.windowAPI.restore(this._windowId);
    const windowInfo = Utils.deepClone(window);
    return windowInfo;
  }

  async fullscreen(toggle: boolean = true): Promise<WindowInfo> {
    const window = await this._browserAPI.windowAPI.fullscreen(this._windowId, toggle);
    const windowInfo = Utils.deepClone(window);
    return windowInfo;
  }

  /** ==================================================================================================================== */
  /** ================================================== Helper methods ================================================== */
  /** ==================================================================================================================== */

  protected async _handleCommandActions(data: MessageData): Promise<MessageData | undefined> {
    const { type, action } = data;

    if (type !== 'command') {
      throw new Error(`_handleCommandActions: unexpected MessageData.type - ${type}`);
    }

    let window: WindowInfo | undefined = await this._browserAPI.windowAPI.get(this._windowId);
    if (Utils.isNullOrUndefined(window)) {
      throw new Error(`fail to find the current window[${this._windowId}]`);
    }

    const resData: MessageData = {
      ...Utils.deepClone(data)
    };

    if (Utils.isNullOrUndefined(resData.status)) {
      throw new Error(`_handleCommandActions: failed to handle action ${action.name}`);
    }

    if (window) {
      const windows = await this._browserAPI.windowAPI.getAll();
      const index = windows.findIndex(w => w.id === window.id);
      resData.objects = [{
        type: "window" as const,
        name: 'window_' + index,
        rtid: this.id,
        runtimeInfo: { ...Utils.deepClone(window) }
      }];
    }

    return resData;
  }

  protected async _handleRecordActions(data: MessageData): Promise<MessageData | undefined> {
    throw new Error("Method not implemented.");
  }

  /** ==================================================================================================================== **/
  /** =================================================== Query methods ================================================== **/
  /** ==================================================================================================================== **/
  private async _queryTabs(desc: AODesc): Promise<AutomationObject[]> {

    let candidates: TabInfo[] = [];
    let usedQueryInfo: QueryInfo | undefined = undefined;

    if (desc.rtids && desc.rtids.length > 0) {
      const window = await this._browserAPI.windowAPI.get(this._windowId, true);
      const tabs = window.tabs?.map(t => Utils.deepClone(t)) || [];
      for (const rtid of desc.rtids) {
        try {
          const tab = tabs.find(tab => tab.id === rtid.tab);
          if (tab) {
            candidates.push(tab);
          }
        }
        catch (error) {
          this.logger.warn(`_queryTabs: ${error instanceof Error ? error.message : error}`)
        }
      }
    }
    else if (desc.queryInfo) {
      const queryResult = await LocatorUtils.queryObjectsAsync(async (selectors) => {
        const window = await this._browserAPI.windowAPI.get(this._windowId, true);
        const tabs = window.tabs?.map(t => Utils.deepClone(t)) || [];
        return LocatorUtils.filterObjects(tabs, selectors);
      }, desc.queryInfo);
      candidates = queryResult?.objects || [];
      usedQueryInfo = queryResult?.queryInfo;
    }
    else {
      const window = await this._browserAPI.windowAPI.get(this._windowId, true);
      candidates = window.tabs || [];
      usedQueryInfo = undefined;
    }

    candidates = candidates.filter(tab => !Utils.isNullOrUndefined(tab.id));
    const objects = candidates.map((tab) => {
      return {
        type: "tab" as const,
        name: tab.title || tab.url?.slice(0, 10) || 'tab_' + tab.index,
        rtid: RtidUtil.getTabRtid(tab.id!, -1),
        runtimeInfo: { ...Utils.deepClone(tab) },
        metaData: usedQueryInfo ? { used: usedQueryInfo } : undefined
      };
    });
    return objects;
  }
}
