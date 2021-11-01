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

async function handleRequest(request) {
    var url = new URL(request.url);
    url.hostname = AWS_S3_BUCKET;
    url.search = 'list-type=2'
    var signedRequest = await aws.sign(url);

    var request = await fetch(signedRequest, { "cf": { "cacheEverything": true } });

    const text = await request.text()
    var files = [];

    const result = await new Promise((resolve, reject) => parser.parseString(text, (err, result) => {
        if (err) reject(err);
        else resolve(result);
    }));

    var contents = result['ListBucketResult']['Contents'];

    var html = `<rss xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd" xmlns:content="http://purl.org/rss/1.0/modules/content/" version="2.0">
    <channel>
        <title>BreakingItaly</title>
        <description>Il podcast</description>
        <lastBuildDate>DATE HERE</lastBuildDate>
        <image>
            <url>https://albertozorzi.it/breaking.jpg</url>
            <width>480</width>
            <height>480</height>
        </image>
        <itunes:image href="https://albertozorzi.it/breaking.jpg" />`;

    contents.forEach(element => {
        files.push(element['Key'][0] + ' ' + element["Size"][0]);
        html += '<item>';
        html += `<title>${element['Key'][0]}</title>`
        html += `<link>https://breakingitaly.albertozorzi.it/file/breakingitalymp3/${element['Key'][0]}</link>`
        html += `<pubDate>${element['LastModified'][0]}</pubDate>`
        html += `<guid isPermaLink="false">https://breakingitaly.albertozorzi.it/file/breakingitalymp3/${element['Key'][0]}</guid>`
        html += `<enclosure url="https://breakingitaly.albertozorzi.it/file/breakingitalymp3/${element['Key'][0]}" length="${element['Size'][0]}" type="audio/mpeg" />`

    })

    html += '</channel></rss>';
    return new Response(html, {
        headers: {
          "content-type": "application/rss;charset=UTF-8",
      }})

    // return await fetch(signedRequest, { "cf": { "cacheEverything": true } });
}