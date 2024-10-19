import logging
import sys


def get_logger(name):
    logger = logging.getLogger(name)
    handler = logging.StreamHandler(sys.stdout)

    # Set the formatter and use UTF-8 encoding
    formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    handler.setFormatter(formatter)

    # Force UTF-8 encoding
    handler.setStream(sys.stdout)
    handler.stream.reconfigure(encoding='utf-8')

    logger.addHandler(handler)
    logger.setLevel(logging.INFO)  # Use INFO in production, DEBUG in development
    return logger
