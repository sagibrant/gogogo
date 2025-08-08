/**
 * @copyright 2025 Sagi All Rights Reserved.
 * @author: Sagi <sagibrant@163.com>
 * @license Apache-2.0
 * @file sandbox.ts
 * @description 
 * Entry point for sandbox.html
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
import { Logger } from "@/common/Logger";
import { SettingUtils } from "@/common/Settings";
import { Browser } from "@/sdk/Browser";
import { ExecutionMsgDispatcher } from "@/sdk/Channel";
import { InvokeAction, Message } from "@/types/message";

SettingUtils.getSettings().logLevel = 'WARN';
const dispatcher = new ExecutionMsgDispatcher();
const browser = new Browser(dispatcher, RtidUtil.getBrowserRtid());
const logger = new Logger('sandbox');
(window as any).browser = browser;
window.addEventListener('message', async (ev) => {
  if (ev.source !== window.parent) {
    return;
  }
  const msg = ev.data as Message;
  logger.debug('onWindowMessage:', msg);
  // reset the page in case the tab is switched before the script execution
  if (msg.data.type === 'command'
    && msg.data.action.name === 'invoke'
    && (msg.data.action as InvokeAction).params.name === 'runScript'
  ) {
    const page = await browser.lastActivePage();
    (window as any).page = page;
  }
  dispatcher.onWindowMessage(msg);
});