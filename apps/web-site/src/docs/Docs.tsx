import React, { useEffect, useMemo, useState } from 'react';

type DocItem = {
  slug: string;
  title: string;
  Component: () => React.ReactElement;
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section style={{ maxWidth: 960, margin: '0 auto', padding: '2rem 1rem' }}>
    <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>{title}</h1>
    {children}
  </section>
);

const Paragraph = ({ children }: { children: React.ReactNode }) => (
  <p style={{ marginBottom: '1rem', color: '#334155' }}>{children}</p>
);

const List = ({ items }: { items: { name: string; desc: string }[] }) => (
  <ul style={{ listStyle: 'none', padding: 0 }}>
    {items.map(i => (
      <li key={i.name} style={{ marginBottom: '0.75rem' }}>
        <strong>{i.name}</strong>
        <div style={{ color: '#475569' }}>{i.desc}</div>
      </li>
    ))}
  </ul>
);

const LocatorDoc = () => (
  <Section title="Locator">
    <Paragraph>Locators find automation objects and provide auto-wait semantics.</Paragraph>
    <List
      items={[
        { name: 'filter(options)', desc: 'Add mandatory filters to narrow matches.' },
        { name: 'prefer(options)', desc: 'Add assistive filters to prefer matches.' },
        { name: 'get()', desc: 'Waits and returns a single matched object or throws.' },
        { name: 'count()', desc: 'Returns number of matched objects.' },
        { name: 'all()', desc: 'Returns locators for each match.' },
        { name: 'nth(index)', desc: 'Returns a locator pointing at index.' },
        { name: 'first()', desc: 'Alias of nth(0).' },
        { name: 'last()', desc: 'Returns last match.' },
      ]}
    />
    <Paragraph>
      See source: <a href="file:///Users/sagi/Workspace/src/qagogogo/gogogo/packages/browser-sdk/src/locators/Locator.ts">Locator.ts</a>
    </Paragraph>
  </Section>
);

const BrowserLocatorDoc = () => (
  <Section title="BrowserLocator">
    <Paragraph>Top-level entry to the current browser.</Paragraph>
    <List
      items={[
        { name: 'window(options)', desc: 'Returns a WindowLocator.' },
        { name: 'page(options)', desc: 'Returns a PageLocator for last-focused window.' },
        { name: 'windows()', desc: 'All windows.' },
        { name: 'pages()', desc: 'All pages.' },
        { name: 'lastFocusedWindow()', desc: 'Returns the last-focused window.' },
        { name: 'lastActivePage()', desc: 'Returns the last active page.' },
        { name: 'name()', desc: 'Browser name.' },
        { name: 'version()', desc: 'Browser version.' },
        { name: 'majorVersion()', desc: 'Major version.' },
        { name: 'attachDebugger()', desc: 'Attach Chrome DevTools Protocol.' },
        { name: 'detachDebugger()', desc: 'Detach debugger.' },
        { name: 'setDefaultTimeout(ms)', desc: 'Set default action timeout.' },
        { name: 'cookies(urls)', desc: 'Get cookies.' },
        { name: 'addCookies(cookies)', desc: 'Add cookies.' },
        { name: 'clearCookies(options)', desc: 'Clear cookies by filters.' },
        { name: 'openNewWindow(url)', desc: 'Open a new window.' },
        { name: 'openNewPage(url)', desc: 'Open a new tab/page.' },
        { name: 'close()', desc: 'Close browser automation session.' },
      ]}
    />
    <Paragraph>
      See source: <a href="file:///Users/sagi/Workspace/src/qagogogo/gogogo/packages/browser-sdk/src/locators/BrowserLocator.ts">BrowserLocator.ts</a>
    </Paragraph>
  </Section>
);

const PageLocatorDoc = () => (
  <Section title="PageLocator">
    <Paragraph>Locates tabs/pages and exposes page-scoped helpers.</Paragraph>
    <List
      items={[
        { name: 'frame(selector)', desc: 'Returns FrameLocator by CSS selector.' },
        { name: 'element(selector)', desc: 'Returns ElementLocator by CSS/XPath.' },
        { name: 'text(selector)', desc: 'Returns TextLocator by text or RegExp.' },
        { name: 'window()', desc: 'Owning window.' },
        { name: 'mainFrame()', desc: 'Main frame.' },
        { name: 'frames()', desc: 'All frames.' },
        { name: 'mouse()', desc: 'Mouse helper.' },
        { name: 'keyboard()', desc: 'Keyboard helper.' },
        { name: 'dialog()', desc: 'Dialog helper.' },
        { name: 'url()', desc: 'Page URL.' },
        { name: 'title()', desc: 'Page title.' },
        { name: 'content()', desc: 'Serialized HTML content.' },
        { name: 'status()', desc: 'Loading status.' },
        { name: 'active()', desc: 'Is active.' },
        { name: 'closed()', desc: 'Is closed.' },
        { name: 'activate()', desc: 'Activate the tab.' },
        { name: 'bringToFront()', desc: 'Focus window and activate tab.' },
        { name: 'sync(timeout)', desc: 'Wait until load complete.' },
        { name: 'openNewPage(url)', desc: 'Open a new page.' },
        { name: 'navigate(url)', desc: 'Navigate URL.' },
        { name: 'refresh(bypassCache)', desc: 'Reload.' },
        { name: 'back()', desc: 'Go back.' },
        { name: 'forward()', desc: 'Go forward.' },
        { name: 'close()', desc: 'Close page.' },
        { name: 'zoom(factor)', desc: 'Zoom the page.' },
        { name: 'moveToWindow(window,index)', desc: 'Move tab to window.' },
        { name: 'captureScreenshot()', desc: 'Screenshot as base64.' },
        { name: 'executeScript(fn,args)', desc: 'Execute JS in page.' },
        { name: 'querySelectorAll(selector)', desc: 'Elements in main frame.' },
      ]}
    />
    <Paragraph>
      See source: <a href="file:///Users/sagi/Workspace/src/qagogogo/gogogo/packages/browser-sdk/src/locators/PageLocator.ts">PageLocator.ts</a>
    </Paragraph>
  </Section>
);

const ElementLocatorDoc = () => (
  <Section title="ElementLocator">
    <Paragraph>Locates DOM elements and exposes element actions.</Paragraph>
    <List
      items={[
        { name: 'element(selector)', desc: 'Chain element locating.' },
        { name: 'text(selector)', desc: 'Chain text locating.' },
        { name: 'ownerFrame()', desc: 'Owning frame.' },
        { name: 'contentFrame()', desc: 'Frame inside element.' },
        { name: 'nodeName()', desc: 'Node name.' },
        { name: 'nodeType()', desc: 'Node type.' },
        { name: 'nodeValue()', desc: 'Node value.' },
        { name: 'isConnected()', desc: 'Connected to DOM.' },
        { name: 'textContent()', desc: 'Text content.' },
        { name: 'tagName()', desc: 'Tag name.' },
        { name: 'id()', desc: 'Element id.' },
        { name: 'innerHTML()', desc: 'Inner HTML.' },
        { name: 'outerHTML()', desc: 'Outer HTML.' },
        { name: 'innerText()', desc: 'Inner text.' },
        { name: 'outerText()', desc: 'Outer text.' },
        { name: 'title()', desc: 'Title attribute.' },
        { name: 'accessKey()', desc: 'Access key.' },
        { name: 'hidden()', desc: 'Hidden state.' },
        { name: 'name()', desc: 'Name attribute.' },
        { name: 'value()', desc: 'Value.' },
        { name: 'type()', desc: 'Input type.' },
        { name: 'alt()', desc: 'Alt text.' },
        { name: 'accept()', desc: 'Accept attribute.' },
        { name: 'placeholder()', desc: 'Placeholder.' },
        { name: 'src()', desc: 'Image src.' },
        { name: 'disabled()', desc: 'Disabled.' },
        { name: 'readOnly()', desc: 'Read only.' },
        { name: 'required()', desc: 'Required.' },
        { name: 'checked()', desc: 'Checked.' },
        { name: 'label()', desc: 'Form label.' },
        { name: 'selected()', desc: 'Selected state.' },
        { name: 'multiple()', desc: 'Multiple select.' },
        { name: 'options()', desc: 'Select options.' },
        { name: 'selectedIndex()', desc: 'Selected index.' },
        { name: 'selectedOptions()', desc: 'Selected options.' },
        { name: 'visible()', desc: 'Visibility.' },
        { name: 'boundingBox()', desc: 'Bounding box.' },
        { name: 'highlight()', desc: 'Highlight element.' },
        { name: 'getProperty(name)', desc: 'Get property.' },
        { name: 'setProperty(name,value)', desc: 'Set property.' },
        { name: 'getAttribute(name)', desc: 'Get attribute.' },
        { name: 'getAttributes()', desc: 'All attributes.' },
        { name: 'setAttribute(name,value)', desc: 'Set attribute.' },
        { name: 'hasAttribute(name)', desc: 'Has attribute.' },
        { name: 'toggleAttribute(name,force)', desc: 'Toggle attribute.' },
        { name: 'querySelectorAll(selector)', desc: 'Query inside element.' },
        { name: 'getBoundingClientRect()', desc: 'Client rect.' },
        { name: 'checkValidity()', desc: 'Form validity.' },
        { name: 'checkVisibility(options)', desc: 'Visibility checks.' },
        { name: 'focus()', desc: 'Focus.' },
        { name: 'blur()', desc: 'Blur.' },
        { name: 'scrollIntoViewIfNeeded()', desc: 'Scroll into view.' },
        { name: 'check(options)', desc: 'Check checkbox.' },
        { name: 'uncheck(options)', desc: 'Uncheck checkbox.' },
        { name: 'selectOption(values)', desc: 'Select option(s).' },
        { name: 'setFileInputFiles(files)', desc: 'Upload files.' },
        { name: 'dispatchEvent(type,options)', desc: 'Dispatch event.' },
        { name: 'sendCDPCommand(method,params)', desc: 'Send CDP command.' },
        { name: 'hover(options)', desc: 'Hover.' },
        { name: 'click(options)', desc: 'Click.' },
        { name: 'dblclick(options)', desc: 'Double click.' },
        { name: 'wheel(options)', desc: 'Wheel.' },
        { name: 'dragTo(target,options)', desc: 'Drag to target.' },
        { name: 'tap(options)', desc: 'Tap.' },
        { name: 'fill(text,options)', desc: 'Fill text.' },
        { name: 'clear(options)', desc: 'Clear value.' },
        { name: 'press(keys,options)', desc: 'Press keys.' },
        { name: '$0()', desc: 'Raw JS object proxy.' },
      ]}
    />
    <Paragraph>
      See source: <a href="file:///Users/sagi/Workspace/src/qagogogo/gogogo/packages/browser-sdk/src/locators/ElementLocator.ts">ElementLocator.ts</a>
    </Paragraph>
  </Section>
);

const TextLocatorDoc = () => (
  <Section title="TextLocator">
    <Paragraph>Locates text nodes and exposes text actions.</Paragraph>
    <List
      items={[
        { name: 'ownerFrame()', desc: 'Owning frame.' },
        { name: 'ownerElement()', desc: 'Owning element.' },
        { name: 'nodeName()', desc: 'Node name.' },
        { name: 'nodeType()', desc: 'Node type.' },
        { name: 'nodeValue()', desc: 'Node value.' },
        { name: 'isConnected()', desc: 'Connected to DOM.' },
        { name: 'textContent()', desc: 'Text content.' },
        { name: 'boundingBox()', desc: 'Bounding box.' },
        { name: 'highlight()', desc: 'Highlight.' },
        { name: 'getProperty(name)', desc: 'Get property.' },
        { name: 'setProperty(name,value)', desc: 'Set property.' },
        { name: 'dispatchEvent(type,options)', desc: 'Dispatch event.' },
        { name: 'sendCDPCommand(method,params)', desc: 'Send CDP command.' },
        { name: 'getBoundingClientRect()', desc: 'Client rect.' },
        { name: 'click(options)', desc: 'Click.' },
        { name: 'dblclick(options)', desc: 'Double click.' },
        { name: 'wheel(options)', desc: 'Wheel.' },
        { name: 'dragTo(target,options)', desc: 'Drag to target.' },
        { name: 'hover(options)', desc: 'Hover.' },
        { name: 'tap(options)', desc: 'Tap.' },
        { name: 'fill(text,options)', desc: 'Fill text via owner element.' },
        { name: 'clear(options)', desc: 'Clear text via owner element.' },
        { name: 'press(keys,options)', desc: 'Press keys.' },
      ]}
    />
    <Paragraph>
      See source: <a href="file:///Users/sagi/Workspace/src/qagogogo/gogogo/packages/browser-sdk/src/locators/TextLocator.ts">TextLocator.ts</a>
    </Paragraph>
  </Section>
);

const MouseDoc = () => (
  <Section title="Mouse">
    <Paragraph>Low-level mouse automation bound to a page.</Paragraph>
    <List
      items={[
        { name: 'click(x,y,options)', desc: 'Click at coordinates.' },
        { name: 'down(options)', desc: 'Press mouse button.' },
        { name: 'up(options)', desc: 'Release mouse button.' },
        { name: 'move(x,y,options)', desc: 'Move pointer.' },
        { name: 'wheel(deltaX,deltaY)', desc: 'Wheel scrolling.' },
      ]}
    />
    <Paragraph>
      See source: <a href="file:///Users/sagi/Workspace/src/qagogogo/gogogo/packages/browser-sdk/src/aos/Mouse.ts">Mouse.ts</a>
    </Paragraph>
  </Section>
);

const KeyboardDoc = () => (
  <Section title="Keyboard">
    <Paragraph>Low-level keyboard automation bound to a page.</Paragraph>
    <List
      items={[
        { name: 'type(text,options)', desc: 'Type text with optional delays.' },
        { name: 'down(key)', desc: 'Key down.' },
        { name: 'up(key)', desc: 'Key up.' },
        { name: 'press(keys,options)', desc: 'Press one or multiple keys.' },
      ]}
    />
    <Paragraph>
      See source: <a href="file:///Users/sagi/Workspace/src/qagogogo/gogogo/packages/browser-sdk/src/aos/Keyboard.ts">Keyboard.ts</a>
    </Paragraph>
  </Section>
);

const DialogDoc = () => (
  <Section title="Dialog">
    <Paragraph>JavaScript dialog automation on a page.</Paragraph>
    <List
      items={[
        { name: 'page()', desc: 'Owning page.' },
        { name: 'opened()', desc: 'Whether a dialog is open.' },
        { name: 'type()', desc: 'Dialog type.' },
        { name: 'defaultValue()', desc: 'Default prompt value.' },
        { name: 'message()', desc: 'Dialog message.' },
        { name: 'accept(promptText?)', desc: 'Accept dialog.' },
        { name: 'dismiss()', desc: 'Dismiss dialog.' },
      ]}
    />
    <Paragraph>
      See source: <a href="file:///Users/sagi/Workspace/src/qagogogo/gogogo/packages/browser-sdk/src/aos/Dialog.ts">Dialog.ts</a>
    </Paragraph>
  </Section>
);

const PageDoc = () => (
  <Section title="Page">
    <Paragraph>Represents a browser tab.</Paragraph>
    <List
      items={[
        { name: 'rtid()', desc: 'Runtime identifier.' },
        { name: 'browser()', desc: 'Owning browser.' },
        { name: 'window()', desc: 'Owning window.' },
        { name: 'frame(selector)', desc: 'Frame locator.' },
        { name: 'element(selector)', desc: 'Element locator.' },
        { name: 'text(selector)', desc: 'Text locator.' },
        { name: 'mouse()', desc: 'Mouse helper.' },
        { name: 'keyboard()', desc: 'Keyboard helper.' },
        { name: 'dialog()', desc: 'Dialog helper.' },
        { name: 'url()', desc: 'Page URL.' },
        { name: 'title()', desc: 'Page title.' },
        { name: 'content()', desc: 'HTML content.' },
        { name: 'status()', desc: 'Loading status.' },
        { name: 'active()', desc: 'Active state.' },
        { name: 'closed()', desc: 'Closed state.' },
        { name: 'activate()', desc: 'Activate.' },
        { name: 'bringToFront()', desc: 'Focus window and activate tab.' },
        { name: 'sync(timeout)', desc: 'Wait until complete.' },
        { name: 'openNewPage(url)', desc: 'Open new tab.' },
        { name: 'navigate(url)', desc: 'Navigate.' },
        { name: 'refresh(bypassCache)', desc: 'Reload.' },
        { name: 'back()', desc: 'Go back.' },
        { name: 'forward()', desc: 'Go forward.' },
        { name: 'close()', desc: 'Close tab.' },
        { name: 'zoom(factor)', desc: 'Zoom.' },
        { name: 'moveToWindow(window,index)', desc: 'Move tab.' },
        { name: 'captureScreenshot()', desc: 'Screenshot.' },
        { name: 'executeScript(fn,args)', desc: 'Execute script.' },
        { name: 'querySelectorAll(selector)', desc: 'Query elements.' },
        { name: 'on(event,listener)', desc: 'Subscribe events.' },
        { name: 'document()', desc: 'JS object proxy.' },
      ]}
    />
    <Paragraph>
      See source: <a href="file:///Users/sagi/Workspace/src/qagogogo/gogogo/packages/browser-sdk/src/aos/Page.ts">Page.ts</a>
    </Paragraph>
  </Section>
);

const WindowDoc = () => (
  <Section title="Window">
    <Paragraph>Represents a browser window.</Paragraph>
    <List
      items={[
        { name: 'rtid()', desc: 'Runtime identifier.' },
        { name: 'browser()', desc: 'Owning browser.' },
        { name: 'page(selector)', desc: 'Page locator.' },
        { name: 'pages()', desc: 'All pages in window.' },
        { name: 'activePage()', desc: 'Active page.' },
        { name: 'state()', desc: 'Window state.' },
        { name: 'focused()', desc: 'Focused state.' },
        { name: 'incognito()', desc: 'Incognito state.' },
        { name: 'closed()', desc: 'Closed state.' },
        { name: 'openNewPage(url)', desc: 'Open a new page.' },
        { name: 'focus()', desc: 'Focus window.' },
        { name: 'close()', desc: 'Close window.' },
        { name: 'minimize()', desc: 'Minimize.' },
        { name: 'maximize()', desc: 'Maximize.' },
        { name: 'restore()', desc: 'Restore.' },
        { name: 'fullscreen(toggle)', desc: 'Toggle fullscreen.' },
        { name: 'on(event,listener)', desc: 'Subscribe events.' },
      ]}
    />
    <Paragraph>
      See source: <a href="file:///Users/sagi/Workspace/src/qagogogo/gogogo/packages/browser-sdk/src/aos/Window.ts">Window.ts</a>
    </Paragraph>
  </Section>
);

const docs: DocItem[] = [
  { slug: 'locator', title: 'Locator', Component: LocatorDoc },
  { slug: 'browser-locator', title: 'BrowserLocator', Component: BrowserLocatorDoc },
  { slug: 'page-locator', title: 'PageLocator', Component: PageLocatorDoc },
  { slug: 'element-locator', title: 'ElementLocator', Component: ElementLocatorDoc },
  { slug: 'text-locator', title: 'TextLocator', Component: TextLocatorDoc },
  { slug: 'page', title: 'Page', Component: PageDoc },
  { slug: 'window', title: 'Window', Component: WindowDoc },
  { slug: 'mouse', title: 'Mouse', Component: MouseDoc },
  { slug: 'keyboard', title: 'Keyboard', Component: KeyboardDoc },
  { slug: 'dialog', title: 'Dialog', Component: DialogDoc },
];

function Docs() {
  const [path, setPath] = useState(window.location.pathname);
  useEffect(() => {
    const onPopState = () => setPath(window.location.pathname);
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const slug = useMemo(() => {
    const parts = path.split('/').filter(Boolean);
    if (parts[0] !== 'docs') return '';
    return parts[1] || '';
  }, [path]);

  const active = docs.find(d => d.slug === slug);

  const navigate = (to: string) => {
    if (to === path) return;
    history.pushState({}, '', to);
    setPath(to);
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', minHeight: 'calc(100vh - 64px)' }}>
      <aside style={{ borderRight: '1px solid #e2e8f0', padding: '1rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>Gogogo API</h3>
        <div style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '0.75rem' }}>Locators</div>
        {docs.filter(d => d.slug.endsWith('locator')).map(d => (
          <div key={d.slug} style={{ marginBottom: '0.5rem' }}>
            <a href={`/docs/${d.slug}`} onClick={(e) => { e.preventDefault(); navigate(`/docs/${d.slug}`); }}>{d.title}</a>
          </div>
        ))}
        <div style={{ fontSize: '0.9rem', color: '#64748b', margin: '0.75rem 0' }}>Objects</div>
        <div style={{ marginBottom: '0.5rem' }}>
          <a href={`/docs/locator`} onClick={(e) => { e.preventDefault(); navigate(`/docs/locator`); }}>Locator</a>
        </div>
      </aside>
      <div>
        {!active && (
          <Section title="Gogogo API Overview">
            <Paragraph>Browse APIs modeled after Playwright-style docs. Use the sidebar to navigate.</Paragraph>
          </Section>
        )}
        {active && <active.Component />}
      </div>
    </div>
  );
}

export default Docs;
