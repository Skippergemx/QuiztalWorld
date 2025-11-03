import { MonsterDropConfig } from '../types/drops';

export const monsterDropConfigs: MonsterDropConfig[] = [
  {
    monsterType: 'mobster',
    drops: [
      {
        itemId: 'health_crystal',
        chance: 30,
        minQuantity: 1,
        maxQuantity: 1
      },
      {
        itemId: 'mana_crystal',
        chance: 20,
        minQuantity: 1,
        maxQuantity: 2
      },
      {
        itemId: 'stamina_potion',
        chance: 25,
        minQuantity: 1,
        maxQuantity: 1
      },
      {
        itemId: 'dragon_scale',
        chance: 5,
        minQuantity: 1,
        maxQuantity: 1
      }
    ]
  },
  {
    monsterType: 'mobster02',
    drops: [
      {
        itemId: 'speed_potion',
        chance: 25,
        minQuantity: 1,
        maxQuantity: 1
      },
      {
        itemId: 'stamina_potion',
        chance: 30,
        minQuantity: 1,
        maxQuantity: 2
      },
      {
        itemId: 'mystic_orb',
        chance: 15,
        minQuantity: 1,
        maxQuantity: 1
      },
      {
        itemId: 'phoenix_feather',
        chance: 2,
        minQuantity: 1,
        maxQuantity: 1
      }
    ]
  },
  {
    monsterType: 'mobster03',
    drops: [
      {
        itemId: 'health_crystal',
        chance: 25,
        minQuantity: 1,
        maxQuantity: 1
      },
      {
        itemId: 'speed_potion',
        chance: 20,
        minQuantity: 1,
        maxQuantity: 1
      },
      {
        itemId: 'stamina_potion',
        chance: 30,
        minQuantity: 1,
        maxQuantity: 2
      },
      {
        itemId: 'dragon_scale',
        chance: 10,
        minQuantity: 1,
        maxQuantity: 1
      },
      {
        itemId: 'phoenix_feather',
        chance: 5,
        minQuantity: 1,
        maxQuantity: 1
      }
    ]
  }
];