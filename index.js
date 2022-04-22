import { AwsClient } from 'aws4fetch'

const xml2js = require('xml2js');
const parser = new xml2js.Parser({ attrkey: "ATTR" });

const aws = new AwsClient({
    "accessKeyId": (globalThis.AWS_ACCESS_KEY_ID || ''), // This is required when creating a new environment that doesn't yet have secrets in place
    "secretAccessKey": (globalThis.AWS_SECRET_ACCESS_KEY || ''),
    "region": AWS_DEFAULT_REGION,
});

addEventListener('fetch', function(event) {
    event.respondWith(handleRequest(event.request));
});

const PUBLIC_URL = globalThis.BUCKET_PUBLIC_URL || `https://${AWS_S3_BUCKET}/`;
var BUCKET_SUBFOLDER = globalThis.SUBFOLDER || '';

BUCKET_SUBFOLDER = (!BUCKET_SUBFOLDER.endsWith('/') && BUCKET_SUBFOLDER != '') ? `${BUCKET_SUBFOLDER}/` : BUCKET_SUBFOLDER;

function createURL(object_key) {
    if (BUCKET_SUBFOLDER != ""){
        object_key = object_key.replace(BUCKET_SUBFOLDER, '');
    }

    return `${PUBLIC_URL}${BUCKET_SUBFOLDER}${encodeURIComponent(object_key)}`;
}

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
    url.search = `list-type=2&prefix=${BUCKET_SUBFOLDER}`
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
                "title": `<![CDATA[${element['Key'][0].replace(BUCKET_SUBFOLDER, '')}]]>`,
                "pubDate": element['LastModified'][0],
                "size": element['Size'][0],
                "url": createURL(element['Key'][0])
            })
        })
    }

    return new Response(createFeed(files), {
        headers: {
          "content-type": "application/rss+xml;charset=UTF-8",
      }})

    // return await fetch(signedRequest, { "cf": { "cacheEverything": true } });
}
