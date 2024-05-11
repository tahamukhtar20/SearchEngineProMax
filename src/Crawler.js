const puppeteer = require("puppeteer-extra");
const { load } = require("cheerio");
const { writeFile } = require("fs");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const { Semaphore } = require("await-semaphore");
const natural = require("natural");
const tokenizer = new natural.WordTokenizer();
const stopWords = require("stopwords").english;
const stemmer = natural.PorterStemmer;

const Base = require("./Base");

class Crawler extends Base {
  constructor() {
    super();
    console.log("Crawler.contructor");
    this.concurrentRequests = 30;
    this.completedTasks = 0;
    this.allTasks = 0;
    this.failedTasks = 0;
    this.forwardLinksBuffer = new Set();
    this.semaphore = new Semaphore(this.concurrentRequests);
    this.browser = null;
  }

  async start() {
    console.log("Crawler.start");
    puppeteer.use(StealthPlugin());
    while (this.urls.length > 0) {
      const urls = this.urls;
      const chunkSize = 150;
      const chunks = [];
      for (let i = 0; i < urls.length; i += chunkSize) {
        chunks.push(urls.slice(i, i + chunkSize));
      }
      for (let i = 0; i < chunks.length; i++) {
        if (this.browser) {
          await new Promise((resolve) => setTimeout(resolve, 61000));
          this.browser.close();
          console.log("Crawled Page Count: ", this.completedTasks);
          console.log("Failed Page Count: ", this.failedTasks);
          console.log("Total Page Count: ", this.allTasks);
          console.log("Crawler.start: Chunk ", i + 1, " of ", chunks.length);
        }
        const currChunk = chunks[i];
        this.browser = await puppeteer.launch({ headless: true });
        await Promise.all(currChunk.map((url) => this.crawl(url)));
      }
      this.requestData();
    }

    await this.browser.close();
  }

  async crawl(url) {
    this.allTasks++;
    let page = null;
    let content = null;
    await this.semaphore.acquire().then(async (release) => {
      try {
        console.log("Crawler.crawl");
        page = await this.browser.newPage();
        await page.setRequestInterception(true);
        page.on("request", (request) => {
          if (request.isInterceptResolutionHandled()) return;
          switch (request.resourceType()) {
            case "image":
            case "media":
            case "stylesheet":
            case "font":
              request.abort();
              break;
            default:
              request.continue();
          }
        });
        await page.goto(url, { timeout: 60000 });
        await page.waitForSelector("body");
        content = await page.content();
      } catch (error) {
        if (error.name === "TimeoutError") {
          this.failedTasks++;
          console.error("TimeoutError: ", url);
        } else {
          Crawler.logError(error, url);
        }
      } finally {
        if (page) {
          await page.close();
        }
      }
      try {
        if (content) {
          if (this.titlesToSkip.some((title) => content.includes(title))) {
            this.failedTasks++;
            console.error("Captcha Found: ", url);
            return;
          }
          const parsedContent = await this.parseContent(content, url);
          if (parsedContent) {
            this.completedTasks++;
            this.saveContent(parsedContent);
            console.log("Crawled Page Count: ", this.completedTasks);
            console.log("Crawled Page: ", url);
          }
        }
      } catch (error) {
        this.failedTasks++;
        console.error("Error while parsing content", error);
      } finally {
        release();
      }
    });
  }

  sanitizeContent(content) {
    console.log("Crawler.sanitize");
    content = content.replace(
      /<(style|noscript|svg|iframe|form|input|button|select|textarea|canvas|audio|video|map|area|track|source)\b[^>]*>.*?<\/\1>/g,
      ""
    );
    content = content.replace(
      /<(h1|h2|p|h3|h4|h5|h6|a|li|td|th)[^>]*>(.*?)<\/\1>/g,
      function (_match, tag, innerContent) {
        innerContent = innerContent.replace(/<[^>]*>/g, " ");
        return "<" + tag + ">" + innerContent + "</" + tag + ">";
      }
    );
    return content;
  }

  async parseContent(content, url) {
    console.log("Crawler.parse");
    const sanitizedContent = this.sanitizeContent(content);
    const $ = load(sanitizedContent);
    const lang = $("html").attr("lang");
    if (lang && lang !== "en") return;
    const title = $("title").text() || "Untitled Page";
    const description = $('meta[name="description"]').attr("content") || "";
    const keywords = $('meta[name="keywords"]').attr("content") || "";
    const headingEls = ["h1", "h2"];
    const contentMineEls = ["p", "h3", "h4", "h5", "h6", "a", "li", "td", "th"];
    const contentData = {};
    const preview = description ? description : "No preview available";
    const forwardLinks = new Set();
    contentData["doc"] = [];
    contentData["headings"] = [];
    contentData["headings"].push(title);
    contentData["headings"].push(description);
    contentData["headings"].push(keywords);

    contentMineEls.forEach((el) => {
      $(el).each((_, element) => {
        const text = $(element).text();
        contentData["doc"].push(text);
      });
    });
    headingEls.forEach((el) => {
      $(el).each((_, element) => {
        const text = $(element).text();
        contentData["headings"].push(text);
      });
    });
    contentData["doc"] = this.processTextArray(contentData["doc"]);
    contentData["headings"] = this.processTextArray(contentData["headings"]);
    const currUrl = new URL(url);
    $("a").each((_, element) => {
      const href = $(element).attr("href");
      if (href) {
        try {
          const url = new URL(href);
          if (
            href.startsWith("#") ||
            href.startsWith("javascript:") ||
            href.startsWith("mailto:") ||
            href.startsWith("tel:") ||
            href.startsWith("/") ||
            url.hostname === currUrl.hostname ||
            url.hostname === "www." + currUrl.hostname ||
            url.hostname === "http://" + currUrl.hostname ||
            url.hostname === "https://" + currUrl.hostname
          )
            return;
          const baseLink = url.protocol + "//" + url.hostname;
          forwardLinks.add(baseLink);
          if (this.forwardLinksBuffer.size >= 1000) {
            this.writeForwardLinksBuffer();
            this.forwardLinksBuffer.clear();
          }
          this.forwardLinksBuffer.add(baseLink);
        } catch (error) {
          if (error instanceof TypeError) {
            return;
          } else {
            Crawler.logError(error, url);
          }
        }
      }
    });

    return {
      doc: contentData["doc"],
      headings: contentData["headings"],
      url: url,
      previewTitle: title,
      preview: preview,
      forwardLinks: forwardLinks.size > 0 ? Array.from(forwardLinks) : [],
    };
  }

  processTextArray(textArray) {
    const text = (textArray.flat().join(" ") || "").replace(/\s+/g, " ");
    const textLower = text.toLowerCase();
    const textWithoutPunctuation = textLower.replace(/[^\w\s]/g, " ");
    const tokens = tokenizer.tokenize(textWithoutPunctuation);
    const filteredTokens = tokens.filter((token) => !stopWords.includes(token));
    const lenFilteredTokens = filteredTokens.filter(
      (token) => token.length >= 2 && token.length <= 32
    );
    const lemmitizeTokens = this.lemmitizeTokens(lenFilteredTokens);
    return lemmitizeTokens.map((token) => stemmer.stem(token));
  }

  lemmitizeTokens(tokens) {
    return tokens.map((token) => {
      if (this.lemmatizeMap[token]) {
        return this.lemmatizeMap[token];
      }
      return token;
    });
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

  static logError(error, url = "") {
    const logFile = `../logs/${Date.now()}-${url
      .replace(/(^\w+:|^)\/\//, "")
      .replace(/\//g, "-")}.log`;
    console.error(
      "Some Error Occurred, please check logs for more details: ",
      logFile
    );
    writeFile(logFile, String(error), (errorWrite) => {
      if (errorWrite) {
        console.error(errorWrite);
      }
    });
  }

  writeForwardLinksBuffer() {
    console.log("Crawler.writeForwardLinksBuffer");
    writeFile(
      `../dataset/splitupDataset/dataset_${++this.maxIndex}.json`,
      JSON.stringify(Array.from(this.forwardLinksBuffer)),
      (error) => {
        if (error) {
          console.error(error);
        }
      }
    );
  }
}

module.exports = Crawler;
