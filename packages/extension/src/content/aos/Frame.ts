/**
 * @copyright 2025 Sagi All Rights Reserved.
 * @author: Sagi <sagibrant@163.com>
 * @license Apache-2.0
 * @file Frame.ts
 * @description 
 * Support the automation actions on a specific Frame
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

import { MsgUtil, RtidUtil, Utils } from "@/common/Common";
import { AODesc, AutomationObject, elementActionName, MessageData, QueryInfo, Rtid, Selector } from "@/types/message";
import { ContentUtils } from "../ContentUtils";
import { LocatorUtils } from "@/common/LocatorUtils";
import { MsgDataHandlerBase } from "@/common/Messaging/MsgDataHandler";
import { CoodinateUtils } from "../CoodinateUtils";

export class Frame extends MsgDataHandlerBase {
  private readonly _isPage: boolean;
  readonly elemMap: Record<number, Element>;
  private _nextObjId: number;

  constructor() {
    const rtid = RtidUtil.getTabRtid(-1, -1);
    rtid.context = 'content';
    super(rtid);
    this.elemMap = {};
    this._nextObjId = 1;
    this._isPage = window.top === window;
  }

  async init(tabId: number, frameId: number): Promise<void> {
    this.id.tab = tabId;
    this.id.frame = frameId;
    // send query_property msg to tab to get the settings
    if (this._isPage) {
      const propValue = await this._queryTabProperty('zoom_factor');
      if (typeof (propValue) === 'number') {
        CoodinateUtils.pageZoomFactor = propValue;
      }
    }
    window.addEventListener('message', (event) => {
      const data = Utils.deepClone(event.data);
      if (!(event.source && 'parent' in event.source && event.source.parent === window
        && 'rtid' in data && RtidUtil.isRtid(data.rtid) && data.rtid.frame > 0)) {
        this.logger.debug('Frame.init: receive unexpected message from other window', event);
        return;
      }
      const frames = ContentUtils.traverseSelectorAllFrames(document, []);
      try {
        for (const frame of frames) {
          if ('contentWindow' in frame && frame.contentWindow === event.source) {
            (frame as any)['rtid'] = data.rtid;
            this.logger.debug('Frame.init: set frame element ', frame, ' with rtid', data.rtid);
          }
        }
      }
      catch (error) {
        this.logger.error('Frame.init: ', error);
      }
    });
    if (!this._isPage) {
      // register the current frame to parent frame with rtid
      window.parent.postMessage({ rtid: this.id }, '*');
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
    else if (propName === 'parent_rtid') {
      let parentRtid = Utils.deepClone(this.id);
      parentRtid.frame = -1;
      return parentRtid;
    }
    else if (propName === 'page_rect') {
      if (this._isPage) {
        const rect = {
          top: 0,
          left: 0,
          right: window.innerWidth,
          bottom: window.innerHeight
        };
        const rectInfo = Utils.fixRectange(rect);
        return rectInfo;
      }
      else {
        const rtid = Utils.deepClone(this.id);
        rtid.frame = 0;
        const queryMsgData = MsgUtil.createMessageData('query', rtid, { name: 'query_property', params: { name: propName } });
        const resMsgData = await self.gogogo.dispatcher.sendRequest(queryMsgData);
        const propValue = Utils.getItem(propName, resMsgData.result as Record<string, unknown>);
        return propValue;
      }

    }
    else if (propName === 'page_screen_rect') {
      if (this._isPage) {
        return CoodinateUtils.getPageRect();
      }
      else {
        const rtid = Utils.deepClone(this.id);
        rtid.frame = 0;
        const queryMsgData = MsgUtil.createMessageData('query', rtid, { name: 'query_property', params: { name: propName } });
        const resMsgData = await self.gogogo.dispatcher.sendRequest(queryMsgData);
        const propValue = Utils.getItem(propName, resMsgData.result as Record<string, unknown>);
        return propValue;
      }
    }
    else if (propName === 'page_zoom_factor' || propName === 'pageZoomFactor') {
      return CoodinateUtils.pageZoomFactor;
    }
    else if (propName === 'device_pixel_ratio' || propName === 'deviceScaleFactor') {
      return CoodinateUtils.getDevicePixelRatio();
    }
    else if (propName === 'device_scale_factor' || propName === 'deviceScaleFactor') {
      return CoodinateUtils.getDeviceScaleFactor();
    }
    else {
      if (propName in document) {
        const propValue = (document as any)[propName];
        if (typeof propValue === 'function') {
          return propValue();
        }
        return propValue;
      }
      else if (propName in window) {
        const propValue = (window as any)[propName];
        if (typeof propValue === 'function') {
          return propValue();
        }
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
    if (desc.type === 'element') {
      const elems = this._queryElements(desc);
      return elems;
    }
    if (desc.type === 'frame') {
      // in tab, we will filter frames in background
      // so, we do not filter frames in content, always return all frames
      const frames = this._queryAllFrames([], document);
      return frames;
    }
    throw new Error(`queryObjects: unexpected description type ${desc.type}`);
  }

  /** ==================================================================================================================== */
  /** =================================================== Frame methods ================================================== */
  /** ==================================================================================================================== */

  /** ==================================================================================================================== **/
  /** ================================================== Helper methods ================================================== **/
  /** ==================================================================================================================== **/

  protected async _handleConfigActions(data: MessageData): Promise<MessageData | undefined> {
    const { type, action } = data;

    if (type != 'config') {
      throw new Error(`_handleConfigActions: unexpected MessageData.type - ${type}`);
    }

    const resData: MessageData = {
      ...Utils.deepClone(data)
    };

    if (action.name === 'set') {
      if ((action.params?.name === 'zoom_factor' || action.params?.name === 'pageZoomFactor')
        && typeof action.params?.value === 'number') {
        CoodinateUtils.pageZoomFactor = action.params?.value;
        resData.status = 'OK';
      }
    }
    else if (action.name === 'get') {
    }

    if (Utils.isNullOrUndefined(resData.status)) {
      throw new Error(`_handleConfigActions: failed to handle action ${action.name}`);
    }

    return resData;
  }

  protected async _handleCommandActions(data: MessageData): Promise<MessageData | undefined> {
    const { type, action } = data;

    if (type != 'command') {
      throw new Error(`_handleCommandActions: unexpected MessageData.type - ${type}`);
    }

    const resData: MessageData = {
      ...Utils.deepClone(data)
    };

    let elems: Element[] = [];
    if (data.target) {
      const objects = this._queryElements(data.target);
      elems = objects.map(obj => this.elemMap[obj.rtid.object]).filter(obj => !Utils.isNullOrUndefined(obj));
    }

    const actionName = action.name as elementActionName;

    if (actionName === 'get_attribute') {
      if (typeof action.params?.name !== 'string') {
        throw new Error('Invalid Arguments: attribute name is invalid');
      }
      if (elems.length === 0) {
        throw new Error('No Such Element');
      }
      if (elems.length > 1) {
        throw new Error('Ambiguous Element');
      }
      const elem = elems[0];
      const attrName = action.params.name;
      const attrValue = elem?.getAttribute(attrName);

      const result = {} as Record<string, unknown>;
      result[attrName] = attrValue;
      resData.result = result;
      resData.status = 'OK';
    }

    if (Utils.isNullOrUndefined(resData.status)) {
      throw new Error(`_handleCommandActions: failed to handle action ${action.name}`);
    }

    return resData;
  }

  protected async _handleRecordActions(data: MessageData): Promise<MessageData | undefined> {
    throw new Error("Method not implemented.");
  }

  private _getLogicName(elem: Element): string {

    let name: string | undefined | null = undefined;

    if (elem.hasAttribute('name')) {
      name = elem.getAttribute('name');
      if (name) {
        return name;
      }
    }

    if (elem.hasAttribute('acc_name')) {
      name = elem.getAttribute('acc_name');
      if (name) {
        return name;
      }
    }

    if (elem.hasAttribute('aria-label')) {
      name = elem.getAttribute('aria-label');
      if (name) {
        return name;
      }
    }

    if (elem.hasAttribute('aria-labelledby')) {
      name = elem.getAttribute('aria-labelledby');
      if (name && elem.tagName) {
        return name + '_' + elem.tagName;
      }
    }

    if (elem.hasAttribute('title')) {
      name = elem.getAttribute('title');
      if (name) {
        return name;
      }
    }

    if (elem.hasAttribute('id')) {
      name = elem.getAttribute('id');
      if (name) {
        return name;
      }
    }

    if (elem.hasAttribute('alt')) {
      name = elem.getAttribute('alt');
      if (name) {
        return name;
      }
    }

    if (elem.hasAttribute('placeholder')) {
      name = elem.getAttribute('placeholder');
      if (name) {
        return name;
      }
    }

    if (elem.hasAttribute('role')) {
      name = elem.getAttribute('role');
      if (name) {
        return name;
      }
    }

    if (elem.tagName === 'INPUT' && !Utils.isEmpty(elem.nodeValue)) {
      name = elem.nodeValue;
      if (name) {
        return name;
      }
    }

    if (!Utils.isEmpty(elem.textContent)) {
      name = elem.textContent;
      if (name) {
        return name;
      }
    }

    return elem.tagName ?? 'element';
  }

  private _getAttributes(elem: Element): Record<string, unknown> {
    const attrs: Record<string, unknown> = {};
    const attrNames = elem.getAttributeNames();
    for (const attrName of attrNames) {
      const attrValue = elem.getAttribute(attrName);
      attrs[attrName] = attrValue;
    }
    return attrs;
  }

  private _cacheElement(elem: Element): number {
    for (const [key, element] of Object.entries(this.elemMap)) {
      if (elem === element) {
        return parseInt(key, 10);
      }
    }
    const objId = this._nextObjId++;
    this.elemMap[objId] = elem;
    return objId;
  }

  /** ==================================================================================================================== **/
  /** =================================================== Query methods ================================================== **/
  /** ==================================================================================================================== **/

  private _queryElements(desc: AODesc): AutomationObject[] {
    // todo: add frame element attribute filters
    let candidates: Element[] = [];
    let usedQueryInfo: QueryInfo | undefined = undefined;

    if (desc.rtids && desc.rtids.length > 0) {
      for (const rtid of desc.rtids) {
        try {
          if (rtid.object >= 1) {
            const elem = this.elemMap[rtid.object];
            if (elem) {
              candidates.push(elem);
            }
          }
        }
        catch (err) {
          this.logger.warn(`_queryElements: failed on rtid: ${JSON.stringify(rtid)}`);
        }
      }
      // find frames via rtids (frame.rtid is set by the init function)
      const frameRtids = desc.rtids.filter(rtid => rtid.object === -1 && rtid.frame > 0);
      if (frameRtids.length > 0) {
        const frameElements = ContentUtils.traverseSelectorAllFrames(document, []);
        for (const frameElement of frameElements) {
          if ('rtid' in frameElement as any) {
            const rtid = (frameElement as any).rtid as Rtid;
            if (frameRtids.find(r => RtidUtil.isRtidEqual(rtid, r))) {
              candidates.push(frameElement);
            }
          }
        }
      }
    }
    else if (desc.queryInfo) {
      let root: Node = document;
      if (desc.parent) {
        root = this.elemMap[desc.parent.object];
        if (Utils.isNullOrUndefined(root)) {
          throw new Error('Invalid Arguments: the parent element is not valid.');
        }
      }
      const queryResult = LocatorUtils.queryObjects((selectors) => {
        return this._queryElementsWithSelectors(selectors, root);
      }, desc.queryInfo);
      candidates = queryResult?.objects || [];
      usedQueryInfo = queryResult?.queryInfo;
    }
    else {
      throw new Error('Invalid Arguments: no valid query info for elements');
    }

    const objects = candidates.map((elem) => {
      const objId = this._cacheElement(elem);
      const attrs = this._getAttributes(elem);
      return {
        type: "element" as const,
        name: this._getLogicName(elem),
        rtid: Object.assign({}, this.id, { object: objId }),
        runtimeInfo: { ...Utils.deepClone(attrs) },
        metaData: usedQueryInfo ? { used: usedQueryInfo } : undefined
      };
    });
    return objects;
  }

  private _queryElementsWithSelectors(selectors: Selector[], root: Node): Element[] {
    // primary selectors: css/xpath
    let cssSelector: Selector | undefined = undefined;
    let xpathSelector: Selector | undefined = undefined;
    const querySelectors: Selector[] = [];
    for (const selector of selectors) {
      const key = selector.key || selector.name;
      // use #css and #xpath as the primary selector key to avoid conflict with element attributes
      if (key === '#css') {
        cssSelector = selector;
      }
      else if (key === '#xpath') {
        xpathSelector = selector;
      }
      else {
        querySelectors.push(selector);
      }
    }

    // query elements using id/css/xpath selector
    const candidates: Element[] = [];
    if (cssSelector && cssSelector.value) {
      const container = 'querySelectorAll' in root ? root as ParentNode : document;
      const res = container.querySelectorAll(cssSelector.value as string);
      res.forEach((elem) => {
        candidates.push(elem);
      });
    }
    if (xpathSelector && xpathSelector.value) {
      const container = 'evaluate' in root ? root as Document : document;
      let it = container.evaluate(xpathSelector.value as string, container, null, XPathResult.ANY_TYPE, null);
      let node = it.iterateNext();
      while (node) {
        if (node.nodeType === Node.ELEMENT_NODE) {
          candidates.push(node as Element);
        }
        node = it.iterateNext();
      }
    }

    if (candidates.length > 0) {
      return LocatorUtils.filterObjects(candidates, querySelectors);
    }
    else {
      return ContentUtils.traverseSelectorAll(root, querySelectors);
    }
  }

  private _queryAllFrames(selectors: Selector[], root: Node): AutomationObject[] {
    const frames = ContentUtils.traverseSelectorAllFrames(root, selectors);

    const objects = frames.map((frame) => {
      const rtid = Utils.deepClone(this.id);
      if ('rtid' in frame && RtidUtil.isRtid(frame.rtid)) {
        rtid.frame = frame.rtid.frame;
      }
      else {
        rtid.frame = -1;
      }
      const attrs = this._getAttributes(frame);
      return {
        type: "frame" as const,
        name: this._getLogicName(frame),
        rtid: rtid,
        runtimeInfo: { ...Utils.deepClone(attrs), tagName: frame.tagName },
        metaData: undefined
      };
    });
    return objects;
  }

  private async _queryTabProperty(propName: string): Promise<unknown> {
    const rtid = RtidUtil.getTabRtid(this.id.tab, -1);
    const queryMsgData = MsgUtil.createMessageData('query', rtid, { name: 'query_property', params: { name: propName } });
    const resMsgData = await self.gogogo.dispatcher.sendRequest(queryMsgData);
    const propValue = Utils.getItem(propName, resMsgData.result as Record<string, unknown>);
    return propValue;
  }

}