# worker-feed-from bucket

This Cloudflare Worker generates a podcast RSS feed based on the contents of a S3-compatible bucket.
It is based on [worker-signed-s3-template](https://github.com/obezuk/worker-signed-s3-template)

## Configuration

You have to create your own `wrangler.toml`, which you can base on [`wrangler.toml.example`](https://github.com/LucaTNT/worker-feed-from-bucket/blob/main/wrangler.toml.example).

Configuration is done through environment variables:

- `AWS_DEFAULT_REGION`: the default S3 region. It is blank with some providers (e.g. Backblaze).
- `AWS_S3_BUCKET`: The virtualhost-style S3 endpoint for your bucket. (e.g. `mybucket.s3.eu-west-003.backblazeb2.com` or `mybucket.s3.eu-south-1.amazonaws.com`).
- `BUCKET_PUBLIC_URL`: The base URL of your bucket. Usually it is `https://${AWS_S3_BUCKET}`, but sometimes it is useful to change it (for example if you have Cloudflare in front of your S3 storage).
- `SUBFOLDER`: Optional subfolder of the bucket to search files in.
- `PODCAST_TITLE`: The title that appears on the RSS feed.
- `PODCAST_DESCRIPTION`: The description that appears on the RSS feed.
- `PODCAST_IMAGE`: The URL of an image to be used as the podcast album art.
- `PODCAST_IMAGE_WIDTH`: The width of `PODCAST_IMAGE`
- `PODCAST_IMAGE_HEIGHT`: The height of `PODCAST_IMAGE`

#### Wrangler

Generation using [wrangler](https://github.com/cloudflare/wrangler) (`wrangler generate projectname https://github.com/LucaTNT/worker-feed-from-bucket`) is currently not supported due to this repo using the "main" branch as opposed to the "master" branch that wrangler is expecting.

After you cloned the repo, set the required secrets containing your S3 API Keys:

    wrangler secret put AWS_ACCESS_KEY_ID
    wrangler secret put AWS_SECRET_ACCESS_KEY

Then you can push it to cloudflare by running `wrangler publish`.
