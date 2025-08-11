const formatMoney = money => {
    return new Intl.NumberFormat('sk-SK', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(money);
};

module.exports = {
    formatMoney
};