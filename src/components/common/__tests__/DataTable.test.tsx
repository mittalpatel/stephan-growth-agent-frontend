import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import {
  DataTable,
  DataTableBody,
  DataTableRow,
  dataTableHeadRow,
  dataTableTh,
  dataTableTd,
} from '../DataTable';

type Row = { id: string; name: string };

const COLUMN = 'Name';

function renderTable(rows: Row[], extra?: { minWidth?: number; header?: React.ReactNode }) {
  return render(
    <DataTable header={extra?.header} minWidth={extra?.minWidth}>
      <thead>
        <tr className={dataTableHeadRow}>
          <th className={dataTableTh}>{COLUMN}</th>
        </tr>
      </thead>
      <DataTableBody>
        {rows.map((r) => (
          <DataTableRow key={r.id}>
            <td className={dataTableTd}>{r.name}</td>
          </DataTableRow>
        ))}
      </DataTableBody>
    </DataTable>
  );
}

describe('DataTable', () => {
  it('renders a table with the header row and column headers', () => {
    renderTable([]);
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Name' })).toBeInTheDocument();
  });

  it('renders one body row per item', () => {
    renderTable([
      { id: '1', name: 'Alpha' },
      { id: '2', name: 'Beta' },
    ]);
    const body = screen.getAllByRole('rowgroup')[1]; // [thead, tbody]
    expect(within(body).getAllByRole('row')).toHaveLength(2);
    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('Beta')).toBeInTheDocument();
  });

  it('renders the optional header slot above the table', () => {
    const headerText = 'HEADER SLOT';
    renderTable([], { header: <div>{headerText}</div> });
    expect(screen.getByText(headerText)).toBeInTheDocument();
  });

  it('applies minWidth as an inline style on the table element', () => {
    renderTable([{ id: '1', name: 'Alpha' }], { minWidth: 720 });
    expect(screen.getByRole('table')).toHaveStyle({ minWidth: '720px' });
  });

  it('omits the inline min-width when minWidth is not provided', () => {
    renderTable([{ id: '1', name: 'Alpha' }]);
    expect(screen.getByRole('table').style.minWidth).toBe('');
  });
});
