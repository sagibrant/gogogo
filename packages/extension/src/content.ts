
import { SettingUtils } from "./common/Settings";
import { Frame } from "./content/aos/Frame";
import { ContentDispatcher } from "./content/ContentDispatcher";

const timestamp = () => new Date().toISOString().replace(/T/, '-').replace(/:/g, '-').split('.')[0] + '-' + Date.now() % 1000;
console.debug(`${timestamp()} content:: start`);

await SettingUtils.init();
const frame = new Frame();
const dispatcher = new ContentDispatcher();
dispatcher.addHandler(frame);
await dispatcher.init();

declare global {
  interface Window {
    gogogo: {
      frame: Frame;
      dispatcher: ContentDispatcher;
    };
  }
}

window.gogogo = {
  frame: frame,
  dispatcher: dispatcher
};

console.debug(`${timestamp()} content:: end`);