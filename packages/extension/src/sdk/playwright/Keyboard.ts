/**
 * @copyright 2025 Sagi All Rights Reserved.
 * @author: Sagi <sagibrant@163.com>
 * @license Apache-2.0
 * @file Keyboard.ts
 * @description 
 * Class for Keyboard which implement the playwright types
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
import { Logger } from "@/common/Logger";
import * as api from "@/types/playwright/types";

export class Keyboard implements api.Keyboard {
  protected readonly logger: Logger;
  constructor() {
    const prefix = Utils.isEmpty(this.constructor?.name) ? "Keyboard" : this.constructor?.name;
    this.logger = new Logger(prefix);
  }

  /** ==================================================================================================================== */
  /** ====================================================== methods ===================================================== */
  /** ==================================================================================================================== */

  async down(key: string): Promise<void> {
    throw new Error("Method not implemented.");
  }
  async insertText(text: string): Promise<void> {
    throw new Error("Method not implemented.");
  }
  async press(key: string, options?: { delay?: number; }): Promise<void> {
    throw new Error("Method not implemented.");
  }
  async type(text: string, options?: { delay?: number; }): Promise<void> {
    throw new Error("Method not implemented.");
  }
  async up(key: string): Promise<void> {
    throw new Error("Method not implemented.");
  }

}