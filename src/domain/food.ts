// Veg / non-veg / sweet marks for menu items. The menu has no veg flag, so keywords decide.
// Extend these lists when a new menu brings new dishes.

export const NON_VEG_KEYWORDS = ['chicken', 'mutton', 'egg', 'eggs', 'omelette', 'fish', 'keema', 'prawn']
export const SWEET_KEYWORDS = ['halwa', 'kheer', 'gulab jamun', 'jalebi', 'ice cream', 'custard', 'rasgulla', 'sweet']

export type FoodMark = 'veg' | 'nonveg' | 'sweet'

const wordRe = (words: string[]) => new RegExp(`\\b(${words.map((w) => w.replace(/\s+/g, '\\s+')).join('|')})\\b`, 'i')
const NON_VEG = wordRe(NON_VEG_KEYWORDS)
const SWEET = wordRe(SWEET_KEYWORDS)

export function foodMark(item: string): FoodMark {
  if (NON_VEG.test(item)) return 'nonveg'
  if (SWEET.test(item)) return 'sweet'
  return 'veg'
}
