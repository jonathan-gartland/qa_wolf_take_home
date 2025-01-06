// EDIT THIS FILE TO COMPLETE ASSIGNMENT QUESTION 1
const { chromium } = require("playwright");
const assert = require("assert");

// convenient constants, that would be set/collected from .env* files using process.env
// but are hard coded here for simplicity
const MAX_ARTICLES =  100;
const ARTICLES_PER_PAGE =  30;
const HN_URL = "https://news.ycombinator.com";


async function buildArticleList(page, list) {
  const storyRanks = await page.locator('.rank').all();
  const subTextRow = await page.locator('.subtext > .subline > .score').all();
  const dates = await page.locator('.subtext > .subline > .age').all();

  const articles = await Promise.all(storyRanks.map(async (rank, i) => ({
    rowid: (await subTextRow[i].getAttribute('id')).split('_')[1],
    datestring: await dates[i].getAttribute('title'),
    index: i,
    rank: await rank.innerText()
  })));

  list.push(...articles.slice(0, Math.min(ARTICLES_PER_PAGE, MAX_ARTICLES - list.length)));
}

async function sortHackerNewsArticles() {
  // launch browser
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // go to Hacker News
  await page.goto(`${HN_URL}/newest`);

  const articles = [];
  while (articles.length < MAX_ARTICLES) {
    await buildArticleList(page, articles);
    if (articles.length < MAX_ARTICLES) {
      await page.click('.morelink');
    }
  }

  assert(articles.length === MAX_ARTICLES, 'Number of articles retrieved is not 100');
  console.log(`Number of Articles retrieved: ${articles.length}`);

  let datesInOrder = false;

  /*
   * In reviewing the hacker news web app, it became obvious that the articles are being
   * presented in order by most recent first. In this case it makes the sorting of the articles
   * redundant. I implemented a sort check to ensure the articles are in order, but it is not necessary.
   */
  articles.sort((a, b) => new Date(b.datestring.split(' ')[0]) - new Date(a.datestring.split(' ')[0]));

  for (let i = 0; i < articles.length - 1; i++) {
    let newer = new Date(articles[i].datestring.split(' ')[0])
    let older = new Date(articles[i + 1].datestring.split(' ')[0])

    datesInOrder = newer.getTime() - older.getTime() >= 0;

  }

  datesInOrder === true ?
      console.log(`Articles are in descending date order newer -> older: ${datesInOrder}`)
          : console.log(`date order error, datesInOrder: ${datesInOrder}`);

  await page.close();
  await browser.close();
}

(async () => {
  await sortHackerNewsArticles();
})();
