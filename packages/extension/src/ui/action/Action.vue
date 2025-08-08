<template>
  <div class="action-container">
    <button 
      class="menu-item" 
      @click="openMarket"
    >
      <i class="icon market-icon"></i>
      <span>{{ t('market') }}</span>
    </button>
    
    <button 
      class="menu-item" 
      @click="openSidebar"
    >
      <i class="icon sidebar-icon"></i>
      <span>{{ t('sidebar') }}</span>
    </button>
    
    <button 
      class="menu-item" 
      :class="{ 'recording': isRecording }"
      @click="toggleRecording"
    >
      <i class="icon" :class="{ 'record-icon': !isRecording, 'stop-icon': isRecording }"></i>
      <span>{{ isRecording ? t('stop') : t('start') }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';

// State with proper typing
const isRecording = ref(false);

// Cleanup function for storage listener
let storageChangeListener: (changes: { [key: string]: chrome.storage.StorageChange }, areaName: string) => void;

// Fixed translation function with proper typing
const t = (key: string): string => {
  return chrome.i18n.getMessage(key) || key; // Fallback to key if message not found
};

// Initialize component
onMounted(() => {
  // Load initial state from storage
  chrome.storage.local.get(['isRecording', 'marketUrl']).then((result) => {
    isRecording.value = result.isRecording || false;
  });

  // Setup storage change listener
  storageChangeListener = (changes, areaName) => {
    if (areaName === 'local' && 'isRecording' in changes) {
      isRecording.value = changes.isRecording.newValue;
    }
  };
  
  chrome.storage.onChanged.addListener(storageChangeListener);
});

// Cleanup on component unmount
onUnmounted(() => {
  if (storageChangeListener) {
    chrome.storage.onChanged.removeListener(storageChangeListener);
  }
});

/**
 * Open the market URL in a new tab using direct Chrome API
 */
const openMarket = async (): Promise<void> => {
  try {
    const result = await chrome.storage.local.get('marketUrl');
    const marketUrl = result.marketUrl || 'https://example.com/market'; // Default URL
    
    if (marketUrl) {
      await chrome.tabs.create({ url: marketUrl });
    } else {
      showError(t('marketUrlNotConfigured'));
    }
  } catch (error) {
    console.error('Error opening market:', error);
    showError(t('failedToOpenMarket'));
  }
};

/**
 * Open sidebar panel for current active tab
 */
const openSidebar = async (): Promise<void> => {
  try {
    if (!chrome.sidePanel && typeof browser !== 'undefined' && browser.sidebarAction) {
      // Fallback for browsers that don't support sidePanel API
      await browser.sidebarAction.open();
      return;
    }
    // Get current active tab
    const [currentTab] = await chrome.tabs.query({
      active: true,
      lastFocusedWindow: true
    });

    if (currentTab?.id) {
      // Open side panel for current tab
      await chrome.sidePanel.open({ tabId: currentTab.id });
    } else {
      showError(t('noActiveTab'));
    }
  } catch (error) {
    console.error('Error opening sidebar:', error);
    showError(t('failedToOpenSidebar'));
  }
};

/**
 * Toggle recording state and update storage
 */
const toggleRecording = async (): Promise<void> => {
  try {
    const newState = !isRecording.value;
    // Update storage with new state
    await chrome.storage.local.set({ isRecording: newState });
    // Local state will be updated via storage change listener
    showNotification(newState ? t('recordingStarted') : t('recordingStopped'));
  } catch (error) {
    console.error('Error toggling recording:', error);
    showError(t('failedToToggleRecording'));
  }
};

/**
 * Show error notification
 */
const showError = (message: string): void => {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: chrome.runtime.getURL('assets/icons/icon_color_48x48.png'),
    title: t('error'),
    message,
    priority: 2
  });
};

/**
 * Show success notification
 */
const showNotification = (message: string): void => {
  chrome.notifications.create({
    type: 'basic',
    // iconUrl: '../../assets/icons/icon_color_48x48.png',
    iconUrl: chrome.runtime.getURL('assets/icons/icon_color_48x48.png'),
    title: t('gogogo'),
    message,
    priority: 2
  });
};
</script>

<style scoped>
/* Menu/list inspired design for Chrome extension popup */
.action-container {
  display: flex;
  flex-direction: column;
  width: 150px;
  background-color: var(--chrome-bg-color, #ffffff);
  color: var(--chrome-text-color, #333333);
}

/* Menu item styling inspired by Vuetify lists */
.menu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 20px;
  width: 100%;
  border: none;
  background: transparent;
  color: inherit;
  font-size: 13px;
  text-align: left;
  cursor: pointer;
  transition: all 0.15s ease;
}

/* Hover state - subtle highlight */
.menu-item:hover {
  background-color: var(--chrome-hover-color, #f0f0f0);
}

/* Active/click state animation */
.menu-item:active {
  background-color: var(--chrome-active-color, #e0e0e0);
  transform: scale(0.99);
  transition: all 0.05s ease;
}

/* Recording state styling */
.menu-item.recording {
  color: #d32f2f;
}

.menu-item.recording:hover {
  background-color: rgba(211, 47, 47, 0.1);
}

.menu-item.recording:active {
  background-color: rgba(211, 47, 47, 0.2);
}

/* Icon styling */
.icon {
  display: inline-block;
  width: 20px;
  text-align: center;
  font-size: 16px;
  font-style: normal;
}

.market-icon::before {
  content: '📑';
}

.sidebar-icon::before {
  content: '📄';
}

.record-icon::before {
  content: '📖';
}

.stop-icon::before {
  content: '🗞';
}

/* Theme adaptation for Chrome */
@media (prefers-color-scheme: dark) {
  .action-container {
    --chrome-bg-color: #2d2d2d;
    --chrome-text-color: #f0f0f0;
    --chrome-hover-color: #3d3d3d;
    --chrome-active-color: #4a4a4a;
  }
}
</style>
    