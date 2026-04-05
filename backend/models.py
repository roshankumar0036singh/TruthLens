from sqlalchemy import Column, Integer, String, Text, Float, Boolean, ForeignKey, DateTime, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from pgvector.sqlalchemy import Vector
from database import Base

class Source(Base):
    __tablename__ = "sources"

    id = Column(Integer, primary_key=True, index=True)
    domain = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    credibility_score = Column(Float, default=0.0)
    trust_level = Column(Integer, default=1)  # 1 to 5 stars
    description = Column(Text, nullable=True)
    is_verified_fact_checker = Column(Boolean, default=False)
    ad_network_disclosure = Column(JSON, nullable=True) # { "ads_txt": "verified", "known_funders": [] }
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    citations = relationship("Citation", back_populates="source")

class Claim(Base):
    __tablename__ = "claims"

    id = Column(Integer, primary_key=True, index=True)
    content_hash = Column(String, unique=True, index=True, nullable=False)
    text = Column(Text, nullable=False)
    context = Column(Text, nullable=True)
    embedding = Column(Vector(768)) # For RAG searches / semantic similarity
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    verdicts = relationship("Verdict", back_populates="claim")

class Verdict(Base):
    __tablename__ = "verdicts"

    id = Column(Integer, primary_key=True, index=True)
    claim_id = Column(Integer, ForeignKey("claims.id"), nullable=False)
    overall_verdict = Column(String, nullable=False) # e.g., FALSE, VERIFIED, UNVERIFIED
    confidence_score = Column(Float, nullable=False)
    explanation = Column(Text, nullable=False)
    transaction_hash = Column(String, nullable=True) # For blockchain
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    claim = relationship("Claim", back_populates="verdicts")
    citations = relationship("Citation", back_populates="verdict")
    community_votes = relationship("CommunityVote", back_populates="verdict")

class Citation(Base):
    __tablename__ = "citations"

    id = Column(Integer, primary_key=True, index=True)
    verdict_id = Column(Integer, ForeignKey("verdicts.id"), nullable=False)
    source_id = Column(Integer, ForeignKey("sources.id"), nullable=False)
    url = Column(String, nullable=False)
    stance = Column(String, nullable=False) # APPROVE, DISAPPROVE, NEUTRAL
    excerpt = Column(Text, nullable=False)
    date_published = Column(DateTime(timezone=True), nullable=True)
    
    verdict = relationship("Verdict", back_populates="citations")
    source = relationship("Source", back_populates="citations")

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    reputation_score = Column(Integer, default=10)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    votes = relationship("CommunityVote", back_populates="user")
    shares = relationship("SharedNews", back_populates="user")

class CommunityVote(Base):
    __tablename__ = "community_votes"

    id = Column(Integer, primary_key=True, index=True)
    verdict_id = Column(Integer, ForeignKey("verdicts.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    vote = Column(Integer, nullable=False) # 1 for agree, -1 for disagree
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    verdict = relationship("Verdict", back_populates="community_votes")
    user = relationship("User", back_populates="votes")

class SharedNews(Base):
    __tablename__ = "shared_news"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    url = Column(String, nullable=False)
    text = Column(Text, nullable=True) # Optional summary
    user_assertion = Column(String, nullable=False) # e.g., "TRUE", "FAKE"
    transaction_hash = Column(String, nullable=True) # On-chain anchor
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="shares")

class NarrativeTriplet(Base):
    __tablename__ = "narrative_triplets"

    id = Column(Integer, primary_key=True, index=True)
    subject = Column(String, index=True, nullable=False)
    predicate = Column(String, index=True, nullable=False)
    object = Column(String, index=True, nullable=False)
    source_url = Column(String, nullable=True) # Where this relation was found
    source_type = Column(String, default="primary") # primary, modifier, amplifier
    parent_triplet_id = Column(Integer, ForeignKey("narrative_triplets.id"), nullable=True)
    claim_id = Column(Integer, ForeignKey("claims.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    claim = relationship("Claim")
    parent = relationship("NarrativeTriplet", remote_side=[id])

class Quest(Base):
    __tablename__ = "quests"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    reward = Column(String, nullable=False)
    status = Column(String, default="active") # active, completed, locked
    progress = Column(Integer, default=0)
    claim_id = Column(Integer, ForeignKey("claims.id"), nullable=True)
    transaction_hash = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    claim = relationship("Claim")

# Update User model to include shares
models_to_patch = [] # Using this to remember to update User later if needed
