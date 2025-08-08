/**
 * @copyright 2025 Sagi All Rights Reserved.
 * @author: Sagi <sagibrant@163.com>
 * @license Apache-2.0
 * @file PostMessageChannel.ts
 * @description 
 * Use window.postMessage for communication. risky if running with user script context
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

import { ChannelBase, ChannelStatus } from '../ChannelBase';
import { Message } from '../../../types/message';

/**
 * The channel based on the extension port
 */
export class PostMessageChannel extends ChannelBase {
  /**
   * the listenerWrapper for events
   */
  private readonly _onMessageListenerWrapper: (ev: MessageEvent<any>) => void;
  /**
   * the window for communication
   */
  private readonly _window: Window;

  constructor(frameId?: string, win?: Window, listen: boolean = true) {
    super();

    if (win) {
      this._window = win;
    }
    else if (frameId) {
      const frame = document.getElementById(frameId);
      if (frame && 'contentWindow' in frame) {
        this._window = frame.contentWindow as Window;
      }
      else {
        throw new Error(`PostMessageChannel init failed in getElementById - ${frameId}`);
      }
    }
    else {
      throw new Error(`PostMessageChannel init failed. missing frameId or window`);
    }


    this._status = ChannelStatus.CONNECTED;
    this._onMessageListenerWrapper = this.onMessage.bind(this);

    if (listen) {
      window.addEventListener('message', this._onMessageListenerWrapper);
    }
  }

  send(msg: Message): void {
    if (this._status != ChannelStatus.CONNECTED) {
      this.logger.warn('send: failed to send message because the port status is not connected');
      return;
    }
    try {
      this.logger.debug('send: ==>> msg=', msg);

      this._window.postMessage(msg, '*');
    }
    catch (error) {
      this.logger.error('send:', error);
    }
  }

  disconnect(_reason?: string): void {
    if (this._status != ChannelStatus.CONNECTED) {
      this.logger.warn('disconnect: failed to disconnect because the port status is not connected');
      return;
    }
    this._status = ChannelStatus.DISCONNECTED;
    window.removeEventListener('message', this._onMessageListenerWrapper);
  }

  private onMessage(ev: MessageEvent<any>): void {
    this.logger.debug('onMessage: ==>> ev=', ev);

    if (ev.source !== this._window) {
      return;
    }
    if (['event', 'request', 'response'].includes(ev.data.type)) {
      const msg = ev.data as Message;
      this.emit('message', { msg: msg });
    }
  }
}
