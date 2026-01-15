import { useState, useEffect } from 'react';
import { BrowserUtils, Utils, SettingUtils } from "@gogogo/shared";
import { ThemeProvider } from '../components/theme-provider';
import { Command, CommandList, CommandItem } from '../components/ui/command';

interface AppProps {
}

export default function App({}: AppProps) {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isRecordSupported, _setIsRecordSupported] = useState<boolean>(false);
  const [isStoreSupported, _setIsStoreSupported] = useState<boolean>(false);

  const t = (key: string): string => {
    return chrome.i18n.getMessage(key) || key;
  };

  useEffect(() => {
    chrome.storage.local.get(['isRecording']).then((result) => {
      setIsRecording(result.isRecording as boolean || false);
    });

    const storageChangeListener = (changes: { [key: string]: chrome.storage.StorageChange }, areaName: string) => {
      if (areaName === 'local' && 'isRecording' in changes) {
        setIsRecording(changes.isRecording.newValue as boolean);
      }
    };

    chrome.storage.onChanged.addListener(storageChangeListener);

    return () => {
      chrome.storage.onChanged.removeListener(storageChangeListener);
    };
  }, []);

  const openStore = async (): Promise<void> => {
    try {
      if (!isStoreSupported) {
        return;
      }
      const result = SettingUtils.getSettings();
      if (result && result.storeURL) {
        await chrome.tabs.create({ url: result.storeURL });
      } else {
        showError(t('action_error_storeURLNotConfigured'));
      }
    } catch (error) {
      console.error('Error opening store:', error);
      showError(t('action_error_failedToOpenStore'));
    }
  };

  const openSidebar = async (): Promise<void> => {
    try {
      if (!chrome.sidePanel && typeof browser !== 'undefined' && browser.sidebarAction) {
        await browser.sidebarAction.open();
        return;
      }
      const [currentTab] = await chrome.tabs.query({
        active: true,
        lastFocusedWindow: true
      });

      if (currentTab?.id) {
        await chrome.sidePanel.open({ tabId: currentTab.id });
      } else {
        throw new Error('The current tab id is missing.');
      }
    } catch (error) {
      console.error('Error opening sidebar:', error);
      showError(t('action_error_failedToOpenSidebar'));
    }
  };

  const openOptions = async (): Promise<void> => {
    try {
      const browserInfo = BrowserUtils.getBrowserInfo();
      const prefix = browserInfo.name === 'edge' ? 'extension' : 'chrome-extension';
      const url = `${prefix}://${chrome.runtime.id}/ui/options/index.html`;
      await chrome.tabs.create({ url: url });
    } catch (error) {
      console.error('Error opening options:', error);
      showError(t('action_error_failedToOpenOptions'));
    }
  };

  const toggleRecording = async (): Promise<void> => {
    try {
      if (!isRecordSupported) {
        showError(t('action_error_recordingNotSupported'));
        return;
      }
      const newState = !isRecording;
      await chrome.storage.local.set({ isRecording: newState });
      showNotification(newState ? t('action_notification_recordingStarted') : t('action_notification_recordingStopped'));
      if (newState) {
        await Utils.wait(2000);
        showError(t('action_error_recordingNotSupported'));
      }
    } catch (error) {
      console.error('Error toggling recording:', error);
      showError(t('action_error_failedToToggleRecording'));
    }
  };

  const showError = (message: string): void => {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: chrome.runtime.getURL('assets/icons/icon_48x48.png'),
      title: t('action_error'),
      message,
      priority: 2
    });
  };

  const showNotification = (message: string): void => {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: chrome.runtime.getURL('assets/icons/icon_48x48.png'),
      title: t('action_notification'),
      message,
      priority: 2
    });
  };

  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <Command className="action-container">
        <CommandList>
          <CommandItem onSelect={openStore} disabled={!isStoreSupported}>
            <i className="icon store-icon"></i>
            <span>{t('action_btn_label_store')}</span>
          </CommandItem>
          <CommandItem onSelect={openSidebar}>
            <i className="icon sidebar-icon"></i>
            <span>{t('action_btn_label_sidebar')}</span>
          </CommandItem>
          <CommandItem onSelect={openOptions}>
            <i className="icon options-icon"></i>
            <span>{t('action_btn_label_options')}</span>
          </CommandItem>
          <CommandItem
            className={isRecording ? 'recording' : ''}
            disabled={!isRecordSupported}
            onSelect={toggleRecording}
            hidden={true}
          >
            <i className={`icon ${!isRecording ? 'record-icon' : 'stop-icon'}`}></i>
            <span>{isRecording ? t('action_btn_label_stop') : t('action_btn_label_record')}</span>
          </CommandItem>
        </CommandList>
      </Command>
    </ThemeProvider>
  );
};
