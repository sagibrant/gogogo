/**
 * @copyright 2025 Sagi All Rights Reserved.
 * @author: Sagi <sagibrant@163.com>
 * @license Apache-2.0
 * @file ContentDispatcher.ts
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

import { RtidUtil, Utils } from "../common/Common";
import { IChannel } from "../common/Messaging/ChannelBase";
import { ExtensionChannelClient, ExtensionClientInfo } from "../common/Messaging/ComChannels/ExtensionChannel";
import { Dispatcher } from "../common/Messaging/Dispatcher";
import { Message } from "../types/message";

export class ContentDispatcher extends Dispatcher {
  private readonly _extensionChannelClient: ExtensionChannelClient;
  private _frameId?: number;
  private _tabId?: number;

  constructor() {
    super('content');

    // connect to native (native messaging)
    this._extensionChannelClient = new ExtensionChannelClient('background');
    this._extensionChannelClient.on('connected', ({ client, channel }) => {
      console.error('connected', client, channel);
      this.addRoutingChannel('background', client, channel);

      this._tabId = (client as ExtensionClientInfo).info?.tab?.id;
      this._frameId = (client as ExtensionClientInfo).info?.frameId;

      if (!Utils.isNullOrUndefined(this._tabId) && !Utils.isNullOrUndefined(this._frameId)) {
        self.gogogo.frame.init(this._tabId, this._frameId);
      }
    });
    this._extensionChannelClient.on('disconnected', ({ client, channel }) => {
      console.error('disconnected', client, channel);
      this.removeRoutingChannel('background', client, channel);

      this._extensionChannelClient.reconnect();
    });

    this.logger.debug('ContentDispatcher created');
  }

  async init() {
    this._extensionChannelClient.connect();
    // todo: connect to the MAIN WORLD
  }

  protected override getRoutingChannels(msg: Message): IChannel[] {

    const dest = msg.data.dest;
    let channels: IChannel[] = [];

    let routingKey = RtidUtil.getRtidContextType(dest);
    if (Utils.isNullOrUndefined(routingKey)) {
      this.logger.error('getRoutingChannels: fail to find the routingKey for the rtid: ', dest);
      return [];
    }

    // content send msg to background and then background forward the message to native/server/extension
    if (routingKey === 'external') {
      routingKey = 'background';
    }

    // msg to other frames, forward msg to bg and then bg will forward to the correct frame
    if (routingKey === 'content' && dest.frame != this._frameId) {
      routingKey = 'background';
    }

    const clientChannels = this.routingMap[routingKey];
    if (Utils.isEmpty(clientChannels)) {
      return channels;
    }

    // for 'background' | 'extension' | 'native' | 'server'
    if (routingKey === 'background') {
      // forward the message to background using the ExtensionChannel
      clientChannels.forEach((clientChannel) => {
        const [_client, channel] = clientChannel;
        channels.push(channel);
      });
    }
    else if (routingKey === 'MAIN') {
      // should use the CustomEventChannel
      clientChannels.forEach((clientChannel) => {
        const [_client, channel] = clientChannel;
        channels.push(channel);
      });
    }
    else {
      // message to content, should be handled by local handlers
      this.logger.warn(`getRoutingChannels: receive unexpected routingKey ${routingKey}`);
    }

    if (channels.length > 1) {
      this.logger.warn(`getRoutingChannels: find unexpected ${channels.length} channels`);
    }

    return channels;
  }
}