


/** ==================================================================================================================== */
/** ================================================ Predefined properties ================================================= */
/** ==================================================================================================================== */

export interface BrowserQueryInfo {
  browserType?: 'chrome' | 'edge' | 'firefox';
  headless?: boolean;
  channel?: 'stable' | 'beta' | 'dev' | 'canary';
  path?: string; // exe path
  version?: number | string; // version or version range
}

export interface WindowQueryInfo {
  id?: number; // browser window id

  title?: string; // window title
  focused?: boolean;

  state?: 'normal' | 'minimized' | 'maximized' | 'fullscreen';
  incognito?: boolean;
  type?: 'normal' | 'popup' | 'panel' | 'app' | 'devtools';
  top?: number;
  left?: number;
  width?: number;
  height?: number;
}

export interface TabQueryInfo {
  id?: number; // browser tab id

  title?: string;
  url?: string;
  favIconUrl?: string;

  active?: boolean;
  pinned?: boolean;
  status?: 'loading' | 'complete';
  index?: number; // position in the window
  lastFocusedWindow?: boolean; //Whether the tabs are in the last focused window.
  windowId?: number; // The ID of the parent window
  windowType?: 'normal' | 'popup' | 'panel' | 'app' | 'devtools'; // The type of window the tabs are in.
}

export interface FrameQueryInfo {
  url?: string;
}

export interface ElementQueryInfo {
  xpath?: string; // evalute
  css?: string; // querySelectorAll
}
