/**
 * @copyright 2025 Sagi All Rights Reserved.
 * @author: Sagi <sagibrant@163.com>
 * @license Apache-2.0
 * @file Settings.ts
 * @description 
 * Shared utility classes for settings
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

export interface Settings {
  marketUrl: string;
  accessKey: string;
  logLevel: 'TRACE' | 'DEBUG' | 'LOG' | 'INFO' | 'WARN' | 'ERROR';
  objectIdentificationSettings: string;
  replaySettings: string;
  recordSettings: string;
}

export class SettingUtils {

  private static settings: Settings = {
    marketUrl: '',
    accessKey: '',
    logLevel: 'WARN',
    objectIdentificationSettings: '',
    replaySettings: '',
    recordSettings: ''
  };

  static async init(): Promise<void> {
    try {
      chrome.storage.onChanged.addListener((changes, areaName) => {
        if (areaName === 'local') {
          for (const key in SettingUtils.settings) {
            if (key in changes) {
              const settingKey = key as keyof Settings;
              SettingUtils.settings[settingKey] = changes[settingKey].newValue;
            }
          }
        }
      });;
      await SettingUtils.load();
    } catch (error) {
      console.error('Error init the settings:', error);
    }
  }

  static async load(): Promise<Settings | undefined> {
    try {
      const result = await chrome.storage.local.get([
        'marketUrl',
        'accessKey',
        'logLevel',
        'objectIdentificationSettings',
        'replaySettings',
        'recordSettings'
      ]);

      // Merge loaded settings with defaults
      SettingUtils.settings = {
        marketUrl: result.marketUrl || SettingUtils.settings.marketUrl,
        accessKey: result.accessKey || SettingUtils.settings.accessKey,
        logLevel: (result.logLevel as 'TRACE' | 'DEBUG' | 'LOG' | 'INFO' | 'WARN' | 'ERROR') || SettingUtils.settings.logLevel,
        objectIdentificationSettings: result.objectIdentificationSettings || SettingUtils.settings.objectIdentificationSettings,
        replaySettings: result.replaySettings || SettingUtils.settings.replaySettings,
        recordSettings: result.recordSettings || SettingUtils.settings.recordSettings
      };
    } catch (error) {
      console.error('Error loading settings:', error);
    }
    finally {
      return SettingUtils.settings;
    }
  }

  static async save(settings?: Settings): Promise<Settings | undefined> {
    try {
      settings = settings || SettingUtils.settings;
      await chrome.storage.local.set({
        marketUrl: settings.marketUrl,
        accessKey: settings.accessKey,
        logLevel: settings.logLevel,
        objectIdentificationSettings: settings.objectIdentificationSettings,
        replaySettings: settings.replaySettings,
        recordSettings: settings.recordSettings
      });
      SettingUtils.settings = settings;
    } catch (error) {
      console.error('Error loading settings:', error);
    }
    finally {
      return SettingUtils.settings;
    }
  }

  static getSettings(): Settings {
    return SettingUtils.settings;
  }

  static getMarketUrl(): string {
    return SettingUtils.settings.marketUrl;
  }

  static getAccessKey(): string {
    return SettingUtils.settings.accessKey;
  }

  static getLogLevel(): string {
    return SettingUtils.settings.logLevel;
  }

  static getObjectIdentificationSettings(): object {
    return {};
  }

  static getReplaySettings(): object {
    return {};
  }

  static getRecordSettings(): object {
    return {};
  }
}