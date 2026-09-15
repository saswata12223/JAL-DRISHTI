import React, { useState, useMemo } from 'react';

export default function StationTable({
  stations = [],
  selectedStation,
  onSelectStation,
}) {
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 15;

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedStations = useMemo(() => {
    return [...stations].sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal ? bVal.toLowerCase() : '';
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [stations, sortField, sortDirection]);

  // Pagination calculation
  const totalPages = Math.ceil(sortedStations.length / rowsPerPage) || 1;
  const paginatedStations = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return sortedStations.slice(start, start + rowsPerPage);
  }, [sortedStations, currentPage, rowsPerPage]);

  const startIndex = (currentPage - 1) * rowsPerPage + 1;
  const endIndex = Math.min(currentPage * rowsPerPage, sortedStations.length);

  return (
    <div className="flex flex-col bg-white border border-[#A5F1F7]/35 rounded-xl shadow-[0_10px_35px_rgba(16,42,46,0.06)] overflow-hidden flex-1 min-w-0">
      {/* Table Container */}
      <div className="overflow-x-auto custom-scrollbar flex-1">
        <table className="w-full text-left border-collapse text-[12px] font-sans">
          {/* Table Header */}
          <thead className="bg-[#F2FAFB] border-b border-[#A5F1F7]/35 text-[10.5px] font-bold text-[#102A2E] uppercase tracking-wider select-none sticky top-0 z-10">
            <tr>
              <th
                onClick={() => handleSort('status')}
                className="py-3 px-2.5 cursor-pointer hover:text-[#24464B] transition-colors"
              >
                <div className="flex items-center gap-1">
                  <span>Status</span>
                  <span className="material-symbols-outlined text-[13px] text-[#6B858A]">
                    {sortField === 'status' ? (sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'}
                  </span>
                </div>
              </th>

              <th
                onClick={() => handleSort('name')}
                className="py-3 px-2.5 cursor-pointer hover:text-[#24464B] transition-colors"
              >
                <div className="flex items-center gap-1">
                  <span>Station / ID</span>
                  <span className="material-symbols-outlined text-[13px] text-[#6B858A]">
                    {sortField === 'name' ? (sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'}
                  </span>
                </div>
              </th>

              <th
                onClick={() => handleSort('district')}
                className="py-3 px-2.5 cursor-pointer hover:text-[#24464B] transition-colors"
              >
                <div className="flex items-center gap-1">
                  <span>District</span>
                  <span className="material-symbols-outlined text-[13px] text-[#6B858A]">
                    {sortField === 'district' ? (sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'}
                  </span>
                </div>
              </th>

              <th
                onClick={() => handleSort('river')}
                className="py-3 px-2.5 cursor-pointer hover:text-[#24464B] transition-colors"
              >
                <div className="flex items-center gap-1">
                  <span>River Basin</span>
                  <span className="material-symbols-outlined text-[13px] text-[#6B858A]">
                    {sortField === 'river' ? (sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'}
                  </span>
                </div>
              </th>

              <th
                onClick={() => handleSort('waterLevel')}
                className="py-3 px-2.5 cursor-pointer hover:text-[#24464B] transition-colors"
              >
                <div className="flex items-center gap-1">
                  <span>Water Level (MSL)</span>
                  <span className="material-symbols-outlined text-[13px] text-[#6B858A]">
                    {sortField === 'waterLevel' ? (sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'}
                  </span>
                </div>
              </th>

              <th
                onClick={() => handleSort('rainfallMm')}
                className="py-3 px-2.5 cursor-pointer hover:text-[#24464B] transition-colors"
              >
                <div className="flex items-center gap-1">
                  <span>Rainfall</span>
                  <span className="material-symbols-outlined text-[13px] text-[#6B858A]">
                    {sortField === 'rainfallMm' ? (sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'}
                  </span>
                </div>
              </th>

              <th
                onClick={() => handleSort('risk')}
                className="py-3 px-2.5 cursor-pointer hover:text-[#24464B] transition-colors"
              >
                <div className="flex items-center gap-1">
                  <span>Risk State</span>
                  <span className="material-symbols-outlined text-[13px] text-[#6B858A]">
                    {sortField === 'risk' ? (sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'}
                  </span>
                </div>
              </th>

              <th className="py-3 px-2.5 text-right">
                <span>Action</span>
              </th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-[#102A2E]/08 text-[#24464B] font-medium bg-white">
            {paginatedStations.length === 0 ? (
              <tr>
                <td colSpan="8" className="py-8 text-center text-[#6B858A]">
                  No monitoring stations match the specified search and filter criteria.
                </td>
              </tr>
            ) : (
              paginatedStations.map((st) => {
                const isSelected = selectedStation?.id === st.id;
                const isExtreme = st.risk === 'EXTREME';
                const isHigh = st.risk === 'HIGH';
                const isModerate = st.risk === 'MODERATE';

                let statusDot = 'bg-[#16A34A]';
                let statusLabel = 'Online';
                if (st.status === 'WARNING') {
                  statusDot = 'bg-[#D97706]';
                  statusLabel = 'Warning';
                } else if (st.status === 'CRITICAL' || isExtreme) {
                  statusDot = 'bg-[#DC2626] animate-pulse';
                  statusLabel = 'Critical';
                } else if (st.status === 'OFFLINE') {
                  statusDot = 'bg-[#6B858A]';
                  statusLabel = 'Offline';
                }

                let riskBadge = 'bg-emerald-500/10 text-[#16A34A] border-emerald-500/20';
                if (isExtreme) {
                  riskBadge = 'bg-red-500/15 text-[#DC2626] border-red-500/30';
                } else if (isHigh) {
                  riskBadge = 'bg-orange-500/15 text-[#F97316] border-orange-500/30';
                } else if (isModerate) {
                  riskBadge = 'bg-amber-500/15 text-[#D97706] border-amber-500/30';
                }

                return (
                  <tr
                    key={st.id}
                    onClick={() => onSelectStation(st)}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-[#EAF8FA] text-[#102A2E]'
                        : 'hover:bg-[#EAF8FA]'
                    }`}
                  >
                    {/* Status */}
                    <td className="py-3 px-2.5">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${statusDot}`}></span>
                        <span className="text-[11.5px] font-bold text-[#102A2E]">{statusLabel}</span>
                      </div>
                    </td>

                    {/* Station Name & ID */}
                    <td className="py-3 px-2.5">
                      <div className="flex flex-col">
                        <span className="font-bold text-[#102A2E]">{st.name}</span>
                        <span className="text-[10px] font-mono text-[#6B858A]">{st.id}</span>
                      </div>
                    </td>

                    {/* District */}
                    <td className="py-3 px-2.5 text-[#102A2E] font-medium">
                      {st.district}
                    </td>

                    {/* River Basin */}
                    <td className="py-3 px-2.5 text-[#24464B]">
                      {st.river || '—'}
                    </td>

                    {/* Water Level */}
                    <td className="py-3 px-2.5 font-mono">
                      {st.waterLevel ? (
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-[#102A2E]">{st.waterLevel} m</span>
                          {st.stage === 'DANGER ZONE' && (
                            <span className="text-[9.5px] font-bold px-1.5 py-0.2 bg-red-500/15 text-[#DC2626] rounded border border-red-500/30">
                              DANGER
                            </span>
                          )}
                          {st.stage === 'WARNING ZONE' && (
                            <span className="text-[9.5px] font-bold px-1.5 py-0.2 bg-amber-500/15 text-[#D97706] rounded border border-amber-500/30">
                              WARN
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-[#6B858A]">—</span>
                      )}
                    </td>

                    {/* Rainfall */}
                    <td className="py-3 px-2.5 font-mono">
                      {st.rainfallMm ? (
                        <span className={st.rainfallMm > 50 ? 'text-[#DC2626] font-bold' : 'text-[#102A2E]'}>
                          {st.rainfallMm} mm/h
                        </span>
                      ) : (
                        <span className="text-[#6B858A]">6 mm/h</span>
                      )}
                    </td>

                    {/* Risk Badge */}
                    <td className="py-3 px-2.5">
                      <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider ${riskBadge}`}>
                        {st.risk || 'LOW'}
                      </span>
                    </td>

                    {/* Action Button */}
                    <td className="py-3 px-2.5 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectStation(st);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-[#EAF8FA] hover:bg-[#A5F1F7] text-[#102A2E] border border-[#A5F1F7]/50 text-[11px] font-bold transition-all cursor-pointer shadow-xs"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-3.5 bg-[#F2FAFB] border-t border-[#A5F1F7]/35 flex flex-col sm:flex-row items-center justify-between gap-3 text-[12px] select-none">
        <span className="text-[#6B858A] text-[11.5px]">
          Showing <strong className="text-[#102A2E] font-mono">{sortedStations.length > 0 ? startIndex : 0}</strong> to{' '}
          <strong className="text-[#102A2E] font-mono">{endIndex}</strong> of{' '}
          <strong className="text-[#102A2E] font-mono">{sortedStations.length}</strong> monitored stations
        </span>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className="px-2.5 py-1 rounded-lg bg-white border border-[#A5F1F7]/50 text-[#24464B] hover:text-[#102A2E] disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-[11.5px] font-bold cursor-pointer"
          >
            Previous
          </button>

          <div className="flex items-center gap-1 px-2 font-mono text-[11.5px] text-[#6B858A]">
            <span className="font-bold text-[#102A2E]">{currentPage}</span>
            <span>/</span>
            <span>{totalPages}</span>
          </div>

          <button
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-2.5 py-1 rounded-lg bg-white border border-[#A5F1F7]/50 text-[#24464B] hover:text-[#102A2E] disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-[11.5px] font-bold cursor-pointer"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

