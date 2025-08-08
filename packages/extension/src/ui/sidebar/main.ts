/**
 * @copyright 2025 Sagi All Rights Reserved.
 * @author: Sagi <sagibrant@163.com>
 * @license Apache-2.0
 * @file main.ts
 * @description 
 * Entry point for Sidebar component
 * Initializes and mounts the Vue application
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

import { createApp } from 'vue';
import Sidebar from './Sidebar.vue';
import { SidebarDispatcher } from './SidebarDispatcher';
import { SidebarHandler } from './SidebarHandler';
import { StepEngine } from './StepEngine';
import { SettingUtils } from '@/common/Settings';

// Create and mount the Vue application
const app = createApp(Sidebar);
app.mount('#app');

await SettingUtils.init();
const dispatcher = new SidebarDispatcher();
const handler = new SidebarHandler();
dispatcher.addHandler(handler);
const engine = new StepEngine(dispatcher, );
(window as any).engine = engine;
// handler.on('objectInspected')
// handler.on('stepRecorded')
dispatcher.init(handler);

// Log initialization for debugging
console.log('Sidebar component initialized');
