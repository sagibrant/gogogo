/**
 * @copyright 2025 Sagi All Rights Reserved.
 * @author: Sagi <sagibrant@163.com>
 * @license Apache-2.0
 * @file Channel.ts
 * @description 
 * Dispatching the message to the handlers or forward via channels using routing map
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
import { IChannel } from "@/common/Messaging/ChannelBase";
import { Dispatcher } from "@/common/Messaging/Dispatcher";
import { AODesc, AutomationObject, InvokeAction, Message, MessageData, Rtid } from "@/types/message";
import { PostMessageChannel } from "@/common/Messaging/ComChannels/PostMessageChannel";
import { MsgDataHandlerBase } from "@/common/Messaging/MsgDataHandler";

export interface IMsgChannel {
  setDefaultTimeout(timeout: number): void;
  queryProperty(rtid: Rtid, propName: string): Promise<unknown>;
  queryObjects(rtid: Rtid, desc: AODesc): Promise<AutomationObject[]>;
  invokeFunction(rtid: Rtid, funcName: string, args: unknown[], target?: AODesc): Promise<unknown>;
}

export class ExecutionMsgDispatcher extends Dispatcher implements IMsgChannel {
  private readonly _sidebarChannel: PostMessageChannel;

  constructor() {
    super('runScipt-sandbox');

    this._sidebarChannel = new PostMessageChannel(undefined, window.parent, false);
    this.addRoutingChannel('external', { id: 'sidebar', type: 'external' }, this._sidebarChannel);

    const runScriptHandler = new RunScriptHandler();
    this.addHandler(runScriptHandler);

    this.logger.debug('ExecutionMsgDispatcher');
  }

  override setDefaultTimeout(timeout: number): void {
    super.setDefaultTimeout(timeout);
  }

  protected override getRoutingChannels(msg: Message): IChannel[] {
    return [this._sidebarChannel];
  }

  onWindowMessage(msg: Message) {
    this.onMessage(msg, this._sidebarChannel);
  }

  async queryProperty(rtid: Rtid, propName: string): Promise<unknown> {
    const queryMsgData = MsgUtil.createMessageData('query', rtid, { name: 'query_property', params: { name: propName } });
    const resMsgData = await this.sendRequest(queryMsgData);
    if (resMsgData.status === 'OK') {
      const propValue = Utils.getItem(propName, resMsgData.result as Record<string, unknown>);
      return propValue;
    }
    else {
      throw new Error(resMsgData.error || 'query property failed');
    }
  }

  async queryObjects(rtid: Rtid, desc: AODesc): Promise<AutomationObject[]> {
    const queryMsgData = MsgUtil.createMessageData('query', rtid, { name: 'query_objects' }, desc);
    const resMsgData = await this.sendRequest(queryMsgData);
    if (resMsgData.status === 'OK') {
      return resMsgData.objects || [];
    }
    else {
      throw new Error(resMsgData.error || 'query objects failed');
    }
  }

  async invokeFunction(rtid: Rtid, funcName: string, args: unknown[], target?: AODesc): Promise<unknown> {
    const queryMsgData = MsgUtil.createMessageData('command', rtid, {
      name: 'invoke',
      params: {
        name: funcName,
        args: args
      }
    } as InvokeAction, target);
    const resMsgData = await this.sendRequest(queryMsgData);
    if (resMsgData.status === 'OK') {
      return resMsgData.result;
    }
    else {
      throw new Error(resMsgData.error || 'invokeFunction failed');
    }
  }

}

export class RunScriptHandler extends MsgDataHandlerBase {

  constructor() {
    const rtid = RtidUtil.getAgentRtid();
    rtid.context = 'external';
    rtid.external = 'runScipt-sandbox';
    super(rtid);
  }

  async runScript(script: string, isolated: boolean = false): Promise<unknown> {
    try {
      // eval/new Function are only allowed in sandbox in extension mv3 for CSP issues
      let result: any = undefined;
      this.logger.debug('runScript: ==> ', script, 'isolated:', isolated);
      if (isolated) {
        // Isolated mode: use new Function
        // Explicitly pass allowed globals to prevent unintended access
        const func = new Function(
          // Whitelist allowed global variables (e.g., fetch, console)
          'fetch', 'console',
          `return (async () => { ${script} })()`
        );
        // Inject whitelisted globals as arguments
        result = func(fetch, console);
      }
      else {
        // Non-isolated mode: use direct eval to access local scope
        // WARNING: Allows script to access/modify local variables (risky for untrusted code)
        // use 'var' to store variables and return value without the 'return' but direct call to the variable
        // 'var a = 1; a;'
        result = eval.call(window, script);
      }
      if (result instanceof Promise) {
        return await result;
      }
      else {
        return result;
      }
    } catch (error) {
      this.logger.error('runScript:', error);
      throw error;
    }
    finally {
      this.logger.debug('runScript: <==');
    }
  }

  async queryProperty(propName: string): Promise<unknown> {
    throw new Error("Method not implemented.");
  }

  async queryObjects(desc: AODesc): Promise<AutomationObject[]> {
    throw new Error("Method not implemented.");
  }

  protected async _handleCommandActions(data: MessageData): Promise<MessageData | undefined> {
    throw new Error("Method not implemented.");
  }

  protected async _handleRecordActions(data: MessageData): Promise<MessageData | undefined> {
    throw new Error("Method not implemented.");
  }

}
