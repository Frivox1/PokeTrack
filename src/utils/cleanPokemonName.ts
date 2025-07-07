export const cleanPokemonName = (name: string): string => {
  return name
    .replace(/^(M\s+|Mega\s+)/i, '')
    .replace(/\s*(V|EX|GX|VMAX|VSTAR)\s*$/i, '')
    .replace(/^Team Rocket's\s+/i, '')
    .replace(/^[^']+'s\s+/i, '')
    .replace(/\s*(Teal Mask|Hearthflame Mask|Wellspring Mask|Cornerstone Mask)\s*/gi, '')
    .replace(/^(Paldean|Hisuian|Galarian|Alolan|Johtonian|Kantonian|Sinnohian|Unovan|Kalosian|Hoennian|Formosan)\s+/i, '')
    .replace(/\s*(Rapid Strike|Single Strike)\s*/gi, '')
    .replace(/\s*(Shadow Rider|Ice Rider)\s*/gi, '')
    .replace(/\s*(Origin Forme)\s*/gi, '')
    .replace(/-+$/, '')
    .trim();
}; 