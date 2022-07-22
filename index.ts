import puppeteer, { Page } from "https://deno.land/x/puppeteer@14.1.1/mod.ts";

const config = {
  crawl: {
    startUrl: "https://www.jamieoliver.com/recipes/category/ingredient/",
    linkExtractors: [
      {
        linkExtraction: "",
      },
    ],
  },
  crawler: {
    launchConfig: {
      headless: false,
    },
  },
} as const;

type LinkExtractor = (
  args: { page: Page; expression: string },
) => Promise<string[]>;

const extractLinks: LinkExtractor = async ({ page, expression }) => {
  const links = await page.$$(expression);
  if (links) {
    const hrefs = await Promise.all(links.map((link) => {
      return new Promise((resolve, reject) => {
        link.evaluate((a) => a.href).then((href) => resolve(href)).catch((e) =>
          reject(e)
        );
      });
    }));
    return hrefs as string[];
  }
  return [] as string[];
};

(async () => {
  const browser = await puppeteer.launch(config.crawler.launchConfig);
  const page = await browser.newPage();
  await page.goto(config.crawl.startUrl);

  console.log(page.url());
  const hrefs = await extractLinks({ page, expression: ".recipe-block a" });
  console.log({ hrefs });
  await browser.close();
})();
