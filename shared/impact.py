"""No default emission factor: an unknown comparison stays unknown."""
from dataclasses import dataclass
from math import isfinite

@dataclass(frozen=True)
class Leg:
    distance_km: float | None
    factor_g_per_pkm: float | None
    factor_source: str | None
    boundary: str | None

def comparison(reference: Leg, legs: list[Leg]):
    all_legs=[reference,*legs]
    if not legs or any(x.distance_km is None or x.factor_g_per_pkm is None or not x.factor_source or not x.boundary for x in all_legs):
        return {'kg_co2e':None,'status':'unknown','reason':'missing_distance_factor_or_source'}
    if len({x.boundary for x in all_legs}) != 1:
        return {'kg_co2e':None,'status':'unknown','reason':'incompatible_boundaries'}
    if any(not isfinite(n) or n<0 for x in all_legs for n in (x.distance_km,x.factor_g_per_pkm)):
        raise ValueError('invalid_quantity')
    emissions=lambda x:x.distance_km*x.factor_g_per_pkm/1000
    return {'kg_co2e':emissions(reference)-sum(map(emissions,legs)),
            'status':'estimate','reason':'reference_minus_all_legs','method':'comparison-v1',
            'sources':list(dict.fromkeys(x.factor_source for x in all_legs))}

