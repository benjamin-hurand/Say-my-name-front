import React, { useMemo, useState } from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Checkbox from '@mui/material/Checkbox';
import Button from '@mui/material/Button';
import DeleteIcon from '@mui/icons-material/Delete';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import BorderColorOutlinedIcon from '@mui/icons-material/BorderColorOutlined';
import Paper from '@mui/material/Paper';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSortUp, faSortDown, faSort } from '@fortawesome/free-solid-svg-icons';
import "./styles/table.css";

interface TableColumn<T> {
    key: keyof T;
    label: string;
    format?: (value: any) => string;  // Optional formatter function
}

interface TableProps<T extends { id: number }> {
    data: T[];
    columns: TableColumn<T>[];
    canBeDeleted?: boolean;
    deleteById?: (id: number[]) => void;
    onRowClick?: (arg: any) => any;
    editById?: (id: number) => void;
    orderby: string[][];
    setOrderby: React.Dispatch<React.SetStateAction<string[][]>>;
}

function useRowSelection() {
    const [selectedRows, setSelectedRows] = React.useState<number[]>([]);

    const handleCheckboxChange = (id: number, isChecked: boolean) => {
        setSelectedRows(prevSelected => 
            isChecked ? [...prevSelected, id] : prevSelected.filter(rowId => rowId !== id)
        );
    };

    const clearSelection = () => {
        setSelectedRows([]);
    };

    return { selectedRows,setSelectedRows, handleCheckboxChange, clearSelection };
}

const CustomTable = <T extends { id: number }>({ 
    data, 
    columns, 
    canBeDeleted, 
    deleteById, 
    onRowClick,
    editById,
    orderby,
    setOrderby 
}: TableProps<T>) => {
    const { selectedRows, setSelectedRows, handleCheckboxChange, clearSelection } = useRowSelection();

    const handleDelete = (id: number[]) => {
        if (deleteById) {
            setSelectedRows(currentIds => [...currentIds, ...id]);
            deleteById(selectedRows);
            clearSelection(); // Clear the selection after deletion
        }
    };

    const columnIndexMap = useMemo(() => {
        return new Map(columns.map((col, index) => [col.key, index]));
    }, [columns]);

    const augmentedColumns = canBeDeleted
        ? [{ key: 'delete' as keyof T, label: 'Delete' }, ...columns]
        : columns;

        const [sortState, setSortState] = useState<Record<keyof T, 'asc' | 'desc' | 'def'>>(
            columns.reduce((acc, column) => ({
                ...acc,
                [column.key]: 'def'
            }), {} as Record<keyof T, 'asc' | 'desc' | 'def'>)
        );
    
        const toggleSortState = (key: keyof T) => {
            const currentSort = sortState[key];
            const nextSort = currentSort === 'asc' ? 'desc' : (currentSort === 'desc' ? 'def' : 'asc');
            setSortState({
                ...sortState,
                [key]: nextSort
            });
            const getNewPriority = (orders: string[][]): string => {
                const maxPriority = orders.reduce((max, order) => {
                    const currentPriority = parseInt(order[1]);
                    return currentPriority > max ? currentPriority : max;
                }, 0);
                return String(maxPriority + 1);
            };
            const index = columnIndexMap.get(key);
            if (index !== undefined) {
                const updatedOrderby = [...orderby];
                if(nextSort === "def") {
                    updatedOrderby[index] = [nextSort, "0"];
                } else if(updatedOrderby[index][1] === "0") {
                    updatedOrderby[index] = [nextSort, getNewPriority(updatedOrderby)];
                } else {
                    updatedOrderby[index] = [nextSort, updatedOrderby[index][1]];
                }
                setOrderby(updatedOrderby);
            }
        };

    return (
        <div className='table'>
            <TableContainer component={Paper} style={{ overflowX: "initial" }}>
                <Table sx={{ minWidth: 650 }} aria-label="sticky table">
                    <TableHead>
                        <TableRow>
                            {augmentedColumns.map((column) => (
                                <TableCell align='center' key={column.key as string} className='table__stickyHeader' >
                                    {(canBeDeleted && column.key === 'delete') ?
                                        <Button
                                            className='table__row__deleteButton'
                                            sx={{ textTransform: 'none' }}
                                            variant="outlined"
                                            color="error"
                                            size="small"
                                            startIcon={<DeleteForeverIcon />}
                                            onClick={() => handleDelete && handleDelete(selectedRows)}
                                        >
                                            Supprimer
                                        </Button>
                                        :
                                        <div className='table__columnTitle' onClick={() => toggleSortState(column.key)}>
                                        {column.label}
                                        <span style={{ marginLeft: '6px', verticalAlign: 'middle' }}> {/* Adjust vertical alignment */}
                                            {sortState[column.key] === 'asc' && <FontAwesomeIcon icon={faSortUp} />}
                                            {sortState[column.key] === 'desc' && <FontAwesomeIcon icon={faSortDown} />}
                                            {sortState[column.key] === 'def' && <FontAwesomeIcon icon={faSort} />}
                                        </span>
                                    </div>
                                    }
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {data.map(item => (
                            <TableRow
                                className="table__row"
                                key={item.id}
                                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                                onClick={() => { onRowClick ? onRowClick(item) : () => {};}}
                            >
                                {augmentedColumns.map(column => (
                                    <TableCell key={`${item.id}-${column.key as string}`} align={column.key === 'statement' ? ("left") : ("center")}>
                                        {column.key === 'delete' ? (
                                            <Checkbox
                                                size="small"
                                                color="secondary"
                                                checked={selectedRows.includes(item.id)}
                                                onChange={(event) => {handleCheckboxChange(item.id, event.target.checked)}}
                                                onClick={(event) => event.stopPropagation()}
                                                className="table__deleteCheckbox"
                                            />
                                        ) : (
                                            column.key === 'statement' ? (<><div style={{marginLeft: "70px"}} dangerouslySetInnerHTML={{ __html: item[column.key] as string }} /></>) : (
                                            column.format ? column.format(item[column.key]) : 
											(item[column.key] == null ? "N/A" : String(item[column.key])))
                                        )}
                                    </TableCell>
                                ))}
                                {canBeDeleted && (
                                    <TableCell align='left' style={{ 
                                        width: '90px', 
                                        height: '70px', 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'space-between',
                                        borderBottom: 'none'
                                        }}>
                                            
                                        <div className="table__row__deleteIcon">
                                            <DeleteIcon onClick={(event) => {event.stopPropagation(); deleteById && deleteById([item.id])}} />
                                        </div>
                                        <div className="table__row__deleteIcon">
                                            <BorderColorOutlinedIcon onClick={(event) => {event.stopPropagation(); editById && editById(item.id)}} />
                                        </div>
                                    </TableCell>
                                )}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </div>
    );
};

export default CustomTable;
