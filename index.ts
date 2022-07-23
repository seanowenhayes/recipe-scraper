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
          url === "https://www.jamieoliver.com/recipes/category/ingredient/",
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
  await crawler.crawl();
})();
