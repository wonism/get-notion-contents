const Notion = require('../lib').default;

const token = process.env.NOTION_TOKEN;

const notion = new Notion(token, { prefix: 'https://notion.so/' });

(async () => {
  if (token != null) {
    const pageIds = await notion.getPageIds();

    const pages = await Promise.all(
      pageIds.map(
        async (id) => {
          const page = await notion.getPageById(id);

          return page;
        }
      )
    );

    pages.forEach((page) => { console.log(page); });
  } else {
    const page = await notion.getPageById('db45cd2e7c694c3493c97f2376ab184a');

    console.log(page);
  }
})();
