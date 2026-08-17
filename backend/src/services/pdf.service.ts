import puppeteer from "puppeteer";

export const generatePdfFromHtml = async (
  html: string
): Promise<Buffer> => {
  const browser = await puppeteer.launch({
    headless: true
  });

  try {
    const page = await browser.newPage();

    await page.setContent(html, {
      waitUntil: "domcontentloaded"
    });

    await page.evaluate(async () => {
      const images = Array.from(document.images);

      await Promise.all(
        images.map((image) => {
          if (image.complete) {
            return Promise.resolve();
          }

          return new Promise<void>((resolve) => {
            image.addEventListener("load", () => resolve(), {
              once: true
            });

            image.addEventListener("error", () => resolve(), {
              once: true
            });
          });
        })
      );

      if (document.fonts) {
        await document.fonts.ready;
      }
    });

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "0mm",
        right: "0mm",
        bottom: "0mm",
        left: "0mm"
      }
    });

    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
};