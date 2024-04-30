import json
from setup import logging

def write_webpage(data, idx):
    """
    Write the webpage to a JSON file.
    """
    logging.info("Crawler.write_webpage")
    with open(f"../output/webpage_{idx}.json", "w") as file:
        file.write(json.dumps(data))
        logging.info(f"Data written to webpage_{idx}.json")


def write_webpages(webpages, completed_tasks, concurrent_requests, parser):
    """
    Iterate over the webpages and write them to JSON files.
    """
    for idx, webpage in enumerate(webpages):
        webpage_number = idx + completed_tasks - concurrent_requests + 1
        logging.info(f"Webpage {webpage_number}")
        if webpage:
            data = parser(webpage)
            write_webpage(data, webpage_number)