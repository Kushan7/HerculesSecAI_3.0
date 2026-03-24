import aiohttp
from typing import Dict, Any, Optional

class NVDEnricher:
    def __init__(self):
        # Public NIST API 2.0 Endpoint
        self.api_url = "https://services.nvd.nist.gov/rest/json/cves/2.0?cveId="
        self._cache = {}

    async def enrich_cve(self, cve_id: str) -> Optional[Dict[str, Any]]:
        """
        Fetches the baseline CVE data from the National Vulnerability Database (NIST).
        Filters and extracts correct CVSS metrics, CWE classifications, and official descriptions.
        """
        if not cve_id or not cve_id.startswith("CVE-"):
            return None
            
        if cve_id in self._cache:
            return self._cache[cve_id]
            
        try:
            async with aiohttp.ClientSession() as session:
                # The NIST API can strictly rate-limit without a key; timeout enforced aggressively
                async with session.get(self.api_url + cve_id, timeout=5) as response:
                    if response.status == 200:
                        data = await response.json()
                        vulnerabilities = data.get("vulnerabilities", [])
                        if vulnerabilities:
                            cve_data = vulnerabilities[0].get("cve", {})
                            
                            # Safely extract CVSS 3.1 or fallback to 3.0 metrics
                            metrics = cve_data.get("metrics", {})
                            cvss = 0.0
                            if "cvssMetricV31" in metrics:
                                cvss = metrics["cvssMetricV31"][0].get("cvssData", {}).get("baseScore", 0.0)
                            elif "cvssMetricV30" in metrics:
                                cvss = metrics["cvssMetricV30"][0].get("cvssData", {}).get("baseScore", 0.0)
                                
                            weaknesses = cve_data.get("weaknesses", [])
                            cwe = "CWE-Unknown"
                            if weaknesses and "description" in weaknesses[0]:
                                cwe_val = weaknesses[0]["description"][0].get("value")
                                if cwe_val: 
                                    cwe = cwe_val
                                
                            descriptions = cve_data.get("descriptions", [])
                            desc = ""
                            for d in descriptions:
                                if d.get("lang") == "en":
                                    desc = d.get("value", "")
                                    break
                                    
                            result = {
                                "cvss_score": float(cvss),
                                "cwe": cwe,
                                "description": desc
                            }
                            self._cache[cve_id] = result
                            return result
        except Exception as e:
            pass
            
        return None
