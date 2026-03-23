import aiohttp
from typing import List
from models.schemas import Vulnerability
import uuid

class HeaderScanner:
    def __init__(self, target_url: str):
        self.target_url = target_url

    async def scan(self) -> List[Vulnerability]:
        vulns = []
        if not self.target_url:
            return vulns
            
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(self.target_url, ssl=False, timeout=10) as response:
                    headers = response.headers
                    
                    if 'Strict-Transport-Security' not in headers:
                        vulns.append(Vulnerability(
                            id=str(uuid.uuid4()),
                            title="Missing HTTP Strict-Transport-Security (HSTS)",
                            description="The application does not enforce HSTS, increasing risk of MITM attacks.",
                            severity="Medium",
                            cvss_score=5.3,
                            affected_component="HTTP Headers",
                            remediation="Add the 'Strict-Transport-Security' header.",
                            secure_code="Strict-Transport-Security: max-age=31536000; includeSubDomains"
                        ))
                    
                    if 'Content-Security-Policy' not in headers:
                        vulns.append(Vulnerability(
                            id=str(uuid.uuid4()),
                            title="Missing Content-Security-Policy",
                            description="No CSP header found, making the app vulnerable to XSS.",
                            severity="High",
                            cvss_score=7.5,
                            affected_component="HTTP Headers",
                            remediation="Implement a strong Content Security Policy.",
                            secure_code="Content-Security-Policy: default-src 'self';"
                        ))
        except Exception as e:
            pass
            
        return vulns
