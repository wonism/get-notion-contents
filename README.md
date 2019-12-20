# get-notion-contents
> Get contents from notion

[![NPM](https://img.shields.io/npm/v/get-notion-contents.svg?style=flat)](https://npmjs.org/package/get-notion-contents)
[![Build Status](https://travis-ci.org/wonism/get-notion-contents.svg?branch=master)](https://travis-ci.org/wonism/get-notion-contents)
![npm bundle size (minified)](https://img.shields.io/bundlephobia/min/get-notion-contents.svg)

## Installation
```sh
$ npm i -S get-notion-contents
```

## ⚠️ Prerequisite
You need a token to use this package.
You can get it from [Notion.so](https://www.notion.so/) cookie. the key of it is `token_v2`.

## Development
```sh
$ export NOTION_TOKEN="<<YOUR_NOTION_TOKEN>>"
$ npm start
```

## How to use
```ts
import Notion from 'get-notion-contents';

// create instance of Notion.
const notion = new Notion('<<YOUR_NOTION_TOKEN>>');

(async () => {
  // get user information
  const user = await notion.getUser();
  console.log(user);

  // get ids of all pages
  const pageIds = await notion.getPageIds();
  console.log(pageIds);

  // get content of a page
  const page = await notion.getPageById(pageIds[0]);
  console.log(page);

  // get contents of all pages
  const pages = await notion.getPages();
  console.log(pages);
})();
```

---

<p align="center">
  <a href="https://www.buymeacoffee.com/dQ3sAxl" target="_blank">
    <img src="https://cdn.buymeacoffee.com/buttons/default-orange.png" alt="Buy Me A Coffee" width="217" height="51" />
  </a>
</p>
