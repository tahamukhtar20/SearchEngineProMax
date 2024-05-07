const puppeteer = require("puppeteer-extra");
const { load } = require("cheerio");
const { writeFile, write } = require("fs");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const { Semaphore } = require("await-semaphore");

const Base = require("src/Base");

class Crawler extends Base {
  constructor() {
    super();
    console.log("Crawler.contructor");
    this.concurrentRequests = 30;
    this.completedTasks = 0;
    this.semaphore = new Semaphore(this.concurrentRequests);
    this.browser = null;
  }

  async start() {
    console.log("Crawler.start");
    puppeteer.use(StealthPlugin());
    this.browser = await puppeteer.launch({ headless: true });
    await Promise.all(this.urls.map((url) => this.crawl(url)));
    await this.browser.close();
  }

  async crawl(url) {
    let page = null;
    let content = null;
    await this.semaphore.acquire().then(async (release) => {
      try {
        console.log("Crawler.crawl");
        page = await this.browser.newPage();
        await page.goto(url, { timeout: 60000 });
        await page.waitForSelector("body");
        content = await page.content();
      } catch (error) {
        if (error.name === "TimeoutError") {
          console.error("TimeoutError: ", url);
        } else {
          const logFile = `../logs/${this.completedTasks}-${Date.now()}-${url
            .replace(/(^\w+:|^)\/\//, "")
            .replace(/\//g, "-")}.log`;
          console.error(
            "Some Error Occurred, please check logs for more details: ",
            logFile
          );
          writeFile(logFile, JSON.stringify(error), (error) => {
            if (error) {
              console.error(error);
            }
          });
        }
      } finally {
        if (page) {
          await page.close();
        }
      }

      if (content) {
        const parsedContent = await this.parseContent(content);
        if (parsedContent) {
          this.completedTasks++;
          this.saveContent(parsedContent);
          console.log("Crawled Page Count: ", this.completedTasks);
          console.log("Crawled Page: ", url);
        }
      }
      release();
    });
  }

  async parseContent(content) {
    console.log("Crawler.parse");
    const $ = load(content);
    const title = $("title").text() || "";
    const description = $('meta[name="description"]').attr("content") || "";
    const keywords = $('meta[name="keywords"]').attr("content") || "";
    const contentTags = [
      "p",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "a",
      "li",
      "td",
      "th",
    ];
    const contentData = {};
    contentTags.forEach((tag) => {
      contentData[tag] = $(tag)
        .map(function () {
          return $(this).text();
        })
        .get();
    });
    const forwardLinks = $("a[href]")
      .map(function () {
        return $(this).attr("href");
      })
      .get();

    return {
      title: title,
      description: description,
      keywords: keywords,
      content: contentData,
      forward_links: forwardLinks,
    };
  }

  async saveContent(content) {
    console.log("Crawler.save");
    const fileName = `../output/${this.completedTasks}.json`;
    writeFile(fileName, JSON.stringify(content), (error) => {
      if (error) {
        console.error(error);
      }
    });
  }
}

module.exports = Crawler;
