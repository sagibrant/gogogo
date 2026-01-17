/**
 * @copyright 2026 Sagi All Rights Reserved.
 * @author: Sagi <sagibrant@hotmail.com>
 * @license Apache-2.0
 * @file WaitUtils.ts
 * @description 
 * Shared utility classes and functions
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


import * as Utils from './Utils';

export const WaitUtils = {
  /**
   * wait 
   * @param ms timeout
   * @returns 
   */
  async wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  /**
   * wait for the checkFunc to be checked
   * @param checkFunc the check function to validate the requirements
   * @param timeout timeout
   * @param delay delay for each check
   * @returns property value match the expected value
   */
  async waitChecked(checkFunc: () => Promise<boolean>, timeout: number = 5000, delay: number = 500): Promise<boolean> {
    const end_time = performance.now() + timeout;
    let count = 0;
    const noWaitRetryNum = 0;
    while (performance.now() < end_time) {
      const isMatch = await checkFunc();
      if (isMatch) {
        return true;
      }
      else if (performance.now() > end_time) {
        return false;
      }
      count++;
      // let's first try ${noWaitRetryNum} times incase the js wait is not stable and low priority cause long timeout than expected
      // if still failed, we try to wait
      if (count > noWaitRetryNum) {
        await WaitUtils.wait(delay);
      }
    }
    return false;
  },

  /**
   * use requestAnimationFrame for wait 
   * @deprecated not working in extension
   * @param checkFunc the check function to validate the requirements
   * @param timeout timeout
   * @param delay delay for each check
   * @returns property value match the expected value
   */
  async rafWaitChecked(checkFunc: () => Promise<boolean>, timeout: number = 5000, delay: number = 100): Promise<boolean> {
    if (typeof requestAnimationFrame !== 'function') {
      throw new Error('requestAnimationFrame is not a valid function');
    }
    const end_time = performance.now() + timeout;
    return new Promise((resolve, _reject) => {
      let lastExecution: number | undefined = undefined;
      const rafFunc = async (): Promise<void> => {
        // time out
        if (performance.now() >= end_time) {
          resolve(false);
          return;
        }

        try {
          if (Utils.isNullOrUndefined(lastExecution) || performance.now() - lastExecution >= delay) {
            lastExecution = performance.now();
            const isMatch = await checkFunc();
            lastExecution = performance.now();
            if (isMatch) {
              resolve(true);
              return;
            }
            else if (performance.now() >= end_time) {
              resolve(false);
              return;
            }
          }
        } catch {
          // Ignore errors and continue
        }
        requestAnimationFrame(rafFunc);
      };
      requestAnimationFrame(rafFunc);
    });
  },

  /**
   * wait for the function result within timeout duration
   * @param func the function to wait for
   * @param timeout the timeout
   * @returns the function run result
   */
  async waitResult<T>(func: () => Promise<T>, timeout: number = 5000): Promise<T> {
    if (timeout <= 0) {
      return await func();
    }
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`timeout after ${timeout}ms`));
      }, timeout);
      func().then((result) => {
        clearTimeout(timeoutId);
        return resolve(result);
      }).catch((error) => {
        clearTimeout(timeoutId);
        return reject(error);
      });
    });
  }
}
