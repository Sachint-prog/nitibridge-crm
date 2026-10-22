import React from 'react';

const Pagination = ({ totalEntries, entriesPerPage, currentPage, onPageChange, onEntriesPerPageChange }) => {
    const totalPages = Math.ceil(totalEntries / entriesPerPage);

    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', padding: '1rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <span>Show</span>
                <select 
                    style={{ padding: '0.2rem', borderRadius: '4px', border: '1px solid var(--border)' }}
                    value={entriesPerPage}
                    onChange={(e) => onEntriesPerPageChange(Number(e.target.value))}
                >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                </select>
                <span>entries</span>
            </div>
            
            <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button 
                    className="btn btn-secondary" 
                    style={{ width: 'auto', padding: '0.4rem 0.8rem', opacity: currentPage === 1 ? 0.5 : 1 }}
                    disabled={currentPage === 1}
                    onClick={() => onPageChange(currentPage - 1)}
                >
                    Previous
                </button>
                <span style={{ display: 'flex', alignItems: 'center', padding: '0 1rem', fontWeight: '600' }}>
                    Page {currentPage} of {totalPages || 1}
                </span>
                <button 
                    className="btn btn-secondary" 
                    style={{ width: 'auto', padding: '0.4rem 0.8rem', opacity: (currentPage === totalPages || totalPages === 0) ? 0.5 : 1 }}
                    disabled={currentPage === totalPages || totalPages === 0}
                    onClick={() => onPageChange(currentPage + 1)}
                >
                    Next
                </button>
            </div>
        </div>
    );
};

export default Pagination;
