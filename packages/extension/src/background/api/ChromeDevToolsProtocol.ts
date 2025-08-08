/**
 * @copyright 2025 Sagi All Rights Reserved.
 * @author: Sagi <sagibrant@163.com>
 * @license Apache-2.0
 * @file ChromeDevToolsProtocol.ts
 * @description 
 * Provide Chrome DevTool Protocol APIs
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

import { BrowserUtils, Utils } from "../../common/Common";
import { Logger } from "../../common/Logger";

/** 
 * Represents a CDP debugger debuggee wrapper for chrome._debugger.Debuggee
 * Debuggee identifier. Either tabId, extensionId or targetId must be specified 
 * */
export interface CDPDebuggee {
  /** The id of the tab which you intend to debug. */
  tabId?: number;
  /** The id of the extension which you intend to debug. Attaching to an extension background page is only possible when the `--silent-debugger-extension-api` command-line switch is used. */
  extensionId?: string;
  /** The opaque id of the debug target. */
  targetId?: string;
};

/**
 * Represents a CDP debugger session wrapper for chrome._debugger.DebuggerSession
 * Debugger session identifier. One of tabId, extensionId or targetId must be specified. Additionally, an optional sessionId can be provided. If sessionId is specified for arguments sent from {@link onEvent}, it means the event is coming from a child protocol session within the root debuggee session. If sessionId is specified when passed to {@link sendCommand}, it targets a child protocol session within the root debuggee session.
 * Used to manage connections to Chrome DevTools Protocol targets.
 */
export interface CDPDebuggerSession {
  /** The id of the extension which you intend to debug. Attaching to an extension background page is only possible when the `--silent-debugger-extension-api` command-line switch is used.*/
  extensionId?: string;
  /** The opaque id of the Chrome DevTools Protocol session. Identifies a child session within the root session identified by tabId, extensionId or targetId. */
  sessionId?: string;
  /** The id of the tab which you intend to debug. */
  tabId?: number;
  /** The opaque id of the debug target. */
  targetId?: string;
};

/**
 * 'tab' | 'page' | 'iframe' | 'other' | 'worker' | 'shared_worker' | 'service_worker' | 'worklet' | 'browser' | 'webview' | 'auction_worklet'
 * chrome._debugger.TargetInfoType
 */
export type CDPTargetInfoType = 'tab' | 'page' | 'iframe' | 'other' | 'worker' | 'shared_worker' | 'service_worker' | 'worklet' | 'browser' | 'webview' | 'auction_worklet';

/**
 * Represents a CDP target (debuggable entity like tab, iframe, or worker) with metadata.
 * Wrapper for chrome._debugger.TargetInfo
 * Extends raw target info from chrome.debugger.getTargets() with normalized IDs.
 */
export interface CDPTargetInfo {
  /** Target type. */
  type: CDPTargetInfoType;
  /** Target id. */
  id?: string;
  /** The tab id, defined if type == 'page'. */
  tabId?: number;
  /** The extension id, defined if type = 'background_page'. */
  extensionId?: string;
  /** True if debugger is already attached. */
  attached?: boolean;
  /** Target page title. */
  title?: string;
  /** Target URL. */
  url?: string;
  /** Target favicon URL.  */
  faviconUrl?: string;

  /** Target id. (when created from Target.attachedToTarget if cross origin iframe attached) */
  targetId?: string;

  openerId?: string;
  canAccessOpener?: boolean;
  openerFrameId?: string;
  browserContextId?: string;
  subtype?: string;
};

/**
 * Represents a CDP Execution Context AuxData with metadata.
 * We use this metadata to know the frameId and if it is the default ExecutionContext
 */
export interface CDPExecutionContextAuxData {
  frameId: string;
  isDefault: boolean;
  type: 'isolate' | 'default';
}

/**
 * Contains information about a CDP execution context (JavaScript environment) within a frame.
 * Should be created by Runtime.executionContextCreated event
 * Tracks context ID, origin, and associated session.
 */
export interface CDPExecutionContextInfo {
  id: number;
  name?: string;
  uniqueId: string;
  origin?: string;
  auxData?: CDPExecutionContextAuxData;

  source?: CDPDebuggerSession;
};

/**
 * Combines a debugger session with its associated target info.
 * Serves as a container for managing active target connections.
 */
export interface CDPTargetSession {
  id: string;
  session: CDPDebuggerSession;
  targetInfo: CDPTargetInfo;
  /**
   * the source session (the parent Debuggee or DebuggerSession)
   */
  source?: CDPDebuggerSession;
};

/**
 * Represents a frame in the page with its execution contexts and child frames.
 * Manages frame hierarchy and associated JavaScript contexts.
 */
export interface CDPFrameInfo {
  id: string;
  parentId?: string;
  contexts: CDPExecutionContextInfo[];
  defaultContext?: CDPExecutionContextInfo;
  contentContext?: CDPExecutionContextInfo;
  childFrames: CDPFrameInfo[];
  frameInfo: unknown;
  session?: CDPDebuggerSession;
  attached?: boolean;
};

/**
 * Represents a CDP Javascript Dialog wrapper type.
 * We use this struct to know the type and message of the popup dialog
 */
export interface CDPJavascriptDialog {
  url: string;
  message: string;
  type: string;
  hasBrowserHandler: boolean;
  defaultPrompt?: string;
}

/**
 * Shared utility classes for CDP
 */
export class CDPUtils {
  /**
   * Normalize and initialize target info from raw target data.
   * @param targetInfoObj - Raw target info from chrome.debugger.getTargets()
   */
  static newCDPTargetInfo(targetInfoObj: Partial<CDPTargetInfo>): CDPTargetInfo {
    const newObj = {
      ...targetInfoObj
    } as CDPTargetInfo;
    // Object.assign(targetInfo, targetInfoObj);
    // set default values
    if (Utils.isNullOrUndefined(newObj.type)) {
      newObj.type = 'page';
    }
    if (Utils.isNullOrUndefined(newObj.attached)) {
      newObj.attached = false;
    }
    if (Utils.isNullOrUndefined(newObj.canAccessOpener)) {
      newObj.canAccessOpener = false;
    }
    const targetId = newObj.targetId || newObj.id;
    newObj.id = targetId;
    newObj.targetId = targetId;

    return newObj;
  }

  /**
   * Create execution context info from source session and context data.
   * @param source - Session associated with this context
   * @param context - CDP context data from Runtime.executionContextCreated event
   */
  static newCDPExecutionContextInfo(source: CDPDebuggerSession, context: Partial<CDPExecutionContextInfo>): CDPExecutionContextInfo {
    // Validate required fields exist
    if (Utils.isNullOrUndefined(context.id)
      || Utils.isNullOrUndefined(context.uniqueId)) {
      throw new Error('CDPExecutionContextInfo creation missing the valid id & uniqueId.');
    }
    const newObj = {} as CDPExecutionContextInfo;
    Object.assign(newObj, context);
    newObj.source = source;

    // Type assertion to ensure TypeScript recognizes required fields are set
    newObj.id = context.id;
    newObj.uniqueId = context.uniqueId;
    return newObj;
  }

  /**
   * Create a target session from a debugger session and target info.
   * @param session - Debugger session for the target
   * @param targetInfo - Metadata about the target
   */
  static newCDPTargetSession(session: CDPDebuggerSession, targetInfo: CDPTargetInfo): CDPTargetSession {
    const newObj = {} as CDPTargetSession;
    newObj.session = session;
    newObj.targetInfo = targetInfo;
    newObj.id = `${newObj.session.sessionId}_${newObj.session.tabId}_${newObj.session.targetId}_${newObj.session.extensionId}`;
    return newObj;
  }

  /**
   * Initialize frame info with frame data and associated session.
   * @param frameInfo - Raw frame data from CDP Page.getFrameTree
   * @param session - Debugger session associated with this frame
   */
  static newCDPFrameInfo(frameInfo: unknown, session?: CDPDebuggerSession): CDPFrameInfo {
    const newObj = {} as CDPFrameInfo;
    newObj.frameInfo = frameInfo;
    newObj.session = session;
    newObj.id = (frameInfo as { id: string }).id;
    newObj.parentId = (frameInfo as { parentId?: string }).parentId || undefined;
    newObj.contexts = [];
    newObj.defaultContext = undefined;
    newObj.contentContext = undefined;
    newObj.childFrames = [];
    newObj.attached = true;

    return newObj;
  }
}

/**
 * Manages CDP-related state for a single browser tab.
 * Tracks execution contexts, target sessions, frames, and dialogs.
 */
export class CDPTabInfo {
  attached: boolean;
  id: number;
  frameId?: string;
  targetId?: string;
  javascriptDialog?: CDPJavascriptDialog;
  emulationSettings?: {
    userAgent: string;
    width: number;
    height: number;
    deviceScaleFactor: number;
    mobile: boolean;
    touch: boolean;
  }; // Device emulation configuration
  executionContexts: Record<string, CDPExecutionContextInfo>; // Key: context.uniqueId
  targetSessions: Record<string, CDPTargetSession>; // Key: session.id
  root?: CDPFrameInfo;
  frames?: CDPFrameInfo[];

  /**
   * Create a tab info instance for tracking CDP state.
   * @param tabId - The browser tab ID
   */
  constructor(tabId: number) {
    this.attached = false;
    this.id = tabId;
    this.frameId = undefined;
    this.targetId = undefined;
    this.javascriptDialog = undefined;
    this.emulationSettings = undefined;

    this.executionContexts = {};
    this.targetSessions = {};
  }

  /**
   * Add a new execution context to the tab.
   * @param source - Session that created the context
   * @param executionContext - Context data from CDP event
   */
  addExecutionContext(source: CDPDebuggerSession, executionContext: Partial<CDPExecutionContextInfo>): void {
    const contextInfo = CDPUtils.newCDPExecutionContextInfo(source, executionContext);
    this.executionContexts[contextInfo.uniqueId] = contextInfo;
  }

  /**
   * Remove execution contexts matching the given criteria.
   * @param source - Associated session
   * @param executionContextId - Numeric context ID (optional)
   * @param executionContextUniqueId - Unique context ID (optional)
   */
  removeExecutionContext(
    source: CDPDebuggerSession,
    executionContextId?: number,
    executionContextUniqueId?: string
  ): void {
    const contextIds = Object.keys(this.executionContexts).filter(contextUniqueId => {
      if (!Utils.isNullOrUndefined(executionContextUniqueId) && executionContextUniqueId !== contextUniqueId) {
        return false;
      }
      const context = this.executionContexts[contextUniqueId];
      if (Utils.isNullOrUndefined(context)) {
        return false;
      }
      if (!Utils.isNullOrUndefined(executionContextId) && executionContextId !== context.id) {
        return false;
      }
      if (!Utils.isNullOrUndefined(source)) {
        const contextSourceSession = this.findTargetSession(context.source);
        const sourceSession = this.findTargetSession(source);
        if (contextSourceSession === sourceSession) {
          return true;
        }
      }
      return false;
    });

    if (Array.isArray(contextIds) && contextIds.length > 0) {
      contextIds.forEach(contextUniqueId => {
        delete this.executionContexts[contextUniqueId];
      });
    }
  }

  /**
   * Clear execution contexts associated with a source session.
   * @param source - Session to clear contexts for
   */
  clearExecutionContext(source: CDPDebuggerSession): void {
    if (Utils.isNullOrUndefined(source)) return;

    if (!Utils.isNullOrUndefined(source.tabId) && source.tabId === this.id &&
      Utils.isNullOrUndefined(source.targetId) && Utils.isNullOrUndefined(source.sessionId)) {
      this.executionContexts = {};
    } else {
      this.removeExecutionContext(source);
    }
  }

  /**
   * Add a new target session to the tab.
   * @param debuggerSession - Debugger session for the target
   * @param targetInfo - Target metadata
   * @param source - Parent session
   */
  addTargetSession(debuggerSession: CDPDebuggerSession, targetInfo: CDPTargetInfo, source?: CDPDebuggerSession): void {
    const targetSession = CDPUtils.newCDPTargetSession(debuggerSession, targetInfo);
    targetSession.source = source || undefined;
    this.targetSessions[targetSession.id] = targetSession;
  }

  /**
   * Remove a target session from the tab.
   * @param source - Parent session
   * @param debuggerSession - Session to remove
   */
  removeTargetSession(_source: CDPDebuggerSession, debuggerSession: CDPDebuggerSession): void {
    const targetSession = this.findTargetSession(debuggerSession);
    if (!Utils.isNullOrUndefined(targetSession)) {
      delete this.targetSessions[targetSession.id];
    }
    else {
      // console.warn("removeTargetSession failed", _source, debuggerSession);
    }
  }

  /**
     * Find a target session matching the given debugger session criteria.
     * @param debuggerSession - Session criteria to match
     * @returns Matching session or undefined
     */
  findTargetSession(debuggerSession: CDPDebuggerSession | undefined): CDPTargetSession | undefined {
    if (Utils.isNullOrUndefined(debuggerSession)) return undefined;

    const sessionKey = Object.keys(this.targetSessions).find(id => {
      const targetSession = this.targetSessions[id];

      if (!Utils.isNullOrUndefined(debuggerSession.tabId)) {
        if (targetSession.session.tabId !== debuggerSession.tabId) return false;
      }

      if (!Utils.isNullOrUndefined(debuggerSession.sessionId)) {
        return targetSession.session.sessionId === debuggerSession.sessionId;
      }

      if (!Utils.isNullOrUndefined(debuggerSession.targetId)) {
        return (
          targetSession.session.targetId === debuggerSession.targetId ||
          targetSession.targetInfo.targetId === debuggerSession.targetId
        );
      }

      // TODO: unexpected extension session
      if (!Utils.isNullOrUndefined(debuggerSession.extensionId)) {
        return targetSession.session.extensionId === debuggerSession.extensionId;
      }

      return true;
    });

    return sessionKey ? this.targetSessions[sessionKey] : undefined;
  }

  /**
   * Clear target sessions associated with a source, preserving tab-level sessions.
   * @param source - Session to clear
   */
  clearTargetSession(source: CDPDebuggerSession): void {
    const normalizedSource = source || { tabId: this.id } as CDPDebuggerSession;

    if (!Utils.isNullOrUndefined(normalizedSource.tabId) && normalizedSource.tabId === this.id &&
      Utils.isNullOrUndefined(normalizedSource.targetId)) {
      const tabSession = this.findTargetSession(normalizedSource);
      if (!Utils.isNullOrUndefined(tabSession)) {
        this.targetSessions = { [tabSession.id]: tabSession };
      }
    } else {
      this.removeTargetSession(normalizedSource, normalizedSource);
    }
  }

  /**
   * Build a hierarchical frame tree from raw frame data, linking child frames and contexts.
   * @param frameTrees - Raw frame tree data from CDP Page.getFrameTree
   * @returns Root frame of the tree
   */
  buildFrameTree(frameTrees: Array<{ frameTree: unknown; session: CDPDebuggerSession }>): CDPFrameInfo | undefined {
    let root: CDPFrameInfo | undefined = undefined;
    const frames: CDPFrameInfo[] = [];
    const extensionId = chrome.runtime && chrome.runtime.id;

    // Recursively create CDPFrameInfo instances from frame trees
    const createCDPFrameInfoFunc = (frameTree: unknown, session: CDPDebuggerSession) => {
      if (Utils.isNullOrUndefined(frameTree)) return;

      const frame = (frameTree as { frame?: unknown }).frame;
      if (!Utils.isNullOrUndefined(frame)) {
        frames.push(CDPUtils.newCDPFrameInfo(frame, session));
      }

      const childFrames = (frameTree as { childFrames?: unknown[] }).childFrames;
      if (Array.isArray(childFrames) && childFrames.length > 0) {
        childFrames.forEach(childFrameTree => {
          createCDPFrameInfoFunc(childFrameTree, session);
        });
      }
    };

    frameTrees.forEach(frameTreeObj => {
      createCDPFrameInfoFunc(frameTreeObj.frameTree, frameTreeObj.session);
    });

    // Link frames to parents and populate contexts
    frames.forEach(frameInfo => {
      // Link to parent frame
      if (!Utils.isNullOrUndefined(frameInfo.parentId)) {
        const parentFrame = frames.find(frame => frame.id === frameInfo.parentId);
        if (!Utils.isNullOrUndefined(parentFrame)) {
          parentFrame.childFrames.push(frameInfo);
        }
      } else {
        root = frameInfo;
      }

      // Associate execution contexts with this frame
      Object.keys(this.executionContexts).forEach(contextId => {
        const contextInfo = this.executionContexts[contextId];
        if (contextInfo?.auxData?.frameId !== frameInfo.id) return;

        if (contextInfo.auxData.isDefault) {
          frameInfo.defaultContext = contextInfo;
        }

        // Identify content context (extension-specific)
        if (
          contextInfo.name === "Gogogo" &&
          extensionId && contextInfo?.origin &&
          contextInfo.origin.indexOf(extensionId) >= 0
        ) {
          frameInfo.contentContext = contextInfo;
        }

        frameInfo.contexts.push(contextInfo);
        if (!Utils.isNullOrUndefined(frameInfo.contentContext)) {
          frameInfo.attached = true;
        }
      });
    });

    this.root = root;
    this.frames = frames;
    return root;
  }
};

/**
 * Main class for interacting with Chrome DevTools Protocol (CDP) in a Chrome extension.
 * Manages tab attachments, target sessions, and CDP command execution.
 * We wrapper the known apis again so that old version apis can be used with promise
 */
export class ChromeDevToolsProtocol {
  private _logger: Logger;
  private _debbuggerEvents: Record<string, (source: CDPDebuggerSession, method: string, params: unknown) => void>;
  private _tabs: Record<number, CDPTabInfo>; // Key: tabId

  constructor() {
    const prefix = Utils.isEmpty(this.constructor?.name) ? "ChromeDevToolsProtocol" : this.constructor?.name;
    this._logger = new Logger(prefix);
    this._tabs = {};
    this._debbuggerEvents = this._initializeDebuggerEvents();

    chrome.debugger.onEvent.addListener((source: chrome._debugger.DebuggerSession, method: string, params?: object) => {
      const source_session = source as CDPDebuggerSession;
      this._debbuggerEvent(source_session, method, params);
    });
    chrome.debugger.onDetach.addListener((source: chrome._debugger.Debuggee, reason: `${chrome._debugger.DetachReason}`) => {
      const source_session = source as CDPDebuggerSession;
      this._debbuggerDetached(source_session, reason);
    });
  }

  /**
   * Add a tab to track and manage with CDP.
   * @param tabId - Tab ID to track
   */
  addTab(tabId: number): void {
    if (Utils.isNullOrUndefined(this._tabs[tabId])) {
      this._tabs[tabId] = new CDPTabInfo(tabId);
      this._tabs[tabId].attached = false;
    }
  }

  /**
   * Stop tracking a tab and clean up its resources.
   * @param tabId - Tab ID to remove
   */
  removeTab(tabId: number): void {
    if (!Utils.isNullOrUndefined(this._tabs[tabId])) {
      delete this._tabs[tabId];
    }
  }

  /**
   * Attach to all tracked tabs.
   */
  async attachAllTabs(): Promise<void> {
    const tabIds = Object.keys(this._tabs).map(id => Number(id));
    // await Promise.all(
    //   tabIds.map(tabId => this.attachTab(this._tabs[tabId].id))
    // );
    for (const tabId of tabIds) {
      const tab = this._tabs[tabId];
      await this.attachTab(tab.id);
    }
  }

  /**
   * Detach from all tracked tabs.
   */
  async detachAllTabs(): Promise<void> {
    const tabIds = Object.keys(this._tabs).map(id => Number(id));
    // await Promise.all(
    //   tabIds.map(tabId => this.detachTab(this._tabs[tabId].id))
    // );
    for (const tabId of tabIds) {
      const tab = this._tabs[tabId];
      await this.detachTab(tab.id);
    }
  }

  /**
    * Attach CDP debugger to a tab.
    * @param tabId - Tab ID to attach to
    */
  async attachTab(tabId: number): Promise<void> {
    if (!Utils.isNullOrUndefined(this._tabs[tabId]) && this._tabs[tabId].attached) {
      return Promise.resolve();
    }
    if (Utils.isNullOrUndefined(this._tabs[tabId])) {
      this.addTab(tabId);
    }
    await this._attachTargetIfNeeded(tabId);
  }

  /**
   * Detach CDP debugger from a tab.
   * @param tabId - Tab ID to detach from
   */
  async detachTab(tabId: number): Promise<void> {
    if (this._tabs[tabId] && !this._tabs[tabId].attached) {
      return Promise.resolve();
    }
    const target = this._getDebuggee(tabId);
    await this._detachTarget(target).then(() => {
      if (this._tabs[tabId]) {
        const tab = this._tabs[tabId];
        tab.attached = false;
        const session = target as CDPDebuggerSession;
        tab.clearExecutionContext(session);
        tab.clearTargetSession(session);
      }
    });
  }

  /**
   * Check if a tab is currently attached to CDP.
   * @param tabId - Tab ID to check
   * @returns True if attached, false otherwise
   */
  isTabAttached(tabId: number): boolean {
    return !!(this._tabs[tabId]?.attached);
  }

  /**
   * Get a debuggee object for a tab/target.
   * @param tabId - Tab ID
   * @param targetId - Optional target ID within the tab
   * @returns Debuggee session
   */
  private _getDebuggee(tabId?: number, targetId?: string): CDPDebuggee {
    return { tabId, targetId } as CDPDebuggee;
  }

  /**
   * Get the CDPTabInfo instance for a given source session.
   * @param source - Session to find associated tab for
   * @returns Tab info or undefined
   */
  private _getTab(source: CDPDebuggerSession): CDPTabInfo | undefined {
    if (!Utils.isNullOrUndefined(source.tabId)) {
      return this._tabs[source.tabId];
    }

    const tabId = Object.keys(this._tabs).find(tabIdStr => {
      const tab = this._tabs[Number(tabIdStr)];
      const session = tab.findTargetSession(source);
      return !Utils.isNullOrUndefined(session);
    });

    return tabId ? this._tabs[Number(tabId)] : undefined;
  }

  /**
   * Attach to a target (tab/iframe) if it's not already attached.
   * @param tabId - Tab ID containing the target
   * @param targetId - Optional specific target ID
   */
  private async _attachTargetIfNeeded(
    tabId: number,
    targetId?: string
  ): Promise<void> {
    try {
      const targets = await this._getTargets();

      const targetObj = targets.find(target => {
        if (target.attached) return false;
        // target is iframe
        if (!Utils.isNullOrUndefined(targetId) && target.id === targetId) return true;
        // target is page
        if (Utils.isNullOrUndefined(targetId) && !Utils.isNullOrUndefined(tabId) && target.type === "page" && target.tabId === tabId) {
          return true;
        }
        return false;
      });

      if (Utils.isNullOrUndefined(targetObj)) {
        return;
      }

      const target = this._getDebuggee(tabId, targetId);
      await this._attachTarget(target);

      targetObj.attached = true;
      const tab = this._getTab(target as CDPDebuggerSession);
      if (tab && targetObj.type === "page" && targetObj.tabId === tab.id) {
        tab.targetId = targetObj.id;
        tab.frameId = targetObj.id;
        tab.attached = true;
      }

      const session = target as CDPDebuggerSession;
      const targetInfo = CDPUtils.newCDPTargetInfo(targetObj);
      tab?.addTargetSession(session, targetInfo, undefined);
      await this._initTarget(target as CDPDebuggerSession);
      this._logger.debug(`_attachTargetIfNeeded: attached on tab[${tabId}]`);
    }
    catch (error) {
      this._logger.error(`_attachTargetIfNeeded: failed on tab ${tabId}:`, error instanceof Error ? error.message : error);
    }
  }

  /**
   * Get all available CDP targets.
   * @returns Promise<CDPTargetInfo[]> - Promise that succeeded
   * @throws Throws error when failed
   */
  private async _getTargets(): Promise<CDPTargetInfo[]> {
    return new Promise((resolve, reject) => {
      chrome.debugger.getTargets((result) => {
        const error = chrome.runtime.lastError;
        if (error) {
          reject(new Error(`debugger.getTargets failed: ${error.message}`));
        }
        else {
          const ret = result.map((item) => CDPUtils.newCDPTargetInfo({ ...item } as Partial<CDPTargetInfo>));
          resolve(ret);
        }
      });
    });
  }

  /**
   * Attach to a CDP target.
   * @param target - Target to attach to
   */
  private async _attachTarget(
    target: CDPDebuggee
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      chrome.debugger.attach(target, "1.3", () => {
        const error = chrome.runtime.lastError;
        if (error) {
          reject(new Error(`debugger.attach failed: ${error.message}`));
        }
        else {
          resolve();
        }
      });
    });
  }

  /**
   * Detach from a CDP target.
   * @param target - Target to detach from
   */
  private _detachTarget(
    target: CDPDebuggee
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      chrome.debugger.detach(target, () => {
        const error = chrome.runtime.lastError;
        if (error) {
          reject(new Error(`debugger.detach failed: ${error.message}`));
        }
        else {
          resolve();
        }
      });
    });
  }

  /**
   * Send a CDP command to a target.
   * @param target - Target to send command to
   * @param method - CDP method name (e.g., "Runtime.evaluate")
   * @param commandParams - Parameters for the command
   * @returns Promise<object | undefined> - Promise that succeeded
   * @throws Throws error when failed
   */
  private async _sendCommand(
    target: CDPDebuggerSession,
    method: string,
    commandParams?: unknown
  ): Promise<object | undefined> {
    return new Promise((resolve, reject) => {
      chrome.debugger.sendCommand(target, method, commandParams as { [key: string]: unknown }, (result) => {
        const error = chrome.runtime.lastError;
        if (error) {
          reject(new Error(`debugger.sendCommand failed: ${error.message}`));
        }
        else {
          resolve(result);
        }
      });
    });
  }

  /**
   * Initialize target and enable required CDP domains (Page, Runtime, etc.).
   * @param target - Target to initialize
   */
  private async _initTarget(target: CDPDebuggerSession): Promise<void> {
    const cdpFeatures = [
      { method: "Page.enable", param: undefined, optional: false },
      { method: "Page.setBypassCSP", param: { "enabled": true }, optional: false },
      { method: "Runtime.enable", param: undefined, optional: false },
      { method: "DOM.enable", param: undefined, optional: false },
      { method: "Overlay.enable", param: undefined, optional: false },
      { method: "DOMSnapshot.enable", param: undefined, optional: true },
      { method: "Inspector.enable", param: undefined, optional: true },
      {
        method: "Target.setAutoAttach",
        param: {
          autoAttach: true,
          waitForDebuggerOnStart: false,
          flatten: true,
          filter: [{ type: "iframe", exclude: false }]
        },
        optional: true
      }
    ];

    // Execute CDP commands one by one
    for (const feature of cdpFeatures) {
      try {
        // Wrap _sendCommand method in a Promise
        await this._sendCommand(target, feature.method, feature.param);
      } catch (error) {
        // Throw error if non-optional command fails
        if (!feature.optional) {
          this._logger.error(`Required CDP command failed: ${feature.method}`, error);
          throw error;
        }
        // Only log warning for failed optional commands
        this._logger.warn(`Optional CDP command failed: ${feature.method}`, error);
      }
    }
  }


  /**
   * Handle incoming CDP debugger events.
   * @param source - Session that received the event
   * @param method - Event method name
   * @param params - Event parameters
   */
  private _debbuggerEvent(source: CDPDebuggerSession, method: string, params?: object): void {
    // if(method === "Runtime.consoleAPICalled" || method === "DOM.setChildNodes") {
    //     return;
    // }
    // console.log("_debbuggerEvent", source, method, params);
    const source_session = source as CDPDebuggerSession;
    if (this._debbuggerEvents[method]) {
      this._debbuggerEvents[method].call(this, source_session, method, params);
    }
  }

  /**
   * Initialize handlers for specific CDP events.
   * @returns Event handler map
   */
  private _initializeDebuggerEvents(): Record<string, (source: CDPDebuggerSession, method: string, params: unknown) => void> {
    return {
      "Page.javascriptDialogOpening": (source, _method, params) => {
        if (Utils.isNullOrUndefined(source.tabId)) return;

        const tabId = source.tabId;
        const dialogParams = params as CDPJavascriptDialog;

        this._tabs[tabId].javascriptDialog = dialogParams;
      },

      "Page.javascriptDialogClosed": (source) => {
        if (Utils.isNullOrUndefined(source.tabId)) return;
        this._tabs[source.tabId].javascriptDialog = undefined;
      },

      "Runtime.executionContextCreated": (source, _method, params) => {
        /**
         * {
         *  context: {
         *      auxData: {
         *          frameId: "57784D671172321996AB58ECE63F0DE2",
         *          isDefault: true,
         *          type: "default"
         *      },
         *      id: 12,
         *      name: "",
         *      origin: "http://mama.swinfra.net",
         *      uniqueId: "7854474203346722172.-5914632085921131557"
         *  }
         * }
         */
        const contextParams = params as {
          context: Partial<CDPExecutionContextInfo>
        };

        if (Utils.isNullOrUndefined(contextParams?.context?.auxData)) return;

        const tab = this._getTab(source);
        tab?.addExecutionContext(source, contextParams.context);
      },

      "Runtime.executionContextDestroyed": (source, _method, params) => {
        /**
         * {executionContextId: 12, executionContextUniqueId: '7594043499172353467.1643448933116185657'}
         */
        const destroyParams = params as {
          executionContextId: number;
          executionContextUniqueId?: string;
        };

        if (Utils.isNullOrUndefined(destroyParams?.executionContextId)) return;

        const tab = this._getTab(source);
        tab?.removeExecutionContext(
          source,
          destroyParams.executionContextId,
          destroyParams.executionContextUniqueId
        );
      },

      "Runtime.executionContextsCleared": (source) => {
        // TODO: check if this event will come from cross origin frame
        if (Utils.isNullOrUndefined(source)) return;

        const tab = this._getTab(source);
        tab?.clearExecutionContext(source);
        tab?.clearTargetSession(source);
      },

      "Target.attachedToTarget": (source, _method, params) => {
        /**
         * {
         *  sessionId: "2A4A4915D7D60148E71F7E07114F9091",
         *  targetInfo: {
         *      attached: true,
         *      browserContextId: "E78150A8298B205119DA74A13A7E2C95",
         *      canAccessOpener: false,
         *      targetId: "9402047E45B1745F42A98167EDBE25B4",
         *      title: ""
         *      type: "iframe"
         *      url: ""
         *  },
         *  waitingForDebugger: false
         * }
         */
        const attachParams = params as {
          sessionId: string;
          targetInfo: CDPTargetInfo;
          waitingForDebugger: boolean;
        };

        const session = source as CDPDebuggerSession;
        session.sessionId = attachParams.sessionId;
        this._initTarget(session).then(() => {
          const tab = this._getTab(source);
          const targetInfo = CDPUtils.newCDPTargetInfo(attachParams.targetInfo);
          tab?.addTargetSession(session, targetInfo, source);
        });
      },

      "Target.detachedFromTarget": (source, _method, params) => {
        /**
         * {sessionId: '2A4A4915D7D60148E71F7E07114F9091', targetId: '9402047E45B1745F42A98167EDBE25B4'}
         */
        const detachParams = params as { sessionId: string; targetId: string };
        const tab = this._getTab(source);
        tab?.removeTargetSession(source, detachParams as unknown as CDPDebuggerSession);
      },

      // Unhandled frame events (for debugging)
      "Page.frameNavigated": (_source, _method, _params) => {
        /**
         * {
         *  frame: { 
         *      adFrameStatus: {adFrameType: 'none'},
         *      crossOriginIsolatedContextType: "NotIsolated",
         *      domainAndRegistry: "swinfra.net",
         *      gatedAPIFeatures: [],
         *      id: "9402047E45B1745F42A98167EDBE25B4",
         *      loaderId: "6EE0314E5EE7AB62595024AC07FC4E5C",
         *      mimeType: "text/html",
         *      name: "frame"
         *      parentId: "57784D671172321996AB58ECE63F0DE2"
         *      secureContextType: "InsecureScheme",
         *      securityOrigin: "http://mama.swinfra.net",
         *      url: "http://mama.swinfra.net/war/web_aut/Frames/frame_cross_origin.html" 
         *  },
         *  type: "Navigation"
         * }
         */
      },
      "Page.frameStartedLoading": (_source, _method, _params) => {
        /**
         * {frameId: '9402047E45B1745F42A98167EDBE25B4'}
         */
      },
      "Page.frameStoppedLoading": (_source, _method, _params) => {
        /**
         * {frameId: '9402047E45B1745F42A98167EDBE25B4'}
         */
      },
      "Page.frameAttached": (_source, _method, _params) => {
        /**
         * { frameId: "9402047E45B1745F42A98167EDBE25B4", parentFrameId: "57784D671172321996AB58ECE63F0DE2" }
         */
      },
      "Page.frameDetached": (_source, _method, _params) => {
        /**
         * {frameId: '9402047E45B1745F42A98167EDBE25B4', reason: 'swap'}
         * {frameId: '2C4A99026FD8219425644D1A1FC00D96', reason: 'remove'}
         */
      }
    };
  }

  /**
   * Handle debugger detachment event.
   * @param source - Session that was detached
   * @param reason - Reason for detachment
   */
  private _debbuggerDetached(source: CDPDebuggerSession, reason: string): void {
    this._logger.debug("Debugger was detached from ", source, ": ", reason);

    if (this._tabs[source.tabId!]) {
      this._tabs[source.tabId!].attached = false;
      // if canceled by user by mistake, try to re-attach (canceled_by_user | target_closed)
      if (reason === "canceled_by_user") {
        this.attachTab(source.tabId!);
      }
    }
  }


  /**
   * Update target session metadata with latest target info.
   * @param tabId - Tab ID to update
   */
  private async _updateTargetSessions(
    tabId: number
  ): Promise<void> {
    const tab = this._tabs[tabId];
    if (!tab) return;

    const targetSessions = Object.values(tab.targetSessions);
    let targets = await this._getTargets();
    targetSessions.forEach(targetSession => {
      const target = targets.find(t =>
        t.id === targetSession.targetInfo.id || t.id === targetSession.targetInfo.targetId
      );
      if (target) {
        Object.assign(targetSession.targetInfo, target);
        targetSession.targetInfo.targetId = target.id;
      }
    });
  }

  /**
   * Build frame tree for a tab by querying all target sessions.
   * @param tabId - Tab ID to build frame tree for
   * @returns Promise<CDPFrameInfo | undefined> - Promise that succeeded
   * @throws Throws error when failed
   */
  private async _buildFrameTree(
    tabId: number
  ): Promise<CDPFrameInfo | undefined> {
    const tab = this._tabs[tabId];
    if (!tab) return;

    const frameTrees: Array<{ frameTree: unknown; session: CDPDebuggerSession }> = [];
    const targetSessions = Object.values(tab.targetSessions);

    // Process each target session sequentially
    for (let index = 0; index < targetSessions.length; index++) {
      const targetSession = targetSessions[index];
      try {
        // Wrap _sendCommand in a promise
        const result = await this._sendCommand(targetSession.session, "Page.getFrameTree", {});
        // Check if we received a valid frame tree
        if (result && (result as { frameTree?: unknown }).frameTree) {
          frameTrees.push({
            frameTree: (result as { frameTree: unknown }).frameTree,
            session: targetSession.session
          });
        }
      } catch (error) {
        this._logger.warn("Page.getFrameTree failed for session", targetSession.session, "error:", error);
        // Re-throw the error to be handled by the caller
        throw error as Error;
      }
    }

    // Build and return the root frame tree
    const root = tab.buildFrameTree(frameTrees);
    return root;
  }

  /**
   * Evaluate a script in a specific frame/context of a tab.
   * @param tabId - Tab ID
   * @param frameId - Frame ID to evaluate in
   * @param contextType - Context type ("MAIN" or other), @defaultvalue = 'MAIN'
   * @param script - Script to evaluate
   * @param options - Evaluation options
   * @returns Promise<object | undefined> - Promise that succeeded
   * @throws Throws error when failed
   */
  async evaluateScript(
    tabId: number,
    frameId?: string,
    contextType: string = 'MAIN',
    script?: string,
    options: unknown = {}
  ): Promise<object | undefined> {
    const tab = this._getTab({ tabId } as CDPDebuggerSession);
    if (!tab) {
      throw new Error(`evaluateScript failed due to unknown tabId ${tabId}`);
    }
    await this._updateTargetSessions(tabId);
    const root = await this._buildFrameTree(tabId);

    if (!root) {
      throw new Error('evaluateScript failed due to unknown frame tree root');
    }

    const targetFrameId = frameId || root.id;
    const frame = tab.frames?.find(f => f.id === targetFrameId);
    if (!frame) {
      throw new Error(`evaluateScript failed due to unknown frameId ${targetFrameId}`);
    }

    const targetSession = frame.session || this._getDebuggee(tabId);
    const scriptOption = Object.assign(options as any, { expression: script });
    const context = contextType === "MAIN" ? frame.defaultContext : frame.contentContext;

    if (context?.uniqueId) {
      (scriptOption as Record<string, unknown>).uniqueContextId = context.uniqueId;
    } else if (context?.id) {
      (scriptOption as Record<string, unknown>).contextId = context.id;
    }

    const result = await this._sendCommand(targetSession, "Runtime.evaluate", scriptOption);
    return result;
  }

  /**
   * Navigate a tab to a URL via CDP.
   * @param tabId - Tab ID to navigate
   * @param url - URL to navigate to
   */
  async pageNavigate(
    tabId: number,
    url: string
  ): Promise<void> {
    const target = this._getDebuggee(tabId);
    await this._sendCommand(target, "Page.navigate", { "url": url });
  }

  /**
   * Check if a JavaScript dialog is open in a tab.
   * @param tabId - Tab ID to check
   */
  isJavascriptDialogOpened(
    tabId: number
  ): boolean {
    if (this._tabs[tabId]?.attached) {
      return !!this._tabs[tabId].javascriptDialog;
    } else {
      throw new Error(`the tab[${tabId}] is not attached`);
    }
  }

  /**
   * Handle a JavaScript dialog (accept/cancel).
   * @param tabId - Tab ID with dialog
   * @param accept - True to accept, false to cancel
   * @param text - Text to enter for prompt dialogs
   */
  async handleJavaScriptDialog(
    tabId: number,
    accept: boolean,
    text: string
  ): Promise<void> {
    const params = { accept, promptText: text };
    const target = this._getDebuggee(tabId);
    await this._sendCommand(target, "Page.handleJavaScriptDialog", params);
  }

  /**
   * Get the message from an open JavaScript dialog.
   * @param tabId - Tab ID with dialog
   */
  getJavaScriptDialogText(
    tabId: number
  ): string | undefined {
    if (this._tabs[tabId]?.attached) {
      return this._tabs[tabId].javascriptDialog?.message;
    } else {
      throw new Error(`the tab[${tabId}] is not attached`);
    }
  }

  /**
   * Emulate a device (screen size, user agent, etc.) for a tab.
   * @param tabId - Tab ID to emulate
   * @param emulationSettings - Device emulation configuration
   * @param successCallback - Called on success
   * @param failCallback - Called on error
   */
  async emulateDevice(
    tabId: number,
    emulationSettings: {
      userAgent: string;
      width: number;
      height: number;
      deviceScaleFactor: number;
      mobile: boolean;
      touch: boolean;
    }
  ): Promise<void> {
    if (!this.isTabAttached(tabId)) {
      throw new Error(`tabId[${tabId}] is invalid`);
    }

    const chromeInfo = BrowserUtils.getBrowserInfo();
    const useNewInstruction = chromeInfo.majorVersion > 60;
    const target = this._getDebuggee(tabId);
    await this._sendCommand(target, "Network.enable", {});
    await this._sendCommand(target, "Network.setUserAgentOverride", { userAgent: emulationSettings.userAgent });

    const method = useNewInstruction ? "Emulation.setDeviceMetricsOverride" : "Page.setDeviceMetricsOverride";
    const params = {
      width: emulationSettings.width,
      height: emulationSettings.height,
      deviceScaleFactor: emulationSettings.deviceScaleFactor,
      mobile: emulationSettings.mobile,
      fitWindow: false
    };
    await this._sendCommand(target, method, params);
    if (emulationSettings.touch) {
      const touchParams = { enabled: true };
      const touchMethod = useNewInstruction
        ? "Emulation.setTouchEmulationEnabled"
        : "Page.setTouchEmulationEnabled";
      const mouseTouchMethod = useNewInstruction
        ? "Emulation.setEmitTouchEventsForMouse"
        : "Page.setEmitTouchEventsForMouse";

      await this._sendCommand(target, touchMethod, touchParams);
      await this._sendCommand(target, mouseTouchMethod, touchParams);
    }

    this._tabs[tabId].emulationSettings = emulationSettings;

  }

  /**
   * Send a custom CDP command to a tab.
   * @param tabId - Tab ID to send command to
   * @param command - CDP command name
   * @param options - Command options
   * @returns Promise<object | undefined> - Promise that succeeded
   * @throws Throws error when failed
   */
  async sendCommand(
    tabId: number,
    command: string,
    options: unknown
  ): Promise<object | undefined> {
    const target = this._getDebuggee(tabId);
    const commandParams = Utils.deepClone(options);
    return await this._sendCommand(target, command, commandParams);
  }
};


