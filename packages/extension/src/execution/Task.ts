/**
 * @copyright 2025 Sagi All Rights Reserved.
 * @author: Sagi <sagibrant@163.com>
 * @license Apache-2.0
 * @file Task.ts
 * @description 
 * Defines interfaces for tasks and steps for automation.
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


/**
 * Interface representing an asset describing a task or a group of tasks
 */
export interface TaskAsset {
  id: string;
  name: string;
  type: 'asset';
  url: string;
  author: string;
  description: string;
  version: string;
  tags: string[];
  root: TaskGroup | Task;
  results: TaskResult[];
  creation_time: number;
  last_modified_time: number;
}

/**
 * Interface representing a group of tasks or other groups
 */
export interface TaskGroup {
  id: string;
  name: string;
  type: 'group';
  children: Array<TaskGroup | Task>;
}

/**
 * Interface representing a task containing multiple steps
 */
export interface Task {
  id: string;
  name: string;
  type: 'task';
  steps: Step[];
}

/**
 * Interface representing an automated step
 */

export interface Step {
  uid: string;
  type: 'script_step';
  objects?: ObjectDescription[];
  description: string;
  script: string;
}

export type ObjectDescription = TabDescription | ElementDescription;

export interface TabDescription {
  title: string;
  url: string;
  index: number;
}

export interface ElementDescription {
  tagName: string;
  parent?: ElementDescription;
  value?: string;
  textContent?: string;
  attributes?: Record<string, string>;
}

/**
 * Interface representing the result of executing a task
 */
export interface TaskResult {
  task_id: string;
  task_start_time: number;
  task_end_time: number;
  status?: 'pass' | 'fail' | 'pending';
  last_error?: string;
  steps: StepResult[];
}

/**
 * Interface representing the result of executing a step
 */
export interface StepResult {
  step_uid: string;
  step_description: string;
  step_start_time: number;
  step_end_time: number;
  status?: 'pass' | 'fail' | 'pending';
  error?: string;
  screenshot?: string;
}


export class TaskUtils {
  static createDemoTaskGroup(): TaskGroup {
    const demoTaskGroup: TaskGroup = {
      id: 'root',
      name: 'root',
      type: 'group',
      children: [
        {
          id: Utils.generateUUID(),
          name: 'empty group',
          type: 'group',
          children: []
        },
        {
          id: 'group2',
          name: 'empty task',
          type: 'group',
          children: [
            {
              id: Utils.generateUUID(),
              name: 'Empty',
              type: 'task',
              steps: []
            }
          ]
        },
        {
          id: Utils.generateUUID(),
          name: 'api test',
          type: 'group',
          children: [
            {
              id: Utils.generateUUID(),
              name: 'window test',
              type: 'task',
              steps: [
                {
                  uid: Utils.generateUUID(),
                  type: 'script_step',
                  description: 'test window methods',
                  script: `console.log("start to test window methods");
let window_old = await browser.lastFocusedWindow();  console.log("browser.lastFocusedWindow", window_old);
let window = await browser.openNewWindow("https://www.bing.com"); console.log("browser.openNewWindow", window);
const state = await window.state(); console.log("window.state", state);
const focused = await window.focused(); console.log("window.focused", focused);
const incognito = await window.incognito(); console.log("window.incognito", incognito);
const browser_new = await window.browser(); console.log("window.browser", browser_new);
const pages = await window.pages(); console.log("window.pages", pages);
const activePage = await window.activePage(); console.log("window.activePage", activePage);
const newPage = await window.openNewPage("https://www.baidu.com"); console.log("window.openNewPage", newPage);
await window_old.focus(); console.log("window.focus");
await window.focus(); console.log("window.focus");
await window.minimize(); console.log("window.minimize");
await window.maximize(); console.log("window.maximize");
await window.restore(); console.log("window.restore");
await window.fullscreen(false); console.log("window.fullscreen");
await window.fullscreen(); console.log("window.fullscreen");
console.log("all passed");
                  `
                },
                {
                  uid: Utils.generateUUID(),
                  type: 'script_step',
                  description: 'close the last window',
                  script: `const windows = await browser.windows();  console.log("browser.windows:", windows);
const window = windows[windows.length-1];
await window.close();
                  `
                }
              ]
            },
            {
              id: Utils.generateUUID(),
              name: 'browser test',
              type: 'task',
              steps: [
                {
                  uid: Utils.generateUUID(),
                  type: 'script_step',
                  description: 'test browser methods',
                  script: `console.log("start to test browser methods");
console.log("browser info:", browser.name(), browser.version(), browser.majorVersion());
const windows = await browser.windows();  console.log("browser.windows:", windows);
const pages = await browser.pages();  console.log("browser.pages:", pages);
const window = await browser.lastFocusedWindow();  console.log("browser.lastFocusedWindow", window);
const page = await browser.lastActivePage();  console.log("browser.lastActivePage", page);
await browser.enableCDP(); console.log("browser.enableCDP");
browser.setDefaultTimeout(5100); console.log("browser.setDefaultTimeout");
const newWindow = await browser.openNewWindow("https://www.bing.com"); console.log("browser.openNewWindow", newWindow);
const newPage = await browser.openNewPage("https://www.baidu.com"); console.log("browser.openNewPage", newPage);
await browser.disableCDP(); console.log("browser.disableCDP");
console.log("all passed");
                  `
                },
                {
                  uid: Utils.generateUUID(),
                  type: 'script_step',
                  description: 'close browser',
                  script: 'await browser.close();'
                }
              ]
            },
            {
              id: Utils.generateUUID(),
              name: 'page test',
              type: 'task',
              steps: [
                {
                  uid: Utils.generateUUID(),
                  type: 'script_step',
                  description: 'test page methods',
                  script: `console.log("start to test page methods");
console.log("current page:", page);
const url = await page.url(); console.log("page.url:", url);
const title = await page.title(); console.log("page.title:", title);
const status = await page.status(); console.log("page.status:", status);
const closed = await page.closed(); console.log("page.closed:", closed);
const pageWindow = await page.window(); console.log("page.window:", pageWindow);
const mainFrame = page.mainFrame(); console.log("page.mainFrame:", mainFrame);
const frames = await page.frames(); console.log("page.frames:", frames);

const newPage = await page.openNewPage("https://www.bing.com"); console.log("page.openNewPage:", newPage);
await page.bringToFront(); console.log("page.bringToFront");
await page.refresh(); console.log("page.refresh");
await page.refresh(true); console.log("page.refresh(true)");
await newPage.active(); console.log("newPage.active");
await page.navigate("https://www.baidu.com"); console.log("page.navigate");
await page.sync(); console.log("page.sync");
await page.navigate("https:///www.bing.com"); console.log("page.navigate");
await page.sync(); console.log("page.sync");
await page.back(); console.log("page.back");
await page.sync(); console.log("page.sync");
await page.forward(); console.log("page.forward");
await page.sync(); console.log("page.sync");
await newPage.bringToFront(); console.log("newPage.bringToFront");
await newPage.refresh(); console.log("newPage.refresh");
await newPage.sync(); console.log("newPage.sync");
await newPage.zoom(2.5); console.log("newPage.zoom(2.5)");
const windows = await browser.windows(); console.log("browser.windows");
const win = windows[0];
await newPage.moveToWindow(win, 0); console.log("newPage.moveToWindow");
const screenshot = await newPage.captureScreenshot(); console.log("newPage.captureScreenshot", screenshot);
const elements = await newPage.querySelectorAll("div"); console.log("newPage.querySelectorAll", elements);
await newPage.bringToFront(); console.log("newPage.bringToFront");
await newPage.zoom(1); console.log("newPage.zoom(1)");
await page.bringToFront(); console.log("page.bringToFront");

console.log("all passed");
                  `
                },
                {
                  uid: Utils.generateUUID(),
                  type: 'script_step',
                  description: 'close page',
                  script: 'await page.close();'
                }
              ]
            },
            {
              id: Utils.generateUUID(),
              name: 'frame test',
              type: 'task',
              steps: [
                {
                  uid: Utils.generateUUID(),
                  type: 'script_step',
                  description: 'test frame methods',
                  script: `console.log("start to test frame methods");
console.log("current page:", page);
const mainFrame = page.mainFrame(); console.log("page.mainFrame:", mainFrame);
const frames = await page.frames(); console.log("page.frames:", frames);
const printFrame = async (frame) =>{
  console.log("current frame: ==>", frame);
  const framePage = frame.page(); console.log("frame.page:", framePage);
  const parentFrame = await frame.parentFrame(); console.log("frame.parentFrame:", parentFrame);
  const childFrames = await frame.childFrames(); console.log("frame.childFrames:", childFrames);
  const frameElement = await frame.frameElement(); console.log("frame.frameElement:", frameElement);

  const url = await frame.url(); console.log("frame.url:", url);
  const status = await frame.status(); console.log("frame.status:", status);
  let readyState = await frame.readyState(); console.log("frame.readyState:", readyState);
  if(readyState === 'interactive') {
    const start_time = performance.now();
    console.log("frame.sync -->");
    await frame.sync();
    const end_time = performance.now()
    console.log("frame.sync <--", end_time - start_time);
    readyState = await frame.readyState(); console.log("frame.readyState x 2:", readyState);
  }
  if(readyState === 'interactive' || readyState === 'complete') {
    const elements = await frame.querySelectorAll("div"); console.log("frame.querySelectorAll", elements);
    for(const childFrame of childFrames) {
      await printFrame(childFrame);
    }
  }
  console.log("current frame: <==", frame);
};
await printFrame(mainFrame);

console.log("all passed");
                  `
                },
                {
                  uid: Utils.generateUUID(),
                  type: 'script_step',
                  description: 'close page',
                  script: 'await page.close();'
                }
              ]
            },
          ]
        },
        {
          id: 'group1',
          name: 'bing search',
          type: 'group',
          children: [
            {
              id: Utils.generateUUID(),
              name: 'Script task',
              type: 'task',
              steps: [
                {
                  uid: Utils.generateUUID(),
                  type: 'script_step',
                  description: 'switch to tab 1',
                  script: `const window = await page.window();
const pages = await window.pages();
if(pages.length > 0) pages[0].active(); `,
                  objects: [
                    {
                      url: 'https://www.bing.com',
                      title: 'bing',
                      index: 0
                    }
                  ]
                },
                {
                  uid: Utils.generateUUID(),
                  type: 'script_step',
                  description: 'navigate to bing',
                  script: 'await page.navigate("https://www.bing.com");'
                },
                {
                  uid: Utils.generateUUID(),
                  type: 'script_step',
                  description: 'input search text "sjtu"',
                  script: 'await page.locator("#sb_form_q").filter({name:"q", type:"search"}).fill("sjtu");',
                  objects: [{
                    tagName: 'input',
                    attributes: {
                      id: 'sb_form_q',
                      name: 'q',
                      type: 'search'
                    }
                  }]
                },
                {
                  uid: Utils.generateUUID(),
                  type: 'script_step',
                  description: 'input search text "sjtu"',
                  script: 'await page.locator("#search_icon").filter({tagName:"LABEL"}).click();',
                  objects: [{
                    tagName: 'LABEL',
                    attributes: {
                      id: 'search_icon'
                    }
                  }]
                }
              ]
            }
          ]
        }
      ]
    };
    return demoTaskGroup;
  }
}