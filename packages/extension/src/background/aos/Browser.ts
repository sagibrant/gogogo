/**
 * @copyright 2025 Sagi All Rights Reserved.
 * @author: Sagi <sagibrant@163.com>
 * @license Apache-2.0
 * @file Browser.ts
 * @description 
 * Support the general automation actions for Browser
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

import { BrowserInfo, BrowserUtils, RtidUtil, Utils } from "../../common/Common";
import { AODesc, AutomationObject, MessageData, QueryInfo, Selector } from "../../types/message";
import { ChromiumExtensionAPI } from "../api/ChromiumExtensionAPI";
import { Window } from "./Window";
import { Tab } from "./Tab";
import { LocatorUtils } from "@/common/LocatorUtils";
import { TabInfo, WindowInfo } from "../api/BrowserWrapperTypes";
import { MsgDataHandlerBase } from "@/common/Messaging/MsgDataHandler";

interface BrowserEvents {
  windowCreated: { window: Window };
  windowRemoved: { window: Window };
  tabCreated: { tab: Tab };
  tabRemoved: { tab: Tab };
}

interface BrowserConfig {
  enableCDP: boolean
}

export class Browser extends MsgDataHandlerBase<BrowserEvents> {
  private readonly _browserAPI: ChromiumExtensionAPI;
  private readonly _windows: Record<number, Window>;
  private readonly _tabs: Record<number, Tab>;
  private _activeTabId: number = -1;
  private _activeWindowId: number = -1;
  readonly config: Record<string, unknown> & BrowserConfig;


  constructor(browserAPI: ChromiumExtensionAPI) {
    const rtid = RtidUtil.getBrowserRtid();
    super(rtid);
    this._browserAPI = browserAPI;
    this._windows = {};
    this._tabs = {};
    this.config = { enableCDP: false };
  }

  /**
   * init the agent
   * start listening on the window, tab and cdp events
   */
  async init(): Promise<void> {
    await this._updateWindowTabs();
    this._registerListeners();
    if (this.config.enableCDP) {
      this._browserAPI.cdpAPI.attachAllTabs();
    }
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
    else if (propName === 'name') {
      const browserInfo = await this.browserInfo;
      return browserInfo.name
    }
    else if (propName === 'version') {
      const browserInfo = await this.browserInfo;
      return browserInfo.version
    }
    else if (propName === 'major_version') {
      const browserInfo = await this.browserInfo;
      return browserInfo.majorVersion
    }
    throw new Error(`queryProperty: unexpected property name ${propName}`);
  }

  /**
   * query automation objects
   * @param desc description for objects
   * @returns automation objects
   */
  async queryObjects(desc: AODesc): Promise<AutomationObject[]> {
    // browser.windows({ lastFocused: true, index: 1})
    if (desc.type === 'window') {
      return await this._queryWindows(desc);
    }
    // browser.pages({ url: 'https://*/*', active: true, lastFocusedWindow: true, title: 'xxx', index: 1})
    if (desc.type === 'tab') {
      return await this._queryTabs(desc);
    }
    throw new Error(`queryObjects: unexpected description type ${desc.type}`);
  }

  /** ==================================================================================================================== */
  /** ================================================= Agent properties ================================================= */
  /** ==================================================================================================================== */

  /** current browser version */
  get browserInfo(): BrowserInfo {
    const browserVersion = BrowserUtils.getBrowserInfo();
    return browserVersion;
  }

  /** all windows */
  get windows(): Window[] {
    let windows: Window[] = [];
    for (const [_windowId, window] of Object.entries(this._windows)) {
      windows.push(window);
    }
    return windows;
  }

  /** all tabs */
  get tabs(): Tab[] {
    let tabs: Tab[] = [];
    for (const [_tabId, tab] of Object.entries(this._tabs)) {
      tabs.push(tab);
    }
    tabs.sort((a, b) => {
      return (a.index ?? 0) - (b.index ?? 0);
    });
    return tabs;
  }

  /** ==================================================================================================================== */
  /** =================================================== Agent methods ================================================== */
  /** ==================================================================================================================== */

  /**
   * Creates a new window.
   * @param url - String or array of strings. A URL or array of URLs to open as tabs in the window. 
   * @param tabId - If included, moves a tab of the specified ID from an existing window into the new window.
   * @param incognito - Whether the new window should be an incognito (private) window.
   * @returns Promise resolving to the created window object, or undefined on failure
   */
  async openNewWindow(url?: string | string[], tabId?: number, incognito?: boolean): Promise<WindowInfo | undefined> {
    const window = await this._browserAPI.windowAPI.create(url, undefined, incognito);
    return Utils.deepClone(window);
  }

  /**
   * close the current browser
   */
  async close(): Promise<void> {
    const windows = await this._browserAPI.windowAPI.getAll();
    for (const window of windows) {
      if (window.id) {
        await this._browserAPI.windowAPI.remove(window.id);
      }
    }
  }

  /**
   * enable the cdp, all tabs will be auto attached
   */
  async enableCDP(): Promise<void> {
    this.config.enableCDP = true;
    await this._browserAPI.cdpAPI.attachAllTabs();
  }

  /**
   * disable the cdp, all tabs will be detached
   */
  async disableCDP(): Promise<void> {
    this.config.enableCDP = false;
    await this._browserAPI.cdpAPI.detachAllTabs();
  }

  /** ==================================================================================================================== **/
  /** ================================================== Helper methods ================================================== **/
  /** ==================================================================================================================== **/

  protected async _handleCommandActions(data: MessageData): Promise<MessageData | undefined> {
    const { type, action } = data;

    if (type != 'command') {
      throw new Error(`_handleCommandActions: unexpected MessageData.type - ${type}`);
    }

    const resData: MessageData = {
      ...Utils.deepClone(data)
    };

    if (Utils.isNullOrUndefined(resData.status)) {
      throw new Error(`_handleCommandActions: failed to handle action ${action.name}`);
    }

    resData.objects = [{
      type: "browser" as const,
      name: 'browser',
      rtid: this.id,
      runtimeInfo: {}
    }];

    return resData;
  }

  protected async _handleRecordActions(data: MessageData): Promise<MessageData | undefined> {
    throw new Error("Method not implemented.");
  }

  private _registerListeners(): void {
    // window events
    this._browserAPI.windowAPI.on('onCreated', ({ window }) => {
      this.logger.debug('onCreated: window -', window);
      // if the DevTool created, then then windowId = -1
      if (Utils.isNullOrUndefined(window.id) || window.id < 0) {
        return;
      }
      this._addNewWindow(window);
    });

    this._browserAPI.windowAPI.on('onFocusChanged', ({ windowId }) => {
      this.logger.debug('onFocusChanged: windowId -', windowId);
      // if focus on the DevTool, then then windowId = -1
      if (Utils.isNullOrUndefined(windowId) || windowId < 0) {
        return;
      }
      this._activeWindowId = windowId;
    });

    this._browserAPI.windowAPI.on('onRemoved', ({ windowId }) => {
      this.logger.debug('onRemoved: windowId -', windowId);
      if (Utils.isNullOrUndefined(windowId) || Utils.isNullOrUndefined(this._windows[windowId])) {
        return;
      }
      const window = this._windows[windowId];
      delete this._windows[windowId];
      this.emit('windowRemoved', { window: window });
    });

    this._browserAPI.windowAPI.on('onBoundsChanged', ({ window }) => {
    });

    // tab events
    this._browserAPI.tabAPI.on('onCreated', ({ tab }) => {
      this.logger.debug('onCreated: tab -', tab);
      if (Utils.isNullOrUndefined(tab.id)) {
        return;
      }
      const newTab = this._addNewTab(tab);
      if (newTab && this.config.enableCDP) {
        this._browserAPI.cdpAPI.attachTab(tab.id);
      }
    });

    this._browserAPI.tabAPI.on('onUpdated', ({ tabId, changeInfo }) => {
      this.logger.debug('onUpdated: tabId -', tabId, ' changeInfo - ', changeInfo);
      if (Utils.isNullOrUndefined(tabId) || Utils.isNullOrUndefined(this._tabs[tabId])) {
        return;
      }
      const tab = this._tabs[tabId];
      tab.status = !Utils.isNullOrUndefined(changeInfo.status) ? changeInfo.status : tab.status;
      tab.title = !Utils.isNullOrUndefined(changeInfo.title) ? changeInfo.title : tab.title;
      tab.url = !Utils.isNullOrUndefined(changeInfo.url) ? changeInfo.url : tab.url;
      tab.favIconUrl = !Utils.isNullOrUndefined(changeInfo.favIconUrl) ? changeInfo.favIconUrl : tab.favIconUrl;
    });

    this._browserAPI.tabAPI.on('onActivated', ({ activeInfo }) => {
      this.logger.debug('onActivated: activeInfo -', activeInfo);
      if (Utils.isNullOrUndefined(activeInfo)) {
        return;
      }
      // _activeTabId is updated after _activeWindowId (windows.onFocusChanged)
      if (this._activeWindowId !== activeInfo.windowId) {
        return;
      }
      this._activeTabId = activeInfo.tabId;
    });

    this._browserAPI.tabAPI.on('onRemoved', ({ tabId }) => {
      this.logger.debug('onRemoved: tabId -', tabId);
      if (Utils.isNullOrUndefined(tabId) || Utils.isNullOrUndefined(this._tabs[tabId])) {
        return;
      }
      const tab = this._tabs[tabId];
      delete this._tabs[tabId];
      this.emit('tabRemoved', { tab: tab });
    });

    this._browserAPI.tabAPI.on('onZoomChange', ({ zoomChangeInfo }) => {
      this.logger.debug('onZoomChange: zoomChangeInfo -', zoomChangeInfo);
      if (Utils.isNullOrUndefined(zoomChangeInfo)) {
        return;
      }
      const tab = this._tabs[zoomChangeInfo.tabId];
      if (Utils.isNullOrUndefined(tab)) {
        return;
      }
      tab.zoomFactor = zoomChangeInfo.newZoomFactor;
    });

    // webNavigation events
    this._browserAPI.webNavigationAPI.on('onErrorOccurred', (ev) => {
      const tab = this._tabs[ev.tabId];
      if (Utils.isNullOrUndefined(tab)) {
        return;
      }
      tab.updateFrameDetails(ev.frameId, { status: 'ErrorOccurred', ev: ev });
    });
    this._browserAPI.webNavigationAPI.on('onBeforeNavigate', (ev) => {
      const tab = this._tabs[ev.tabId];
      if (Utils.isNullOrUndefined(tab)) {
        return;
      }
      tab.updateFrameDetails(ev.frameId, { status: 'BeforeNavigate', ev: ev });
    });
    this._browserAPI.webNavigationAPI.on('onCommitted', (ev) => {
      const tab = this._tabs[ev.tabId];
      if (Utils.isNullOrUndefined(tab)) {
        return;
      }
      tab.updateFrameDetails(ev.frameId, { status: 'Committed', ev: ev });
    });
    this._browserAPI.webNavigationAPI.on('onDOMContentLoaded', (ev) => {
      const tab = this._tabs[ev.tabId];
      if (Utils.isNullOrUndefined(tab)) {
        return;
      }
      tab.updateFrameDetails(ev.frameId, { status: 'DOMContentLoaded', ev: ev });
    });
    this._browserAPI.webNavigationAPI.on('onCompleted', (ev) => {
      const tab = this._tabs[ev.tabId];
      if (Utils.isNullOrUndefined(tab)) {
        return;
      }
      tab.updateFrameDetails(ev.frameId, { status: 'DOMContentLoaded', ev: ev });
    });
  }

  private async _updateWindowTabs(): Promise<void> {
    const windows = await this._browserAPI.windowAPI.getAll(true);
    // clean the cache
    const windowIds = Object.keys(this._windows);
    for (const windowId of windowIds) {
      delete this._windows[Number(windowId)];
    }
    const tabIds = Object.keys(this._tabs);
    for (const tabId of tabIds) {
      delete this._tabs[Number(tabId)];
    }

    for (const window of windows) {
      this._addNewWindow(window);
      for (const tab of window.tabs || []) {
        const newTab = this._addNewTab(tab);
        if (newTab && tab.highlighted) {
          this._activeTabId = tab.id!;
          this._activeWindowId = tab.windowId;
        }
      }
    }
  }

  private _addNewWindow(window: chrome.windows.Window): Window | undefined {
    if (Utils.isNullOrUndefined(window.id)) {
      return;
    }
    const newWindow = new Window(window.id, this._browserAPI);
    this._windows[window.id] = newWindow;

    this.emit('windowCreated', { window: newWindow });
    return newWindow;
  }

  private _addNewTab(tab: chrome.tabs.Tab): Tab | undefined {
    if (Utils.isNullOrUndefined(tab.id)) {
      return;
    }
    const newTab = new Tab(tab.id, this._browserAPI);
    newTab.windowId = tab.windowId;
    newTab.index = tab.index;
    newTab.url = tab.url || tab.pendingUrl;
    newTab.title = tab.title;
    newTab.favIconUrl = tab.favIconUrl;
    newTab.status = tab.status;

    this._tabs[tab.id] = newTab;

    this._browserAPI.cdpAPI.addTab(tab.id);

    this.emit('tabCreated', { tab: newTab });
    return newTab;
  }

  /** ==================================================================================================================== **/
  /** =================================================== Query methods ================================================== **/
  /** ==================================================================================================================== **/

  private async _queryWindows(desc: AODesc): Promise<AutomationObject[]> {

    let candidates: WindowInfo[] = [];
    let usedQueryInfo: QueryInfo | undefined = undefined;

    if (desc.rtids && desc.rtids.length > 0) {
      for (const rtid of desc.rtids) {
        try {
          const window = await this._browserAPI.windowAPI.get(rtid.window);
          if (window) {
            candidates.push(window);
          }
        }
        catch (error) {
          this.logger.warn(`_queryWindows: ${error instanceof Error ? error.message : error}`)
        }
      }
    }
    else if (desc.queryInfo) {
      // has assistive or ordinal, try to query one object
      const queryResult = await LocatorUtils.queryObjectsAsync(async (selectors) => {
        return await this._queryWindowsWithSelectors(selectors);
      }, desc.queryInfo);
      candidates = queryResult?.objects || [];
      usedQueryInfo = queryResult?.queryInfo;
    }
    else {
      candidates = await this._browserAPI.windowAPI.getAll();
    }

    candidates = candidates.filter(win => !Utils.isNullOrUndefined(win.id));
    const objects = candidates.map((win, index) => {
      return {
        type: "window" as const,
        name: 'window_' + index,
        rtid: RtidUtil.getWindowRtid(win.id!),
        runtimeInfo: { ...Utils.deepClone(win) },
        metaData: usedQueryInfo ? { used: usedQueryInfo } : undefined
      };
    });
    return objects;
  }

  private async _queryTabs(desc: AODesc): Promise<AutomationObject[]> {

    let candidates: TabInfo[] = [];
    let usedQueryInfo: QueryInfo | undefined = undefined;

    if (desc.rtids && desc.rtids.length > 0) {
      for (const rtid of desc.rtids) {
        try {
          const tab = await this._browserAPI.tabAPI.get(rtid.tab);
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
        return await this._queryTabsWithSelectors(selectors);
      }, desc.queryInfo);
      candidates = queryResult?.objects || [];
      usedQueryInfo = queryResult?.queryInfo;
    }
    else {
      candidates = await this._browserAPI.tabAPI.queryTab({}) || [];
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

  private async _queryWindowsWithSelectors(selectors: Selector[]): Promise<WindowInfo[]> {
    // browser.windows({ lastFocused: true, index: 1})
    let lastFocused = false;
    let querySelectors: Selector[] = [];
    for (const selector of selectors) {
      const key = selector.key || selector.name;
      if (key === 'lastFocused') {
        lastFocused = selector.value === true;
      }
      else {
        querySelectors.push(selector);
      }
    }

    const candidates: WindowInfo[] = [];
    // if select focused window, then return it directly
    if (lastFocused && querySelectors.length === 0) {
      const window = await this._browserAPI.windowAPI.getLastFocused();
      if (window?.id !== this._activeWindowId) {
        this.logger.warn(`the lastFocusedWindow does not match the cached _activeWindowId. window: ${window}, _activeWindowId: ${this._activeWindowId}`);
      }
      if (window) {
        candidates.push(Utils.deepClone(window));
        return candidates;;
      }
    }

    let windows = await this._browserAPI.windowAPI.getAll(false);
    windows = windows.map(v => Utils.deepClone(v));
    if (querySelectors.length > 0) {
      return LocatorUtils.filterObjects(windows, querySelectors);
    }
    else {
      return windows;
    }
  }

  private async _queryTabsWithSelectors(selectors: Selector[]): Promise<TabInfo[]> {
    // browser.pages({ url: 'https://*/*', active: true, lastFocusedWindow: true, title: 'xxx', index: 1})
    let active = false;
    let lastFocusedWindow = false;
    let querySelectors: Selector[] = [];
    for (const selector of selectors) {
      const key = selector.key || selector.name;
      if (key === 'active') {
        active = selector.value === true;
      }
      else if (key === 'lastFocusedWindow') {
        lastFocusedWindow = selector.value === true;
      }
      else {
        querySelectors.push(selector);
      }
    }

    const candidates: TabInfo[] = [];
    // if select active tab in lastFocusedWindow, then return it directly
    if (active && lastFocusedWindow && querySelectors.length === 0) {
      const lastFocusedWindow = await this._browserAPI.windowAPI.getLastFocused(true);
      const tabs = lastFocusedWindow.tabs?.filter(tab => tab.active);
      const tab = tabs?.length == 1 ? tabs[0] : undefined;
      // const tab = await this._browserAPI.tabAPI.queryLastFocusedTab();
      if (tab?.id !== this._activeTabId || tab?.windowId !== this._activeWindowId) {
        this.logger.warn(`the active tab in lastFocusedWindow does not match the cached _activeTabId or _activeWindowId. tab: ${JSON.stringify(tab)}, _activeTabId: ${this._activeTabId}, _activeWindowId: ${this._activeWindowId}`);
      }
      if (tab) {
        candidates.push(Utils.deepClone(tab));
        return candidates;
      }
    }

    // query all tabs with the selectors
    const queryInfo: Record<string, unknown> = {};
    for (const selector of querySelectors) {
      queryInfo[selector.key || selector.name] = selector.value;
    }
    const tabs = await this._browserAPI.tabAPI.queryTab(queryInfo);
    return tabs.map(tab => Utils.deepClone(tab));
  }
}