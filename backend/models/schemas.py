from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class ScanRequest(BaseModel):
    target_url: Optional[str] = None
    target_repo: Optional[str] = None

class Vulnerability(BaseModel):
    id: str
    title: str
    description: str
    severity: str
    cvss_score: float
    poc: Optional[str] = None
    remediation: str
    secure_code: Optional[str] = None
    cwe: Optional[str] = "CWE-UNKNOWN"
    owasp: Optional[str] = "OWASP-UNKNOWN"
    method: Optional[str] = "GET"
    vulnerable_parameter: Optional[str] = "N/A"
    evidence: Optional[str] = "No evidence provided."
    references: Optional[List[str]] = []

class ScanReport(BaseModel):
    scan_id: str
    status: str
    target: str
    risk_score: int
    overall_risk_level: Optional[str] = "Low"
    scan_duration: Optional[str] = "0s"
    start_time: Optional[datetime] = None
    finish_time: Optional[datetime] = None
    tests_performed: Optional[int] = 0
    integrity: Optional[str] = "100%"
    latency: Optional[str] = "0ms"
    resilience: Optional[str] = "High"
    discovered_subdomains: List[str] = []
    scraped_intel: List[str] = []
    vulnerabilities: List[Vulnerability] = []
