from models.schemas import Vulnerability
from scanner.plugins.cisa_kev import CisaKevAnalyzer
from scanner.plugins.exploit_db import ExploitDBAnalyzer
from scanner.plugins.remediation import AIAutoRemediation

class AIJudge:
    def __init__(self, target_url: str):
        self.target_url = target_url
        self.kev = CisaKevAnalyzer()
        self.exploit_db = ExploitDBAnalyzer()
        self.remediator = AIAutoRemediation()

    async def verify(self, vuln: Vulnerability) -> Vulnerability:
        """
        Simulates the Dual-Layer LLM Red Team reflection. 
        Enhances the data by instantly querying CISA KEV for active exploits and Exploit-DB for public PoCs.
        """
        # Threat Intelligence Cross-Referencing
        is_exploited = await self.kev.is_actively_exploited(vuln.id)
        has_poc = await self.exploit_db.has_public_poc(vuln.id, vuln.title)

        # Risk Scoring Adjustment Algorithm
        if is_exploited:
            vuln.severity = "Critical"
            vuln.cvss_score = max(vuln.cvss_score, 9.8)
            vuln.description = "[ALERT: CISA KEV - Actively Exploited In The Wild] " + vuln.description
            
        elif has_poc:
            if vuln.severity != "Critical":
                vuln.severity = "High" 
            vuln.cvss_score = max(vuln.cvss_score, 7.5)
            vuln.description = "[WARNING: Public Proof-of-Concept Exploit Available] " + vuln.description

        # Apply basic heuristics
        if "Missing" in vuln.title and not has_poc:
            vuln.severity = "Medium"
            vuln.cvss_score = 5.0
            
        # Hook into multi-file Auto-Remediation engine
        if not vuln.remediation:
            vuln.remediation = self.remediator.generate_patch(vuln.id, vuln.title)
        
        return vuln
