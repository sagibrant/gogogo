<template>
  <div class="settings-container">
    <h1>{{ t('automationSettings') }}</h1>

    <form @submit.prevent="saveSettings">
      <!-- Market URL Field -->
      <div class="settings-group">
        <label class="setting-label" for="marketUrl">{{ t('marketUrl') }}</label>
        <div class="input-container">
          <input id="marketUrl" v-model="settings.marketUrl" type="url" class="setting-input"
            placeholder="https://example.com/market">
        </div>
      </div>

      <!-- Access Key Field -->
      <div class="settings-group">
        <label class="setting-label" for="accessKey">{{ t('accessKey') }}</label>
        <div class="input-container">
          <input id="accessKey" v-model="settings.accessKey" type="text" class="setting-input"
            placeholder="eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsIng1dCI6Imk2...">
        </div>
      </div>

      <!-- Log Level Select -->
      <div class="settings-group">
        <label class="setting-label" for="logLevel">{{ t('logLevel') }}</label>
        <div class="select-container">
          <select id="logLevel" v-model="settings.logLevel" class="setting-select">
            <option value="TRACE">TRACE</option>
            <option value="DEBUG">DEBUG</option>
            <option value="LOG">LOG</option>
            <option value="INFO">INFO</option>
            <option value="WARN">WARN</option>
            <option value="ERROR">ERROR</option>
          </select>
          <div class="select-arrow"></div>
        </div>
      </div>

      <!-- Object Identification Settings -->
      <div class="settings-group">
        <label class="setting-label" for="objectIdentificationSettings">
          {{ t('objectIdentificationSettings') }}
        </label>
        <div class="textarea-container">
          <textarea id="objectIdentificationSettings" v-model="settings.objectIdentificationSettings"
            class="setting-textarea" rows="5" :placeholder="t('jsonPlaceholder')"></textarea>
        </div>
      </div>

      <!-- Replay Settings -->
      <div class="settings-group">
        <label class="setting-label" for="replaySettings">
          {{ t('replaySettings') }}
        </label>
        <div class="textarea-container">
          <textarea id="replaySettings" v-model="settings.replaySettings" class="setting-textarea" rows="5"
            :placeholder="t('jsonPlaceholder')"></textarea>
        </div>
      </div>

      <!-- Record Settings -->
      <div class="settings-group">
        <label class="setting-label" for="recordSettings">
          {{ t('recordSettings') }}
        </label>
        <div class="textarea-container">
          <textarea id="recordSettings" v-model="settings.recordSettings" class="setting-textarea" rows="5"
            :placeholder="t('jsonPlaceholder')"></textarea>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="settings-actions">
        <button type="submit" class="btn btn-primary">{{ t('apply') }}</button>
        <button type="button" class="btn btn-secondary" @click="resetSettings">
          {{ t('reset') }}
        </button>
      </div>
    </form>

    <!-- Notification Snackbar -->
    <div class="snackbar" :class="{
      'snackbar-visible': notification.visible,
      'snackbar-success': notification.type === 'success',
      'snackbar-error': notification.type === 'error',
      'snackbar-info': notification.type === 'info'
    }">
      {{ notification.message }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Settings, SettingUtils } from '../../common/Settings'

// Define notification interface
interface Notification {
  visible: boolean;
  message: string;
  type: 'success' | 'error' | 'info';
}

// State
const settings = ref<Settings>({
  marketUrl: '',
  accessKey: '',
  logLevel: 'ERROR',
  objectIdentificationSettings: '{}',
  replaySettings: '{}',
  recordSettings: '{}'
});

// Store original settings for reset functionality
const originalSettings = ref<Settings>({ ...settings.value });

// Notification state
const notification = ref<Notification>({
  visible: false,
  message: '',
  type: 'info'
});

// Translation function
const t = (key: string): string => {
  return chrome.i18n.getMessage(key) || key; // Fallback to key if message not found
};

// Initialize component
onMounted(() => {
  // Initialize theme based on system preferences
  updateTheme();

  // Setup theme change listener
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  mediaQuery.addEventListener('change', updateTheme);

  // Load settings
  loadSettings();
});

/**
 * Update theme class based on system preference
 */
const updateTheme = () => {
  document.documentElement.classList.toggle('dark-theme',
    window.matchMedia('(prefers-color-scheme: dark)').matches);
};

/**
 * Load settings directly from chrome.storage.local
 */
const loadSettings = async (): Promise<void> => {
  try {
    const result = await SettingUtils.load();
    if (!result) {
      throw new Error('fail to load settings by calling SettingUtils.load');
    }
    settings.value = result;
    originalSettings.value = { ...settings.value };
  } catch (error) {
    console.error('Error loading settings:', error);
    showNotification(t('failedToLoadSettings'), 'error');
  }
};

/**
 * Save settings directly to chrome.storage.local
 */
const saveSettings = async (): Promise<void> => {
  try {
    // Validate JSON fields
    if (!validateJson(settings.value.objectIdentificationSettings)) {
      showNotification(t('invalidJsonObject'), 'error');
      return;
    }

    if (!validateJson(settings.value.replaySettings)) {
      showNotification(t('invalidJsonReplay'), 'error');
      return;
    }

    if (!validateJson(settings.value.recordSettings)) {
      showNotification(t('invalidJsonRecord'), 'error');
      return;
    }

    const result = await SettingUtils.save(settings.value);
    if (!result) {
      throw new Error('fail to save settings by calling SettingUtils.save');
    }
    originalSettings.value = { ...settings.value };
    showNotification(t('settingsSavedSuccessfully'), 'success');
  } catch (error) {
    console.error('Error saving settings:', error);
    showNotification(t('failedToSaveSettings'), 'error');
  }
};

/**
 * Reset settings to original values
 */
const resetSettings = (): void => {
  settings.value = { ...originalSettings.value };
  showNotification(t('settingsReset'), 'info');
};

/**
 * Validate JSON string
 */
const validateJson = (jsonString: string): boolean => {
  try {
    if (!jsonString.trim()) return true; // Allow empty
    JSON.parse(jsonString);
    return true;
  } catch (e) {
    return false;
  }
};

/**
 * Show notification using snackbar
 */
const showNotification = (message: string, type: 'success' | 'error' | 'info'): void => {
  notification.value = {
    visible: true,
    message,
    type
  };

  // Hide after 3 seconds
  setTimeout(() => {
    notification.value.visible = false;
  }, 3000);
};
</script>

<style scoped>
/* Base styles with theme variables */
.settings-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
  background-color: var(--background-color, #ffffff);
  color: var(--text-color, #333333);
  transition: background-color 0.3s, color 0.3s;
}

h1 {
  color: var(--primary-color, #6200ee);
  border-bottom: 1px solid var(--border-color, #e0e0e0);
  padding-bottom: 1rem;
  margin-bottom: 2rem;
  font-size: 1.5rem;
  font-weight: 500;
}

.settings-group {
  margin-bottom: 1.5rem;
}

.setting-label {
  display: block;
  margin-bottom: 0.5rem;
  color: var(--secondary-text-color, #555555);
  font-size: 0.9rem;
  font-weight: 500;
}

/* Input styles */
.input-container,
.select-container,
.textarea-container {
  position: relative;
}

.setting-input,
.setting-select,
.setting-textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--border-color, #ddd);
  border-radius: 4px;
  font-size: 1rem;
  background-color: var(--input-background, #ffffff);
  color: var(--text-color, #333);
  transition: border-color 0.2s, box-shadow 0.2s;
  box-sizing: border-box;
}

.setting-input:focus,
.setting-select:focus,
.setting-textarea:focus {
  outline: none;
  border-color: var(--primary-color, #6200ee);
  box-shadow: 0 0 0 2px rgba(98, 0, 238, 0.2);
}

.setting-textarea {
  font-family: monospace;
  resize: vertical;
  min-height: 100px;
}

/* Select styles */
.setting-select {
  appearance: none;
  padding-right: 2.5rem;
}

.select-arrow {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  width: 0;
  height: 0;
  border-left: 5px solid transparent;
  border-right: 5px solid transparent;
  border-top: 5px solid var(--text-color, #333);
}

/* Button styles */
.settings-actions {
  margin-top: 2rem;
  display: flex;
  gap: 1rem;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s, transform 0.1s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.btn:active {
  transform: scale(0.98);
}

.btn-primary {
  background-color: var(--primary-color, #6200ee);
  color: white;
}

.btn-primary:hover {
  background-color: #5000d1;
}

.btn-secondary {
  background-color: var(--secondary-background, #f5f5f5);
  color: var(--text-color, #333);
}

.btn-secondary:hover {
  background-color: var(--secondary-hover, #e0e0e0);
}

/* Snackbar notification */
.snackbar {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%) translateY(100px);
  padding: 1rem 1.5rem;
  border-radius: 4px;
  color: white;
  z-index: 1000;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.2);
  transition: transform 0.3s, opacity 0.3s;
  opacity: 0;
  font-size: 0.9rem;
}

.snackbar-visible {
  transform: translateX(-50%) translateY(0);
  opacity: 1;
}

.snackbar-success {
  background-color: #4caf50;
}

.snackbar-error {
  background-color: #f44336;
}

.snackbar-info {
  background-color: #2196f3;
}

/* Dark theme adaptations */
:global(.dark-theme) .settings-container {
  --background-color: #121212;
  --text-color: #ffffff;
  --secondary-text-color: #bbbbbb;
  --border-color: #333333;
  --input-background: #1e1e1e;
  --secondary-background: #333333;
  --secondary-hover: #444444;
  --primary-color: #bb86fc;
}
</style>