import asyncio
from typing import Dict
from models.schemas import ScanReport, Vulnerability
from scanner.plugins.headers import HeaderScanner
from scanner.plugins.vibe_smells import VibeSmellsScanner
from scanner.plugins.ai_judge import AIJudge

class ScannerEngine:
    def __init__(self, scan_id: str, target: str, db: Dict[str, ScanReport]):
        self.scan_id = scan_id
        self.target = target
        self.db = db

    async def run_scan(self):
        report = self.db[self.scan_id]
        report.status = "running"
        try:
            header_scanner = HeaderScanner(self.target)
            vibe_scanner = VibeSmellsScanner(self.target)
            
            vulns_lists = await asyncio.gather(
                header_scanner.scan(),
                vibe_scanner.scan()
            )
            raw_vulns = [vuln for sublist in vulns_lists for vuln in sublist]
            
            judge = AIJudge(self.target)
            verified_vulns = []
            for v in raw_vulns:
                verified_v = await judge.verify(v)
                verified_vulns.append(verified_v)
                
            report.vulnerabilities = verified_vulns
            report.risk_score = 100 if any(v.severity == 'Critical' for v in verified_vulns) else 50
            report.status = "completed"
            
        except Exception as e:
            report.status = "failed"
