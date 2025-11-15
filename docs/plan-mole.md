# Plan d'implémentation: Support du vaisseau MOLE

## Résumé des spécifications

### Comparaison des vaisseaux

| Spécification | Prospector | MOLE |
|---------------|------------|------|
| Capacité cargo | 32 SCU | 96 SCU |
| Nombre de lasers | 1 | 3 |
| Taille des lasers | Size 1 | Size 2 |
| Laser par défaut | Arbor MH1 | 3x Arbor MH2 |
| Équipage | 1 | 2-4 |

### Lasers Size 1 (Prospector)
- Arbor MH1 (1 slot module)
- Lancet MH1 (1 slot module)
- Hofstede-S1 (1 slot module)
- Klein-S1 (0 slot module)
- Helix I (2 slots module)
- Impact I (2 slots module)

### Lasers Size 2 (MOLE)
- Arbor MH2 (2 slots module)
- Lancet MH2 (2 slots module)
- Hofstede-S2 (2 slots module)
- Klein-S2 (1 slot module)
- Helix II (3 slots module)
- Impact II (3 slots module)

**Règle:** Les lasers Size 2 ont généralement +1 slot module par rapport à leur équivalent Size 1.

---

## 1. Créer une nouvelle branche

```bash
git checkout -b feature/mole-ship
```

---

## 2. Modifications du fichier `data.js`

### 2.1 Ajouter les données des vaisseaux

```javascript
export const shipData = {
  prospector: {
    name: 'Prospector',
    manufacturer: 'MISC',
    capacity: 32,
    laserCount: 1,
    laserSize: 1
  },
  mole: {
    name: 'MOLE',
    manufacturer: 'Argo Astronautics',
    capacity: 96,
    laserCount: 3,
    laserSize: 2
  }
};
```

### 2.2 Ajouter propriété `size` aux lasers existants

Modifier tous les lasers existants pour ajouter `size: 1`:

```javascript
arbor: {
  name: 'Arbor MH1',
  size: 1,  // NOUVEAU
  moduleSlots: 1,
  // ... reste inchangé
}
```

### 2.3 Ajouter les 6 lasers Size 2

Données récupérées depuis starcitizen.tools:

```javascript
'arbor-mh2': {
  name: 'Arbor MH2',
  manufacturer: 'Greycat Industrial',
  size: 2,
  moduleSlots: 2,
  fracturingPower: 2400,
  extractionPower: 2590,
  instability: 0.65,      // -35%
  resistance: 1.25,       // +25%
  optimalChargeWindowSize: 1.0,
  catastrophicChargeWindow: 1.0,
  shatterDamage: 1.0
},
'lancet-mh2': {
  name: 'Lancet MH2',
  manufacturer: 'Greycat Industrial',
  size: 2,
  moduleSlots: 2,
  fracturingPower: 3600,
  extractionPower: 2590,
  instability: 0.90,      // -10%
  resistance: 1.0,
  optimalChargeWindowSize: 1.0,
  catastrophicChargeWindow: 1.0,
  shatterDamage: 1.0
},
'hofstede-s2': {
  name: 'Hofstede-S2',
  manufacturer: 'Shubin Interstellar',
  size: 2,
  moduleSlots: 2,
  fracturingPower: 3360,
  extractionPower: 1295,
  instability: 1.10,      // +10%
  resistance: 0.70,       // -30%
  optimalChargeWindowSize: 1.0,
  catastrophicChargeWindow: 1.0,
  shatterDamage: 1.0
},
'klein-s2': {
  name: 'Klein-S2',
  manufacturer: 'Shubin Interstellar',
  size: 2,
  moduleSlots: 1,
  fracturingPower: 3600,
  extractionPower: 2775,
  instability: 1.35,      // +35%
  resistance: 0.55,       // -45%
  optimalChargeWindowSize: 1.0,
  catastrophicChargeWindow: 1.0,
  shatterDamage: 1.0
},
'helix-ii': {
  name: 'Helix II',
  manufacturer: 'Thermyte Concern',
  size: 2,
  moduleSlots: 3,
  fracturingPower: 4080,
  extractionPower: 2590,
  instability: 1.0,
  resistance: 0.70,       // -30%
  optimalChargeWindowSize: 1.0,
  catastrophicChargeWindow: 1.0,
  shatterDamage: 1.0
},
'impact-ii': {
  name: 'Impact II',
  manufacturer: 'Thermyte Concern',
  size: 2,
  moduleSlots: 3,
  fracturingPower: 3360,
  extractionPower: 3145,
  instability: 0.90,      // -10%
  resistance: 1.10,       // +10%
  optimalChargeWindowSize: 1.0,
  catastrophicChargeWindow: 1.0,
  shatterDamage: 1.0
}
```

---

## 3. Modifications du fichier `ui.js`

### 3.1 Ajouter état global pour le vaisseau

```javascript
let currentShipType = 'prospector'; // Par défaut

function setShipType(shipType) {
  currentShipType = shipType;
  updateShipsUI();
  updateCapacityTable();
}

function getShipType() {
  return currentShipType;
}
```

### 3.2 Filtrer les lasers selon la taille

```javascript
function getCompatibleLasers() {
  const ship = shipData[currentShipType];
  return Object.entries(laserData)
    .filter(([key, laser]) => laser.size === ship.laserSize)
    .reduce((obj, [key, laser]) => {
      obj[key] = laser;
      return obj;
    }, {});
}
```

### 3.3 Adapter l'affichage des lasers

Pour le MOLE, afficher 3 configurations de lasers au lieu d'1:

```javascript
function createShipHTML(shipIndex) {
  const ship = shipData[currentShipType];
  const laserCount = ship.laserCount;

  let lasersHTML = '';
  for (let i = 0; i < laserCount; i++) {
    lasersHTML += `
      <div class="laser-config">
        <h4>Laser ${i + 1}</h4>
        ${createLaserSelectHTML(shipIndex, i)}
        ${createModuleSlotsHTML(shipIndex, i)}
      </div>
    `;
  }

  return `<div class="ship-item" id="ship-${shipIndex}">
    ${lasersHTML}
  </div>`;
}
```

### 3.4 Mettre à jour la capacité

```javascript
function updateCapacityDisplay() {
  const ship = shipData[currentShipType];
  const totalCapacity = shipCount * ship.capacity;
  // Afficher la capacité
}
```

---

## 4. Modifications du fichier `calculations.js`

### 4.1 Adapter pour multi-lasers

```javascript
function calculateMaxMass(lasersConfig, modules, gadgets) {
  // lasersConfig est maintenant un tableau de configs laser
  // Pour MOLE: 3 lasers, pour Prospector: 1 laser

  let totalFracturingPower = 0;

  lasersConfig.forEach((laserConfig, index) => {
    const laser = laserData[laserConfig.type];
    const shipModules = modules[index] || [];

    // Calculer la puissance pour ce laser
    let laserPower = laser.fracturingPower;
    // Appliquer modificateurs modules...

    totalFracturingPower += laserPower;
  });

  // Utiliser la puissance totale pour les calculs
  // ...
}
```

### 4.2 Garder la rétro-compatibilité

Supporter l'ancien format (1 laser) et le nouveau (multi-lasers):

```javascript
function calculateMaxMass(lasersConfigOrSingleLaser, modules, gadgets) {
  const lasersConfig = Array.isArray(lasersConfigOrSingleLaser)
    ? lasersConfigOrSingleLaser
    : [lasersConfigOrSingleLaser];

  // ... reste du code
}
```

---

## 5. Modifications du fichier `index.html`

### 5.1 Ajouter sélecteur de vaisseau

```html
<div class="ship-selector">
  <label for="ship-type">Type de vaisseau :</label>
  <select id="ship-type" onchange="onShipTypeChange()">
    <option value="prospector">Prospector (1 laser S1, 32 SCU)</option>
    <option value="mole">MOLE (3 lasers S2, 96 SCU)</option>
  </select>
</div>
```

---

## 6. Modifications du fichier `style.css`

### 6.1 Layout pour multi-lasers

```css
.ship-item {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.laser-config {
  border: 1px solid #444;
  padding: 1rem;
  border-radius: 4px;
}

/* Pour MOLE: afficher les 3 lasers côte à côte sur desktop */
@media (min-width: 768px) {
  .ship-item {
    flex-direction: row;
  }

  .laser-config {
    flex: 1;
  }
}
```

---

## 7. Tests

### 7.1 Tests unitaires (`ui.test.js`)

```javascript
describe('Ship type selection', () => {
  it('should filter lasers by size for Prospector', () => {
    setShipType('prospector');
    const lasers = getCompatibleLasers();
    Object.values(lasers).forEach(laser => {
      expect(laser.size).toBe(1);
    });
  });

  it('should filter lasers by size for MOLE', () => {
    setShipType('mole');
    const lasers = getCompatibleLasers();
    Object.values(lasers).forEach(laser => {
      expect(laser.size).toBe(2);
    });
  });

  it('should display 3 laser configs for MOLE', () => {
    setShipType('mole');
    const html = createShipHTML(0);
    expect(html).toContain('Laser 1');
    expect(html).toContain('Laser 2');
    expect(html).toContain('Laser 3');
  });
});
```

### 7.2 Tests unitaires (`calculations.test.js`)

```javascript
describe('Multi-laser calculations', () => {
  it('should calculate total power with 3 MOLE lasers', () => {
    const lasersConfig = [
      { type: 'arbor-mh2' },
      { type: 'arbor-mh2' },
      { type: 'arbor-mh2' }
    ];
    const result = calculateMaxMass(lasersConfig, {}, []);
    // Vérifier que la puissance est 3x celle d'un seul laser
  });

  it('should work with single Prospector laser (backward compatibility)', () => {
    const laserConfig = { type: 'arbor' };
    const result = calculateMaxMass(laserConfig, {}, []);
    // Doit fonctionner comme avant
  });
});
```

### 7.3 Tests E2E (`app.e2e.js`)

```javascript
test('should switch between Prospector and MOLE', async ({ page }) => {
  await page.goto('/');

  // Vérifier Prospector par défaut
  await expect(page.locator('#ship-type')).toHaveValue('prospector');

  // Changer pour MOLE
  await page.selectOption('#ship-type', 'mole');

  // Vérifier que 3 lasers sont affichés
  await expect(page.locator('.laser-config')).toHaveCount(3);

  // Vérifier que seuls les lasers Size 2 sont disponibles
  const firstLaserSelect = page.locator('.laser-config').first().locator('select');
  const options = await firstLaserSelect.locator('option').allTextContents();
  expect(options.some(opt => opt.includes('MH2'))).toBe(true);
  expect(options.some(opt => opt.includes('MH1'))).toBe(false);
});

test('should calculate correct capacity for MOLE', async ({ page }) => {
  await page.goto('/');
  await page.selectOption('#ship-type', 'mole');

  // Vérifier capacité = 96 SCU
  await expect(page.locator('.capacity-value')).toContainText('96');
});
```

---

## 8. Documentation

### 8.1 Mettre à jour README.md

Ajouter section:

```markdown
## Vaisseaux supportés

### Prospector
- 1 laser de minage Size 1
- Capacité: 32 SCU
- Lasers compatibles: Arbor MH1, Lancet MH1, Hofstede-S1, Klein-S1, Helix I, Impact I

### MOLE (Multi Operator Laser Extractor)
- 3 lasers de minage Size 2
- Capacité: 96 SCU
- Lasers compatibles: Arbor MH2, Lancet MH2, Hofstede-S2, Klein-S2, Helix II, Impact II
```

### 8.2 Mettre à jour AGENTS.md

Documenter:
- Structure `shipData`
- Système de tailles de lasers (Size 1 vs Size 2)
- Compatibilité modules (identique pour toutes les tailles)

---

## 9. Organisation des commits

### Commit 1: `feat(data): add MOLE ship and Size 2 lasers data`
- Ajouter `shipData` dans `data.js`
- Ajouter propriété `size` aux lasers existants
- Ajouter les 6 nouveaux lasers Size 2

### Commit 2: `feat(ui): add ship type selector and multi-laser support`
- Ajouter sélecteur de vaisseau dans `index.html`
- Implémenter filtrage des lasers par taille
- Adapter l'UI pour afficher 1 ou 3 lasers selon le vaisseau

### Commit 3: `feat(calculations): support multiple lasers for MOLE`
- Adapter les fonctions de calcul pour accepter plusieurs lasers
- Calculer la puissance cumulée des 3 lasers
- Garder la rétro-compatibilité avec Prospector

### Commit 4: `style: add responsive layout for multi-laser configuration`
- CSS pour afficher 3 lasers côte à côte (desktop)
- Layout responsive pour mobile

### Commit 5: `test: add comprehensive tests for MOLE support`
- Tests unitaires pour sélection vaisseau
- Tests unitaires pour calculs multi-lasers
- Tests E2E pour workflow complet MOLE

### Commit 6: `docs: update documentation for MOLE feature`
- Mettre à jour README.md
- Mettre à jour AGENTS.md

---

## 10. Checklist avant PR

- [ ] Tous les tests unitaires passent (vitest)
- [ ] Tous les tests E2E passent (playwright)
- [ ] Couverture de code maintenue ou améliorée
- [ ] Pas de régression sur fonctionnalités Prospector existantes
- [ ] UI responsive testée (mobile + desktop)
- [ ] Documentation à jour
- [ ] Messages de commit clairs et organisés
- [ ] Code review personnel effectué

---

## 11. Créer la Pull Request

### Titre
`feat: add MOLE ship support with Size 2 lasers`

### Description
```markdown
## Summary
Adds support for the MOLE mining ship with 3 Size 2 lasers, alongside the existing Prospector support.

## Changes
- **Data**: Added shipData structure and 6 Size 2 lasers (Arbor MH2, Lancet MH2, Hofstede-S2, Klein-S2, Helix II, Impact II)
- **UI**: Added ship type selector, multi-laser configuration display
- **Calculations**: Extended to support multiple lasers working together
- **Tests**: Comprehensive unit and E2E tests for MOLE functionality

## Ship Specifications
- **Prospector**: 1 laser Size 1, 32 SCU capacity
- **MOLE**: 3 lasers Size 2, 96 SCU capacity

## Testing
- [x] All unit tests pass (XX/XX)
- [x] All E2E tests pass (XX/XX)
- [x] No regressions on Prospector functionality
- [x] Code coverage maintained/improved

## Screenshots
[Add screenshots showing MOLE configuration]

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

---

## Notes techniques

### Compatibilité des modules
Les modules de minage (FLTR, XTR, Focus, Rieger, Vaux) sont compatibles avec tous les lasers, Size 1 et Size 2. Aucune modification n'est nécessaire au niveau des modules.

### Calculs de puissance
Pour le MOLE avec 3 lasers, la puissance de fracturation totale est la somme des 3 lasers. Cela permet de s'attaquer à des roches plus résistantes.

### Capacité de stockage
- 1 Prospector = 32 SCU
- 1 MOLE = 96 SCU = 3 Prospectors

### Migration progressive
Le code doit supporter à la fois:
- L'ancien format (Prospector uniquement)
- Le nouveau format (Prospector + MOLE)

Cela garantit qu'aucune fonctionnalité existante ne casse.
