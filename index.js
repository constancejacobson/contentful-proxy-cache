const http = require("http");

const httpProxy = require("http-proxy");
const redis = require("redis");

const { logger } = require("./utils");

require("dotenv").config();

const client = redis.createClient();

client.on("connect", () => {
  logger.info("Connected");
});

client.on("error", error => {
  logger.error(error);
});

const getContentfulUrl = () => {
  const path = process.env.SPACE_ID ? `spaces/${process.env.SPACE_ID}` : "";
  const protocol = process.env.SECURE ? "https" : "http";
  const host = process.env.PREVIEW ? "preview.contentful.com" : "cdn.contentful.com";
  return `${protocol}://${host}/${path}`;
};

const getAuthToken = () => {
  const hasPreviewToken = Boolean(process.env.PREVIEW_TOKEN);
  if (!hasPreviewToken && process.env.PREVIEW) {
    const errorMsg = "Please provide preview API token to use the preview API.";
    throw new Error(errorMsg);
  }
  return process.env.PREVIEW ? process.env.PREVIEW_TOKEN : process.env.ACCESS_TOKEN;
};

const cacheResponse = (proxyRes, req) => {
  const { headers } = proxyRes;
  let array = [];

  proxyRes.on("data", chunk => {
    array.push(chunk);
  });
  proxyRes.on("end", () => {
    try {
      if (req.method === "GET") {
        const body = Buffer.concat(array).toString("hex");
        const headerString = JSON.stringify(headers);

        client.hmset(req.url, {
          data: body,
          headers: headerString,
        });
      } else {
        req.logger.warn("Response was not cached");
      }
    } catch (err) {
      logger.error(err);
    }
  });
};

const handleError = (err, req, res) => {
  logger.error(err);
  res.writeHead(500);
  res.write(err);
  res.end();
};

const createContentfulProxy = () => {
  const target = getContentfulUrl();
  const token = getAuthToken();
  const secure = Boolean(process.env.SECURE);

  const options = {
    target,
    changeOrigin: true,
    xfwd: true,
    secure,
    prependPath: true,
    preserveHeaderKeyCase: true,
    headers: { Authorization: `Bearer ${token}` },
  };

  return httpProxy
    .createProxyServer(options)
    .on("proxyRes", cacheResponse)
    .on("error", handleError);
};

const proxy = createContentfulProxy();

http
  .createServer((req, res) => {
    logger.verbose({
      method: req.method,
      url: req.url,
    });

    req.logger = logger.child({
      meta: {
        logType: "application_log",
        req: {
          "method": req.method,
          "url": req.url,
          "user-agent": req.headers["user-agent"],
        },
      },
    });

    if (req.method === "DELETE") {
      client.flushall((err, reply) => {
        if (err) {
          logger.error(err);
          throw err;
        }
        req.logger.info(`Deleted all cache ${reply}`);
      });
      res.writeHead(200);
      res.end();
      return;
    }

    if (req.method !== "GET") {
      proxy.web(req, res);
      return;
    }

    client.hgetall(req.url, (err, object) => {
      if (err) {
        logger.error(err);
        return;
      }
      if (object) {
        req.logger.info("From cached");
        const buffer = Buffer.from(object.data, "hex");
        const jsonHeaders = JSON.parse(object.headers);

        res.writeHead(200, jsonHeaders);
        res.write(buffer);
        res.end();
      } else {
        req.logger.info("From contentful");
        proxy.web(req, res);
      }
    });
  })
  .listen(3000);
