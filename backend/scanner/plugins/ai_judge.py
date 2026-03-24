from models.schemas import Vulnerability
from scanner.plugins.cisa_kev import CisaKevAnalyzer
from scanner.plugins.exploit_db import ExploitDBAnalyzer
from scanner.plugins.remediation import AIAutoRemediation
from scanner.plugins.nvd import NVDEnricher

class AIJudge:
    def __init__(self, target_url: str):
        self.target_url = target_url
        self.kev = CisaKevAnalyzer()
        self.exploit_db = ExploitDBAnalyzer()
        self.nvd = NVDEnricher()
        self.remediator = AIAutoRemediation()

    async def verify(self, vuln: Vulnerability) -> Vulnerability:
        """
        Simulates the Dual-Layer LLM Red Team reflection. 
        Hooks the NVD for verified severity, then enhances with CISA KEV and Exploit-DB intelligence.
        """
        
        # Ground Truth NIST NVD Metadata Injection
        nvd_metadata = await self.nvd.enrich_cve(vuln.id)
        if nvd_metadata:
            # Overwrite our heuristic guesses with the authoritative JSON metrics
            vuln.cwe = nvd_metadata.get("cwe", vuln.cwe)
            if nvd_metadata.get("cvss_score", 0.0) > 0:
                vuln.cvss_score = nvd_metadata["cvss_score"]
            # Fallback for weak descriptions
            if len(vuln.description) < 50 and nvd_metadata.get("description"):
                vuln.description = nvd_metadata["description"]

        # Active Threat Intelligence Cross-Referencing
        is_exploited = await self.kev.is_actively_exploited(vuln.id)
        has_poc = await self.exploit_db.has_public_poc(vuln.id, vuln.title)

        # Mathematical Risk Scoring Calibration
        if is_exploited:
            vuln.severity = "Critical"
            vuln.cvss_score = max(vuln.cvss_score, 9.8)
            vuln.description = "[ALERT: CISA KEV - Actively Exploited In The Wild] \n\n" + vuln.description
            
        elif has_poc:
            if vuln.severity != "Critical":
                vuln.severity = "High" 
            vuln.cvss_score = max(vuln.cvss_score, 7.5)
            vuln.description = "[WARNING: Public Proof-of-Concept Exploit Available] \n\n" + vuln.description

        # Base Application Heuristics
        if "Missing" in vuln.title and not has_poc:
            vuln.severity = "Medium"
            vuln.cvss_score = 5.0
            
        if not vuln.remediation:
            vuln.remediation = self.remediator.generate_patch(vuln.id, vuln.title)
        
        return vuln
