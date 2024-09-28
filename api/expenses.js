'use strict';

const { addDataRows, createSheetIfNotExists, sortColumn } = require('./spreadsheet');
const debug = require('debug')('Expenses API');

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

module.exports = {
    addExpense
};