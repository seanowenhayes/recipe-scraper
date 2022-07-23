import puppeteer, {
  Browser,
} from "https://deno.land/x/puppeteer@14.1.1/mod.ts";
import { Config } from "../index.ts";
import { extractLinks } from "./extractions.ts";

export class Crawler {
  #crawl;
  #crawler;
  #toCrawl: Array<string> = [];
  #crawled: Array<string> = [];
  #browser?: Browser;

  constructor(config: Config) {
    this.#crawl = config.crawl;
    this.#crawler = config.crawler;
  }

  #addUrls(urls: string[]) {
    urls.forEach((url) => {
      if (this.#crawled.includes(url)) {
        // TODO: emit info duplicate url
      } else {
        this.#toCrawl.push(url);
      }
    });
  }

  async #doCrawl(url: string) {
    this.#crawled.push(url);
    if (this.#browser) {
      const page = await this.#browser.newPage();
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
    } else {
      // TODO: emit error browser not initialised.
    }
  }

  async crawl() {
    this.#browser = await puppeteer.launch(this.#crawler.launchConfig);
    await this.#doCrawl(this.#crawl.startUrl);
    await this.#browser.close();
  }
}
