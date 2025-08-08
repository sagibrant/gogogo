/**
 * @copyright 2025 Sagi All Rights Reserved.
 * @author: Sagi <sagibrant@163.com>
 * @license Apache-2.0
 * @file ContentUtils.ts
 * @description 
 * Shared utility classes and functions for content
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

import { Utils } from "@/common/Common";
import { LocatorUtils } from "@/common/LocatorUtils";
import { RectInfo } from "@/types/api";
import { Selector } from "@/types/message";

export class ContentUtils {

  /**
   * Recursively traverse a root (document, element, or shadow root) with TreeWalker to find out matched nodes
   * @param node the current node
   * @param selectors the selectors
   * @returns the filtered nodes
   */
  static traverseSelectorAll(node: Node, selectors: Selector[]): Element[] {
    const result: Element[] = [];
    const treeWalker = document.createTreeWalker(
      node,
      NodeFilter.SHOW_ELEMENT, // Only consider Element nodes
      undefined // No custom filter here (we'll check attributes manually)
    );

    // Traverse all elements in the root
    let currentNode: Node | null = treeWalker.nextNode();
    while (currentNode) {
      if (currentNode.nodeType === Node.ELEMENT_NODE) {
        const elem = currentNode as Element;
        if (LocatorUtils.matchSelectors(elem, selectors)) {
          result.push(elem);
        }
        // Recursively check open shadow roots
        if (elem.shadowRoot && elem.shadowRoot instanceof ShadowRoot && elem.shadowRoot.mode === 'open') {
          const childNodes = ContentUtils.traverseSelectorAll(elem.shadowRoot, selectors);
          result.push(...childNodes);
        }
      }

      currentNode = treeWalker.nextNode();
    }
    return result;
  }

  static traverseSelectorAllFrames(node: Node, selectors: Selector[]): Element[] {
    const result: Element[] = [];
    const treeWalker = document.createTreeWalker(
      node,
      NodeFilter.SHOW_ELEMENT, // Only consider Element nodes
      undefined // No custom filter here (we'll check attributes manually)
    );

    // Traverse all elements in the root
    let currentNode: Node | null = treeWalker.nextNode();
    while (currentNode) {
      if (currentNode.nodeType === Node.ELEMENT_NODE) {
        const elem = currentNode as Element;
        if (LocatorUtils.matchSelectors(elem, selectors)
          && (elem.tagName === 'IFRAME' || elem.tagName === 'FRAME' || (elem.tagName === 'OBJECT' && 'contentWindow' in elem))) {
          result.push(elem);
        }
        // Recursively check open shadow roots
        if (elem.shadowRoot && elem.shadowRoot instanceof ShadowRoot && elem.shadowRoot.mode === 'open') {
          const childNodes = ContentUtils.traverseSelectorAllFrames(elem.shadowRoot, selectors);
          result.push(...childNodes);
        }
      }

      currentNode = treeWalker.nextNode();
    }
    return result;
  }

  /**
   * get the element by the given node
   * @param {Node} node 
   * @returns {Element|undefined}
   */
  static getElementByNode(node: Node): Element | undefined {
    let elem = node;
    while (elem.nodeType !== Node.ELEMENT_NODE && elem.parentElement) {
      elem = elem.parentElement;
    }
    if (elem.nodeType !== Node.ELEMENT_NODE) {
      return undefined;
    }
    return elem as Element;
  }

  /**
   * get the document of the given node
   * @param {Node} node 
   * @returns {HTMLDocument|ShadowRoot}
   */
  static getDocumentObjectByNode(node: Node): HTMLDocument | ShadowRoot {
    let curNode = node;
    while (curNode) {
      if (curNode.nodeType === Node.DOCUMENT_NODE) {
        return curNode as HTMLDocument;
      }
      else if ('shadowRoot' in curNode
        && curNode.shadowRoot instanceof ShadowRoot
        && curNode.shadowRoot.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
        return curNode.shadowRoot as ShadowRoot;
      }

      if (curNode.parentNode) {
        curNode = curNode.parentNode;
      }
      else {
        break;
      }
    }
    return document;
  }

  /**
   * check if the node is visible according to the css
   * @param {Node} node 
   * @returns {boolean}
   */
  static isVisibleBasedOnCSS(node: Node): boolean {
    if (!node) {
      return false;
    }
    const elem = ContentUtils.getElementByNode(node);
    if (!elem || elem.nodeType !== Node.ELEMENT_NODE) {
      return false;
    }
    const style = getComputedStyle(elem, null);
    if (!style) {
      return false;
    }
    // these styles will cause the element and the following childNodes invisible
    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
      return false;
    }

    if (style.position === 'absolute' || style.position === 'fixed') {
      let rect: RectInfo | undefined = undefined;
      let clip = style.clip;
      if (clip && clip !== 'auto' && clip !== 'inherit') {
        let match = clip.match(/rect\(([^)]+)\)/);
        if (match) {
          let values = match[1].split(',').map(value => parseInt(value.trim(), 10));
          if (values.length === 4) {
            const tmp = {
              top: values[0],
              right: values[1],
              bottom: values[2],
              left: values[3],
            };
            rect = Utils.fixRectange(tmp);
          }
        }
      }
      if (rect && !ContentUtils.isRectangeVisible(rect)) {
        return false;
      }
      rect = undefined
      // Check for 'clip-path' property (inset format)
      let clipPath = style.clipPath;
      if (clipPath && clipPath.startsWith('inset')) {
        let match = clipPath.match(/inset\(([^)]+)\)/);
        if (match) {
          let values = match[1].split(' ').map(value => parseInt(value.trim(), 10));
          if (values.length === 4) {
            const tmp = {
              top: values[0],
              right: values[1],
              bottom: values[2],
              left: values[3]
            };
            rect = Utils.fixRectange(tmp);
          }
        }
      }
      if (rect && !ContentUtils.isRectangeVisible(rect)) {
        return false;
      }
    }
    return true;
  }

  /**
   * check if the visible area of the give node is zero or not, *the child nodes may still visible if the child's position is fixed or absolute
   * @param {Node} node 
   * @returns {boolean}
   */
  static isVisibleAreaZero(node: Node): boolean {
    if (!node) {
      return false;
    }
    let elem = ContentUtils.getElementByNode(node);
    if (!elem || elem.nodeType !== Node.ELEMENT_NODE) {
      return false;
    }
    let style = getComputedStyle(elem, null);
    if (!style) {
      return false;
    }
    // for display:contents, the rect is all zero, but the children will be visible
    if (style.display === 'contents') {
      return false;
    }
    let rect = elem.getBoundingClientRect();
    if (!ContentUtils.isRectangeVisible(rect) && !style.overflow.includes('visible')) {
      return true;
    }
    return false;
  }

  /**
   * check if the current node is visible on the current viewport (do not use this method for non leaf nodes)
   * @param {Node} node 
   * @returns {boolean}
   */
  static isVisibleOnViewPort(node: Node): boolean {
    if (!node) {
      return false;
    }
    const elem = ContentUtils.getElementByNode(node);
    if (!elem || elem.nodeType !== Node.ELEMENT_NODE) {
      return false;
    }
    const style = getComputedStyle(elem, null);
    if (!style) {
      return false;
    }
    if (!ContentUtils.isVisibleBasedOnCSS(node)) {
      return false;
    }

    // checking the parents if the position depends on the parent
    if (style.position !== 'fixed' && style.position !== 'absolute') {
      let isParentVisibleAreaZero = false;
      let parent = elem.parentElement;
      while (parent) {
        const parentStyle = getComputedStyle(parent, null);
        if (parentStyle && (parentStyle.position === 'fixed' || parentStyle.position === 'absolute')) {
          isParentVisibleAreaZero = false;
          break;
        }
        if (ContentUtils.isVisibleAreaZero(parent)) {
          isParentVisibleAreaZero = true;
          break;
        }
        parent = parent.parentElement;
      }
      if (isParentVisibleAreaZero) {
        return false;
      }
    }

    const rect = elem.getBoundingClientRect();
    if (!ContentUtils.isRectangeVisible(rect)) {
      return false;
    }

    return true;
  }

  /**
   * check if the rectange area of the node is visible on the current viewport based on the inspect simulation
   * @param {Node} node 
   * @param {RectInfo} rect 
   * @returns {boolean}
   */
  static isVisibleUsingInspect(node: Node, rect: RectInfo): boolean {
    const center_x = (rect.right + rect.left) / 2;
    const center_y = (rect.bottom + rect.top) / 2;
    if (center_x < 0 || center_y < 0) {
      return false;
    }
    const elem = ContentUtils.getElementByNode(node);
    if (!elem) {
      return false;
    }
    const doc = ContentUtils.getDocumentObjectByNode(node);
    if (!doc) {
      return false;
    }
    const pointedElem = doc.elementFromPoint(center_x, center_y);
    if (pointedElem && elem === pointedElem) {
      return true;
    }
    if (pointedElem && elem !== pointedElem) {
      const style = getComputedStyle(elem);
      if (style && style.pointerEvents === 'none') {
        return true;
      }
    }

    if (doc.elementsFromPoint) {
      const elems = doc.elementsFromPoint(center_x, center_y);
      if (elems.length > 0 && elems.indexOf(elem) >= 0) {
        // there might be Pseudo-elements (e.g. ::before, ::after)
        if (pointedElem && elems.indexOf(pointedElem) >= 0) {
          const index_elem = elems.indexOf(elem);
          const index_pointed = elems.indexOf(pointedElem);
          const index_last_pointed = elems.lastIndexOf(pointedElem);
          // [pseudo-element of parent, elem, parent, xxx]
          if (index_last_pointed > index_pointed && index_pointed < index_elem && index_last_pointed > index_elem) {
            return true;
          }
        }
        // all the above elements might be transparent
        for (let i = 0; i < elems.length; i++) {
          if (elems[i] === elem) {
            return true;
          }
          const style = getComputedStyle(elems[i]);
          const backgroundColor = style.backgroundColor;
          const rgbaMatch = backgroundColor.match(/^rgba\((\d+), (\d+), (\d+), (\d?\.?\d+)\)$/); // by default 'rgba(0, 0, 0, 0)'
          const isAlphaZero = rgbaMatch && rgbaMatch.length > 4 && parseFloat(rgbaMatch[4]) < 0.5; // Check alpha value
          const opacity = style.opacity || '0';
          const isOpacity = parseFloat(opacity) < 0.5;
          if (isOpacity || (style.backgroundImage === 'none' && isAlphaZero)) {
            continue;
          } else {
            break;
          }
        }
      }
    }

    return false;
  }

  /**
   * check if the rectange is visible
   * @param {object} rect 
   * @returns {boolean}
   */
  static isRectangeVisible(rect: RectInfo): boolean {
    const temp = Utils.fixRectange(rect);
    if (!temp) {
      return false;
    }
    if (temp.width <= 1 || temp.height <= 1) {
      return false;
    }
    if (temp.right <= 1 && temp.bottom <= 1) {
      return false;
    }
    return true;
  }

  /**
   * check if the text is noise after trimed
   * @param {string} text 
   * @returns {boolean}
   */
  static isTrimNoise(text: string): boolean {
    if (typeof (text) !== 'string') {
      return true;
    }
    text = text.replace(/\n|\r/gm, '');
    text = text.replace(/\t/g, ' ');
    text = text.replace(/\xa0/g, ' '); // replace '&nbsp;' with ' '
    text = text.replace(/ +/g, ' ');
    if (text.trim() === '') {
      return true;
    }
    return false;
  }

  static elemIsIframe(elem: Element): boolean {
    const tagName = elem.tagName;
    return tagName === 'IFRAME' ||
      tagName === "FRAME" ||
      (tagName === "OBJECT" && 'contentWindow' in elem);
  }

  static isSpecialUninjectablePage(): boolean {
    const protocol = location.protocol;
    if (protocol === "chrome-extension:" || protocol === "chrome:" || protocol === "edge:") {
      return true;
    }
    return false;
  }

  static iframeXpathSelector: string = "//iframe | //frame | //object";
  static iframeCssSelector: string = 'iframe,frame,object';

}