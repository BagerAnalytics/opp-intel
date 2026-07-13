import asyncio
from playwright.async_api import async_playwright

class BaseScraper:
    """
    Base scraper class utilizing Playwright for handling modern JS-heavy SPAs
    like LinkedIn, EasyGrant, and OpportunityDesk.
    """
    def __init__(self, start_url):
        self.start_url = start_url

    async def initialize_browser(self):
        self.playwright = await async_playwright().start()
        self.browser = await self.playwright.chromium.launch(headless=True)
        self.context = await self.browser.new_context()
        self.page = await self.context.new_page()

    async def close_browser(self):
        await self.browser.close()
        await self.playwright.stop()

    async def scrape(self):
        """
        To be implemented by child classes (e.g. LinkedInScraper, EasyGrantScraper).
        Should return a list of dictionaries mapping to the Opportunity model.
        """
        raise NotImplementedError("Scrape method must be implemented by subclasses.")

    async def run(self):
        await self.initialize_browser()
        try:
            results = await self.scrape()
            return results
        finally:
            await self.close_browser()
