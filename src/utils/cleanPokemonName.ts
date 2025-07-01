export const cleanPokemonName = (name: string): string => {
  return name
    .replace(/^(M\s+|Mega\s+)/i, '')
    .replace(/\s*(V|EX|GX|VMAX|VSTAR)\s*$/i, '')
    .replace(/^Team Rocket's\s+/i, '')
    .replace(/^[^']+'s\s+/i, '')
    .replace(/\s*(Teal Mask|Hearthflame Mask|Wellspring Mask|Cornerstone Mask)\s*/gi, '')
    .replace(/-+$/, '')
    .trim()
}; 