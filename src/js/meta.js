import getSubstringIndex from './substring-nth';

export function metaDescription(meta) {
    return meta.substring(getSubstringIndex(meta, '</h2>', 1) + 5, getSubstringIndex(meta, '<h3', 1));
}
