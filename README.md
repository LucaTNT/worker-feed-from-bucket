# Cloudflare Worker Signed S3 Request Template

A template for signing requests to Amazon S3 using Workers.

[`index.js`](https://github.com/obezuk/worker-signed-s3-template/blob/master/index.js) is the content of the Workers script.

#### Wrangler

To generate using [wrangler](https://github.com/cloudflare/wrangler)

```
wrangler generate projectname https://github.com/obezuk/worker-signed-s3-template
```

#### Serverless

To deploy using serverless add a [`serverless.yml`](https://serverless.com/framework/docs/providers/cloudflare/) file.