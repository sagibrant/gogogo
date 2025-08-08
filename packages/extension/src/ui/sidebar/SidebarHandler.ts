/**
 * @copyright 2025 Sagi All Rights Reserved.
 * @author: Sagi <sagibrant@163.com>
 * @license Apache-2.0
 * @file SidebarHandler.ts
 * @description 
 * Support the record and inspect actions
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

import { RtidUtil } from "@/common/Common";
import { MsgDataHandlerBase } from "@/common/Messaging/MsgDataHandler";
import { Action, AODesc, AutomationObject, MessageData } from "@/types/message";

interface SidebarEvents {
  objectInspected: { ao: AutomationObject };
  stepRecorded: { ao: AutomationObject, action: Action };
}

export class SidebarHandler extends MsgDataHandlerBase<SidebarEvents> {

  constructor() {
    const rtid = RtidUtil.getAgentRtid();
    rtid.external = '';
    super(rtid);
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
    const { type, action } = data;

    if (type != 'record') {
      throw new Error(`_handleRecordActions: unexpected MessageData.type - ${type}`);
    }

    throw new Error(`_handleRecordActions: failed to handle action ${action.name}`);
  }

}
