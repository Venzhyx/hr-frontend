import React, { useState, useEffect, useRef } from 'react';
import {
  HiOutlineXMark,
  HiOutlineBuildingOffice2,
  HiOutlineUsers,
  HiOutlineChevronDown,
  HiOutlineUser,
} from 'react-icons/hi2';
import { HiOutlineOfficeBuilding as HiOutlineOfficeBuildingOld } from 'react-icons/hi';

// ==================== LEVEL CONFIG ====================
const LEVEL_CONFIG = [
  { bar: 'bg-indigo-500', badge: 'bg-indigo-50 text-indigo-700 border-indigo-200', icon: 'bg-indigo-100 text-indigo-600' },
  { bar: 'bg-violet-500', badge: 'bg-violet-50 text-violet-700 border-violet-200', icon: 'bg-violet-100 text-violet-600' },
  { bar: 'bg-sky-500',    badge: 'bg-sky-50 text-sky-700 border-sky-200',          icon: 'bg-sky-100 text-sky-600'       },
  { bar: 'bg-emerald-500',badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: 'bg-emerald-100 text-emerald-600' },
  { bar: 'bg-amber-500',  badge: 'bg-amber-50 text-amber-700 border-amber-200',    icon: 'bg-amber-100 text-amber-600'   },
];

// ==================== ANIMATED COLLAPSE ====================
// Pure-JS height animation — no Tailwind animate classes needed
const AnimatedCollapse = ({ open, children }) => {
  const ref = useRef(null);
  const [height,   setHeight]   = useState(open ? 'auto' : '0px');
  const [overflow, setOverflow] = useState(open ? 'visible' : 'hidden');
  const firstRender = useRef(true);

  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return; }
    const el = ref.current;
    if (!el) return;

    if (open) {
      setOverflow('hidden');
      setHeight(`${el.scrollHeight}px`);
      const t = setTimeout(() => { setHeight('auto'); setOverflow('visible'); }, 280);
      return () => clearTimeout(t);
    } else {
      setHeight(`${el.scrollHeight}px`);
      setOverflow('hidden');
      // pin → then let go so transition fires
      requestAnimationFrame(() => requestAnimationFrame(() => setHeight('0px')));
    }
  }, [open]);

  return (
    <div
      ref={ref}
      style={{
        height,
        overflow,
        transition: height === 'auto' ? 'none' : 'height 280ms cubic-bezier(0.4,0,0.2,1)',
      }}
    >
      {children}
    </div>
  );
};

// ==================== TREE NODE ====================
const DepartmentTreeNode = ({ node, level = 0, mountDelay = 0 }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [visible,    setVisible]    = useState(false);
  const hasChildren = node.children && node.children.length > 0;
  const cfg = LEVEL_CONFIG[level % LEVEL_CONFIG.length];

  // Staggered fade + slide-up on mount
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), mountDelay);
    return () => clearTimeout(t);
  }, [mountDelay]);

  return (
    <div className="relative">
      {/* Vertical connector */}
      {level > 0 && (
        <div
          className="absolute top-0 bottom-0 w-px bg-gray-200"
          style={{ left: `${level * 28 - 14}px` }}
        />
      )}

      <div className="relative" style={{ marginLeft: `${level * 28}px` }}>
        {/* Horizontal connector */}
        {level > 0 && (
          <div
            className="absolute top-7 h-px bg-gray-200"
            style={{ left: '-14px', width: '14px' }}
          />
        )}

        {/* Toggle + card row */}
        <div
          className="flex items-start gap-2 mb-2"
          style={{
            opacity:   visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(10px)',
            transition: 'opacity 240ms ease, transform 240ms ease',
          }}
        >
          {/* Chevron toggle — rotates on collapse */}
          {hasChildren ? (
            <button
              onClick={() => setIsExpanded(p => !p)}
              className="mt-4 flex-shrink-0 w-6 h-6 rounded-md border border-gray-200 bg-white hover:bg-gray-50 flex items-center justify-center shadow-sm transition-colors"
            >
              <HiOutlineChevronDown
                className="w-3.5 h-3.5 text-gray-500"
                style={{
                  transform:  isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)',
                  transition: 'transform 220ms cubic-bezier(0.4,0,0.2,1)',
                }}
              />
            </button>
          ) : (
            <div className="w-6 flex-shrink-0" />
          )}

          {/* Card */}
          <div className="flex-1 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md hover:border-gray-300 transition-all duration-150 overflow-hidden">
            <div className="flex items-stretch">
              {/* Left accent bar */}
              <div className={`w-1 flex-shrink-0 ${cfg.bar}`} />

              {/* Body */}
              <div className="flex-1 px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${cfg.icon}`}>
                      <HiOutlineOfficeBuildingOld className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 text-sm leading-tight truncate">
                        {node.departmentName}
                      </p>
                      {node.company && (
                        <p className="text-xs text-gray-400 mt-0.5 truncate">{node.company.companyName}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {node.parentDepartmentName && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 border border-gray-200 font-medium">
                        Sub
                      </span>
                    )}
                    <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border font-medium ${cfg.badge}`}>
                      <HiOutlineUsers className="w-3 h-3" />
                      {node.employees?.length || 0}
                    </span>
                  </div>
                </div>

                {node.managerName && (
                  <div className="mt-2 pt-2 border-t border-dashed border-gray-100 flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <HiOutlineUser className="w-3 h-3 text-gray-500" />
                    </div>
                    <p className="text-xs text-gray-500 truncate">
                      <span className="text-gray-400">Manager · </span>
                      <span className="text-gray-700 font-medium">{node.managerName}</span>
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Children — animated height expand / collapse */}
      {hasChildren && (
        <AnimatedCollapse open={isExpanded}>
          {node.children.map((child, idx) => (
            <DepartmentTreeNode
              key={child.id}
              node={child}
              level={level + 1}
              mountDelay={mountDelay + (idx + 1) * 50}
            />
          ))}
        </AnimatedCollapse>
      )}
    </div>
  );
};

// ==================== MODAL ====================
const DepartmentTreeModal = ({ isOpen, onClose, departments }) => {
  // Keep DOM alive during exit animation
  const [rendered, setRendered] = useState(false);
  const [visible,  setVisible]  = useState(false);

  useEffect(() => {
    if (isOpen) {
      setRendered(true);
      // two rAF ticks ensure CSS transition fires after first paint
      requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
    } else {
      setVisible(false);
      const t = setTimeout(() => setRendered(false), 300);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  useEffect(() => {
    const fn = (e) => { if (e.key === 'Escape' && isOpen) onClose(); };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [isOpen, onClose]);

  if (!rendered) return null;

  const countTotal = (depts) => {
    let totalDepts = depts.length, totalEmployees = 0;
    const recurse = (nodes) => nodes.forEach(n => {
      totalEmployees += n.employees?.length || 0;
      if (n.children?.length) { totalDepts += n.children.length; recurse(n.children); }
    });
    recurse(depts);
    return { totalDepts, totalEmployees };
  };
  const { totalDepts, totalEmployees } = countTotal(departments);

  return (
    /* ── Overlay: fades + blurs in ── */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto py-10"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        backgroundColor: visible ? 'rgba(0,0,0,0.55)' : 'rgba(0,0,0,0)',
        backdropFilter:  visible ? 'blur(4px)' : 'blur(0px)',
        transition: 'background-color 300ms ease, backdrop-filter 300ms ease',
      }}
    >
      {/* ── Panel: scale + slide up ── */}
      <div
        className="bg-white rounded-xl max-w-5xl w-full mx-4 max-h-[90vh] overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        style={{
          opacity:   visible ? 1 : 0,
          transform: visible ? 'scale(1) translateY(0)' : 'scale(0.95) translateY(20px)',
          transition: 'opacity 280ms cubic-bezier(0.4,0,0.2,1), transform 280ms cubic-bezier(0.4,0,0.2,1)',
        }}
      >
        {/* ── Header: slides down ── */}
        <div
          className="sticky top-0 bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-4 flex justify-between items-center z-10"
          style={{
            opacity:   visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(-100%)',
            transition: 'opacity 300ms ease 60ms, transform 300ms cubic-bezier(0.4,0,0.2,1) 60ms',
          }}
        >
          <div className="flex items-center space-x-3">
            <div className="bg-white/20 rounded-lg p-2 backdrop-blur-sm">
              <HiOutlineBuildingOffice2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Organization Structure</h2>
              <p className="text-sm text-indigo-100">Department hierarchy tree view</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-lg flex items-center space-x-2">
              <HiOutlineBuildingOffice2 className="w-4 h-4 text-white" />
              <span className="text-sm font-medium text-white">{totalDepts}</span>
            </div>
            <div className="bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-lg flex items-center space-x-2">
              <HiOutlineUsers className="w-4 h-4 text-white" />
              <span className="text-sm font-medium text-white">{totalEmployees}</span>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white ml-2 bg-white/10 hover:bg-white/20 rounded-lg p-1.5 transition-colors"
            >
              <HiOutlineXMark className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ── Body ── */}
        <div
          className="p-6 overflow-y-auto bg-gray-50"
          style={{ maxHeight: 'calc(90vh - 140px)' }}
        >
          {departments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="bg-indigo-50 rounded-2xl p-6 mb-4">
                <HiOutlineBuildingOffice2 className="w-16 h-16 text-indigo-300" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">No Departments Found</h3>
              <p className="text-sm text-gray-500 text-center max-w-sm">
                Get started by creating your first department to organize your company structure.
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {departments.map((dept, idx) => (
                <DepartmentTreeNode
                  key={dept.id}
                  node={dept}
                  level={0}
                  mountDelay={idx * 70}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── Footer: slides up ── */}
        <div
          className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-between items-center"
          style={{
            opacity:   visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(100%)',
            transition: 'opacity 300ms ease 80ms, transform 300ms cubic-bezier(0.4,0,0.2,1) 80ms',
          }}
        >
          <div className="flex items-center gap-4 text-xs text-gray-500">
            {LEVEL_CONFIG.slice(0, 3).map((cfg, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <div className={`w-2.5 h-2.5 rounded-full ${cfg.bar}`} />
                <span>Level {i + 1}{i === 2 ? '+' : ''}</span>
              </div>
            ))}
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium shadow-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default DepartmentTreeModal;
