import { Crawler } from "./lib/crawler.ts";

export interface Extractor {
  linkExtraction: string;
  shouldExtract: (pageUrl: string) => boolean;
}
export interface Config {
  crawl: {
    startUrl: string;
    linkExtractors: Extractor[];
  };
  crawler: {
    launchConfig: {
      headless: boolean;
    };
  };
}

const config: Config = {
  crawl: {
    startUrl: "https://www.jamieoliver.com/recipes/category/ingredient/",
    linkExtractors: [
      {
        linkExtraction: ".recipe-block a",
        shouldExtract: (url) =>
          url.startsWith("https://www.jamieoliver.com/recipes"),
      },
    ],
  },
  crawler: {
    launchConfig: {
      headless: false,
    },
  },
};

(async () => {
  const crawler = new Crawler(config);
  crawler.on(
    "start",
    (startUrl, date) => console.log({ startUrl, date }),
  );
  crawler.on(
    "finish",
    (urlsCrawled, date) => console.log({ urlsCrawled, date }),
  );
  crawler.on("crawled", (url) => console.log("crawled:", url));
  crawler.on("error", (error) => {
    console.log("Error", error);
  });
  crawler.on("info", (tag, info) => {
    console.log("info", tag, info);
  });
  await crawler.crawl();
})();
