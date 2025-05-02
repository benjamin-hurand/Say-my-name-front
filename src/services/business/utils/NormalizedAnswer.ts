export const normalizeText = (text: string, typosFriendly: boolean): string => {
    // Always remove accents and convert to lowercase
    text = text.normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Remove accents
        .toLowerCase(); // Convert to lowercase

    // Apply full normalization only if typosFriendly is true
    if (typosFriendly) {
        text = text.replace(/y/gi, 'i') // Replace 'y' with 'i'
            .replace(/h/gi, '') // Remove silent 'h'
            .replace(/pt/gi, 't') // Simplify "pt" to "t"
            .replace(/sz/gi, 's') // Simplify "sz" to "s"
            .replace(/([a-z])\1+/gi, '$1') // Simplify 1 or more the same letters into 1 letter 
            .replace(/e+$/gi, '') // Remove trailing silent 'e'
            .replace(/[^a-z]/gi, '') // Remove non-alphabetic characters
            .replace(/au/gi, 'o') // Transform "au" to "o"
            .replace(/ck/gi, 'k') // Transform "ck" to "k"
            .replace(/qu/gi, 'k') // Transform "qu" to "k"
            .replace(/que/gi, 'k') // Transform "que" to "k"
            .replace(/en/gi, 'an') // Transform "que" to "k"
            .replace(/c/gi, 'k') // Transform "c" to "k"
            .trim() // Remove spaces at the beginning and end
            .replace(/\s+/g, ' '); // Replace multiple spaces with a single space

        text = text.replace(/(ein|ain|in)/gi, 'in') // Transform "ein", "ain", and "in" to "in"
            .replace(/gue/gi, 'g'); // Transform "gue" to "g"
    }

    return text;
}; 