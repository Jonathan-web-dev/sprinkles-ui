/* eslint jsx-a11y/no-static-element-interactions: "off" */
/* eslint react/forbid-prop-types: "off" */
/* eslint class-methods-use-this: "off" */

import React from 'react';
import color from 'color';
import PropTypes from 'prop-types';
import styledComponent from '../shared/styledComponent';
import Base from './Base';
import Checkbox from './Checkbox';
import TableCell from './TableCell';
import TableRow from './TableRow';

const tableStyles = clr => ({
  border: 'none',
  borderRight: `1px solid ${clr.structuralColors.divider}`,
  borderLeft: `1px solid ${clr.structuralColors.divider}`,
  color: clr.textColors.primary,
  '& thead': {
    '& tr': {
      background: clr.backgroundColors.tableHeader,
      borderTop: `1px solid ${clr.structuralColors.divider}`,
      borderBottom: `1px solid ${clr.structuralColors.divider}`,
      '& th': {
        background: clr.backgroundColors.tableHeader,
        border: 'none',
        color: clr.textColors.tableHeader,
        cursor: 'pointer',
        fontWeight: '600',
        padding: '10px 20px',
        textAlign: 'left',
        '.sui-filtered': {
          background: color(clr.backgroundColors.tableHeader)
            .darken(0.1)
            .hexString(),
          borderBottom: `1px solid ${clr.structuralColors.divider}`,
        },
        '& .sui-down': {
          borderLeft: '4px solid transparent',
          borderRight: '4px solid transparent',
          borderTop: '4px dashed',
          color: clr.textColors.tableHeader,
          display: 'inline-block',
          height: 0,
          marginRight: 5,
          verticalAlign: 'middle',
          width: 0,
        },
        '& .sui-up': {
          borderBottom: '4px dashed',
          borderLeft: '4px solid transparent',
          borderRight: '4px solid transparent',
          color: clr.textColors.tableHeader,
          display: 'inline-block',
          height: 0,
          marginRight: 5,
          verticalAlign: 'middle',
          width: 0,
        },
      },
    },
  },
  '& tr': {
    '.collapsed': {
      display: 'none',
    },
    '.sui-selected': {
      background: clr.backgroundColors.selected,
    },
    '.sui-hoverable': {
      ':hover': {
        background: clr.backgroundColors.hover,
        cursor: 'Pointer',
      },
    },
    '& td': {
      border: 'none',
      borderBottom: `1px solid ${clr.structuralColors.divider}`,
      color: clr.textColors.primary,
      padding: '10px 20px',
    },
  },
});

export default class DataTable extends Base {
  static propTypes = {
    columns: PropTypes.shape({
      order: PropTypes.array,
      width: PropTypes.array,
    }),
    collapsableChildren: PropTypes.array,
    filterRecords: PropTypes.array,
    hasSubRows: PropTypes.bool, // record key has to be called level for now
    headers: PropTypes.object,
    multiselectRowKey: PropTypes.string,
    noRecordsText: PropTypes.string,
    onChange: PropTypes.func,
    onClick: PropTypes.func,
    onHeaderClick: PropTypes.func,
    orderBy: PropTypes.shape({
      column: PropTypes.string,
      direction: PropTypes.oneOf(['asc', 'desc']),
      /* Strings and numbers are supported by default and do not need explicit format config.
        Use date for any dates, must be pure date (Yes: 10/20/1994 No: Updated: 10/20/1994)
      */
      formatter: PropTypes.oneOf(['date']),
      getSortValue: PropTypes.func,
    }),
    recordInclusion: PropTypes.array,
    records: PropTypes.array,
    restrictSort: PropTypes.bool,
    returnAllRecordsOnClick: PropTypes.bool,
    selectedColumn: PropTypes.string,
    selectedRows: PropTypes.arrayOf(PropTypes.string),
  };

  static defaultProps = {
    collapsableChildren: [],
    hasSubRows: false,
    multiselectRowKey: '',
    noRecordsText: 'No records found.',
    onChange: () => {},
    onClick: null,
    onHeaderClick: () => {},
    records: [],
    restrictSort: false,
    selectedRows: [],
  };

  displayName = 'DataTable';

  constructor() {
    super();
    this.state = {
      hoveredRow: null,
      isRowHovering: false,
      lastChecked: null,
    };
  }

  componentWillMount() {
    this.StyledTable = styledComponent('table', tableStyles(this.getColors()));
  }

  includeSubRecords = record => {
    const filteredRecord = {};
    Object.getOwnPropertyNames(record).forEach(val => {
      if (this.props.recordInclusion.indexOf(val) > -1) {
        filteredRecord[val] = record[val];
      }
    });
    return filteredRecord;
  };

  filteredSubRecords = (fields) => (record) =>
    fields.some((val) =>
      this.props.filterRecords.some((filterVal) =>
        (filterVal[val] === record[val])));

  sortRecords = record => {
    const newRecord = {};
    this.props.columns.order.forEach(val => {
      newRecord[val] = record[val];
    });
    if (this.props.hasSubRows && record.level) {
      newRecord.level = record.level;
      newRecord.recordId = record.recordId;
    }
    return newRecord;
  };

  processHeaders() {
    let headers = this.props.headers;
    if (headers && headers.level) {
      delete headers.level;
    }
    if (!headers) {
      const firstRowCopy = Object.assign({}, this.props.records[0]);

      Object.keys(firstRowCopy).forEach(key => {
        firstRowCopy[key] = key;
      });

      headers = firstRowCopy;
    }

    if (this.props.columns && this.props.columns.order) {
      return this.sortRecords(headers);
    }
    if (this.props.recordInclusion) {
      const filteredHeaders = {};
      this.props.recordInclusion.forEach(record => {
        if (record !== 'level') {
          filteredHeaders[record] = headers[record];
        }
      });
      return filteredHeaders;
    }

    return headers;
  }

  sortColumnRecords(mappedRecords) {
    const ops = {
      asc: (a, b) => +(a > b) || +(a === b) - 1,
      desc: (a, b) => +(a < b) || +(a === b) - 1,
    };

    const { getSortValue = value => value } = this.props.orderBy;

    if (this.props.hasSubRows) {
      return mappedRecords;
    }

    return mappedRecords.sort((a, b) => {
      switch (this.props.orderBy.formatter) {
        case 'date':
          return ops[this.props.orderBy.direction](new Date(a.value), new Date(b.value));
        default:
          return ops[this.props.orderBy.direction](getSortValue(a.value), getSortValue(b.value));
      }
    });
  }

  processRecords() {
    let processedRecords = this.props.records;
    if (this.props.recordInclusion) {
      processedRecords = processedRecords.map(this.includeSubRecords);
    }
    if (this.props.filterRecords && processedRecords.length) {
      const fields = Object.getOwnPropertyNames(processedRecords[0]);
      processedRecords = processedRecords.filter(this.filteredSubRecords(fields));
    }
    if (this.props.columns && this.props.columns.order) {
      processedRecords = processedRecords.map(this.sortRecords);
    }
    if (this.props.orderBy) {
      const mappedColValues = processedRecords.map((record, i) => ({
        index: i,
        level: record.level ? record.level : null,
        value: record[this.props.orderBy.column],
      }));
      const sortedColumnValues = this.sortColumnRecords(mappedColValues);
      const orderdRecords = sortedColumnValues.map(el => processedRecords[el.index]);
      processedRecords = orderdRecords;
    }
    return processedRecords;
  }

  handleClick(data, e) {
    const returnedData = Object.assign({}, data);
    returnedData.row = this.props.returnAllRecordsOnClick && !this.props.filterRecords ? this.props.records[data.yCord] : data.row;
    this.props.onClick(e.target, returnedData);
  }

  handleSelectAll = () => {
    const multiselectRowKey = this.props.multiselectRowKey;
    const ids = this.processRecords()
      .map(row => multiselectRowKey && row[multiselectRowKey])
      .filter(row => !!row);
    this.props.onChange(ids);
  };

  handleRowSelect(id, event) {
    let range = [id];

    if (event.shiftKey) {
      const currentRecords = this.processRecords().map(item => item.guid);
      const lastSelectedIdx = currentRecords.indexOf(this.state.lastChecked);
      const currentSelectedIdx = currentRecords.indexOf(id);
      const selectedRows = [...this.props.selectedRows];

      range = currentRecords.slice(Math.min(lastSelectedIdx, currentSelectedIdx), Math.max(lastSelectedIdx, currentSelectedIdx) + 1);

      const isUnchecking = selectedRows.indexOf(id) === -1;
      if (isUnchecking) {
        range = range.filter(item => selectedRows.indexOf(item) === -1);
      } else {
        range = range.filter(item => selectedRows.indexOf(item) !== -1);
      }
    }
    this.props.onChange(range);
    this.setState({ lastChecked: id });
  }

  renderHeaderItem() {
    const headers = this.processHeaders();
    const headerTitles = Object.keys(headers).map((header, i) => {
      const arrowCSSClass = this.props.orderBy && this.props.orderBy.direction === 'asc' ? 'sui-up' : 'sui-down';
      const isFilteredHeader = this.props.orderBy && this.props.orderBy.column === header;
      let handleHeaderSort = this.props.onHeaderClick.bind(this, header);
      if (this.props.restrictSort && header !== this.props.orderBy.column) {
        handleHeaderSort = () => {};
      }
      return (
        <th key={i} onClick={handleHeaderSort} className={isFilteredHeader ? 'sui-filtered' : ''}>
          {isFilteredHeader && <span className={arrowCSSClass} />}
          {headers[header]}
        </th>
      );
    });
    const selectAllHeader = (
      <th key={0} onClick={this.handleSelectAll}>
        <Checkbox ref={c => (this.checkBoxHeaderRef = c)} checked={false} />
      </th>
    );
    return this.props.multiselectRowKey ? [selectAllHeader, headerTitles] : headerTitles;
  }

  renderHeaderItems() {
    return <TableRow rowIndex={0}>{this.renderHeaderItem()}</TableRow>;
  }

  renderCheckBox(xCord, row, id) {
    this.checkBoxRefs = [];
    const shouldBeChecked = this.props.selectedRows.indexOf(id) > -1;
    return (
      <TableCell key={xCord} onClick={this.handleRowSelect.bind(this, id)}>
        <Checkbox checked={shouldBeChecked} ref={c => this.checkBoxRefs.push(c)} />
      </TableCell>
    );
  }

  renderItems(columnKey, xCord, row, yCord, level, recordId) {
    const cellData = row[columnKey];
    const cellWidth = this.props.columns && this.props.columns.width ? this.props.columns.width[xCord] : 'auto';
    return (
      <TableCell
        key={`${xCord}-${yCord}`}
        level={xCord === 0 ? level : null}
        onClick={
          this.props.onClick &&
          this.handleClick.bind(this, {
            cellData,
            columnKey,
            recordId,
            row,
            xCord,
            yCord,
          })
        }
        width={cellWidth}
      >
        {row[columnKey]}
      </TableCell>
    );
  }

  renderRow(r, i, rowKeys, hoverable) {
    const row = r;
    const level = row.level;
    const recordId = row.recordId;
    delete row.level;
    delete row.recordId;
    const multiselectRowKey = this.props.multiselectRowKey;
    const multiSelectId = multiselectRowKey && row[multiselectRowKey];

    return rowKeys.length > 0 ? (
      <TableRow
        isCollapsed={!!this.props.collapsableChildren.find(id => id === recordId)}
        isHoverable={hoverable}
        isSelected={this.props.selectedRows.indexOf(multiSelectId) > -1}
        key={`row-${i}`}
        rowIndex={i}
        rowKey={multiSelectId}
      >
        {multiselectRowKey ? this.renderCheckBox(0, row, multiSelectId) : undefined}
        {rowKeys.map((item, ri) => {
          if (item !== 'level' && item !== 'recordId') {
            return this.renderItems(item, ri, row, i, level, recordId);
          }
          return null;
        })}
      </TableRow>
    ) : null;
  }

  renderNoResults() {
    let colSpan = Object.keys(this.processHeaders()).length;
    /* We need to add an element to account for the checkbox column for multiselect */
    if (this.props.multiselectRowKey) {
      colSpan += 1;
    }

    return (
      <TableRow rowIndex={0}>
        <TableCell colSpan={colSpan > 0 ? colSpan : 1}>{this.props.noRecordsText}</TableCell>
      </TableRow>
    );
  }

  renderRows(records) {
    const rowKeys = records.length ? Object.keys(records[0]) : [];
    const hoverable = typeof this.props.onClick === 'function';
    const rowResults = records.length > 0 ? records.map((item, i) => this.renderRow(item, i, rowKeys, hoverable)) : [];
    return rowResults[0] ? rowResults : this.renderNoResults();
  }

  render() {
    const records = this.processRecords();
    return (
      <this.StyledTable>
        <thead>{this.renderHeaderItems()}</thead>
        <tbody>{this.renderRows(records)}</tbody>
      </this.StyledTable>
    );
  }
}
