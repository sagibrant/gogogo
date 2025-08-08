/**
 * @copyright 2025 Sagi All Rights Reserved.
 * @author: Sagi <sagibrant@163.com>
 * @license Apache-2.0
 * @file Tab.ts
 * @description 
 * Support the automation actions on a specific Tab
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
import { AODesc, AutomationObject, MessageData, QueryInfo, Rtid } from "@/types/message";
import { ChromiumExtensionAPI } from "@/background/api/ChromiumExtensionAPI";
import { FrameInfo, TabInfo, WindowInfo } from "../api/BrowserWrapperTypes";
import { RectInfo } from "@/types/api";
import { LocatorUtils } from "@/common/LocatorUtils";
import { MsgDataHandlerBase } from "@/common/Messaging/MsgDataHandler";
import { WebNavigationEventDetails } from "../api/ChromiumWebNavigationAPI";

export interface FrameDetails {
  lastWebNavigationStatus?: string;
  lastWebNavigationEventDetails?: WebNavigationEventDetails;
  channelConnected: boolean;
}

export class Tab extends MsgDataHandlerBase {
  private readonly _contentId: Rtid;
  private readonly _tabId: number;
  private readonly _browserAPI: ChromiumExtensionAPI;
  private readonly _frameDict: Record<number, FrameDetails>;
  private _zoomFactor?: number;

  constructor(tabId: number, browserAPI: ChromiumExtensionAPI) {
    const rtid = RtidUtil.getTabRtid(tabId, -1);
    super(rtid);
    this._tabId = tabId;
    this._contentId = Utils.deepClone(rtid);
    this._contentId.context = 'content';
    this._contentId.frame = 0;
    this._browserAPI = browserAPI;
    this._frameDict = {};
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
      let parentWindow = await this.window();
      let parentRtid = Utils.deepClone(this.id);
      parentRtid.window = parentWindow.id || -1;
      parentRtid.tab = -1;
      return parentRtid;
    }
    else if (propName === 'zoom_factor') {
      return this.zoomFactor;
    }
    else if (propName === 'rect') {
      // the rect in viewport coordinate
      const rect = (await this._queryContentProperty('tab_rect')) as RectInfo;
      return rect;
    }
    else if (propName === 'screen_rect') {
      // the rect in screen coordinate 
      const rect = (await this._queryContentProperty('tab_screen_rect')) as RectInfo;
      return rect;
    }
    else if (propName === 'deviceScaleFactor') {
      if (!Utils.isNullOrUndefined(BrowserUtils.deviceScaleFactor)) {
        return BrowserUtils.deviceScaleFactor;
      }

      const propValue = await this._queryContentProperty('devicePixelRatio');
      if (typeof (propValue) === 'number') {
        const devicePixelRatio = propValue as number;
        BrowserUtils.deviceScaleFactor = devicePixelRatio / (this.zoomFactor || 1);
        return BrowserUtils.deviceScaleFactor;
      }
      else {
        return undefined;
      }
    }
    else {
      const tab = await this._browserAPI.tabAPI.get(this._tabId);
      if (propName in tab) {
        const propValue = (tab as any)[propName];
        return propValue;
      }
      else {
        return await this._queryContentProperty(propName);
      }
    }
    // throw new Error(`queryProperty: unexpected property name ${propName}`);
  }

  /**
   * query automation objects
   * @param desc description for objects
   * @returns automation objects
   */
  async queryObjects(desc: AODesc): Promise<AutomationObject[]> {
    // page.window()
    if (desc.type === 'window') {
      const window = await this.window();
      return [{
        type: "window" as const,
        name: 'window-' + window.id,
        rtid: Object.assign({}, this.id, { window: window.id, tab: -1 }),
        runtimeInfo: { ...Utils.deepClone(window) },
        metaData: undefined
      }];
    }
    /**
     * query by api
     *  page.frames()    => desc: empty
     *  page.mainFrame() => desc: rtid.frame = 0
     *  page.frame({url: 'https://x/x', index?: 0}) => desc: url, index
     * query by content (desc.parent is tab.id)
     *  page.locator({name: 'frame-name', tagName: 'IFRAME', src: 'https://x/x', index: 0}).contentFrame().click
     *  page.frame({name: 'frame-name', tagName: 'IFRAME', src: 'https://x/x', index: 0}) = locator().contentFrame()
     */
    if (desc.type === 'frame') {
      const frames = await this._queryFrames(desc);
      return frames;
    }
    if (desc.type === 'element') {
      const elements = await this._queryElements(desc);
      return elements;
    }
    throw new Error(`queryObjects: unexpected description type ${desc.type}`);
  }

  /** ==================================================================================================================== */
  /** ================================================== Tab properties ================================================== */
  /** ==================================================================================================================== */

  /** tab rtid */
  get tabId(): number {
    return this._tabId;
  }
  /** content rtid */
  get contentId(): Rtid {
    return this._contentId;
  }

  /** The ID of the window that contains the tab. */
  windowId?: number;
  /** The zero-based index of the tab within its window. */
  index?: number;
  /** The title of the tab. */
  title?: string;
  /** The last committed URL of the main frame of the tab. Or the value of pendingUrl: The URL the tab is navigating to, before it has committed */
  url?: string;
  /** The URL of the tab's favicon */
  favIconUrl?: string;
  /** The tab's loading status. */
  status?: 'unloaded' | 'loading' | 'complete';
  /** The tab's ZoomFactor. */
  get zoomFactor(): number | undefined {
    return this._zoomFactor;
  }
  set zoomFactor(value: number | undefined) {
    this._zoomFactor = value;
    // update the zoomFactor into the page content
    const frameDetails = this._frameDict[0];
    if (frameDetails && frameDetails.channelConnected) {
      const msgData = MsgUtil.createMessageData('config', this.contentId, { name: 'set', params: { name: 'zoom_factor', value: this._zoomFactor } });
      self.gogogo.dispatcher.sendEvent(msgData);
    }
  }

  async frames(parentFrameId?: number): Promise<FrameInfo[]> {
    let frames = await this._browserAPI.webNavigationAPI.getAllFrames(this._tabId);
    if (!Utils.isNullOrUndefined(parentFrameId)) {
      frames = frames.filter(f => f.parentFrameId === parentFrameId);
    }
    return Utils.deepClone(frames);
  }

  async mainFrame(): Promise<FrameInfo> {
    let frames = await this._browserAPI.webNavigationAPI.getAllFrames(this._tabId);
    let roots = frames.filter((f) => f.parentFrameId === -1);
    if (roots.length !== 1) {
      throw new Error(`mainFrame: find ${roots.length} frames with parentFrameId === -1`);
    }
    return Utils.deepClone(roots[0]);
  }

  async window(): Promise<WindowInfo> {
    let tab = await this._browserAPI.tabAPI.get(this._tabId);
    let window = await this._browserAPI.windowAPI.get(tab.windowId);
    return Utils.deepClone(window);
  }

  async frameTree(): Promise<FrameInfo> {
    let frames = await this._browserAPI.webNavigationAPI.getAllFrames(this._tabId);
    if (Utils.isNullOrUndefined(frames) || Utils.isEmpty(frames)) {
      throw new Error(`frameTree: get empty frames`);
    }
    const frameInfoList: FrameInfo[] = [];
    for (const frame of frames) {
      const frameInfo = { ...frame, children: [] } as FrameInfo;
      frameInfoList.push(frameInfo);
    }
    for (const frameInfo of frameInfoList) {
      if (!Utils.isNullOrUndefined(frameInfo.parentFrameId) && frameInfo.parentFrameId >= 0) {
        const parents = frameInfoList.filter((f) => f.frameId === frameInfo.parentFrameId);
        if (parents.length === 1) {
          parents[0].children?.push(frameInfo);
        }
      }
    }
    let roots = frameInfoList.filter((f) => f.parentFrameId === -1);
    if (roots.length !== 1) {
      throw new Error(`frameTree: find ${roots.length} frames with parentFrameId === -1`);
    }
    return roots[0]
  }

  /** ==================================================================================================================== */
  /** ==================================================== Tab methods =================================================== */
  /** ==================================================================================================================== */

  async active(focusWindow: boolean = false): Promise<TabInfo> {
    let tab = await this._browserAPI.tabAPI.get(this._tabId);
    if (focusWindow) {
      const window = await this._browserAPI.windowAPI.get(tab.windowId);
      if (!window.focused && !Utils.isNullOrUndefined(window.id)) {
        await this._browserAPI.windowAPI.update(window.id, { focused: true });
      }
    }
    tab = await this._browserAPI.tabAPI.active(this._tabId);
    const tabInfo = Utils.deepClone(tab);
    return tabInfo;
  }

  async capturePage(): Promise<string> {
    const result = this._browserAPI.tabAPI.capturePage(this._tabId);
    return result;
  }

  async close(): Promise<void> {
    await this._browserAPI.tabAPI.close(this._tabId);
  }

  async goBack(): Promise<void> {
    await this._browserAPI.tabAPI.goBack(this._tabId);
  }

  async goForward(): Promise<void> {
    await this._browserAPI.tabAPI.goForward(this._tabId);
  }

  async moveToWindow(windowId: number, index: number = -1): Promise<TabInfo> {
    const tab = await this._browserAPI.tabAPI.moveToWindow(this._tabId, windowId, index);
    const tabInfo = Utils.deepClone(tab);
    return tabInfo;
  }

  async navigate(url: string): Promise<TabInfo | undefined> {
    const tab = await this._browserAPI.tabAPI.navigate(this._tabId, url);
    const tabInfo = Utils.deepClone(tab);
    return tabInfo;
  }

  async openNewTab(url?: string): Promise<TabInfo> {
    const cur = await this._browserAPI.tabAPI.get(this._tabId);
    const tab = await this._browserAPI.tabAPI.openNewTab(url, cur.windowId, this._tabId);
    const tabInfo = Utils.deepClone(tab);
    return tabInfo;
  }

  async reload(bypassCache: boolean = false): Promise<void> {
    await this._browserAPI.tabAPI.reload(this._tabId, bypassCache);
  }

  async zoom(zoomFactor: number): Promise<void> {
    await this._browserAPI.tabAPI.zoom(this._tabId, zoomFactor);
  }

  async getFrameStatus(frameId: number): Promise<'BeforeNavigate' | 'Committed' | 'DOMContentLoaded' | 'Completed' | 'ErrorOccurred' | 'Removed'> {
    // we must filter the frames first
    // because the webnavigation event does not contain the remove info
    const frames = await this.frames();
    const frame = frames.find(frame => frame.frameId === frameId);
    if (Utils.isNullOrUndefined(frame)) {
      return 'Removed';
    }
    const frameDetails = this._frameDict[frameId];
    if (frameDetails && !Utils.isNullOrUndefined(frameDetails.lastWebNavigationStatus)) {
      // ErrorOccurred : "net::ERR_BLOCKED_BY_RESPONSE"
      return frameDetails.lastWebNavigationStatus as 'BeforeNavigate' | 'Committed' | 'DOMContentLoaded' | 'Completed' | 'ErrorOccurred';
    }
    else {
      this.logger.warn(`getFrameStatus: find one frame without frameNavigationEventDetail. ${frame}`);
      return 'Removed';
    }
  }

  updateFrameDetails(frameId: number, options: { status?: string, ev?: WebNavigationEventDetails, connected?: false }) {
    if (frameId === 0 && options.status === 'Committed') {
      const frameIds = Object.keys(this._frameDict);
      for (const id of frameIds) {
        delete this._frameDict[Number(id)];
      }
    }
    if (Utils.isNullOrUndefined(this._frameDict[frameId])) {
      this._frameDict[frameId] = {
        lastWebNavigationEventDetails: options.ev,
        lastWebNavigationStatus: options.status,
        channelConnected: options.connected ? options.connected : false
      };
    }
    else {
      if (!Utils.isNullOrUndefined(options.status)) {
        this._frameDict[frameId].lastWebNavigationStatus = options.status;
      }
      if (!Utils.isNullOrUndefined(options.ev)) {
        this._frameDict[frameId].lastWebNavigationEventDetails = Object.assign({}, this._frameDict[frameId].lastWebNavigationEventDetails, options.ev);
      }
      if (!Utils.isNullOrUndefined(options.connected)) {
        this._frameDict[frameId].channelConnected = options.connected;
      }
    }
  }

  /** ==================================================================================================================== */
  /** ================================================== Helper methods ================================================== */
  /** ==================================================================================================================== */

  protected async _handleCommandActions(data: MessageData): Promise<MessageData | undefined> {
    const { type, action } = data;

    if (type !== 'command') {
      throw new Error(`_handleCommandActions: unexpected MessageData.type - ${type}`);
    }

    let tab: TabInfo | undefined = await this._browserAPI.tabAPI.get(this._tabId);
    if (Utils.isNullOrUndefined(tab) || Utils.isNullOrUndefined(tab?.id)) {
      throw new Error(`fail to find the current tab[${this._tabId}]`);
    }

    tab = Utils.deepClone(tab);

    const resData: MessageData = {
      ...Utils.deepClone(data)
    };

    if (Utils.isNullOrUndefined(resData.status)) {
      throw new Error(`_handleCommandActions: failed to handle action ${action.name}`);
    }

    if (tab) {
      resData.objects = [{
        type: "tab" as const,
        name: tab.title || tab.url?.slice(0, 10) || 'tab-' + tab.id,
        rtid: this.id,
        runtimeInfo: { ...Utils.deepClone(tab) }
      }];
    }

    return resData;
  }

  protected async _handleRecordActions(data: MessageData): Promise<MessageData | undefined> {
    throw new Error("Method not implemented.");
  }

  protected async _queryContentProperty(propName: string): Promise<unknown> {
    const queryMsgData = MsgUtil.createMessageData('query', this.contentId, { name: 'query_property', params: { name: propName } });
    const resMsgData = await self.gogogo.dispatcher.sendRequest(queryMsgData);
    const propValue = Utils.getItem(propName, resMsgData.result as Record<string, unknown>);
    return propValue;
  }

  protected async _buildFrameTree(frameId: number): Promise<AutomationObject[]> {
    // send message to frame content to get all the child frames with all attributes
    const rtid = Utils.deepClone(this.id);
    rtid.frame = frameId;
    const queryMsgData = MsgUtil.createMessageData('query', rtid, { name: 'query_objects' }, { type: 'frame' });
    const resMsgData = await self.gogogo.dispatcher.sendRequest(queryMsgData);
    return resMsgData.objects || [];
  }

  /** ==================================================================================================================== **/
  /** =================================================== Query methods ================================================== **/
  /** ==================================================================================================================== **/

  /**
   * query by api
   *  page.frames()    => desc: {}
   *  xxx.contentFrame().frames() => desc: { parent: {frame = xxx.frame} }
   *  page.mainFrame() => desc: { rtids: [rtid: {frame = 0}] }
   *  page.frame({url: 'https://x/x', index?: 0}) => desc: {queryInfo: {primary: [{name:'url', value:'https://x/x'}], ordinal?: {index: 0} }}
   * query by content (desc.parent is the frame rtid)
   *  page.locator({name: 'frame-name', tagName: 'IFRAME', src: 'https://x/x', index: 0}).contentFrame().click
   *  page.frame({name: 'frame-name', tagName: 'IFRAME', src: 'https://x/x', index: 0}) = locator().contentFrame()
   * @param desc 
   * @returns 
   */
  private async _queryFrames(desc: AODesc): Promise<AutomationObject[]> {
    // page.locator({name: 'frame-name', tagName: 'IFRAME', src: 'https://*/*', index: 0}).contentFrame().click
    // page.frame({name: 'frame-name', tagName: 'IFRAME', src: 'https://*/*', index: 0}) = locator().contentFrame()

    let candidates: FrameInfo[] = [];
    let usedQueryInfo: QueryInfo | undefined = undefined;

    if (desc.rtids && desc.rtids.length > 0) {
      // page.mainFrame() => return the top frame for tab
      const frames = await this._browserAPI.webNavigationAPI.getAllFrames(this._tabId);
      for (const rtid of desc.rtids) {
        const frame = frames.find(frame => (frame.frameId === rtid.frame) || (rtid.frame === 0 && frame.parentFrameId === -1));
        if (frame) {
          candidates.push(frame);
        }
      }
    }
    else if (desc.queryInfo) {
      // page.frame({url: 'https://*/*', index: 0}) => filter the frames with url and index
      if (desc.queryInfo.primary?.length === 1
        && desc.queryInfo.primary[0].key === 'url'
        && Utils.isEmpty(desc.queryInfo.mandatory)
        && Utils.isEmpty(desc.queryInfo.assistive)) {

        const frames = await this._browserAPI.webNavigationAPI.getAllFrames(this._tabId);
        candidates = LocatorUtils.filterObjects(frames, desc.queryInfo.primary);
        if (!Utils.isNullOrUndefined(desc.parent?.frame)) {
          candidates = candidates.filter(f => f.parentFrameId === desc.parent?.frame);
        }
        if (candidates.length > 1 && desc.queryInfo.ordinal && desc.queryInfo.ordinal.index >= 0
          && candidates.length > desc.queryInfo.ordinal.index) {
          candidates = [candidates[desc.queryInfo.ordinal.index]];
        }
        usedQueryInfo = desc.queryInfo;
      }
      else {
        // query the frames with all selectors in contents
        //  page.locator({name: 'frame-name', tagName: 'IFRAME', src: 'https://x/x', index: 0}).contentFrame().click
        //  page.frame({name: 'frame-name', tagName: 'IFRAME', src: 'https://x/x', index: 0}) = locator().contentFrame()
        const rtid = Utils.deepClone(this.contentId);
        rtid.frame = desc.parent?.frame || 0;
        const queryMsgData = MsgUtil.createMessageData('query', rtid, { name: 'query_objects' }, desc);
        const resMsgData = await self.gogogo.dispatcher.sendRequest(queryMsgData);
        return resMsgData.objects || [];
      }
    }
    else {
      // page.frames() => all frames 
      // xxx.contentFrame().frames() => all sub frames which match the desc.parent
      let frames = await this.frames(desc.parent?.frame);
      candidates.push(...frames);
    }

    const objects = candidates.map((frame) => {
      return {
        type: "frame" as const,
        name: 'frame-' + frame.frameId,
        rtid: Object.assign({}, this._contentId, { frame: frame.frameId }),
        runtimeInfo: { url: frame.url },
        metaData: usedQueryInfo ? { used: usedQueryInfo } : undefined
      };
    });
    return objects;
  }

  private async _queryElements(desc: AODesc): Promise<AutomationObject[]> {
    const rtid = Utils.deepClone(this.id);
    rtid.context = 'content';
    rtid.frame = desc.parent?.frame || 0;
    const queryMsgData = MsgUtil.createMessageData('query', rtid, { name: 'query_objects' }, desc);
    const resMsgData = await self.gogogo.dispatcher.sendRequest(queryMsgData);
    return resMsgData.objects || [];
  }

}
