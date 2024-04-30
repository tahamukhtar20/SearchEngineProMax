import asyncio
from Crawler.core import Crawler

if __name__ == "__main__":
    crawler = Crawler()
    asyncio.run(crawler.start())