import puppeteer from 'puppeteer';
import getBlockId from './getBlockId';

const buildHtml = async (pageId: string, token: string) => {
  process.setMaxListeners(0);

  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    await page.goto(`https://www.notion.so/${pageId.split('-').join('')}`);

    const cookie = [{ name: 'token_v2', value: token }];

    await page.setCookie(...cookie);
    await page.waitForSelector('#notion-app');
    await page.waitFor(20000);

    const data = await page.evaluate(() => {
      const contentEditable$ = document.querySelectorAll('div[contenteditable=true]');

      contentEditable$?.forEach((item: HTMLDivElement) => {
        item.removeAttribute('contenteditable');
      });

      // transform image link
      const img$ = document.querySelectorAll('#notion-app img');

      img$.forEach((item: HTMLImageElement) => {
        const src = item.getAttribute('src');
        let newSrc: string;

        if (src.startsWith('https://s3.us-west')) {
          const [parsedOriginUrl] = src.split('?');

          newSrc = `https://notion.so/image/${encodeURIComponent(parsedOriginUrl).replace('s3.us-west', 's3-us-west')}`;
        } else if (src.startsWith('/')) {
          const notionImage = src.replace(/^\/image\//, '');

          newSrc = decodeURIComponent(notionImage);
        }

        item.setAttribute('src', newSrc);
      });

      // transform table of content's link
      const anchor$ = document.querySelectorAll('#notion-app .notion-page-content > div > div:nth-child(1) > div > a');

      anchor$.forEach((item: HTMLAnchorElement) => {
        let url: URL;

        try {
          url = new URL(item.href);
        } catch (e) {}

        if (url?.host === 'www.notion.so') {
          const hashBlockID = getBlockId(item.hash.slice(1));

          item.href = `#${hashBlockID}`;

          const block = document.querySelector(`div[data-block-id="${hashBlockID}"]`);

          if (block) {
            block.id = hashBlockID;
          }
        }
      });

      // transform bookmakr
      const bookmark$ = document.querySelectorAll('#notion-app .notion-page-content > div[data-block-id] > div > div > a');

      bookmark$.forEach((item: HTMLAnchorElement) => {
        if (!item.href) {
          const link$: HTMLDivElement = item.querySelector('div > div:first-child > div:last-child');

          item.href = link$.innerText;
        }
      });

      // transform table view styles
      const table$ = document.querySelectorAll('div.notion-scroller.horizontal');

      table$.forEach((item: HTMLDivElement) => {
        (item.children[0] as HTMLElement).style!.padding = '0';
        (item.previousElementSibling as HTMLElement).style!.paddingLeft = '0';
        item.style.overflowX = 'scroll';
      });

      const content$ = document.querySelector('#notion-app .notion-page-content');

      if (content$ != null) {
        const emoji$ = content$.parentElement.querySelector('div').querySelector('.notion-record-icon');
        const title$ = content$.parentElement.querySelector('div[placeholder="Untitled"]');

        const titleString = emoji$?.textContent ?? '' + title$?.textContent ?? '';
        const title = title$?.innerHTML ?? '';
        const content = content$.innerHTML;

        return {
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
        const title$ = view$.parentElement.parentElement.querySelector('div[placeholder="Untitled"]')?.parentElement.parentElement;
        const content$ = title$.nextElementSibling;

        const titleString = title$?.textContent ?? '';
        const title = title$?.innerHTML ?? '';
        const content = content$?.innerHTML ?? '';
        const resource = view$.innerHTML;

        return {
          title,
          titleString,
          content,
          resource,
        };
      }
    });

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
