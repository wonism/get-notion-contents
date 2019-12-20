import fetch from 'node-fetch';
import { flow, keys, values, get } from 'lodash/fp';
import buildHtml from './utils/buildHtml';
import request from './utils/request';
import { NotionResponse, NotionUser } from './types';

export default class Notion {
  static getUser = flow(get('recordMap.notion_user'), values, get('0.value'));
  static getPageIds = flow(get('recordMap.block'), keys);

  private token: string;
  private userContent: NotionResponse;

  constructor(token: string) {
    if (!token) {
      throw new Error('Token MUST be provided.');
    }

    this.token = token;
  }

  private async getUserContent() {
    try {
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
    if (this.userContent != null) {
      return Notion.getUser(this.userContent);
    }

    const result = await this.getUserContent();

    if (result != null) {
      return Notion.getUser(result);
    }
  }

  public async getPageIds() {
    if (this.userContent != null) {
      return Notion.getPageIds(this.userContent);
    }

    const result = await this.getUserContent();

    if (result != null) {
      return Notion.getPageIds(result);
    }
  }

  public async getPageById(pageId: string) {
    const page = await buildHtml(pageId, this.token);

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
