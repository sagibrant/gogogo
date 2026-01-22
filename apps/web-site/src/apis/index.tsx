import { useEffect, useMemo, useState } from 'react';
import { Section, Paragraph } from './components/Common';
import MarkdownDoc from './components/MarkdownDoc';

type DocItem = {
  slug: string;
  title: string;
  category: 'AutomationObjects' | 'GeneralObjects' | 'Locators' | 'Assertions' | 'Misc';
  markdown: string;
};

const toKebabCase = (value: string) => {
  return value
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2')
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .toLowerCase();
};

const titleFromMarkdown = (md: string) => {
  const match = md.match(/^#\s+(.+)$/m);
  return match?.[1]?.trim() ?? '';
};

const markdownFiles = import.meta.glob('../../../../docs/apis/**/*.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

const docs: DocItem[] = Object.entries(markdownFiles)
  .map(([filePath, markdown]) => {
    const normalizedPath = filePath.replaceAll('\\', '/');
    const idx = normalizedPath.lastIndexOf('/docs/apis/');
    const rel = idx >= 0 ? normalizedPath.slice(idx + '/docs/apis/'.length) : normalizedPath;
    if (rel === 'STYLE.md') return null;

    const parts = rel.split('/').filter(Boolean);
    const fileName = parts[parts.length - 1] ?? '';
    const baseName = fileName.replace(/\.md$/i, '');
    const topTitle = titleFromMarkdown(markdown) || baseName;

    if (rel === 'types.md') {
      return { slug: 'types', title: topTitle, category: 'Misc', markdown };
    }

    const dir = parts[0] ?? '';
    const kebab = toKebabCase(baseName);

    if (dir === 'aos') return { slug: `automation/${kebab}`, title: topTitle, category: 'AutomationObjects', markdown };
    if (dir === 'objects') return { slug: `objects/${kebab}`, title: topTitle, category: 'GeneralObjects', markdown };
    if (dir === 'locators') return { slug: `locators/${kebab}`, title: topTitle, category: 'Locators', markdown };
    if (dir === 'assertions') return { slug: `assertions/${kebab}`, title: topTitle, category: 'Assertions', markdown };

    return null;
  })
  .filter((d): d is DocItem => d !== null)
  .sort((a, b) => a.slug.localeCompare(b.slug));

export default function APIs() {
  const [path, setPath] = useState(window.location.pathname);
  useEffect(() => {
    const onPopState = () => setPath(window.location.pathname);
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const slug = useMemo(() => {
    const parts = path.split('/').filter(Boolean);
    if (parts[0] !== 'apis') return '';
    return parts.slice(1).join('/');
  }, [path]);

  const active = docs.find(d => d.slug === slug);

  const navigate = (to: string) => {
    if (to === path) return;
    history.pushState({}, '', to);
    setPath(to);
  };
  const byCategory = (category: DocItem['category']) => docs.filter(d => d.category === category);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', minHeight: 'calc(100vh - 64px)' }}>
      <aside style={{ borderRight: '1px solid #e2e8f0', padding: '1rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>Mimic API Reference</h3>
        <div style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '0.5rem' }}>Automation Objects</div>
        {byCategory('AutomationObjects').map(d => (
          <div key={d.slug} style={{ marginBottom: '0.5rem' }}>
            <a href={`/apis/${d.slug}`} onClick={(e) => { e.preventDefault(); navigate(`/apis/${d.slug}`); }}>{d.title}</a>
          </div>
        ))}
        <div style={{ fontSize: '0.9rem', color: '#64748b', margin: '1rem 0 0.5rem' }}>Other Objects</div>
        {byCategory('GeneralObjects').map(d => (
          <div key={d.slug} style={{ marginBottom: '0.5rem' }}>
            <a href={`/apis/${d.slug}`} onClick={(e) => { e.preventDefault(); navigate(`/apis/${d.slug}`); }}>{d.title}</a>
          </div>
        ))}
        <div style={{ fontSize: '0.9rem', color: '#64748b', margin: '1rem 0 0.5rem' }}>Locators</div>
        {byCategory('Locators').map(d => (
          <div key={d.slug} style={{ marginBottom: '0.5rem' }}>
            <a href={`/apis/${d.slug}`} onClick={(e) => { e.preventDefault(); navigate(`/apis/${d.slug}`); }}>{d.title}</a>
          </div>
        ))}
        <div style={{ fontSize: '0.9rem', color: '#64748b', margin: '1rem 0 0.5rem' }}>Assertions</div>
        {byCategory('Assertions').map(d => (
          <div key={d.slug} style={{ marginBottom: '0.5rem' }}>
            <a href={`/apis/${d.slug}`} onClick={(e) => { e.preventDefault(); navigate(`/apis/${d.slug}`); }}>{d.title}</a>
          </div>
        ))}
        <div style={{ fontSize: '0.9rem', color: '#64748b', margin: '1rem 0 0.5rem' }}>Misc</div>
        {byCategory('Misc').map(d => (
          <div key={d.slug} style={{ marginBottom: '0.5rem' }}>
            <a href={`/apis/${d.slug}`} onClick={(e) => { e.preventDefault(); navigate(`/apis/${d.slug}`); }}>{d.title}</a>
          </div>
        ))}
      </aside>
      <div>
        {!active && (
          <>
            <Section title="Mimic APIs">
              <Paragraph>
                Official API to work with the Mimic Extension for automating browsers and web apps.
                Browse Automation Objects, Other Objects, Locators, Assertions, and Types using the sidebar.
              </Paragraph>
              <Paragraph>Quick Start:</Paragraph>
              <pre style={{ background: 'var(--mimic-codeblock-bg)', color: 'var(--mimic-codeblock-fg)', border: '1px solid var(--mimic-codeblock-border)', padding: '16px', borderRadius: 8, overflowX: 'auto' }}>
                <code>{`import { BrowserLocator } from 'mimic-sdk';
import { AIClient } from 'mimic-sdk';

const browserLocator = new BrowserLocator();
const browser = await browserLocator.get(); // get current browser
const page = await browser.lastActivePage(); // get current page
const ai = new AIClient(); // get ai client`}</code>
              </pre>
            </Section>
          </>
        )}
        {active && <MarkdownDoc source={active.markdown} />}
      </div>
    </div>
  );
}
