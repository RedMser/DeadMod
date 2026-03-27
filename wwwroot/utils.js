export function redrawUI() {
    return new Promise(res => setTimeout(() => res(), 100));
}

export function setClass(element, className, value) {
    if (value) {
        element.classList.add(className);
    } else {
        element.classList.remove(className);
    }
}

export function setVisible(element, visible) {
    setClass(element, "hide", !visible);
}

export function dateToRelative(date) {
    const now = new Date();
    const d = date instanceof Date ? date : new Date(date);
    const diffMs = now - d;

    const seconds = Math.floor(diffMs / 1000);
    if (seconds < 60) return "under a minute ago";

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
        return minutes === 1 ? "1 minute ago" : `${minutes} minutes ago`;
    }

    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
        return hours === 1 ? "1 hour ago" : `${hours} hours ago`;
    }

    const days = Math.floor(hours / 24);
    if (days < 7) {
        return days === 1 ? "1 day ago" : `${days} days ago`;
    }

    const weeks = Math.floor(days / 7);
    if (weeks < 4) {
        return weeks === 1 ? "1 week ago" : `${weeks} weeks ago`;
    }

    const months = Math.floor(days / 30);
    if (months < 12) {
        return months === 1 ? "1 month ago" : `${months} months ago`;
    }

    const years = Math.floor(days / 365);
    return years === 1 ? "1 year ago" : `${years} years ago`;
}
