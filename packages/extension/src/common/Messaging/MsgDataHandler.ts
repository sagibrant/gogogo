/**
 * @copyright 2025 Sagi All Rights Reserved.
 * @author: Sagi <sagibrant@163.com>
 * @license Apache-2.0
 * @file MsgDataHandler.ts
 * @description 
 * Defines the interface and base class for MessageData handler
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

import { AODesc, AutomationObject, InvokeAction, MessageData, queryActionName, Rtid } from "@/types/message";
import { EventEmitter, EventMap } from "../EventEmitter";
import { RtidUtil, Utils } from "../Common";

/**
 * Callback type for delivering handler results
 */
export type ResultCallback = (result: MessageData) => void;

/**
 * The base class for handling communication messages
 */
export interface IMsgDataHandler {
  readonly id: Rtid;

  /**
   * Handles a message and invokes a result callback when done.
   * @param msg - The incoming message data.
   * @param resultCallback - Callback to return results.
   */
  handle(data: MessageData, resultCallback?: ResultCallback): boolean;
}

/**
 * the base class for MessageData handler
 */
export abstract class MsgDataHandlerBase<T extends EventMap = any> extends EventEmitter<T> implements IMsgDataHandler {
  readonly id: Rtid;
  readonly config: Record<string, unknown>;

  constructor(rtid: Rtid) {
    super();
    this.id = rtid;
    this.config = {};
  }

  /**
   * handle the message data
   * @param data message data
   * @param resultCallback result callback func
   * @returns handled or not
   */
  handle(data: MessageData, resultCallback?: ResultCallback): boolean {
    if (!RtidUtil.isRtidEqual(data.dest, this.id)) {
      return false;
    }
    this.logger.debug('handle: ==> handle the msgData:\r\n', data);
    this._handle(data).then((res) => {
      if (res && resultCallback) {
        this.logger.debug('handle: <== resultCallback result:\r\n', res);
        resultCallback(res);
      }
      else {
        this.logger.debug('handle: <==');
      }
    }).catch((error) => {
      this.logger.error(`handle: failed on the message data: \r\n error: ${error instanceof Error ? error.message : error}, \r\n msgData: ${JSON.stringify(data)} `);
      if (resultCallback) {
        const resData: MessageData = {
          ...Utils.deepClone(data),
          status: 'ERROR',
          error: error instanceof Error ? error.message : error as string
        };
        this.logger.debug('handle: <== resultCallback ERROR result:\r\n', data);
        resultCallback(resData);
      }
    });
    return true;
  }

  /**
   * query property value 
   * @param propName property name
   * @returns property value
   */
  abstract queryProperty(propName: string): Promise<unknown>;

  /**
   * query property values
   * @param props property array
   * @returns property values
   */
  async queryProperties(props: string[]): Promise<Record<string, unknown>> {
    const result: Record<string, unknown> = {};
    for (const propName of props) {
      try {
        const propValue = await this.queryProperty(propName);
        result.propName = propValue;
      }
      catch (error) {
        this.logger.warn(`queryProperties: ${error instanceof Error ? error.message : error}`)
      }
    }
    return result;
  }

  /**
   * query automation objects
   * @param desc description for objects
   * @returns automation objects
   */
  abstract queryObjects(desc: AODesc): Promise<AutomationObject[]>;

  /**
   * invoke a function with name and arguments
   * @param funcName function name to invoke
   * @param args function arguements
   * @returns function call result
   */
  async invokeFunction(funcName: string, args?: unknown[]): Promise<unknown> {
    if (Utils.isEmpty(funcName)) {
      throw new Error(`invokeFunction: '${funcName}' is not valid`);
    }
    if (!(funcName in this)) {
      throw new Error(`invokeFunction: fail to find '${funcName}'`);
    }
    const func = (this as any)[funcName];
    if (!Utils.isFunction(func)) {
      throw new Error(`invokeFunction: '${funcName}' is not a function`);
    }
    const result = await func.apply(this, args);
    return result;
  }


  async getAO(): Promise<AutomationObject> {
    return {
      type: 'agent',
      name: 'agent',
      rtid: this.id,
      runtimeInfo: {}
    };
  }

  /**
   * internal message data handle function
   * @param data MessageData to be handled
   */
  private async _handle(data: MessageData): Promise<MessageData | undefined> {
    const { type, action } = data;
    if (Utils.isNullOrUndefined(type) || Utils.isNullOrUndefined(action)) {
      throw new Error('_handle: type or action is null or undefined');
    }

    if (type === 'config') {
      const result = await this._handleConfigActions(data);
      return result;
    }
    else if (type === 'query') {
      const result = await this._handleQueryActions(data);
      return result;
    }
    else if (type === 'command') {
      if (action.name === 'invoke') {
        const invokeAction = action as InvokeAction;
        const { name, args } = invokeAction.params;
        const result = await this.invokeFunction(name, args);
        const resData: MessageData = {
          ...Utils.deepClone(data),
          status: 'OK'
        };
        if (!Utils.isNullOrUndefined(result)) {
          resData.result = result;
        }
        const ao = await this.getAO();
        resData.objects = [ao];
        return resData;
      }
      // if not wait or invoke which is in generalActionName
      const result = await this._handleCommandActions(data);
      return result;
    }
    else if (type === 'record') {
      const result = await this._handleRecordActions(data);
      return result;
    }

    throw new Error(`_handle: unsupported MessageData.type - ${type}`);
  }

  protected async _handleConfigActions(data: MessageData): Promise<MessageData | undefined> {
    const { type, action } = data;

    if (type != 'config') {
      throw new Error(`_handleConfigActions: unexpected MessageData.type - ${type}`);
    }

    const resData: MessageData = {
      ...Utils.deepClone(data)
    };

    if (action.name === 'set') {
      const name = action.params?.name as string
      const value = action.params?.value;
      this.config[name] = value;
      resData.status = 'OK';
    }
    else if (action.name === 'get') {
      const name = action.params?.name as string
      const value = this.config[name];
      const result = {} as Record<string, unknown>;
      result[name] = value;
      resData.result = result;
      resData.status = 'OK';
    }

    if (Utils.isNullOrUndefined(resData.status)) {
      throw new Error(`_handleConfigActions: failed to handle action ${action.name}`);
    }

    return resData;
  }

  protected async _handleQueryActions(data: MessageData): Promise<MessageData | undefined> {
    const { type, action, target } = data;

    if (type != 'query') {
      throw new Error(`_handleQueryActions: unexpected MessageData.type - ${type}`);
    }

    const resData: MessageData = {
      ...Utils.deepClone(data)
    };

    const actionName = action.name as queryActionName;

    if (actionName === 'query_object' && target) {
      const objects = await this.queryObjects(target);
      resData.objects = objects;
      resData.result = { rtids: objects.map(t => t.rtid) };
      if (objects.length === 1) {
        resData.status = 'OK';
      }
      else if (objects.length > 1) {
        resData.status = 'ERROR';
        resData.error = 'Multiple objects';
      }
      else {
        resData.status = 'ERROR';
        resData.error = 'No object';
      }
    }
    else if (actionName === 'query_objects' && target) {
      const objects = await this.queryObjects(target);
      resData.objects = objects;
      resData.result = { rtids: objects.map(t => t.rtid) };
      resData.status = 'OK';
    }
    else if (actionName === 'query_property' && typeof action.params?.name === 'string') {
      const propName = action.params?.name as string
      const propValue = await this.queryProperty(propName);
      const result = {} as Record<string, unknown>;
      result[propName] = propValue;
      resData.result = result;
      resData.status = 'OK';
    }
    else if (actionName === 'query_properties' && Array.isArray(action.params?.names)) {
      const propNames = action.params?.names as string[];
      const values = await this.queryProperties(propNames);
      resData.result = values;
      resData.status = 'OK';
    }

    if (Utils.isNullOrUndefined(resData.status)) {
      throw new Error(`_handleQueryActions: failed to handle action ${action.name}`);
    }

    return resData;
  }

  protected abstract _handleCommandActions(data: MessageData): Promise<MessageData | undefined>;
  protected abstract _handleRecordActions(data: MessageData): Promise<MessageData | undefined>;

}