from sqlalchemy import create_engine, Column, String, Integer, Float, ForeignKey, JSON, DateTime
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
import datetime
import os

# Uses SQLite as a drop-in fallback for local dev if Postgres isn't immediately spun up
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./vibescanner.db")

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, connect_args=connect_args)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class ScanReportModel(Base):
    __tablename__ = "scan_reports"
    id = Column(String, primary_key=True, index=True)
    target_url = Column(String, index=True)
    status = Column(String, default="pending")
    risk_score = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    report_json = Column(JSON, default={})

    vulnerabilities = relationship("VulnerabilityModel", back_populates="scan_report")

class VulnerabilityModel(Base):
    __tablename__ = "vulnerabilities"
    id = Column(String, primary_key=True, index=True)
    scan_id = Column(String, ForeignKey("scan_reports.id"))
    title = Column(String)
    severity = Column(String)
    cvss_score = Column(Float)
    details_json = Column(JSON, default={})

    scan_report = relationship("ScanReportModel", back_populates="vulnerabilities")

# Create tables
Base.metadata.create_all(bind=engine)
