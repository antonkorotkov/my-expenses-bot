'use strict';

const { addDataRows, createSheetIfNotExists, sortColumn, getDataRows } = require('./spreadsheet');
const debug = require('debug')('Expenses API');

/**
 * @param {number} serial
 * @returns {Date}
 */
const serialToDate = serial => {
    const MS_PER_DAY = 24 * 60 * 60 * 1000;
    const epoch = new Date(Date.UTC(1899, 11, 30));
    return new Date(epoch.getTime() + serial * MS_PER_DAY);
};

/**
 * @param {Date} date1
 * @param {Date} date2
 * @returns {boolean}
 */
const isSameWeek = (date1, date2) => {
    const startOfWeek = (d) => {
        const date = new Date(d);
        const day = date.getDay(); // Sunday = 0
        const diff = date.getDate() - day + (day === 0 ? -6 : 1); // adjust to Monday
        return new Date(date.setDate(diff));
    };

    const start1 = startOfWeek(date1);
    const start2 = startOfWeek(date2);

    return start1.toDateString() === start2.toDateString();
};

/**
 * @param {number} value
 * @param {string} category
 * @param {Date} date
 * @param {string | undefined} comment
 * @param {string} name
 */
const addExpense = async (value, category, date, comment, name) => {
    debug('Adding expense:', value, category, date, comment, name);
    await createSheetIfNotExists();

    const dateDay = String(date.getDate()).padStart(2, '0');
    const dateMonth = String(date.getMonth() + 1).padStart(2, '0');
    const dateYear = date.getFullYear();
    const dateFormatted = `${dateDay}.${dateMonth}.${dateYear}`;
    const dateMonthString = date.toLocaleString('uk', { month: 'long' });

    const todayDay = String(new Date().getDate()).padStart(2, '0');
    const todayMonth = String(new Date().getMonth() + 1).padStart(2, '0');
    const todayYear = new Date().getFullYear();
    const todayFormatted = `${todayDay}.${todayMonth}.${todayYear}`;

    await addDataRows([[dateFormatted, todayFormatted, category, name, value, comment, dateMonthString]]);
    debug('Added expense:', dateFormatted, todayFormatted, category, name, value, comment, dateMonthString);
    await sortColumn(0);
};

/**
 * @param {'w' | 'm' | 'y'} filter
 * @returns {Promise<number>}
 */
const getExpenses = async (filter) => {
    debug('Reading expenses');
    await createSheetIfNotExists();
    const rows = await getDataRows();

    if (!rows || rows.length === 0) {
        debug('No expenses found');
        return 0;
    }

    if (filter === 'y')
        return rows.reduce((sum, row) => sum + (row[4] || 0), 0);

    if (filter === 'm') {
        const currentMonth = new Date().toLocaleString('uk', { month: 'long' });
        return rows.reduce((sum, row) => {
            if (row[6] === currentMonth)
                return sum + (row[4] || 0);
            return sum;
        }, 0);
    }

    if (filter === 'w') {
        const today = new Date();
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        return rows.reduce((sum, row) => {
            const date = serialToDate(row[0]);
            if (isSameWeek(date, today))
                return sum + (row[4] || 0);
            return sum;
        }, 0);
    }

    return 0;
};

module.exports = {
    addExpense,
    getExpenses
};
