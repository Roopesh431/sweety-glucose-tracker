
const getTodayIST = () => {
    return new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    }).format(new Date());
};

const isValidDate = (date) => {
    if (typeof date !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return false;
    }

    const parsed = new Date(`${date}T00:00:00.000Z`);

    return !Number.isNaN(parsed.getTime()) &&
        parsed.toISOString().slice(0, 10) === date;
};

const isFutureDate = (date) => {
    return date > getTodayIST();
};

module.exports = {
    getTodayIST,
    isValidDate,
    isFutureDate
};
