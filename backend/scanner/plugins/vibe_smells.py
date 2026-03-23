import aiohttp
from typing import List
from models.schemas import Vulnerability
import uuid
import re

class VibeSmellsScanner:
    def __init__(self, target_url: str):
        self.target_url = target_url

    async def scan(self) -> List[Vulnerability]:
        vulns = []
        if not self.target_url:
            return vulns
            
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(self.target_url, ssl=False, timeout=10) as response:
                    html = await response.text()
                    
                    if "localStorage.setItem" in html and ("jwt" in html.lower() or "token" in html.lower()):
                        vulns.append(Vulnerability(
                            id=str(uuid.uuid4()),
                            title="Insecure Client-Side Token Storage",
                            description="Vibe coding anti-pattern detected: Storing authentication tokens in localStorage, vulnerable to XSS exfiltration.",
                            severity="High",
                            cvss_score=8.2,
                            affected_component="Frontend Code",
                            poc="localStorage.getItem('token')",
                            remediation="Migrate token storage to secure, httpOnly cookies.",
                            secure_code="res.cookie('token', jwt, { httpOnly: true, secure: true, sameSite: 'strict' })"
                        ))
                        
                    if re.search(r"sk-[a-zA-Z0-9]{32,}", html):
                        vulns.append(Vulnerability(
                            id=str(uuid.uuid4()),
                            title="Exposed OpenAI API Key",
                            description="Found a hardcoded OpenAI secret key embedded in the frontend bundle.",
                            severity="Critical",
                            cvss_score=10.0,
                            affected_component="Frontend Bundle",
                            poc=None,
                            remediation="Remove the API key from frontend code and proxy requests through a secure backend.",
                            secure_code="fetch('/api/generate', { method: 'POST' })"
                        ))
        except:
            pass
            
        return vulns
