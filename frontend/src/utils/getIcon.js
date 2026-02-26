import woltIcon from '../assets/wolt.png'
import tenbisIcon from '../assets/tenbis.svg'
import mishlohaIcon from '../assets/mishloha.svg'

export const getServiceIcon = (url) => {
    if (!url) return null;
    const lower = url.toLowerCase();
    if (lower.includes('wolt')) return woltIcon;
    if (lower.includes('tenbis')) return tenbisIcon;
    if (lower.includes('mishloha')) return mishlohaIcon;
    return url;
}
