import { Crawler } from "./lib/crawler.ts";

interface Extractor {
  shouldExtract: (pageUrl: string) => boolean;
}
export interface LinkExtractor extends Extractor {
  linkExtraction: string;
}

export interface DetailExtractor extends Extractor {
  details: {
    [key: string]: string;
  };
}
export interface Config {
  crawl: {
    startUrl: string;
    linkExtractors: LinkExtractor[];
    detailExtractor: DetailExtractor;
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
        shouldExtract: (url) => {
          const rawUrl = new URL(url);
          if (rawUrl.pathname === "/recipes/category/ingredient/") {
            return true;
          }
          if (rawUrl.pathname.split("/").length === 4) {
            return true;
          }
          return false;
        },
      },
    ],
    detailExtractor: {
      details: {
        headline: "h1",
        subHeadline: "p.subheading",
        serves: ".recipe-detail.serves",
        time: ".recipe-detail.time",
        difficulty: ".recipe-detail.difficulty",
        calories: "li[title=Calories] .top",
        fat: "li[title=Fat] .top",
        saturates: "li[title=Saturates] .top",
        sugars: "li[title=Sugars] .top",
        salt: "li[title=Salt] .top",
        protein: "li[title=Protein] .top",
        carbohydrate: "li[title=Carbs] .top",
        fibre: "li[title=Fibre] .top",
        ingredients: ".ingred-list",
        method: "div.method-p > div",
      },
      shouldExtract: (url) => {
        const rawUrl = new URL(url);
        if (rawUrl.pathname.split("/").length === 5) {
          return true;
        }
        return false;
      },
    },
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
  crawler.on("data", (record) => console.log({ record }));
  await crawler.crawl();
})();
