/**
 * @copyright 2025 Sagi All Rights Reserved.
 * @author: Sagi <sagibrant@163.com>
 * @license Apache-2.0
 * @file SidebarDispatcher.ts
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

import { RtidUtil, Utils } from "@/common/Common";
import { IChannel } from "@/common/Messaging/ChannelBase";
import { ExtensionChannelClient } from "@/common/Messaging/ComChannels/ExtensionChannel";
import { Dispatcher } from "@/common/Messaging/Dispatcher";
import { Message } from "@/types/message";
import { SidebarHandler } from "./SidebarHandler";
import { PostMessageChannel } from "@/common/Messaging/ComChannels/PostMessageChannel";


export class SidebarDispatcher extends Dispatcher {
  private readonly _extensionChannelClient: ExtensionChannelClient;
  private readonly _runScriptChannel: PostMessageChannel;

  constructor() {
    super('sidebar');

    this._extensionChannelClient = new ExtensionChannelClient('background');
    this._runScriptChannel = new PostMessageChannel('sandbox-iframe');
    this.logger.debug('SidebarDispatcher created');
  }

  async init(handler: SidebarHandler) {
    this._extensionChannelClient.on('connected', ({ client, channel }) => {
      console.error('connected:', client, channel);
      this.addRoutingChannel('background', client, channel);
      handler.id.external = client.id;
    });
    this._extensionChannelClient.on('disconnected', ({ client, channel }) => {
      this.removeRoutingChannel('background', client, channel);
      // try re-connect
      console.error('disconnected:', client, channel);
      this._extensionChannelClient.connect();
    });

    this.addRoutingChannel('external', { id: 'runScipt-sandbox', type: 'external' }, this._runScriptChannel);
    
    this._extensionChannelClient.connect();
  }

  protected override getRoutingChannels(msg: Message): IChannel[] {

    const dest = msg.data.dest;
    let channels: IChannel[] = [];

    let routingKey = RtidUtil.getRtidContextType(dest);
    if (Utils.isNullOrUndefined(routingKey)) {
      this.logger.error('getRoutingChannels: fail to find the routingKey for the rtid: ', dest);
      return [];
    }

    if(routingKey!== 'external') {
      routingKey = 'background';
    }

    const clientChannels = this.routingMap[routingKey];
    if (Utils.isEmpty(clientChannels)) {
      return [];
    }

    clientChannels.forEach((clientChannel) => {
      const [_client, channel] = clientChannel;
      channels.push(channel);
    });

    if (channels.length > 1) {
      this.logger.warn(`getRoutingChannels: find unexpected ${channels.length} channels`);
    }

    return channels;
  }
}