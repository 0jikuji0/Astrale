export const scientificFormatter = new Intl.NumberFormat('fr-FR', {
    notation: 'scientific',
    maximumFractionDigits: 2,
});

export const decimalFormatter = new Intl.NumberFormat('fr-FR', {
    maximumFractionDigits: 1,
});

export const compactFormatter = new Intl.NumberFormat('fr-FR', {
    notation: 'compact',
    maximumFractionDigits: 1,
});
