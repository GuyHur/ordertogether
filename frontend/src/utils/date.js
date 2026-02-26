export const parseZonedDateTime = (dateString) => {
    if (!dateString) return null;
    let safeDateString = dateString;
    if (safeDateString.includes('T') && !safeDateString.endsWith('Z') && !safeDateString.match(/[+-]\d{2}:\d{2}$/)) {
        safeDateString += 'Z';
    }
    return new Date(safeDateString);
};

export const formatTimeAgo = (dateString) => {
    if (!dateString) return '';
    const date = parseZonedDateTime(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffSecs = Math.floor(diffMs / 1000);

    if (diffSecs < 60) return 'Just now';
    if (diffSecs < 3600) return `${Math.floor(diffSecs / 60)}m ago`;
    if (diffSecs < 86400) return `${Math.floor(diffSecs / 3600)}h ago`;
    return `${Math.floor(diffSecs / 86400)}d ago`;
};
