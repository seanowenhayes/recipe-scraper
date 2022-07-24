# Recipe Scraper

A simple scraper made for scraping recipes but not limited to such.

## Idea
Use puppeteer to crawl using an actual browser and have events that inform of the status of the call.

## Config
The way to configure a crawler.

* `crawl`
    * `startUrl` where the crawl should start
    * `linkExtractors` array
        * `linkExtraction` css selector for links to follow
        * `shouldExtract` function taking the page url deciding if to use this extractor or not
    * `detailExtractor`
        * `details` key value map key is key of data extarcted and the value is a css selector to get the text to be extracted by that key
        * `shouldExtract` takes the page url and decides if to extract data or not

## Events
* `data` fires witha record of data extracted.
* `start` fires when crawl starts with start url and the date
* `crawled` fires with the url of the crawled page
* `info` tag and message, just misscelaneous info
* `error` fires when something unexpected happens
* `finnish` fires at the end with all crawled urls and the date finished

