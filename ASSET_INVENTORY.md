# Inventário dos assets usados

O pack foi inspecionado antes da implementação. As construções Black são PNGs
individuais: Castle `320×256`; Barracks e Archery `192×256`; Monastery
`192×320`; Tower `128×256`; e House 1–3 `128×192`.

As animações são spritesheets horizontais. Pawns, Warriors, Archers e Monks
usam frames `192×192`; Lancers usam `320×320`.

| Categoria | Animações conferidas |
| --- | --- |
| Pawn | Idle 8, Run 6, Interact Axe 6, Pickaxe 6, Hammer 3, Knife 4 frames |
| Warrior | Idle 8, Run 6, Attack 1 4 frames |
| Archer | Idle 6, Run 4, Shoot 8 frames |
| Lancer | Idle 12, Run 6, Right Defence 6 frames |
| Monk | Idle 6, Run 4, Heal e Heal Effect 11 frames |
| Terrain | Tilemaps `576×384` (atlas de 9×6 tiles de `64×64`); Water Foam 16 frames de `192×192` |
| Ambiente | Trees 1–2: 6 frames `256×256`; Trees 3–4: 6 frames `256×192`; Bushes: 8 frames `128×128`; Water Rocks: 16 frames `64×64` |
| Partículas | Dust 01 e Fire 01: 8 frames de `64×64` |

Os demais PNGs do pack foram mantidos intactos. A cena usa exclusivamente as
variantes Black para edifícios e unidades.
