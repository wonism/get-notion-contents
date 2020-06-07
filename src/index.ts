import fetch from 'node-fetch';
import { flow, entries, filter, map, values, get, flatten, isEqual } from 'lodash/fp';
import buildHtml from './utils/buildHtml';
import request from './utils/request';
import { Option, NotionResponse, NotionUser, NotionContent } from './types';

export default class Notion {
  static getUser = flow(get('recordMap.notion_user'), values, get('0.value'));
  static getPageIds = flow(get('recordMap.block'), entries, filter(flow(get('1.value.type'), isEqual('page'))), map(get('0')));

  private option: Option;
  private prefix: string;
  private token: string | null;
  private removeStyle: boolean;
  private userContent: NotionResponse;

  constructor(token: string = null, option: Option = { prefix: '/', removeStyle: false }) {
    this.token = token;

    this.option = {
      prefix: option.prefix ?? '/',
      removeStyle: Boolean(option.removeStyle),
    };
  }

  private async getUserContent() {
    try {
      if (this.token == null) {
        throw new Error('You need to pass the token to get your user data.');
      }

      const response = await request('loadUserContent', this.token);
      const result: NotionResponse = await response.json();

      this.userContent = result;

      return result;
    } catch (e) {
      console.error(e.message);

      throw e;
    }
  }

  public async getUser(): Promise<NotionUser> {
    const userContent = this.userContent ?? (await this.getUserContent());
    const user = Notion.getUser(userContent);

    return user;
  }

  public async getPageIds(skipChildren = true): Promise<string[]> {
    const userContent = this.userContent ?? (await this.getUserContent());
    const pageIds = Notion.getPageIds(this.userContent);

    if (skipChildren) {
      return pageIds;
    }

    const chunks = await Promise.all(pageIds.map(async pageId => (await request('loadPageChunk', this.token, { pageId })).json()));

    const pageIdsWithChildren = flatten(chunks.map(Notion.getPageIds));

    return pageIdsWithChildren;
  }

  public async getPageById(pageId: string): Promise<NotionContent> {
    const page = await buildHtml(pageId, this.token, this.option);

    return page;
  }

  public async getPages() {
    try {
      const pageIds = await this.getPageIds();
      const pages = await Promise.all(pageIds.map(id => this.getPageById(id)));

      return pages;
    } catch (e) {
      console.error(e.message);

      throw e;
    }
  }
}
