import { Page } from "https://deno.land/x/puppeteer@14.1.1/mod.ts";

export type LinkExtractor = (
  args: { page: Page; expression: string },
) => Promise<string[]>;

export const extractLinks: LinkExtractor = async ({ page, expression }) => {
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
