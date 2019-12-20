import fetch from 'node-fetch';

const request = (endpoint: string, token: string, body?: any) =>
  fetch(`https://www.notion.so/api/v3/${endpoint}`, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'Content-Type': 'application/json',
      cookie: `token_v2=${token};`,
    },
    body: JSON.stringify({
      ...body,
      limit: 200,
      cursor: { stack: [] },
      chunkNumber: 0,
      verticalColumns: false,
    }),
  });

export default request;
