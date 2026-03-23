import aiohttp
from typing import Dict, Any

class CisaKevAnalyzer:
    def __init__(self):
        self.kev_url = "https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json"
        self._cache = {}

    async def fetch_catalog(self):
        if self._cache:
            return self._cache
            
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(self.kev_url, timeout=5) as response:
                    if response.status == 200:
                        data = await response.json()
                        for vuln in data.get("vulnerabilities", []):
                            cve = vuln.get("cveID")
                            if cve:
                                self._cache[cve] = vuln
        except Exception:
            pass
            
        return self._cache

    async def is_actively_exploited(self, cve_id: str) -> bool:
        """
        Checks if a CVE is on the CISA Known Exploited Vulnerabilities catalog.
        """
        catalog = await self.fetch_catalog()
        return cve_id in catalog
