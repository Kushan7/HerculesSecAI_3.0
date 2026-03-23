from pydantic import BaseModel, HttpUrl
from typing import List, Optional, Literal

class ScanRequest(BaseModel):
    target_url: Optional[HttpUrl] = None
    target_repo: Optional[str] = None

class Vulnerability(BaseModel):
    id: str
    title: str
    description: str
    severity: Literal['Critical', 'High', 'Medium', 'Low', 'Informational']
    cvss_score: float
    affected_component: str
    poc: Optional[str] = None
    remediation: str
    secure_code: Optional[str] = None

class ScanReport(BaseModel):
    scan_id: str
    status: Literal['pending', 'running', 'completed', 'failed']
    target: str
    risk_score: int
    vulnerabilities: List[Vulnerability] = []
