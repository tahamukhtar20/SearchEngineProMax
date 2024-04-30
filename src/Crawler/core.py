import asyncio
import pyppeteer
from setup import logging
from Base.core import Base
from bs4 import BeautifulSoup
from Crawler.helpers import write_webpages
# from requests_html import AsyncHTMLSession

class Crawler(Base):
    def __init__(self):
        """
        Initialize the Crawler class.
        """
        logging.info("Crawler.__init__")
        super().__init__()
        self.concurrent_requests = 20
        self.completed_tasks = 0


    async def start(self):
        """
        Start the crawler.
        """
        logging.info("Crawler.start")
        for i in range(0, len(self.URLS), self.concurrent_requests):
            curr_urls = self.URLS[i:i+self.concurrent_requests]
            webpages = await asyncio.gather(*[Crawler.crawl(url) for url in curr_urls])
            webpages = [webpage for webpage in webpages if webpage]
            self.completed_tasks += self.concurrent_requests
            logging.info(f"{self.completed_tasks} Webpages crawled.")
            write_webpages(webpages, self.completed_tasks, self.concurrent_requests, Crawler.parse)


    @staticmethod
    async def crawl(url):
        """
        Crawl the web.
        """
        logging.info("Crawler.crawl")
        logging.info(f"Crawling {url}...")
        html = None
        try:
            browser = await pyppeteer.launch()
            page = await browser.newPage()
            await page.goto(url)
            html = await page.content()
        except Exception as e:
            logging.error(f"Error: {e}")
        finally:
            if browser:
                await browser.disconnect()
                await browser.close()

        return html
        

    @staticmethod
    def parse(html):
        """
        Parse the HTML.
        """
        logging.info("Crawler.parse")
        soup = BeautifulSoup(html, "html.parser")
        title = soup.title.string if soup.title else ""
        description = soup.find("meta", attrs={"name": "description"})
        description = description["content"] if description else ""
        keywords = soup.find("meta", attrs={"name": "keywords"})
        keywords = keywords["content"] if keywords else ""
        content_tags = ["p", "h1", "h2", "h3", "h4", "h5", "h6", "a", "li"]
        content = {tag: [item.text for item in soup.find_all(tag)] for tag in content_tags}
        return {"title": title, "description": description, "keywords": keywords, "content": content}
