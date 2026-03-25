import urllib.parse
import httpx
import asyncio
import re
from bs4 import BeautifulSoup, Comment

class OSINTReconModule:
    def __init__(self, target_url: str):
        self.target_url = target_url

    def _extract_domain(self) -> str:
        """Extract the root domain from a full URL."""
        if not self.target_url.startswith('http'):
            url = 'https://' + self.target_url
        else:
            url = self.target_url
            
        parsed = urllib.parse.urlparse(url)
        hostname = parsed.hostname
        if not hostname:
            return self.target_url
            
        # Very simple TLD extraction (assumes ending like .com, .org, or .co.uk)
        parts = hostname.split('.')
        if len(parts) > 2:
            return ".".join(parts[-2:])
        return hostname

    async def gather_subdomains(self):
        """
        Passively enumerates subdomains using Certificate Transparency logs via crt.sh.
        This is completely stealthy and very fast.
        """
        domain = self._extract_domain()
        subdomains = set()
        
        try:
            # Setting an explicit timeout because crt.sh can sometimes be slow
            async with httpx.AsyncClient(timeout=15.0) as client:
                url = f"https://crt.sh/?q=%.{domain}&output=json"
                response = await client.get(url)
                
                if response.status_code == 200:
                    data = response.json()
                    for entry in data:
                        name_value = entry.get("name_value", "")
                        # crt.sh sometimes returns multiple domains separated by newlines
                        for sub in name_value.split("\n"):
                            sub = sub.strip().lower()
                            if sub and not sub.startswith("*"):
                                subdomains.add(sub)
        except Exception as e:
            print(f"OSINT Recon Error (crt.sh): {e}")
            
        return list(subdomains)

    async def scrape_target(self):
        """
        Actively fetches the target URL and performs deep DOM parsing to extract
        hidden developer comments, internal routes, and outdated frontend libraries.
        """
        intel = set()
        url = self.target_url if self.target_url.startswith('http') else 'https://' + self.target_url
        
        try:
            async with httpx.AsyncClient(timeout=10.0, verify=False) as client:
                response = await client.get(url, follow_redirects=True)
                if response.status_code == 200:
                    soup = BeautifulSoup(response.text, 'html.parser')
                    
                    # 1. Extract Developer Comments
                    comments = soup.find_all(string=lambda text: isinstance(text, Comment))
                    for c in comments:
                        text = c.strip()
                        if text and any(keyword in text.lower() for keyword in ["todo", "fixme", "api", "key", "password", "secret", "admin", "test"]):
                            intel.add(f"DOM Comment Leak: {text[:100]}")
                            
                    # 2. Extract Hidden Inputs
                    hidden_inputs = soup.find_all('input', type='hidden')
                    for inp in hidden_inputs:
                        name = inp.get('name', '')
                        value = inp.get('value', '')
                        if name and value:
                            if "csrf" not in name.lower() and "token" not in name.lower():
                                intel.add(f"Hidden State Exposed: [{name}] = {value[:50]}")
                                
                    # 3. Analyze Scripts for Outdated CDNs or interesting files
                    scripts = soup.find_all('script', src=True)
                    for script in scripts:
                        src = script['src']
                        if 'jquery' in src.lower() and re.search(r'1\.\d+\.\d+|2\.\d+\.\d+', src):
                            intel.add(f"Legacy Dependency: {src}")
                        elif 'auth' in src.lower() or 'admin' in src.lower():
                            intel.add(f"Sensitive Script Node: {src}")

                    # 4. Extract unconventional endpoints
                    links = soup.find_all('a', href=True)
                    for link in links:
                        href = link['href']
                        if href.startswith('/api/v') or href.startswith('/admin') or href.startswith('/config'):
                            intel.add(f"High-Value Endpoint Discovered: {href}")
                            
        except Exception as e:
            print(f"OSINT Scraper Error: {e}")
            
        return list(intel)
