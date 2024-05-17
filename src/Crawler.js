// local imports
const { Base } = require("./Base");
const { BloomFilter } = require("./BloomFilter");

// puppeteer imports
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const { TimeoutError } = require("puppeteer");

// other imports
const natural = require("natural");
const stopWords = require("stopwords").english;
const { readFileSync } = require("fs");
const { load } = require("cheerio");
const { writeFile } = require("fs");
const { Semaphore } = require("await-semaphore");

// tokenizer and stemmer
const tokenizer = new natural.WordTokenizer();
const stemmer = natural.PorterStemmer;

class Crawler extends Base {
  constructor() {
    super();
    console.log("Crawler.contructor");
    // using puppeteer-extra to add stealth plugin to avoid detection for websites such as Reddit or Twitter
    puppeteer.use(StealthPlugin());
    this.bFilter = new BloomFilter();
    this.concurrentRequests = 30;
    this.completedTasks = 0;
    this.allTasks = 0;
    this.failedTasks = 0;
    this.forwardLinksBuffer = new Set();

    // semaphore to limit the number of concurrent requests
    this.semaphore = new Semaphore(this.concurrentRequests);

    // browser instance
    this.browser = null;
  }

  /**
   * Start the crawling process
   * Read the dataset fragments and process each URL
   * Create a new browser instance for each fragment
   * @param: None
   * @return: None
   */
  async start() {
    console.log("Crawler.start");

    let dataCount = 0; // for keeping count of the fragment of dataset
    let dataRemaining = true; // for checking if there is any data left to process

    while (dataRemaining) {
      // loop through the dataset fragments
      try {
        const datasetSlice = JSON.parse(
          readFileSync(`../dataset/splitupDataset/dataset_${dataCount++}.json`, "utf8")
        );

        this.browser = await puppeteer.launch({
          headless: true
        });

        // initiate the crawling process for each URL in the fragment asynchronously
        await Promise.all(datasetSlice.map((url) => this.crawl(url)));
        this.bFilter.save_filter_to_txt();
      } catch (e) {
        // if there is no more data to process, exit the loop
        dataRemaining = false;
        console.error("Crawler.start: No more data to process");
        console.error("Crawler.start: Exiting");
      } finally {
        if (this.browser) {
          await this.browser.close();
        } // close the browser instance
      }
    }
  }

  /**
   * Crawl the URL and extract the content
   * @param: URL
   * @return: None
   */
  async crawl(url) {
    this.allTasks++; // increment the total number of tasks

    // variables to store the page and content
    let page = null;
    let content = null;

    // not interested in these resource types
    const resourceTypesToSkip = ["image", "media", "stylesheet", "font"];

    // acquire the semaphore to limit the number of concurrent requests
    await Crawler.semaphoreHandling(this.semaphore, async () => {
      try {
        console.log("Crawler.crawl");

        // create a new page instance
        page = await this.browser.newPage();

        // intercept the requests to skip the resource types
        await page.setRequestInterception(true);

        // handle the requests
        page.on("request", (request) => {
          // skip if already handled
          if (request.isInterceptResolutionHandled()) {
            return;
          }

          // abort the request if it is of the resource types to skip
          if (resourceTypesToSkip.includes(request.resourceType())) {
            request.abort();
          }
          // continue the request otherwise
          else {
            request.continue();
          }
        });

        // navigate to the URL and wait for the body to load
        await page.goto(url, { timeout: 60000 });
        await page.waitForSelector("body");

        // get the content of the page
        content = await page.content();

        // throw an error if the content is empty
        if (!content) {
          throw new Error("ContentError");
        }

        // throw an error if the content contains the titles to skip
        // titles to skip are the ones that are recognized as captchas
        if (this.titlesToSkip.some((title) => content.includes(title))) {
          throw new Error("CaptchaError");
        }

        // parse the content
        const parsedContent = await this.parseContent(content, url);

        // throw an error if the parsed content is empty
        if (!parsedContent) {
          throw new Error("ContentError");
        }

        // save the content
        this.completedTasks++;
        this.saveContent(parsedContent);

        console.log("Crawled Page Count: ", this.completedTasks);
        console.log("Crawled Page: ", url);
      } catch (error) {
        // log the error and increment the failed tasks count
        this.failedTasks++;
        if (error instanceof TimeoutError) {
          console.error("TimeoutError: ", url);
        } else if (error.message === "CaptchaError") {
          console.error("CaptchaError: ", url);
        } else if (error.message === "ContentError") {
          console.error("ContentError: ", url);
          console.error("Failed Page Count: ", this.failedTasks);
        } else {
          Crawler.logErrorFile(error, url);
        }
      } finally {
        // close the page instance
        if (page) {
          await page.close();
        }
      }
    });
  }

  /**
   * Sanitize the content
   * Remove the unnecessary tags and their child nodes
   * @param: content
   * @returns: sanitized content
   */
  sanitizeContent(content) {
    console.log("Crawler.sanitize");

    // list of tag names which are not needed
    let tagNames = [
      "style",
      "script",
      "noscript",
      "svg",
      "iframe",
      "form",
      "input",
      "button",
      "select",
      "textarea",
      "canvas",
      "audio",
      "video",
      "map",
      "area",
      "track",
      "source"
    ];
    let regexPattern = new RegExp("<(" + tagNames.join("|") + ")\\b[^>]*>.*?<\\/\\1>", "g");
    content = content.replace(regexPattern, "");

    // remove child nodes of these tags and leave those with text content
    tagNames = ["h1", "h2", "h3", "h4", "h5", "h6", "p", "a", "li", "td", "th"];
    regexPattern = new RegExp("<(" + tagNames.join("|") + ")[^>]*>(.*?)<\\/\\1>", "g");

    // replace the tags with their inner content
    content = content.replace(regexPattern, function (_match, tag, innerContent) {
      innerContent = innerContent.replace(/<[^>]*>/g, " ");
      return "<" + tag + ">" + innerContent + "</" + tag + ">";
    });

    // remove all the tags except the ones in the tagNames list
    return content;
  }

  async parseContent(content, url) {
    console.log("Crawler.parse");
    const contentData = {};
    contentData["doc"] = [];
    contentData["headings"] = [];
    const forwardLinks = new Set();

    // element for headings and content
    const headingEls = ["h1", "h2"];
    const contentMineEls = ["p", "h3", "h4", "h5", "h6", "a", "li", "td", "th"];

    // exclude the forward URLs with these prefixes
    const includedPrefixes = ["http:", "https:"];

    // sanitize the html content before mining the text
    const sanitizedContent = this.sanitizeContent(content);

    // load the content using cheerio
    const $ = load(sanitizedContent);

    // if the language is not mentioned or is not English, return
    const lang = $("html").attr("lang");
    if (lang && lang !== "en") {
      return;
    }

    // extract the title, description, keywords, and a preview to show as search results
    const title = $("title").text() || "Untitled Page";
    const description = $('meta[name="description"]').attr("content") || "";
    const keywords = $('meta[name="keywords"]').attr("content") || "";
    const preview = description ? description : "No preview available";
    contentData["headings"].push(title);
    contentData["headings"].push(description);
    contentData["headings"].push(keywords);

    // extract the content and headings
    Crawler.textMining(contentMineEls, $, contentData["doc"]);
    Crawler.textMining(headingEls, $, contentData["doc"]);

    // process the text data
    contentData["doc"] = this.processTextArray(contentData["doc"]);
    contentData["headings"] = this.processTextArray(contentData["headings"]);

    // extract the forward links
    const currUrl = new URL(url);
    $("a").each(async (_, element) => {
      const excludedHostnames = new Set([
        currUrl.hostname,
        "www." + currUrl.hostname,
        "http://" + currUrl.hostname,
        "https://" + currUrl.hostname
      ]);
      const href = $(element).attr("href");
      if (!href) return true;
      try {
        const url = new URL(href);
        if (
          includedPrefixes.some((prefix) => !href.startsWith(prefix)) ||
          href.startsWith("#") ||
          href.startsWith("/") ||
          excludedHostnames.has(url.hostname)
        ) {
          return;
        }

        // add the base link to the forward links
        const baseLink = url.protocol + "//" + url.hostname;
        forwardLinks.add(baseLink);
        const semaphore = new Semaphore(1);
        if (this.forwardLinksBuffer.size >= 1000) {
          await Crawler.semaphoreHandling(semaphore, async () => {
            this.writeForwardLinksBuffer();
            this.forwardLinksBuffer.clear();
            if (!this.bFilter.check_filter(baseLink)) {
              this.forwardLinksBuffer.add(baseLink);
              this.bFilter.hash_url_to_bit_array(baseLink);
            }
          });
        }

        this.forwardLinksBuffer.add(baseLink);
      } catch (error) {
        if (error instanceof TypeError) {
          return;
        } else {
          Crawler.logErrorFile(error, url);
        }
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

  /**
   * Process the text array
   * Tokenize the text, remove the stop words, and lemmatize the tokens
   * @param: textArray
   * @returns: processed text array
   */
  processTextArray(textArray) {
    // join the text array and remove the extra spaces
    const text = (textArray.flat().join(" ") || "").replace(/\s+/g, " ");

    // convert the text to lowercase and remove the punctuation
    const textLower = text.toLowerCase();
    const textWithoutPunctuation = textLower.replace(/[^\w\s]/g, " ");

    // tokenize the text and remove the stop words
    const tokens = tokenizer.tokenize(textWithoutPunctuation);
    const filteredTokens = tokens.filter((token) => !stopWords.includes(token));

    // remove the tokens with length less than 2 and greater than 32
    const lenFilteredTokens = filteredTokens.filter(
      (token) => token.length >= 2 && token.length <= 32
    );

    // lemmatize the tokens and stem them
    const lemmitizeTokens = lenFilteredTokens.map((token) =>
      this.lemmatizeMap[token] ? this.lemmatizeMap[token] : token
    );
    return lemmitizeTokens.map((token) => stemmer.stem(token));
  }

  /**
   *
   * @param: content
   * @returns: None
   */
  async saveContent(content) {
    console.log("Crawler.save");
    const fileName = `../output/${this.completedTasks}.json`;
    const stringContent = JSON.stringify(content);
    writeFile(fileName, stringContent, Crawler.logError);
  }

  /**
   * Write the forward links buffer to the file
   * @param: None
   * @returns: None
   */
  writeForwardLinksBuffer() {
    console.log("Crawler.writeForwardLinksBuffer");
    const forwardLinks = JSON.stringify(Array.from(this.forwardLinksBuffer));
    const filePath = `../dataset/splitupDataset/dataset_${++this.maxIndex}.json`;
    writeFile(filePath, forwardLinks, Crawler.logError);
  }

  /**
   * Extract the text from the elements
   * @param: elements, cheerio, contentData
   * @returns: None
   */
  static textMining(els, $, contentData) {
    els.forEach((el) => {
      $(el).each((_, element) => {
        const text = $(element).text();
        contentData.push(text);
      });
    });
  }

  /**
   * Handle the semaphore for the concurrent requests
   * @param: semaphore, callback
   * @returns: None
   */
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

  /**
   * Log the error to the file
   * @param: error, url
   * @returns: None
   */
  static logErrorFile(error, url = "") {
    const logFile = `../logs/${Date.now()}-${url
      .replace(/(^\w+:|^)\/\//, "")
      .replace(/\//g, "-")}.log`;
    console.error("Error Occurred, please check logs for more details: ", logFile);
    const stringError = String(error);
    writeFile(logFile, stringError, Crawler.logError);
  }

  /**
   * Log the error to the console
   * @param: error
   * @returns: None
   */
  static logError(error = null) {
    if (error) {
      console.error(error);
    }
  }
}

module.exports = Crawler;
