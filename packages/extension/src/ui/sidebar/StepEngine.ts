/**
 * @copyright 2025 Sagi All Rights Reserved.
 * @author: Sagi <sagibrant@163.com>
 * @license Apache-2.0
 * @file StepEngine.ts
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

import { MsgUtil, RtidUtil, Utils } from "@/common/Common";
import { AODesc, InvokeAction, Rtid } from "@/types/message";
import { SidebarDispatcher } from "./SidebarDispatcher";
import { Logger } from "@/common/Logger";


export class StepEngine {
  private readonly _logger: Logger;
  private readonly _dispatcher: SidebarDispatcher;

  constructor(dispatcher: SidebarDispatcher) {
    this._dispatcher = dispatcher;
    const prefix = Utils.isEmpty(this.constructor?.name) ? "Dispatcher" : this.constructor?.name;
    this._logger = new Logger(prefix);
  }

  async inspect(tabRtid: Rtid): Promise<void> {
    const msgData = MsgUtil.createMessageData('command', tabRtid, {
      name: 'invoke',
      params: {
        name: 'inspect'
      }
    } as InvokeAction);
    await this._dispatcher.sendEvent(msgData);
    return;
  }

  async highlight(tabRtid: Rtid, desc: AODesc): Promise<boolean> {
    const msgData = MsgUtil.createMessageData('command', tabRtid, {
      name: 'invoke',
      params: {
        name: 'highlight'
      }
    } as InvokeAction, desc);
    const resMsgData = await this._dispatcher.sendRequest(msgData);
    if (resMsgData.status === 'OK') {
      return true;
    }
    return false;
  }

  async runScript(script: string, isolated: boolean = true, timeout: number = 60000): Promise<any> {
    const rtid = RtidUtil.getAgentRtid();
    rtid.context = 'external';
    rtid.external = 'runScipt-sandbox';
    const msgData = MsgUtil.createMessageData('command', rtid, {
      name: 'invoke',
      params: {
        name: 'runScript',
        args: [script, isolated]
      }
    } as InvokeAction);

    this._logger.debug('runScript ==>', script, isolated);
    const resMsg = await this._dispatcher.sendRequest(msgData, timeout);
    this._logger.debug('runScript <==', script, isolated, resMsg);
    if (resMsg.status === 'OK') {
      return resMsg.result || undefined;
    }
    else {
      throw new Error(resMsg.error ?? 'run script failed');
    }
  }
}
