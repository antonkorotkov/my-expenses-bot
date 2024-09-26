'use strict';

const { google } = require('googleapis');
const debug = require('debug')('SpreadSheets API');

const SHEET_ROWS = 5000;
const SHEET_COLS = 10;

const spreadsheetId = process.env.SPREADSHEET_ID;
const auth = new google.auth.GoogleAuth({
    keyFilename: process.env.SERVICE_ACCOUNT,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

/**
 * Get current year to identify the Sheet
 *
 * @returns {number}
 */
const getCurrentYear = () => new Date().getFullYear();

/**
 * Get a client for working with Sheets API
 *
 * @returns {Promise<import('googleapis').sheets_v4.Sheets>}
 */
const getSheetsClient = async () => {
    const client = await auth.getClient();
    return google.sheets({ version: 'v4', auth: client });
};

/**
 * Get the SheetID based on the year
 *
 * @returns {number}
 */
const getSheetId = () => {
    return getCurrentYear();
};

/**
 * Get the Sheet Title based on the year
 *
 * @returns {string}
 */
const getSheetName = () => {
    return getCurrentYear().toString();
};

/**
 * Create and format a new sheet if it does not exist yet for the current year
 *
 * @throws {Error}
 * @returns {void}
 */
const createSheetIfNotExists = async () => {
    const sheets = await getSheetsClient();
    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });

    const sheetId = getSheetId();
    const sheetName = getSheetName();
    const sheetExists = Boolean(spreadsheet.data.sheets?.find(
        sheet => sheet.properties.title === sheetName && sheet.properties.sheetId === sheetId
    ));

    if (sheetExists)
        return debug(`Sheet "${sheetName}" exists, continue...`);

    const request = {
        requests: [
            {
                addSheet: {
                    properties: {
                        sheetId,
                        title: sheetName,
                        gridProperties: {
                            rowCount: SHEET_ROWS,
                            columnCount: SHEET_COLS
                        }
                    }
                }
            },
            {
                setDataValidation: {
                    range: {
                        sheetId,
                        startRowIndex: 1,
                        startColumnIndex: 0,
                        endColumnIndex: 2
                    },
                    rule: {
                        condition: {
                            type: 'DATE_IS_VALID'
                        },
                        strict: true
                    }
                }
            },
            {
                setDataValidation: {
                    range: {
                        sheetId,
                        startRowIndex: 1,
                        startColumnIndex: 4,
                        endColumnIndex: 5
                    },
                    rule: {
                        condition: {
                            type: 'NUMBER_BETWEEN',
                            values: [
                                {
                                    userEnteredValue: "-1000000"
                                },
                                {
                                    userEnteredValue: "1000000"
                                }
                            ]
                        },
                        strict: true
                    }
                }
            },
            {
                repeatCell: {
                    range: {
                        sheetId,
                        startRowIndex: 1,
                        startColumnIndex: 4,
                        endColumnIndex: 5
                    },
                    cell: {
                        userEnteredFormat: {
                            numberFormat: {
                                type: 'CURRENCY',
                                pattern: '€#,##0.00'
                            }
                        }
                    },
                    fields: 'userEnteredFormat.numberFormat',
                }
            }
        ]
    };

    const batchUpdateResult = await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        resource: request
    });

    if (batchUpdateResult.status === 200)
        debug(`Sheet "${sheetName}" created`);
    else
        throw new Error(`Could not create sheet "${sheetName}"`);

    const appendResult = await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: sheetId,
        valueInputOption: 'USER_ENTERED',
        resource: {
            values: [
                ['Operation Date', 'Date Added', 'Category', 'Person', 'Value', 'Comment']
            ]
        }
    });

    if (appendResult.status === 200)
        debug(`Sheet "${sheetName}" formatted`);
    else
        throw new Error(`Could not format sheet "${sheetName}"`);
};

/**
 * @param {Array<Array<string | number>>} values
 */
const addDataRows = async values => {
    const sheets = await getSheetsClient();
    const sheetId = getSheetId();

    const appendResult = await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: sheetId,
        valueInputOption: 'USER_ENTERED',
        resource: { values }
    });

    if (appendResult.status === 200)
        debug(`${values.length} row(s) inserted`);
    else
        throw new Error(`Could not format sheet "${sheetName}"`);
};

/**
 * @param {number} columnIndex
 * @param {'SORT_ORDER_UNSPECIFIED' | 'ASCENDING' | 'DESCENDING'} [direction]
 */
const sortColumn = async (columnIndex, direction = 'ASCENDING') => {
    const sheets = await getSheetsClient();
    const sheetId = getSheetId();

    const request = {
        requests: [
            {
                sortRange: {
                    range: {
                        sheetId,
                        startRowIndex: 1,
                        startColumnIndex: 0
                    },
                    sortSpecs: [
                        {
                            dimensionIndex: columnIndex,
                            sortOrder: direction
                        }
                    ]
                }
            }
        ]
    };

    const batchUpdateResult = await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        resource: request
    });

    if (batchUpdateResult.status === 200)
        debug(`Column ${columnIndex} sorted ${direction}`);
    else
        throw new Error(`Could not sort column`);
};

module.exports = {
    createSheetIfNotExists,
    addDataRows,
    sortColumn
}
