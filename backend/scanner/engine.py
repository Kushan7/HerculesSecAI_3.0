import asyncio
from models.schemas import Vulnerability
from models.database import SessionLocal, ScanReportModel
from scanner.plugins.headers import HeaderScanner
from scanner.plugins.vibe_smells import VibeSmellsScanner
from scanner.plugins.ai_judge import AIJudge

class ScannerEngine:
    def __init__(self, scan_id: str, target: str):
        self.scan_id = scan_id
        self.target = target

    async def run_scan(self):
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
                
            risk_score = 100 if any(v.severity == 'Critical' for v in verified_vulns) else 50
            
            # Commit results securely to Database models
            db = SessionLocal()
            db_scan = db.query(ScanReportModel).filter(ScanReportModel.id == self.scan_id).first()
            if db_scan:
                db_scan.status = "completed"
                db_scan.risk_score = risk_score
                db_scan.report_json = {"vulnerabilities": [v.dict() for v in verified_vulns]}
                db.commit()
            db.close()
            
        except Exception as e:
            db = SessionLocal()
            db_scan = db.query(ScanReportModel).filter(ScanReportModel.id == self.scan_id).first()
            if db_scan:
                db_scan.status = "failed"
                db.commit()
            db.close()
