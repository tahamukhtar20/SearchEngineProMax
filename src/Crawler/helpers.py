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
