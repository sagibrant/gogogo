/**
 * @copyright 2025 Sagi All Rights Reserved.
 * @author: Sagi <sagibrant@163.com>
 * @license Apache-2.0
 * @file Dispatcher.ts
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

import { Logger } from './../Logger';
import { Utils, MsgUtil, RtidUtil } from './../Common';
import { ContextType, Message, MessageData } from '../../types/message';
import { ChannelBase, ClientChannel, ClientInfo, IChannel } from './ChannelBase';
import { IMsgDataHandler } from './MsgDataHandler';

/**
 * Dispatcher class that routes messages between handlers and channels.
 */
export abstract class Dispatcher {
  readonly id: number;
  protected readonly logger: Logger;
  protected readonly mode: string;
  private _timeout: number = 500;
  private _responseCallbacks: Record<string, (result: MessageData) => void> = {};
  private _responseTimeoutId: Record<string, any> = {};
  private _handlers: IMsgDataHandler[] = [];
  protected readonly routingMap: Record<ContextType, ClientChannel[]> = {
    MAIN: [],
    content: [],
    background: [],
    external: []
  };

  constructor(mode: string) {
    this.id = Date.now();
    const prefix = Utils.isEmpty(this.constructor?.name) ? "Dispatcher" : this.constructor?.name;
    this.logger = new Logger(prefix);
    this.mode = mode;
  }

  /**
   * Add a message handler.
   * @param handler - a message handler
   */
  addHandler(handler: IMsgDataHandler): void {
    this._handlers.push(handler);
  }

  /**
   * Remove a message handler.
   * @param handler - a message handler
   */
  removeHandler(handler: IMsgDataHandler): void {
    const index = this._handlers.indexOf(handler);
    if (index >= 0) {
      this._handlers.splice(index, 1);
    }
  }

  /**
 * Remove a [client, channel]  from the routing map under a routing key.
 * @param routingKey - the routing key: 'main' | 'content' | 'background' | 'external';
 * @param client - the connected client 
 * @param channel - the channel 
 */
  addRoutingChannel(routingKey: ContextType, client: ClientInfo, channel: IChannel): void {
    // init if no routing key
    if (!this.routingMap.hasOwnProperty(routingKey)) {
      this.routingMap[routingKey] = [];
    }

    let i = this.routingMap[routingKey].findIndex((val) => {
      let [cur_client, cur_channel] = val;
      if (cur_channel.id === channel.id && cur_client.id === client.id) {
        return true;
      }
      return false;
    });
    if (i >= 0) {
      this.logger.warn('addRoutingChannel: find duplicated client & channel', routingKey, client, channel);
      this.routingMap[routingKey][i] = [client, channel];
    }
    else {
      this.routingMap[routingKey].push([client, channel]);
    }

    if (channel instanceof ChannelBase) {
      channel.on('message', (data) => {
        this.onMessage(data.msg, channel);
      });
    }
  }

  /**
   * Remove a [client, channel]  from the routing map under a routing key.
   * @param routingKey - the routing key: 'page' | 'content' | 'background' | 'external' | 'native' | 'server'
   * @param client - the connected client 
   * @param channel - the channel 
   */
  removeRoutingChannel(routingKey: ContextType, client: ClientInfo, channel: IChannel): void {
    if (!this.routingMap.hasOwnProperty(routingKey)) {
      this.routingMap[routingKey] = [];
    }

    this.routingMap[routingKey] = this.routingMap[routingKey].filter(
      ([cur_client, cur_channel]) => !(cur_channel.id === channel.id && cur_client.id === client.id)
    );
  }

  setDefaultTimeout(timeout: number): void {
    this._timeout = timeout;
  }

  /**
   * Send request
   * @param data Request Payload data
   * @param timeout Timeout in milliseconds (default: 5000ms)
   */
  async sendRequest(
    data: MessageData,
    timeout: number = this._timeout
  ): Promise<MessageData> {
    this.logger.debug('sendRequest: ==> data=', data, ' timeout=', timeout);
    const handlers = this.getLocalHandlers(data);
    if (handlers.length > 0) {
      const result = await this.handleMsgData(data, handlers);
      this.logger.debug('sendRequest: <== data=', data, ' handled result=', result);
      return result;
    }
    else {
      const result = await this._sendRequestData(data, timeout);
      this.logger.debug('sendRequest: <== data=', data, ' response result=', result);
      return result;
    }
  }

  /**
   * Send event
   * @param data Request Payload data
   * @param timeout Timeout in milliseconds (default: 5000ms)
   */
  async sendEvent(data: MessageData,
    timeout: number = this._timeout
  ): Promise<void> {
    this.logger.debug('sendEvent: ==> data=', data, ' timeout=', timeout);
    const handlers = this.getLocalHandlers(data);
    if (handlers.length > 0) {
      await this.handleMsgData(data, handlers);
    }
    else {
      const msg = MsgUtil.createEvent(data);
      this.sendMsg(msg);
    }
    this.logger.debug('sendEvent: <==');
  }

  /**
   * Handler for incoming messages from a channel.
   */
  onMessage(msg: Message, sender: IChannel): void {
    this.logger.debug('onMessage: ==> msg=', msg, ' sender=', sender);

    // response:
    if (msg.type === 'response' && msg.syncId) {
      if (msg.syncId in this._responseTimeoutId) {
        const timeoutId = this._responseTimeoutId[msg.syncId];
        delete this._responseTimeoutId[msg.syncId];
        clearTimeout(timeoutId);
      }
      if (msg.syncId in this._responseCallbacks) {
        const responseCallback = this._responseCallbacks[msg.syncId];
        delete this._responseCallbacks[msg.syncId];
        responseCallback(msg.data);
        this.logger.debug('onMessage: <== handled by responseCallback, msg=', msg, ' sender=', sender);
      }
      return;
    }

    // forward the event | request message
    if (msg.type === 'event') {
      const handlers = this.getLocalHandlers(msg.data);
      if (handlers.length > 0) {
        this.handleMsgData(msg.data, handlers);
        this.logger.debug('onMessage: <== handled by local handlers, msg=', msg, ' sender=', sender);
      }
      else {
        const event = MsgUtil.createEvent(msg.data, msg.correlationId);
        this.sendMsg(event);
        this.logger.debug('onMessage: <== forward msg=', msg, ' new event=', event);
      }
    }
    else if (msg.type === 'request') {
      const handlers = this.getLocalHandlers(msg.data);
      if (handlers.length > 0) {
        this.handleMsgData(msg.data, handlers).then((result) => {
          const resMsg = MsgUtil.createResponse(result, msg.syncId!, msg.correlationId);
          this.logger.debug('onMessage: <== handled by local handlers, msg=', msg, ' sender=', sender, ' response=', resMsg);
          sender.send(resMsg);
        });
      }
      else {
        this.logger.debug('onMessage: ==> forward request msg=', msg);
        this._sendRequestData(msg.data).then((result) => {
          const resMsg = MsgUtil.createResponse(result, msg.syncId!, msg.correlationId);
          this.logger.debug('onMessage: <== forward request msg=', msg, ' sender=', sender, ' response=', resMsg);
          sender.send(resMsg);
        });
      }
    }
  }

  /** ================================================================== */
  /** ========================= Helper methods ========================= */
  /** ================================================================== */

  /**
   * Get the local handlers which match the given message data
   * @param msgData message data
   * @returns if the message data should be handled locally
   */
  protected getLocalHandlers(msgData: MessageData): IMsgDataHandler[] {
    const dest = msgData.dest;
    const handlers = this._handlers.filter((handler) =>
      Utils.isNullOrUndefined(dest) || RtidUtil.isRtidEqual(dest, handler.id)
    );
    return handlers;
  }

  /**
   * Handle a message data via the registered handlers that match the destination RTID.
   * @returns true if handled, false otherwise
   */
  private async handleMsgData(msgData: MessageData, handlers: IMsgDataHandler[]): Promise<MessageData> {
    return new Promise((resolve, reject) => {
      if (handlers.length === 0) {
        reject(new Error('Invalid Arguments: no handlers'));
        return false;
      }

      const resultCallback = (result: MessageData) => {
        resolve(result);
      };
      for (const handler of handlers) {
        const handled = handler.handle(msgData, resultCallback);
        if (handled) {
          return true;
        }
      }

      reject(new Error('Message Data is not handled successfully.'));
      return false;
    });
  }

  /**
   * Send request message data using channels.
   * @param data message data for request
   * @param timeout message timeout
   */
  private async _sendRequestData(data: MessageData, timeout: number = this._timeout): Promise<MessageData> {
    return new Promise((resolve, reject) => {
      const resultCallback = (result: MessageData) => {
        resolve(result);
      };

      const msg = MsgUtil.createRequest(data);
      while (Utils.isNullOrUndefined(msg.syncId) || msg.syncId in this._responseCallbacks) {
        msg.syncId = Utils.generateUUID();
      }
      const syncId = msg.syncId;
      this._responseCallbacks[syncId] = resultCallback;
      const timeoutId = setTimeout(() => {
        if (syncId in this._responseTimeoutId) {
          delete this._responseTimeoutId[syncId];
        }
        if (syncId in this._responseCallbacks) {
          delete this._responseCallbacks[syncId];
          this.logger.error(`============ request timeout after ${timeout}ms. \r\nmessage: ${JSON.stringify(msg)}`);
          reject(new Error(`Request timed out after ${timeout}ms`));
        }
      }, timeout);
      this._responseTimeoutId[syncId] = timeoutId;

      this.sendMsg(msg);
    });
  }

  /**
   * Send message using channels.   
   * @param msg message
   */
  private sendMsg(msg: Message): void {
    const channels: IChannel[] = this.getRoutingChannels(msg);
    if (Utils.isEmpty(channels)) {
      this.logger.warn(`sendMsg: find 0 channels when sending msg ${JSON.stringify(msg)}`);
      return;
    }
    channels.forEach((channel) => {
      try {
        channel.send(msg);
      } catch (error) {
        this.logger.error(`sendMsg: channel.send error: ${error instanceof Error ? error.message : error}, msg: ${JSON.stringify(msg)} , channle: ${channel.id}`);
      }
    });
  }

  /**
   * Get the routing channels from the msg.data.dest
   * @param msg message
   */
  protected abstract getRoutingChannels(msg: Message): IChannel[];

}