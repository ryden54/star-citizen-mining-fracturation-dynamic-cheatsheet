# Mesures supplémentaires requises pour affiner la formule de fracturation

## État actuel

### Données collectées
- **13 mesures** avec Prospector de location (laser Arbor MH1, aucun module/gadget)
- **Précision actuelle**: 100% avec 4 formules différentes:
  1. `maxMass = 10000 * (1 - resistance)^1.0` ← **Actuellement implémentée**
  2. `maxMass = 11000 * (1 - resistance)^1.2`
  3. `maxMass = 12000 * (1 - resistance)^1.2`
  4. `maxMass = 12000 * (1 - resistance)^1.5`

### Recherche en ligne
- ❌ Aucune formule mathématique précise documentée par la communauté
- ✅ Relations qualitatives confirmées (masse↑ = énergie↑, résistance↑ = énergie↑)
- ✅ Modificateurs de lasers multiples sont multiplicatifs
- ℹ️ Les guides communautaires sont qualitatifs, pas quantitatifs

## Problème actuel

Les 4 formules qui passent à 100% donnent des résultats très différents sur des cas non testés:

| Formule | À 0% résistance | À 50% résistance | À 80% résistance |
|---------|-----------------|------------------|------------------|
| #1 (10k, exp=1.0) | 10000 kg | 5000 kg | 2000 kg |
| #2 (11k, exp=1.2) | 11000 kg | 5063 kg | 1564 kg |
| #3 (12k, exp=1.2) | 12000 kg | 5523 kg | 1707 kg |
| #4 (12k, exp=1.5) | 12000 kg | 4243 kg | 806 kg |

**Écart à 50%**: jusqu'à 1523 kg de différence!
**Écart à 80%**: jusqu'à 1194 kg de différence!

## Mesures prioritaires à effectuer in-game

### 1. Validation du baseline (0-15% résistance)

**Objectif**: Déterminer la masse maximale fracturable à très faible résistance

**Mesures à prendre**:
- [ ] Roches à **0-5% résistance**, masse **8000-10000 kg** (devrait être fracturable mais proche de la limite)
- [ ] Roches à **0-5% résistance**, masse **10000-12000 kg** (pour vérifier le baseline exact)
- [ ] Roches à **10-15% résistance**, diverses masses

**Pourquoi**: Cela permettra de déterminer si le baseline est 10000, 11000 ou 12000 kg

### 2. Zone de différenciation (45-55% résistance)

**Objectif**: Distinguer entre les formules linéaires et exponentielles

**Mesures à prendre**:
- [ ] Roches à **45-50% résistance**, masse **4500-5500 kg**
- [ ] Roches à **50-55% résistance**, masse **4000-5000 kg**

**Pourquoi**: C'est la zone où les formules divergent le plus fortement

| Formule | Prédiction à 50% résistance pour 5000 kg |
|---------|------------------------------------------|
| #1 | Fracturable (limite: 5000 kg) |
| #2 | Fracturable (limite: 5063 kg) |
| #3 | Fracturable (limite: 5523 kg) |
| #4 | NON fracturable (limite: 4243 kg) |

### 3. Hautes résistances (60-75%)

**Objectif**: Valider le comportement aux extrêmes

**Mesures à prendre**:
- [ ] Roches à **65-70% résistance**, masse **2500-3500 kg**
- [ ] Roches à **70-75% résistance**, masse **2000-3000 kg**

### 4. Validation multi-laser (CRITIQUE pour la généralisation)

**Objectif**: Vérifier que la puissance se scale correctement

**Configuration**:
- Prospector avec **laser Helix I** (3150 power vs 1890 pour Arbor)
- Ratio de puissance: 3150/1890 = **1.667x**

**Mesures à prendre**:
- [ ] Re-tester quelques cas déjà mesurés avec Arbor mais avec Helix
- [ ] Si formule correcte: `maxMass_Helix = maxMass_Arbor * 1.667`

**Exemple test**:
- Rock #2 avec Arbor: 4814 kg, 44% → "hard" (limite Arbor calculée: 5600 kg)
- Même roche avec Helix devrait avoir une limite de: 5600 * 1.667 = **9334 kg**
- Ou Rock #12 avec Arbor: 6418 kg, 31% → "challenging"
- Avec Helix devrait être beaucoup plus facile

### 5. Validation modules (si possible)

**Configuration**: Prospector avec Arbor + 1 module Rieger (+15% fracturing power)

**Test**:
- [ ] Re-tester 1-2 roches déjà mesurées
- [ ] Vérifier si limite = baseline * 1.15

## Format de collecte des données

Pour chaque nouvelle mesure, noter:

```json
{
  "id": X,
  "masse_kg": XXXX,
  "resistance_pct": XX,
  "fracturable": true/false,
  "difficulty": "easy/challenging/hard/impossible",
  "configuration": {
    "ship": "Prospector (location/owned)",
    "laser": "Arbor MH1 / Helix I / ...",
    "modules": ["none" / "rieger" / ...]
  },
  "notes": "Observations particulières"
}
```

## Ordre de priorité

1. **#2 - Zone 45-55%** (PRIORITÉ MAXIMALE) → Différencie les 4 formules
2. **#1 - Baseline 0-15%** → Confirme 10k vs 11k vs 12k
3. **#4 - Tests multi-laser** → Valide la généralisation
4. **#3 - Hautes résistances** → Confirme le comportement exponentiel
5. **#5 - Modules** → Bonus si temps disponible

## Nombre minimum de mesures recommandé

- **5-7 mesures** en zone 45-55% résistance
- **3-4 mesures** en baseline (0-15%)
- **2-3 mesures** avec Helix pour validation
- **Total: 10-14 nouvelles mesures** devraient suffire pour discriminer les formules

## Note importante

Les mesures doivent être faites dans les mêmes conditions que les 13 originales:
- ✅ Surface de lunes (pas d'astéroïdes)
- ✅ Aucun gadget
- ✅ Prospector seul (pas de coopération)
- ✅ Screenshots clairs montrant: masse, résistance, instabilité, verdict
