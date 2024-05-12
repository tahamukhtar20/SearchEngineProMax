const puppeteer = require("puppeteer-extra");
const { load } = require("cheerio");
const { writeFile } = require("fs");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const { Semaphore } = require("await-semaphore");
const natural = require("natural");
const tokenizer = new natural.WordTokenizer();
const stopWords = require("stopwords").english;
const stemmer = natural.PorterStemmer;

const { Base } = require("./Base");
const { TimeoutError } = require("puppeteer");

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
        this.browser = await puppeteer.launch({
          headless: true
        });
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

    await Crawler.semaphoreHandling(this.semaphore, async () => {
      try {
        console.log("Crawler.crawl");
        const resourceTypesToSkip = ["image", "media", "stylesheet", "font"];

        page = await this.browser.newPage();
        await page.setRequestInterception(true);
        page.on("request", (request) => {
          if (request.isInterceptResolutionHandled()) return;
          if (resourceTypesToSkip.includes(request.resourceType())) request.abort();
          else request.continue();
        });
        await page.goto(url, { timeout: 60000 });
        await page.waitForSelector("body");

        content = await page.content();

        if (!content) throw new Error("ContentError");
        if (this.titlesToSkip.some((title) => content.includes(title))) throw new Error("CaptchaError");

        const parsedContent = await this.parseContent(content, url);
        if (!parsedContent) throw new Error("ContentError");

        this.completedTasks++;
        this.saveContent(parsedContent);

        console.log("Crawled Page Count: ", this.completedTasks);
        console.log("Crawled Page: ", url);
      } catch (error) {
        this.failedTasks++;
        if (error instanceof TimeoutError) console.error("TimeoutError: ", url, "\n Failed Page Count: ", this.failedTasks);
        if (error.message === "CaptchaError") console.error("CaptchaError: ", url);
        if (error.message === "ContentError") console.error("ContentError: ", url);
        else Crawler.logErrorFile(error, url);
      } finally {
        if (page) await page.close();
      }
    });
  }

  sanitizeContent(content) {
    console.log("Crawler.sanitize");
    content = content.replace(/<(style|noscript|svg|iframe|form|input|button|select|textarea|canvas|audio|video|map|area|track|source)\b[^>]*>.*?<\/\1>/g, "");
    content = content.replace(/<(h1|h2|p|h3|h4|h5|h6|a|li|td|th)[^>]*>(.*?)<\/\1>/g, function (_match, tag, innerContent) {
      innerContent = innerContent.replace(/<[^>]*>/g, " ");
      return "<" + tag + ">" + innerContent + "</" + tag + ">";
    });
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
      Crawler.textMining(el, $, contentData["doc"]);
    });
    headingEls.forEach((el) => {
      Crawler.textMining(el, $, contentData["headings"]);
    });

    contentData["doc"] = this.processTextArray(contentData["doc"]);
    contentData["headings"] = this.processTextArray(contentData["headings"]);
    const currUrl = new URL(url);
    $("a").each(async (_, element) => {
      const href = $(element).attr("href");
      if (!href) return true;
      try {
        const url = new URL(href);
        if (!href.startsWith("http") || !href.startsWith("https") || href.startsWith("#") || href.startsWith("javascript:") || href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("/") || url.hostname === currUrl.hostname || url.hostname === "www." + currUrl.hostname || url.hostname === "http://" + currUrl.hostname || url.hostname === "https://" + currUrl.hostname) return;
        const baseLink = url.protocol + "//" + url.hostname;
        forwardLinks.add(baseLink);
        const semaphore = new Semaphore(1);
        await Crawler.semaphoreHandling(semaphore, async () => {
          if (this.forwardLinksBuffer.size < 900) return;
          this.writeForwardLinksBuffer();
          this.forwardLinksBuffer.clear();
        });
        this.forwardLinksBuffer.add(baseLink);
      } catch (error) {
        if (error instanceof TypeError) return;
        else Crawler.logErrorFile(error, url);
      }
    });

    return {
      doc: contentData["doc"],
      headings: contentData["headings"],
      url: url,
      previewTitle: title,
      preview: preview,
      forwardLinks: forwardLinks.size > 0 ? Array.from(forwardLinks) : []
    };
  }

  processTextArray(textArray) {
    const text = (textArray.flat().join(" ") || "").replace(/\s+/g, " ");
    const textLower = text.toLowerCase();
    const textWithoutPunctuation = textLower.replace(/[^\w\s]/g, " ");
    const tokens = tokenizer.tokenize(textWithoutPunctuation);
    const filteredTokens = tokens.filter((token) => !stopWords.includes(token));
    const lenFilteredTokens = filteredTokens.filter((token) => token.length >= 2 && token.length <= 32);
    const lemmitizeTokens = this.lemmitizeTokens(lenFilteredTokens);
    return lemmitizeTokens.map((token) => stemmer.stem(token));
  }

  lemmitizeTokens(tokens) {
    return tokens.map((token) => (this.lemmatizeMap[token] ? this.lemmatizeMap[token] : token));
  }

  async saveContent(content) {
    console.log("Crawler.save");
    const fileName = `../output/${this.completedTasks}.json`;
    const stringContent = JSON.stringify(content);
    writeFile(fileName, stringContent, Crawler.logError);
  }

  writeForwardLinksBuffer() {
    console.log("Crawler.writeForwardLinksBuffer");
    const forwardLinks = JSON.stringify(Array.from(this.forwardLinksBuffer));
    const filePath = `../dataset/splitupDataset/dataset_${++this.maxIndex}.json`;
    writeFile(filePath, forwardLinks, Crawler.logError);
  }

  static textMining(el, $, contentData) {
    $(el).each((_, element) => {
      const text = $(element).text();
      contentData.push(text);
    });
  }

  static async semaphoreHandling(semaphore, callback) {
    return await semaphore.acquire().then(async (release) => {
      try {
        await callback();
      } catch (e) {
        console.error("Error in semaphoreHandling");
      } finally {
        release();
      }
    });
  }

  static logErrorFile(error, url = "") {
    const logFile = `../logs/${Date.now()}-${url.replace(/(^\w+:|^)\/\//, "").replace(/\//g, "-")}.log`;
    console.error("Some Error Occurred, please check logs for more details: ", logFile);
    const stringError = String(error);
    writeFile(logFile, stringError, Crawler.logError);
  }

  static logError(error = null) {
    if (error) {
      console.error(error);
    }
  }
}

module.exports = Crawler;
