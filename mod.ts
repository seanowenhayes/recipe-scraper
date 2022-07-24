import puppeteer, { Page } from "https://deno.land/x/puppeteer@14.1.1/mod.ts";
import { EventEmitter } from "https://deno.land/x/event@2.0.0/mod.ts";

import { extractLinks } from "./lib/extractions.ts";

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

type Events = {
  data: [Record<string, string>];
  start: [string, Date];
  crawled: [string];
  info: [string, string];
  error: [string];
  finish: [string[], Date];
};

export class Crawler extends EventEmitter<Events> {
  #crawl;
  #crawler;
  #toCrawl: Array<string> = [];
  #crawled: Array<string> = [];
  #page?: Page;

  constructor(config: Config) {
    super();
    this.#crawl = config.crawl;
    this.#crawler = config.crawler;
  }

  #addUrls(urls: string[]) {
    urls.forEach((url) => {
      if (this.#crawled.includes(url)) {
        this.emit("info", "Duplicate url", url);
      } else {
        this.#toCrawl.push(url);
      }
    });
  }

  async #extractLinks() {
    const page = this.#page as Page;
    const allHrefs = await Promise.all(
      this.#crawl.linkExtractors.map((extractor) =>
        new Promise((resolve) => {
          if (extractor.shouldExtract(page.url())) {
            resolve(extractLinks({
              page,
              expression: extractor.linkExtraction,
            }));
          }
          resolve([] as string[]);
        })
      ),
    ) as string[];
    this.#addUrls(allHrefs.flat());
  }

  async #extractDetails() {
    const page = this.#page as Page;
    const shouldExtract = this.#crawl.detailExtractor.shouldExtract(page.url());
    if (shouldExtract) {
      const details = this.#crawl.detailExtractor.details;
      const extraction = await Promise.all(
        Object.keys(details).map(async (key) => {
          const result = await page.$(details[key]);
          const detail = await result?.evaluate((div) => div.innerText);
          return [key, detail];
        }),
      );
      this.emit("data", Object.fromEntries(extraction));
    }
  }

  async #doCrawl(url: string) {
    try {
      this.#crawled.push(url);
      if (this.#page) {
        const page = this.#page;
        await page.goto(url);
        await this.#extractLinks();
        await this.#extractDetails();
        this.emit("crawled", url);
      } else {
        this.emit("error", "Page was not initialised");
      }
    } catch (error) {
      this.emit("error", error.toString());
    } finally {
      const nextUrl = this.#toCrawl.pop();
      nextUrl && await this.#doCrawl(nextUrl);
    }
  }

  async crawl() {
    this.emit("start", this.#crawl.startUrl, new Date());
    const browser = await puppeteer.launch(this.#crawler.launchConfig);
    this.#page = await browser.newPage();
    await this.#doCrawl(this.#crawl.startUrl);
    await browser.close();
    this.emit("finish", this.#crawled, new Date());
  }
}
