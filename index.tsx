import express from "express";
import puppeteer from "puppeteer";
import { S3 } from "aws-sdk";
import 'dotenv/config'


const app = express();
//check if dev or prod
const isDev = process.env.NODE_ENV === 'development';

const s3Args = isDev? {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  } : {}

const s3 = new S3(s3Args);

const API_KEY = process.env.API_KEY;
const S3_BUCKET = "alternet-page-card ";

let browser;
const screenshotQueue: { html: string; cacheKey: string }[] = [];

app.use(express.json());

app.post("/screenshot", async (req, res) => {
  const { apiKey, html, cacheKey } = req.body;

  if (apiKey !== API_KEY) {
    return res.status(401).json({ error: "Invalid API key" });
  }
  if (!html || !cacheKey) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  
  screenshotQueue.push({ html, cacheKey });
  res.json({ message: "Screenshot request queued" });
});

async function processScreenshotQueue() {
  while (screenshotQueue.length > 0) {
    const nextItem = screenshotQueue.shift();
    if (!nextItem) {
      throw new Error("No item in the queue, this should not happen");
    }
    const { html, cacheKey } = nextItem;
    const page = await browser.newPage();
    await page.setContent(html);
    await page.setViewport({ width: 1200, height: 630 }); // Set viewport size as in the example
    const screenshot = await page.screenshot({ type: "png" });
    await page.close();

    const fileName = `${cacheKey}.png`;
    await s3
      .putObject({
        Bucket: S3_BUCKET,
        Key: fileName,
        Body: screenshot,
        ContentType: "image/png",
      })
      .promise();

    console.log(`Screenshot uploaded: ${fileName}`);
  }
}

async function startServer() {
  browser = await puppeteer.launch();
  app.listen(3000, () => {
    console.log("Server is running on port 3000");
  });

  setInterval(processScreenshotQueue, 1000);
}

startServer();
