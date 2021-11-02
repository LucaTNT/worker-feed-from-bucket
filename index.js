import { AwsClient } from 'aws4fetch'

const xml2js = require('xml2js');
const parser = new xml2js.Parser({ attrkey: "ATTR" });

const aws = new AwsClient({
    "accessKeyId": AWS_ACCESS_KEY_ID,
    "secretAccessKey": AWS_SECRET_ACCESS_KEY,
    "region": AWS_DEFAULT_REGION,
});

addEventListener('fetch', function(event) {
    event.respondWith(handleRequest(event.request))
});

const PUBLIC_URL = BUCKET_PUBLIC_URL || `https://${AWS_S3_BUCKET}/`

function createFeed(files) {
    var rss = `<rss xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd" xmlns:content="http://purl.org/rss/1.0/modules/content/" version="2.0">
    <channel>
        <title>${PODCAST_TITLE}</title>
        <description>${PODCAST_DESCRIPTION}</description>
        <lastBuildDate>${new Date().toISOString()}</lastBuildDate>
        <image>
            <url>${PODCAST_IMAGE}</url>
            <width>${PODCAST_IMAGE_WIDTH}</width>
            <height>${PODCAST_IMAGE_HEIGHT}</height>
        </image>
        <itunes:image href="${PODCAST_IMAGE}" />\n`;

    files.forEach(file => {
        rss += '        <item>\n';
        rss += `            <title>${file.title}</title>\n`
        rss += `            <link>${file.url}</link>\n`
        rss += `            <pubDate>${file.pubDate}</pubDate>\n`
        rss += `            <guid isPermaLink="false">${file.url}</guid>\n`
        rss += `            <enclosure url="${file.url}" length="${file.size}" type="audio/mpeg" />\n`
        rss += '        </item>\n';
    });

    return rss + '    </channel>\n</rss>\n';
}

async function handleRequest(request) {
    var url = new URL(`https://${AWS_S3_BUCKET}/`);
    url.search = 'list-type=2'
    var signedRequest = await aws.sign(url);

    var request = await fetch(signedRequest, { "cf": { "cacheEverything": true } });

    const text = await request.text()
    var files = [];

    console.log(text);

    const result = await new Promise((resolve, reject) => parser.parseString(text, (err, result) => {
        if (err) reject(err);
        else resolve(result);
    }));

    if ('Contents' in result['ListBucketResult']) {
        const contents = result['ListBucketResult']['Contents'];

        contents.forEach(element => {
            files.push({
                "title": element['Key'][0],
                "pubDate": element['LastModified'][0],
                "size": element['Size'][0],
                "url": `${PUBLIC_URL}${element['Key'][0]}`
            })
        })
    }

    return new Response(createFeed(files), {
        headers: {
          "content-type": "application/rss;charset=UTF-8",
      }})

    // return await fetch(signedRequest, { "cf": { "cacheEverything": true } });
}
