import express from "express";
import puppeteer, { Browser } from "puppeteer";
import AWS from 'aws-sdk';
import 'dotenv/config'

const app = express();
const isDev = process.env.NODE_ENV === 'development';
const { S3 } = AWS;

const s3Args = isDev ? {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
} : {}

const s3 = new S3(s3Args);

const API_KEY = process.env.API_KEY;
const S3_BUCKET = "alternet-page-card-bucket";

let browser: Browser;

app.use(express.json());

app.post("/screenshot", async (req, res) => {
    const { apiKey, html, cacheKey } = req.body;
    console.log("Received request", req.body);

    if (apiKey !== API_KEY) {
        return res.status(401).json({ error: "Invalid API key" });
    }
    if (!html || !cacheKey) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    try {
        console.log("Creating new page");
        const page = await browser.newPage();
        await page.setContent(html);
        await page.setViewport({ width: 1200, height: 630 }); // Set viewport size as in the example
        const screenshot = await page.screenshot({ type: "png" });
        await page.close();

        const fileName = `${cacheKey}.png`;
        console.log("Uploading screenshot to S3");
        await s3.putObject({
            Bucket: S3_BUCKET,
            Key: fileName,
            Body: screenshot,
            ContentType: "image/png",
        }).promise();

        const imageUrl = `https://${S3_BUCKET}.s3.amazonaws.com/${fileName}`;
        console.log("Screenshot URL:", imageUrl);
        res.json({ imageUrl });
    } catch (error) {
        console.error("Error processing screenshot:", error);
        res.status(500).json({ error: "Failed to process screenshot" });
    }
});

async function startServer() {
    browser = await puppeteer.launch();
    app.listen(3000, () => {
        console.log("Server is running on port 3000");
    });
}

startServer();