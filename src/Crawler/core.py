import json
import asyncio
from setup import logging
from Crawler.helpers import write_webpages
from Base.core import Base
from bs4 import BeautifulSoup
from requests_html import AsyncHTMLSession

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
        curr_urls = self.URLS[self.completed_tasks:self.completed_tasks+self.concurrent_requests]
        while self.completed_tasks < len(self.URLS):
            webpages = await asyncio.gather(*[Crawler.crawl(url) for url in curr_urls])
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
        try:
            session = AsyncHTMLSession()
            response = await session.get(url)
            await response.html.arender(timeout=60)
            html = response.html.html
            return html
        except Exception as e:
            logging.error(f"Error: {e}")
            return None

    @staticmethod
    def parse(html):
        """
        Parse the HTML.
        """
        logging.info("Crawler.parse")
        soup = BeautifulSoup(html, "html.parser")
        title = soup.title.string
        description = soup.find("meta", attrs={"name": "description"})
        description = description["content"] if description else ""
        keywords = soup.find("meta", attrs={"name": "keywords"})
        keywords = keywords["content"] if keywords else ""
        content_tags = ["p", "h1", "h2", "h3", "h4", "h5", "h6", "a", "li", "span", "div", "section", "article", "header"]
        content = {tag: [item.text for item in soup.find_all(tag)] for tag in content_tags}
        return {"title": title, "description": description, "keywords": keywords, "content": content}
