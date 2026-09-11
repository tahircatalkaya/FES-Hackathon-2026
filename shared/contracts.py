"""Trusted adapter contract. This is deliberately NOT a client request model."""
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Literal

Partner = Literal['fes', 'foodsharing', 'vytal', 'transdev', 'traffiq']

@dataclass(frozen=True)
class EvidenceEvent:
    event_id: str
    partner: Partner
    environment: str
    action_key: str
    user_id: str
    action: str
    occurred_at: str
    source: str
    evidence_status: str
    reason: str
    external_id: str | None = None
    schema_version: int = 1
    privacy: str = 'private'
    reward_eligible: bool = False
    quantity: float | None = None
    unit: str | None = None
    impact_version: str | None = None

    def validate(self, principal: str):
        if self.schema_version != 1 or self.partner not in ('fes','foodsharing','vytal','transdev','traffiq'):
            raise ValueError('unsupported_schema_or_partner')
        if self.environment not in ('local_demo','partner_sandbox','production'):
            raise ValueError('invalid_environment')
        if self.evidence_status not in ('confirmed','plausible','self_reported','pending','rejected','unmatched'):
            raise ValueError('invalid_evidence')
        if self.user_id != principal:
            raise PermissionError('identity_mismatch')
        if self.privacy != 'private':
            raise ValueError('private_by_default')
        for value in (self.event_id,self.action_key,self.user_id,self.action,self.reason,self.source):
            if not isinstance(value,str) or not value.strip() or len(value)>500:
                raise ValueError('invalid_required_field')
        timestamp = datetime.fromisoformat(self.occurred_at.replace('Z','+00:00'))
        if timestamp.tzinfo is None:
            raise ValueError('timezone_required')
        if self.quantity is not None:
            from math import isfinite
            if not isfinite(self.quantity) or self.quantity < 0 or not self.unit:
                raise ValueError('invalid_quantity')
        return timestamp.astimezone(timezone.utc)

