/**
 * @copyright 2025 Sagi All Rights Reserved.
 * @author: Sagi <sagibrant@163.com>
 * @license Apache-2.0
 * @file BackgroundDispatcher.ts
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

import { MsgUtil, RtidUtil, Utils } from "../common/Common";
import { IChannel } from "../common/Messaging/ChannelBase";
import { ExtensionChannelClient, ExtensionChannelHost, ExtensionClientInfo } from "../common/Messaging/ComChannels/ExtensionChannel";
import { Dispatcher } from "../common/Messaging/Dispatcher";
import { InvokeAction, Message } from "../types/message";

export class BackgroundDispatcher extends Dispatcher {

  private readonly _extensionChannelHost: ExtensionChannelHost;
  private readonly _extensionNativeChannelClient: ExtensionChannelClient;

  constructor() {
    super('background');

    // listening for content and extension connections
    this._extensionChannelHost = new ExtensionChannelHost();
    this._extensionChannelHost.on('connected', ({ client, channel }) => {
      if (client.type === 'content') {
        this.addRoutingChannel('content', client, channel);
        // send msg to frame to notify the connection
        const tabId = (client as ExtensionClientInfo).info?.tab?.id;
        const frameId = (client as ExtensionClientInfo).info?.frameId;
        if (!Utils.isNullOrUndefined(tabId) && !Utils.isNullOrUndefined(frameId)) {
          this.updateFrameConnectionStatus(tabId, frameId, true);
        }
      }
      else if (client.type === 'background') {
        this.addRoutingChannel('background', client, channel);
      }
      else if (client.type === 'external') {
        this.addRoutingChannel('external', client, channel);
      }
    });
    this._extensionChannelHost.on('disconnected', ({ client, channel }) => {
      if (client.type === 'content') {
        this.removeRoutingChannel('content', client, channel);

        // send msg to frame to notify the connection
        const tabId = (client as ExtensionClientInfo).info?.tab?.id;
        const frameId = (client as ExtensionClientInfo).info?.frameId;
        if (!Utils.isNullOrUndefined(tabId) && !Utils.isNullOrUndefined(frameId)) {
          this.updateFrameConnectionStatus(tabId, frameId, false);
        }
      }
      else if (client.type === 'background') {
        this.removeRoutingChannel('background', client, channel);
      }
      else if (client.type === 'external') {
        this.removeRoutingChannel('external', client, channel);
      }
    });

    // connect to native (native messaging)
    this._extensionNativeChannelClient = new ExtensionChannelClient('native', 'mock_native_app');
    this._extensionNativeChannelClient.on('connected', ({ client, channel }) => {
      if (client.type === 'external') {
        this.addRoutingChannel('external', client, channel);
      }
    });
    this._extensionNativeChannelClient.on('disconnected', ({ client, channel }) => {
      if (client.type === 'external') {
        this.removeRoutingChannel('external', client, channel);
      }
    });
  }

  async init() {
    this._extensionChannelHost.start();
    this._extensionNativeChannelClient.connect();
    // todo: connect to server using ws channel
  }

  protected override getRoutingChannels(msg: Message): IChannel[] {

    const dest = msg.data.dest;
    let channels: IChannel[] = [];

    let routingKey = RtidUtil.getRtidContextType(dest);
    if (Utils.isNullOrUndefined(routingKey)) {
      return [];
    }
    // we need to forward the message to content channel and content will forward to MAIN
    if (routingKey === 'MAIN') {
      routingKey = 'content';
    }

    const clientChannels = this.routingMap[routingKey];
    if (Utils.isEmpty(clientChannels)) {
      return [];
    }

    if (routingKey === 'external' || routingKey === 'background') {
      clientChannels.forEach((clientChannel) => {
        const [client, channel] = clientChannel;
        // require exact match
        if (client.type === routingKey && client.id === dest.external) {
          channels.push(channel);
        }
      });
    }
    else if (routingKey === 'content') {
      clientChannels.forEach((clientChannel) => {
        const [client, channel] = clientChannel;
        // require exact match in background
        if (client.type === 'content'
          && (dest.tab === (client as ExtensionClientInfo).info?.tab?.id && dest.frame === (client as ExtensionClientInfo).info?.frameId)) {
          channels.push(channel);
        }
      });
    }
    else {
      this.logger.warn(`getRoutingChannels: receive unexpected routingKey ${routingKey}`);
    }

    return channels;
  }

  private updateFrameConnectionStatus(tabId: number, frameId: number, connected: boolean): void {
    const rtid = RtidUtil.getTabRtid(tabId, -1);
    const msgData = MsgUtil.createMessageData('command', rtid, {
      name: 'invoke',
      params: {
        name: 'updateFrameDetails',
        args: [frameId, { connected: connected }]
      }
    } as InvokeAction);
    this.sendEvent(msgData);
  }
}