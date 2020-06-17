Small authentication and caching proxy service for [Contentful](http://contentful.com)'s [Content Delivery API](https://www.contentful.com/developers/docs/references/content-delivery-api/) (CDA) written for and using http and redis. Useful for front-end's connecting to Contentful and for people who have problems with their request cap.

Forked from https://github.com/felixjung/contentful-proxy and updated to use http server, redis caching, environment variables and work with Contentful's updates. Uses Winston to log pretty messages to console. Also added prettier, eslint and nodemon for development.

## Installation

This project uses yarn, so run the following from the terminal:

``` bash
$ yarn
```

You can also install via npm by running

``` bash
$ npm install
```

## Usage

### Configuration

This project uses dotenv to load environment variables. Required and optional .env variables and example values:
```
NODE_ENV=development
SPACE_ID=izij9rskv5y1
ACCESS_TOKEN=<your access token>
PREVIEW_TOKEN=<your preview token>
PREVIEW=false
SECURE=true
```

| Option         | Note                   | Description                              |
| -------------- | ---------------------- | ---------------------------------------- |
| `ACCESS_TOKEN`  | **String** *required*  | The space's access token for the production CDA. |
| `PREVIEW_TOKEN` | **String** *optional*  | The space's access token for the CPA.    |
| `PREVIEW`      | **Boolean** *optional* | Should the CPA be proxied? If set to true, make sure the `PREVIEW_TOKEN` is specified. |
| `SPACE_ID`      | **String** *optional*  | The ID of you space. If specified, you won't have to set `/spaces/{spaceId}` in your requests. |
| `SECURE`       | **Boolean** *optional* | Should the proxy use HTTPS and verify Contentful's SSL certificate. |

### Start

Running

``` bash
$ yarn start
```
from the terminal will start the server on port `3000` listening at `localhost`.

### Caching

The proxy will cache any responses from Contentful using the full URL including
query params as key. Cached values never expire and are used for both, the
response body and headers, when responding to subsequent requests. To clear the
cache, for example using Contentful's post-publishing hooks, send a `DELETE`
request to the service.



