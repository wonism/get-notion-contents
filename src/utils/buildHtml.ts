import puppeteer from 'puppeteer';
import getBlockId from './getBlockId';
import { Option, Type } from '../types';

const windowSet = (page, name, value) =>
  page.evaluateOnNewDocument(`
  Object.defineProperty(window, '${name}', {
    get() {
      return '${value}';
    }
  })
`);

const buildHtml = async (pageId: string, token: string, option: Option) => {
  process.setMaxListeners(0);

  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    await page.goto(`https://www.notion.so/${pageId.split('-').join('')}`);

    const cookie = [{ name: 'token_v2', value: token }];

    await page.setCookie(...cookie);
    await page.waitForSelector('#notion-app');
    await page.waitFor(20000);

    const data = await page.evaluate(option => {
      const contentEditable$ = document.querySelectorAll('div[contenteditable=true]');

      contentEditable$?.forEach((item: HTMLDivElement) => {
        item.removeAttribute('contenteditable');
      });

      const control$ = document.querySelectorAll('div.notion-page-controls');

      control$?.forEach((item: HTMLDivElement) => {
        item.textContent = '';
      });

      if (option.removeStyle) {
        const elements$ = document.querySelectorAll('*[style]');

        elements$.forEach((item: HTMLElement) => {
          item.removeAttribute('style');
        });
      }

      // transform image link
      const img$ = document.querySelectorAll('#notion-app img');

      img$.forEach((item: HTMLImageElement) => {
        const src = item.getAttribute('src');
        let newSrc: string = src;

        if (src.startsWith('https://s3.us-west')) {
          const [parsedOriginUrl] = src.split('?');

          newSrc = `https://notion.so/image/${encodeURIComponent(parsedOriginUrl).replace('s3.us-west', 's3-us-west')}`;
        } else if (src.startsWith('/')) {
          newSrc = 'https://notion.so' + src;
        }

        item.setAttribute('src', newSrc);
      });

      // transform table of content's link
      const anchor$ = document.querySelectorAll('#notion-app .notion-page-content > div > div:nth-child(1) > div > a');

      anchor$.forEach((item: HTMLAnchorElement) => {
        const href = item.getAttribute('href');
        const hash = item.getAttribute('hash');

        let url: URL;

        try {
          url = new URL(href);
        } catch (e) {}

        if (url?.host === 'www.notion.so') {
          const hashBlockID = getBlockId(hash.slice(1));

          item.setAttribute('href', `#${hashBlockID}`);

          const block = document.querySelector(`div[data-block-id="${hashBlockID}"]`);

          if (block) {
            block.setAttribute('id', hashBlockID);
          }
        }
      });

      // transform relative links
      const pages$ = document.querySelectorAll('#notion-app .notion-collection-item > a');

      pages$.forEach((item: HTMLAnchorElement) => {
        const href = item.getAttribute('href');

        if (href.startsWith('/')) {
          const newHref = href.match(/\w+$/)?.[0] ?? href;
          const url = option.prefix + newHref;

          item.setAttribute('href', url);
        }
      });

      // transform bookmakr
      const bookmark$ = document.querySelectorAll('#notion-app .notion-page-content > div[data-block-id] > div > div > a');

      bookmark$.forEach((item: HTMLAnchorElement) => {
        const href = item.getAttribute('href');

        if (!href) {
          const link$: HTMLDivElement = item.querySelector('div > div:first-child > div:last-child');

          item.setAttribute('href', link$.innerText);
        }
      });

      // transform table view styles
      const table$ = document.querySelectorAll('div.notion-scroller.horizontal');

      if (!option.removeStyle) {
        table$.forEach((item: HTMLDivElement) => {
          (item.children[0] as HTMLElement).style!.padding = '0';
          (item.previousElementSibling as HTMLElement).style!.paddingLeft = '0';
          item.style.overflow = 'visible';
          item.parentElement.style.maxWidth = '100%';
          item.parentElement.style.overflow = 'auto hidden';
        });
      }

      const content$ = document.querySelector('#notion-app .notion-page-content');

      if (content$ != null) {
        const wrapper$ = content$.parentElement;
        const cover$ = wrapper$.querySelector('img')?.parentElement;
        const title$ = wrapper$.querySelector('div[placeholder="Untitled"]')?.parentElement.parentElement;

        const titleString = title$?.textContent ?? '';
        const title = (cover$?.innerHTML ?? '') + (title$?.innerHTML ?? '');
        const content = content$.innerHTML.replace(/\s-\s192px/g, '');

        return {
          type: 'NotionContent',
          title,
          titleString,
          content,
        };
      }

      const view$ = document
        .getElementById('notion-app')
        .querySelectorAll('.notion-board-view, .notion-list-view, .notion-table-view, .notion-gallery-view')?.[0];

      if (view$ == null) {
        return null;
      }

      {
        const type = view$.getAttribute('class')?.match(/^(?:notion-)(.+)(-view)$/)?.[1] ?? 'Content';

        const wrapper$ = view$.parentElement.parentElement;
        const cover$ = wrapper$.querySelector('img')?.parentElement;
        const title$ = wrapper$.querySelector('div[placeholder="Untitled"]')?.parentElement.parentElement;
        const content$ = title$.nextElementSibling;

        const titleString = title$?.textContent ?? '';
        const title = (cover$?.innerHTML ?? '') + (title$?.innerHTML ?? '');
        const content = (content$?.innerHTML ?? '').replace(/\s-\s192px/g, '');
        const resource = view$.innerHTML;

        return {
          type: ('Notion' + type.slice(0, 1).toUpperCase() + type.slice(1)) as Type,
          title,
          titleString,
          content,
          resource,
        };
      }
    }, option);

    await browser.close();

    if (data == null) {
      throw new Error("Can't load content");
    }

    return data;
  } catch (e) {
    return `Error: ${e.message}\noccurred while loading notion.so/${pageId.replace(/-/g, '')}\n\n`;
  }
};

export default buildHtml;
