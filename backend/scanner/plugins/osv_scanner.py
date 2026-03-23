import aiohttp
from typing import List
from models.schemas import Vulnerability
import uuid

class OSVScanner:
    def __init__(self, target_repo: str = None):
        self.target_repo = target_repo

    async def scan_package(self, package_name: str, version: str) -> List[Vulnerability]:
        vulns = []
        url = "https://api.osv.dev/v1/query"
        payload = {
            "version": version,
            "package": {"name": package_name, "ecosystem": "npm"}
        }
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(url, json=payload, timeout=10) as response:
                    if response.status == 200:
                        data = await response.json()
                        if "vulns" in data:
                            for v in data["vulns"]:
                                vulns.append(Vulnerability(
                                    id=v.get("id", str(uuid.uuid4())),
                                    title=v.get("summary", f"OSV Vulnerability in {package_name}"),
                                    description=v.get("details", f"Critical dependency vulnerability detected via Google OSV API for {package_name}@{version}."),
                                    severity="High",
                                    cvss_score=8.5, # Placeholder assigned without parsing full CVSS vector
                                    affected_component=f"Dependency: {package_name}@{version}",
                                    poc=v.get("references", [{"url": ""}])[0].get("url") if v.get("references") else "",
                                    remediation=f"Upgrade '{package_name}' to the latest securely patched version immediately.",
                                    secure_code=f"npm install {package_name}@latest"
                                ))
        except Exception as e:
            pass
            
        return vulns
