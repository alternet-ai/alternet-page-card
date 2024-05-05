import express from 'express';
import puppeteer from 'puppeteer';
import { S3 } from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const s3 = new S3();

const API_KEY = 'your-api-key';
const S3_BUCKET = 'your-s3-bucket';

let browser: puppeteer.Browser;
const screenshotQueue: { html: string, cacheKey: string }[] = [];

app.use(express.json());

app.post('/screenshot', async (req, res) => {
  const { apiKey, html, cacheKey } = req.body;

  if (apiKey !== API_KEY) {
    return res.status(401).json({ error: 'Invalid API key' });
  }

  screenshotQueue.push({ html, cacheKey });
  res.json({ message: 'Screenshot request queued' });
});

async function processScreenshotQueue() {
  while (screenshotQueue.length > 0) {
    const nextItem = screenshotQueue.shift();
    if (!nextItem) {
      throw new Error('No item in the queue, this should not happen');
    }
    const { html, cacheKey } = nextItem;
    const page = await browser.newPage();
    await page.setContent(html);
    const screenshot = await page.screenshot();
    await page.close();

    const fileName = `${cacheKey}.png`;
    await s3.putObject({
      Bucket: S3_BUCKET,
      Key: fileName,
      Body: screenshot,
      ContentType: 'image/png',
    }).promise();

    console.log(`Screenshot uploaded: ${fileName}`);
  }
}

async function startServer() {
  browser = await puppeteer.launch();
  app.listen(3000, () => {
    console.log('Server is running on port 3000');
  });

  setInterval(processScreenshotQueue, 1000);
}

startServer();