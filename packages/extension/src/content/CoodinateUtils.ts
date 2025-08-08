/**
 * @copyright 2025 Sagi All Rights Reserved.
 * @author: Sagi <sagibrant@163.com>
 * @license Apache-2.0
 * @file ChromeContentUtils.ts
 * @description 
 * Shared utility classes and functions for content in chrome
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

import { BrowserUtils, Utils } from "@/common/Common";
import { RectInfo } from "@/types/api";

export class CoodinateUtils {

  /** the zoom factor for the page, get updated by chrome.tabs.onZoomChange listeners */
  static pageZoomFactor: number | undefined = undefined;
  /** force device scale factor */
  static deviceScaleFactor: number | undefined = undefined;
  /** force desktop scale factor */
  static desktopScaleFactor: number | undefined = undefined;
  /** force device pixel ratio */
  static devicePixelRatio: number | undefined = undefined;
  /** the page's window offset x */
  static pageWindowOffsetX: number | undefined = undefined;
  /** the page's window offset y */
  static pageWindowOffsetY: number | undefined = undefined;
  /** if there's a page padding (only available for edge new look) */
  static isPagePaddingEnabled: boolean | undefined = undefined;

  static test(): void {
    const onMouseOverListener = (ev: MouseEvent) => {
      if (window.parent !== window) {
        return; // check if in page
      }
      if (typeof (ev.isTrusted) === "boolean" && ev.isTrusted === true &&
        typeof (ev.screenX) === "number" && typeof (ev.screenY) === "number" &&
        typeof (ev.clientX) === "number" && typeof (ev.clientY) === "number") {
        var devicePixelRatio = CoodinateUtils.getDevicePixelRatio() || CoodinateUtils.getDevicePixelRatio();
        var deviceScaleFactor = CoodinateUtils.getDeviceScaleFactor() || CoodinateUtils.getDevicePixelRatio()
        CoodinateUtils.pageWindowOffsetX = Math.floor(((ev.screenX - window.screenX) * deviceScaleFactor) - (ev.clientX * devicePixelRatio));
        CoodinateUtils.pageWindowOffsetY = Math.floor(((ev.screenY - window.screenY) * deviceScaleFactor) - (ev.clientY * devicePixelRatio));
        if (CoodinateUtils.pageWindowOffsetX < 0 || CoodinateUtils.pageWindowOffsetY < 0) {
          CoodinateUtils.pageWindowOffsetX = undefined;
          CoodinateUtils.pageWindowOffsetY = undefined;
        }
      }
    };
    const onResize = (ev: UIEvent) => {
      if (window.parent !== window) {
        return; // check if in page
      }
      CoodinateUtils.pageWindowOffsetX = undefined;
      CoodinateUtils.pageWindowOffsetY = undefined;
    };
    window.addEventListener("mouseover", onMouseOverListener, true);
    window.addEventListener("resize", onResize, true);
  }

  static updatePagePaddingState(windowState: 'maximized' | 'normal') {
    // on edge, users can disable the new look to remove the round corner
    const isMaximized = CoodinateUtils.isMaximized();
    // we need to first make sure the pageWindowOffsetX is reliable (set by tool in the same browser window state or set by user actions)
    if (!Utils.isNullOrUndefined(CoodinateUtils.pageWindowOffsetX) &&
      (!Utils.isNullOrUndefined(CoodinateUtils.pageWindowOffsetY) ||
        (windowState === "maximized" && isMaximized) ||
        (windowState === "normal" && !isMaximized))) {
      let deltaOffset = 0;
      const deviceScaleFactor = CoodinateUtils.getDeviceScaleFactor() || CoodinateUtils.getDevicePixelRatio();
      const desktopScaleFactor = CoodinateUtils.getDesktopScaleFactor() || CoodinateUtils.getDevicePixelRatio();
      const borderPixels = CoodinateUtils.calculatePageBorder(deviceScaleFactor) || 8;
      let screenX_maximized_browser = CoodinateUtils.calculatePageBorder(desktopScaleFactor);
      if (!Utils.isNullOrUndefined(screenX_maximized_browser)) {
        screenX_maximized_browser = 0 - screenX_maximized_browser;
      }
      else {
        screenX_maximized_browser = -8;
      }
      if (isMaximized) {
        deltaOffset = Math.abs(CoodinateUtils.pageWindowOffsetX - (screenX_maximized_browser + borderPixels));
      } else {
        deltaOffset = Math.abs(CoodinateUtils.pageWindowOffsetX - borderPixels);
      }
      if (deltaOffset <= 1) {
        CoodinateUtils.isPagePaddingEnabled = false;
      }
    }
  };

  static getDevicePixelRatio(): number {

    if (!Utils.isNullOrUndefined(CoodinateUtils.devicePixelRatio) && CoodinateUtils.devicePixelRatio > 0) {
      return CoodinateUtils.devicePixelRatio;
    }

    return window.devicePixelRatio;
  }

  /**
   * get the device scale factor 
   * @returns the browser's device scale factor
   */
  static getDeviceScaleFactor(): number | undefined {
    // device scale factor describe the scale factor for the window but not the page
    // it can be set by launching chrome with --force-device-scale-factor or auto inherit the desktop scale factor (DEVICE_SCALE_FACTOR)
    // devicePixelRatio = pageZoomFactor * deviceScaleFactor

    if (!Utils.isNullOrUndefined(CoodinateUtils.deviceScaleFactor) && CoodinateUtils.deviceScaleFactor > 0) {
      return CoodinateUtils.deviceScaleFactor;
    }

    if (!Utils.isNullOrUndefined(CoodinateUtils.pageZoomFactor)) {
      const deviceScaleFactor = CoodinateUtils.getDevicePixelRatio() / CoodinateUtils.pageZoomFactor;
      return deviceScaleFactor;
    }

    // assume the pageZoomFactor is 100% by default
    return undefined;
  }

  /**
   * get the desktop scale factor
   * @returns the desktop's scale factor
   */
  static getDesktopScaleFactor(): number | undefined {
    // desktop scale factor describe the scale factor for the desktop when chrome launched

    if (!Utils.isNullOrUndefined(CoodinateUtils.desktopScaleFactor) && CoodinateUtils.desktopScaleFactor > 0) {
      const desktopScaleFactor = CoodinateUtils.desktopScaleFactor;
      return desktopScaleFactor;
    }

    // assume in most cases, the desktop scale factor is the device scale factor of browser 
    // unless the browser is launched with --force-device-scale-factor
    return undefined;
  }

  /** get the window rect in the screen coordinate */
  static getWindowRect(): RectInfo {
    const deviceScaleFactor = CoodinateUtils.getDeviceScaleFactor() || CoodinateUtils.getDevicePixelRatio();
    const rect = {
      top: Math.floor(window.screenY * deviceScaleFactor),
      left: Math.floor(window.screenX * deviceScaleFactor),
      right: Math.ceil((window.screenX + window.outerWidth) * deviceScaleFactor),
      bottom: Math.ceil((window.screenY + window.outerHeight) * deviceScaleFactor),
      // width: Math.ceil(window.outerWidth * deviceScaleFactor),
      // height: Math.ceil(window.outerHeight * deviceScaleFactor),
    };
    const rectInfo = Utils.fixRectange(rect);
    return rectInfo;
  }

  /** check if the page is in full screen mode */
  static isFullscreen(): boolean {
    return !!(document.fullscreenElement);
    // Support all major browsers (including prefixes for Safari/IE)
    // document.fullscreenElement ||
    // document.webkitFullscreenElement || // Safari
    // document.msFullscreenElement ||     // IE/Edge (legacy)
    // document.mozFullscreenElement       // Firefox (legacy)
  }

  /** check if the page is minimized or inactive */
  static isMinimizedOrInactive(): boolean {
    return document.hidden;
  }

  /** check if the page is maxmized, not very reliable */
  static isMaximized(tolerance = 0): boolean {
    // Skip check if in fullscreen (fullscreen is a separate state)
    if (CoodinateUtils.isFullscreen()) return false;

    // screenX and screenY may be affected by the system toolbar
    // (window.screenX === 0) && (window.screenY === 0)
    // if scale is not 100%, the following check also fail because the outerWidth and outerHeight will be changed
    // (window.outerWidth === window.screen.availWidth) && (window.outerHeight === window.screen.availHeight)

    // Compare window dimensions to available screen space (with tolerance)
    const widthMatch = Math.abs(window.outerWidth - window.screen.availWidth) <= tolerance;
    const heightMatch = Math.abs(window.outerHeight - window.screen.availHeight) <= tolerance;

    return widthMatch && heightMatch;
  }

  /**
   * Calculate the bound size based on the known scales and bounds
   * @param {number} scale - the start index
   * @param {number} scales - the known scales array
   * @param {number} bounds - the known bounds array
   * @returns the bound size
   */
  static calculateBound(scale: number, scales: number[], bounds: number[]): number | undefined {
    let bound = 8;
    if (scale > scales[scales.length - 1] || scale < scales[0]) {
      return undefined;
    }
    for (let i = 0; i < scales.length; i++) {
      const cur = scales[i];
      const next = scales[i + 1] || cur;
      if (scale > next) {
        continue;
      }
      const deltaCur = Math.abs(scale - cur);
      const deltaNext = Math.abs(next - scale);
      if (deltaCur <= deltaNext) {
        bound = bounds[i];
        break;
      } else {
        bound = bounds[i + 1] || bounds[i];
        break;
      }
    }
    return bound;
  }

  static calculatePagePadding(scale: number): number | undefined {
    if (!CoodinateUtils.isPagePaddingEnabled) {
      return 0;
    }
    const browserInfo = BrowserUtils.getBrowserInfo();
    if (browserInfo.name === 'edge') {
      return CoodinateUtils.calculateEdgePagePadding(scale);
    }
    return 0;
  }

  static calculateEdgePagePadding(scale: number): number | undefined {
    if (!CoodinateUtils.isPagePaddingEnabled) {
      return 0;
    }
    if (Utils.isNullOrUndefined(scale)) {
      scale = CoodinateUtils.getDeviceScaleFactor() || CoodinateUtils.getDevicePixelRatio();
    }
    if (scale === 1) {
      return 4;
    }
    const scales = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.25, 2.5, 2.75, 3, 3.25, 3.5, 3.75, 4];
    const paddings = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];
    let padding = CoodinateUtils.calculateBound(scale, scales, paddings);
    return padding;
  };

  static calculatePageBorder(scale: number) {
    if (Utils.isNullOrUndefined(scale)) {
      scale = CoodinateUtils.getDeviceScaleFactor() || 1;
    }
    if (scale === 1) {
      return 8;
    }
    const scales = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.25, 2.5, 2.75, 3, 3.25, 3.5, 3.75, 4];
    const borders = [4, 6, 7, 8, 9, 11, 12, 13, 14, 16, 17, 18, 19, 21, 22, 23];
    let border = CoodinateUtils.calculateBound(scale, scales, borders);
    return border;
  }

  static getPageRect(): RectInfo {
    const pageRect = {} as RectInfo;
    const devicePixelRatio = CoodinateUtils.getDevicePixelRatio();
    const deviceScaleFactor = CoodinateUtils.getDeviceScaleFactor() || devicePixelRatio;
    const desktopScaleFactor = CoodinateUtils.getDesktopScaleFactor() || devicePixelRatio;
    const isMaximized = CoodinateUtils.isMaximized();
    let paddingPixels = CoodinateUtils.calculatePagePadding(deviceScaleFactor);
    let borderPixels = CoodinateUtils.calculatePageBorder(deviceScaleFactor);
    let screenX_maximized_browser = CoodinateUtils.calculatePageBorder(desktopScaleFactor);

    if (!Utils.isNullOrUndefined(paddingPixels)
      && !Utils.isNullOrUndefined(borderPixels)
      && !Utils.isNullOrUndefined(screenX_maximized_browser)) {
      screenX_maximized_browser = 0 - screenX_maximized_browser;
    }
    else {
      paddingPixels = 0; // 0 by default
      borderPixels = 0; // 0 by default
      screenX_maximized_browser = -8; //-8 by default
      let deltaWidth = window.outerWidth * deviceScaleFactor - window.innerWidth * devicePixelRatio;
      if (deltaWidth < 0) {
        deltaWidth = 0;
      }
      // assume no sidebar in left and right
      borderPixels = deltaWidth / 2;
    }
    // user interactive mode: user action help us to fix the offset issue
    if (!Utils.isNullOrUndefined(CoodinateUtils.pageWindowOffsetX) && !Utils.isNullOrUndefined(CoodinateUtils.pageWindowOffsetY)) {
      pageRect.left = window.screenX * deviceScaleFactor + CoodinateUtils.pageWindowOffsetX;
    } else {
      if (isMaximized) {
        pageRect.left = screenX_maximized_browser + borderPixels + paddingPixels;
      } else {
        pageRect.left = window.screenX * deviceScaleFactor + borderPixels + paddingPixels;
      }
    }

    // user interactive mode: user action help us to fix the offset issue
    if (!Utils.isNullOrUndefined(CoodinateUtils.pageWindowOffsetY) && CoodinateUtils.pageWindowOffsetY > 0) {
      pageRect.top = window.screenY * deviceScaleFactor + CoodinateUtils.pageWindowOffsetY;
    } else {
      let deltaHeight = window.outerHeight * deviceScaleFactor - window.innerHeight * devicePixelRatio;
      if (deltaHeight < 0) {
        deltaHeight = 0;
      }

      // outerHeight = innerHeight + banner + border*2 + padding*2
      // deltaHeight = outerHeight - innerHeight = banner + border*2 + padding*2
      // top = screenY + border + banner + padding = screenY + deltaHeight - border - padding
      if (isMaximized) {
        let adjustedBorderPixels = screenX_maximized_browser + borderPixels;
        pageRect.top = window.screenY * deviceScaleFactor + deltaHeight - adjustedBorderPixels - paddingPixels;
      } else {
        pageRect.top = window.screenY * deviceScaleFactor + deltaHeight - borderPixels - paddingPixels;
      }
    }

    pageRect.right = pageRect.left + window.innerWidth * devicePixelRatio;
    pageRect.bottom = pageRect.top + window.innerHeight * devicePixelRatio;

    // Math.floor
    pageRect.left = Math.floor(pageRect.left);
    pageRect.top = Math.floor(pageRect.top);
    pageRect.right = Math.ceil(pageRect.right);
    pageRect.bottom = Math.ceil(pageRect.bottom);

    return Utils.fixRectange(pageRect);
  }

}
