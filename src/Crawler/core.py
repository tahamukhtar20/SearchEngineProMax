import asyncio
import pyppeteer
from setup import logging
from Base.core import Base
from bs4 import BeautifulSoup
from Crawler.helpers import write_webpage

class Crawler(Base):
    def __init__(self):
        """
        Initialize the Crawler class.
        """
        logging.info("Crawler.__init__")
        super().__init__()
        self.concurrent_requests = 5
        self.completed_tasks = 0
        self.semaphore = asyncio.Semaphore(self.concurrent_requests)
        self.browser = None


    async def start(self):
        """
        Start the crawler.
        """
        logging.info("Crawler.start")
        self.browser = await pyppeteer.launch()
        try:
            tasks = [asyncio.ensure_future(self.crawl(url)) for url in self.URLS]
            await asyncio.gather(*tasks)
        except Exception as e:
            logging.error(f"Error: {e}")
        finally:
            if self.browser:
                await self.browser.disconnect()
                await self.browser.close()


    async def crawl(self, url):
        """
        Crawl the web.
        """
        async with self.semaphore:
            logging.info("Crawler.crawl")
            logging.info(f"Crawling {url}...")
            html = None
            try:
                page = await self.browser.newPage()
                await page.goto(url)
                html = await page.content()
            except Exception as e:
                logging.error(f"Error: {e}")
            finally:
                if page:
                    await page.close()

            if html:
                webpage = Crawler.parse(html)
                if webpage:
                    self.completed_tasks += 1
                    logging.info(f"{self.completed_tasks} Webpages crawled.")
                    write_webpage(webpage, self.completed_tasks)
        

    @staticmethod
    def parse(html):
        """
        Parse the HTML.
        """
        logging.info("Crawler.parse")
        soup = BeautifulSoup(html, "html.parser")
        title = soup.title.string if soup.title else ""
        titles_to_skip = [
            "",
            "Blocked", 
            "403 Forbidden", 
            "404 Not Found", 
            "403 Forbidden Request", 
            "403 Forbidden Error", 
            "Access to this page has been denied", 
            "Access Denied",
            "Just a moment...",
            "Attention Required! | Cloudflare",
            "Please wait...",
            "503 Service Temporarily Unavailable",
            "Service Unavailable",
            "Robot or human?"
            ]
        description = soup.find("meta", attrs={"name": "description"})
        description = description["content"] if description else ""
        keywords = soup.find("meta", attrs={"name": "keywords"})
        keywords = keywords["content"] if keywords else ""
        content_tags = ["p", "h1", "h2", "h3", "h4", "h5", "h6", "a", "li"]
        content = {tag: [item.text for item in soup.find_all(tag)] for tag in content_tags}
        if (title in titles_to_skip) or (any([str(i) in title.split(" ") for i in range(400, 600)])):
            return None
        return {"title": title, "description": description, "keywords": keywords, "content": content}
