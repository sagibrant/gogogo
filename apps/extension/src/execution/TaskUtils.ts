/**
 * @copyright 2025 Sagi All Rights Reserved.
 * @author: Sagi <sagibrant@hotmail.com>
 * @license Apache-2.0
 * @file TaskUtils.ts
 * @description 
 * Defines Utils for tasks and steps for automation.
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

import { Utils } from "@gogogo/shared";
import { ObjectDescription, Step, StepResult, Task, TaskAsset, TaskGroup, TaskResult } from "./Task";

export class TaskUtils {

  static createNewTaskAsset(): TaskAsset {
    const emptyTask: Task = {
      id: Utils.generateUUID(),
      name: 'task',
      type: 'task',
      steps: []
    }
    const root: TaskGroup = {
      id: Utils.generateUUID(),
      name: 'root',
      type: 'group',
      children: [emptyTask]
    };
    const asset: TaskAsset = {
      id: Utils.generateUUID(),
      name: 'asset',
      type: 'asset',
      url: '',
      author: 'placeholder',
      description: 'placeholder',
      version: '0.0.1',
      tags: [],
      root: root,
      results: [],
      creation_time: Date.now(),
      last_modified_time: Date.now(),
    };
    return asset;
  }

  static createDemoTaskAsset(): TaskAsset {
    const asset = TaskUtils.createNewTaskAsset();
    const task = (asset.root as TaskGroup).children[0];
    if (!task || task.type !== 'task') {
      throw new Error('Fail to create Demo Task asset');
    }
    const sauceDemoSteps = [
      {
        description: '1. Navigate to demo page',
        script: `const url = 'https://www.saucedemo.com/';
await page.navigate(url);
await page.bringToFront();
await page.sync();`
      },
      {
        description: '2. Login',
        script: `await page.element('#login_credentials').first().text().nth(1).highlight();
const username = await page.element('#login_credentials').first().text().nth(1).textContent();

const password = await page.element().filter({ name: 'data-test', value: 'login-password', type: 'attribute' }).first().text().nth(1).textContent();
await page.element().filter({ name: 'data-test', value: 'login-password', type: 'attribute' }).first().text().nth(1).highlight();

await page.element('#user-name').highlight();
await page.element('#user-name').fill(username);

await page.element('#password').highlight();
await page.element('#password').fill(password);

await page.element('#login-button').highlight();
await page.element('#login-button').click();

await page.sync();`
      },
      {
        description: '3. Buy Backpack',
        script: `await page.element('div .inventory_item_name ').filter({ name: 'textContent', value: /Backpack/ }).highlight();
await page.element('div .inventory_item_name ').filter({ name: 'textContent', value: /Backpack/ }).click();
await page.sync();
const count = await page.element('button#add-to-cart').count();
if (count === 1) {
  await page.element('button#add-to-cart').highlight();
  await page.element('button#add-to-cart').click();
}
await page.element('#back-to-products').highlight();
await page.element('#back-to-products').click();
await page.sync();`
      },
      {
        description: '4. Buy Bike Light & Fleece Jacket',
        script: `const items = await page.element('div .inventory_item_description').all();
const names = [/Bike Light/, /Fleece Jacket/];
for (const item of items) {
  for (const name of names) {
    if (await item.text(name).count() === 1 && await item.text('Add to cart').count() === 1) {
      await item.text(name).highlight();
      await item.text('Add to cart').highlight();
      await item.text('Add to cart').click();
    }
  }
}
const itemCount = await page.element('#shopping_cart_container > a > span').textContent();
expect(itemCount).toEqual('3');
await page.element('#shopping_cart_container > a').highlight();
await page.element('#shopping_cart_container > a').click();
await page.sync();`
      },
      {
        description: '5. Checkout',
        script: `await page.element('#checkout').highlight();
await page.element('#checkout').click();
await page.sync();
await page.element('input#first-name').highlight();
await page.element('input#first-name').fill('first_name');
await page.element('input#last-name').highlight();
await page.element('input#last-name').fill('last_name');
await page.element('input#postal-code').highlight();
await page.element('input#postal-code').fill('111111');
await page.element('#continue').highlight();
await page.element('#continue').click();
await page.sync();`
      },
      {
        description: '6. Verify and Finish',
        script: `const elems = await page.element('div.inventory_item_price').all();
let total_price = 0;
for (const elem of elems) {
  await elem.highlight();
  const textContent = await elem.textContent();
  const index = textContent.indexOf('$');
  const price = Number(textContent.slice(index + 1));
  total_price += price;
}
await page.element('div.summary_subtotal_label').highlight();
const summary_total_text = await page.element('div.summary_subtotal_label').textContent();
const index = summary_total_text.indexOf('$');
const summary_total_price = Number(summary_total_text.slice(index + 1));
expect(total_price).toBe(summary_total_price);

await page.element('#finish').highlight();
await page.element('#finish').click();`
      },
      {
        description: '7. Back Home',
        script: `await page.element('#back-to-products').highlight();
await page.element('#back-to-products').click();`
      },
      {
        description: '8. Reset and Logout',
        script: `await page.element('#react-burger-menu-btn').highlight();
await page.element('#react-burger-menu-btn').click();
let exists = await page.element('div.bm-menu').text('Reset App State').count() === 1;
while (!exists) {
  await wait(500);
  exists = await page.element('div.bm-menu').text('Reset App State').count() === 1;
}
await page.element('div.bm-menu').text('Reset App State').highlight();
await page.element('div.bm-menu').text('Reset App State').click();
await page.element('div.bm-menu').text('Logout').highlight();
await page.element('div.bm-menu').text('Logout').click();`
      },
    ];
    const demoSteps = sauceDemoSteps;
    for (const stepInfo of demoSteps) {
      const step: Step = {
        uid: Utils.generateUUID(),
        type: 'script_step',
        description: stepInfo.description,
        script: stepInfo.script
      };
      task.steps.push(step);
    }
    return asset;
  }

  static isTaskAsset(asset: any): asset is TaskAsset {

    if (asset === null || typeof asset !== 'object') {
      return false;
    }

    const basicChecks = [
      typeof asset.id === 'string',
      typeof asset.name === 'string',
      typeof asset.type === 'string' && asset.type === 'asset',
      typeof asset.url === 'string',
      typeof asset.author === 'string',
      typeof asset.description === 'string',
      typeof asset.version === 'string',
      Array.isArray(asset.tags) && asset.tags.every((tag: any) => typeof tag === 'string'),
      typeof asset.creation_time === 'number',
      typeof asset.last_modified_time === 'number'
    ];

    if (basicChecks.some(check => !check)) {
      return false;
    }

    if (!TaskUtils.isTaskNode(asset.root)) {
      return false;
    }

    if (!Array.isArray(asset.results)) {
      return false;
    }
    if (!asset.results.every((result: any) => TaskUtils.isTaskResult(result))) {
      return false;
    }

    return true;
  }

  private static isTaskResult(result: any): result is TaskResult {
    if (result === null || typeof result !== 'object') {
      return false;
    }

    const requiredChecks = [
      typeof result.task_id === 'string',
      typeof result.task_start_time === 'number',
      typeof result.task_end_time === 'number',
      Array.isArray(result.steps) && result.steps.every((step: any) => TaskUtils.isStepResult(step))
    ];

    if (requiredChecks.some(check => !check)) {
      return false;
    }

    const optionalStatus = result.status === undefined ||
      ['passed', 'failed'].includes(result.status);
    const optionalError = result.last_error === undefined || typeof result.last_error === 'string';

    return optionalStatus && optionalError;
  }

  private static isStepResult(step: any): step is StepResult {
    if (step === null || typeof step !== 'object') {
      return false;
    }

    const requiredChecks = [
      typeof step.step_uid === 'string',
      typeof step.step_description === 'string',
      typeof step.step_start_time === 'number',
      typeof step.step_end_time === 'number'
    ];

    if (requiredChecks.some(check => !check)) {
      return false;
    }

    const optionalStatus = step.status === undefined ||
      ['passed', 'failed'].includes(step.status);
    const optionalError = step.error === undefined || typeof step.error === 'string';
    const optionalScreenshot = step.screenshot === undefined || typeof step.screenshot === 'string';

    return optionalStatus && optionalError && optionalScreenshot;
  }

  private static isTaskNode(root: any): root is TaskGroup | Task {
    if (root === null || typeof root !== 'object') {
      return false;
    }

    if (
      typeof root.id !== 'string' ||
      typeof root.name !== 'string' ||
      typeof root.type !== 'string'
    ) {
      return false;
    }

    if (root.type === 'group') {
      return (
        Array.isArray(root.children) &&
        root.children.every((child: any) => TaskUtils.isTaskNode(child))
      );
    } else if (root.type === 'task') {
      if (!Array.isArray(root.steps)) {
        return false;
      }

      return root.steps.every((step: any) =>
        typeof step === 'object' &&
        step !== null &&
        typeof step.uid === 'string' &&
        step.type === 'script_step' &&
        typeof step.description === 'string' &&
        typeof step.script === 'string' &&
        (step.objects === undefined ||
          (Array.isArray(step.objects) &&
            step.objects.every(TaskUtils.isObjectDescription)))
      );
    }

    return false;
  }

  private static isObjectDescription(obj: any): obj is ObjectDescription {
    if (obj === null || typeof obj !== 'object') {
      return false;
    }
    if ('title' in obj && 'url' in obj && 'index' in obj) {
      return (
        typeof obj.title === 'string' &&
        typeof obj.url === 'string' &&
        typeof obj.index === 'number'
      );
    }

    if ('tagName' in obj) {
      const baseCheck = typeof obj.tagName === 'string';

      const parentCheck = obj.parent === undefined || TaskUtils.isObjectDescription(obj.parent);
      const valueCheck = obj.value === undefined || typeof obj.value === 'string';
      const textContentCheck = obj.textContent === undefined || typeof obj.textContent === 'string';
      const attributesCheck = obj.attributes === undefined ||
        (typeof obj.attributes === 'object' &&
          obj.attributes !== null &&
          !Array.isArray(obj.attributes));

      return baseCheck && parentCheck && valueCheck && textContentCheck && attributesCheck;
    }

    return false;
  }

}