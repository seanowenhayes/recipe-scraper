import puppeteer, { Page } from "https://deno.land/x/puppeteer@14.1.1/mod.ts";
import { EventEmitter } from "https://deno.land/x/event@2.0.0/mod.ts";

import { Config } from "../index.ts";
import { extractLinks } from "./extractions.ts";

type Events = {
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

  async #doCrawl(url: string) {
    this.#crawled.push(url);
    if (this.#page) {
      const page = this.#page;
      await page.goto(url);

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
      const nextUrl = this.#toCrawl.pop();
      nextUrl && await this.#doCrawl(nextUrl);
      this.emit("crawled", url);
    } else {
      this.emit("error", "Browser was not initialised");
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
