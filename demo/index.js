const Notion = require('../lib').default;

const token = process.env.NOTION_TOKEN;

const notion = new Notion(token);

(async () => {
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
})();
