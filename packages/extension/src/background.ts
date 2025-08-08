/**
 * background.ts
 * init the extension background
 * @author: Zhang Jie
 */
import { BrowserUtils } from "./common/Common";
import { BackgroundDispatcher } from "./background/BackgroundDispatcher";
import { Agent } from "./background/aos/Agent";
import { ChromeExtensionAPI } from "./background/api/ChromeExtensionAPI";
import { ChromiumExtensionAPI } from "./background/api/ChromiumExtensionAPI";
import { EdgeExtensionAPI } from "./background/api/EdgeExtensionAPI";
import { FirefoxWebExtensionAPI } from "./background/api/FirefoxWebExtensionAPI";
import { SafariWebExtensionAPI } from "./background/api/SafariWebExtensionAPI";
import { SettingUtils } from "./common/Settings";

const timestamp = () => new Date().toISOString().replace(/T/, '-').replace(/:/g, '-').split('.')[0] + '-' + Date.now() % 1000;
console.debug(`${timestamp()} background:: start`);

await SettingUtils.init();
const dispatcher = new BackgroundDispatcher();
const browserInfo = BrowserUtils.getBrowserInfo();
type BrowserAPI = ChromiumExtensionAPI | ChromeExtensionAPI | EdgeExtensionAPI | FirefoxWebExtensionAPI | SafariWebExtensionAPI;
const createBrowserAPIFunc = (browserName: string) => {
  switch (browserName) {
    case 'chrome':
      return new ChromeExtensionAPI();
    case 'edge':
      return new EdgeExtensionAPI();
    case 'firefox':
      return new FirefoxWebExtensionAPI();
    case 'safari':
      return new SafariWebExtensionAPI();
    default:
      console.error(`unexpected browser type ${browserName}, rollback to ChromiumExtensionAPI`);
      return new ChromiumExtensionAPI();
  }
}
const browserAPI = createBrowserAPIFunc(browserInfo.name);
const agent = new Agent(browserAPI);
dispatcher.addHandler(agent);
agent.on('browserCreated', ({ browser }) => {
  dispatcher.addHandler(browser);

  browser.on('tabCreated', ({ tab }) => {
    dispatcher.addHandler(tab);
  });
  browser.on('tabRemoved', ({ tab }) => {
    dispatcher.removeHandler(tab);
  });

  browser.on('windowCreated', ({ window }) => {
    dispatcher.addHandler(window);
  });
  browser.on('windowRemoved', ({ window }) => {
    dispatcher.removeHandler(window);
  });

  browser.init();
});
await agent.init();
await dispatcher.init();

// extend self type for TypeScript requirements
declare global {
  interface ServiceWorkerGlobalScope {
    gogogo: {
      dispatcher: BackgroundDispatcher,
      browserAPI: BrowserAPI,
      agent: Agent,
    };
  }
}
// 关键：通过类型断言明确 self 的类型
const swSelf = self as unknown as ServiceWorkerGlobalScope & typeof globalThis;
// add globalData to self as Service Worker's global object
swSelf.gogogo = {
  dispatcher: dispatcher,
  browserAPI: browserAPI,
  agent: agent
};

console.debug(`${timestamp()} background:: end`);

export { };