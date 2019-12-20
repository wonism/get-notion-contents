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
      // transform image link
      const img$ = document.querySelectorAll('div.notion-page-content img');

      img$.forEach((item: HTMLImageElement) => {
        if (item.src.startsWith('https://s3.us-west')) {
          const [parsedOriginUrl] = item.src.split('?');

          item.src = `https://notion.so/image/${encodeURIComponent(parsedOriginUrl).replace('s3.us-west', 's3-us-west')}`;
        }
      });

      // transform table of content's link
      const anchor$ = document.querySelectorAll('#notion-app > div > div.notion-cursor-listener > div > div.notion-scroller.vertical.horizontal > div.notion-page-content > div > div:nth-child(1) > div > a');

      anchor$.forEach((item: HTMLAnchorElement) => {
        let url: URL;

        try {
          url = new URL(item.href);
        } catch (e) { }

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
      const bookmark$ = document.querySelectorAll('#notion-app > div > div.notion-cursor-listener > div > div.notion-scroller.vertical.horizontal > div.notion-page-content > div[data-block-id] > div > div > a');

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

      const content$ = document.querySelector('#notion-app > div > div.notion-cursor-listener > div > div > div.notion-page-content');
      const contentEditable$ = content$.querySelectorAll('div[contenteditable=true]');

      contentEditable$.forEach((item: HTMLDivElement) => {
        item.removeAttribute('contenteditable');
      });

      return content$?.innerHTML ?? '';
    });

    await browser.close();

    return data;
  } catch (e) {
    console.error(e.message);
  }
};

export default buildHtml;
