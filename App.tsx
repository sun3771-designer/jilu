
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
  LayoutDashboard, 
  PlusCircle, 
  BarChart3, 
  Settings, 
  LogOut, 
  Wallet, 
  Smartphone,
  Trash2,
  Calendar,
  ChevronRight,
  TrendingUp,
  BrainCircuit,
  CheckCircle2,
  UserPen,
  Plus,
  Type,
  Percent,
  Coins,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Filter,
  FilterX,
  Keyboard,
  ClipboardCheck,
  ArrowRightLeft,
  Settings2,
  Tags,
  DollarSign,
  Download,
  UploadCloud,
  FileJson,
  FileSpreadsheet,
  MessageCircle
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { DEFAULT_EMPLOYEES, DEFAULT_SERVICES, STORAGE_KEY, SETTINGS_KEY } from './constants';
import { Transaction, PaymentMethod, MonthlySummary, Employee, ServiceConfig } from './types';
import { formatCurrency, calculateCommission } from './utils/calculations';

// --- UI Components ---

const Card: React.FC<{ children: React.ReactNode; title?: string; subtitle?: string; className?: string }> = ({ children, title, subtitle, className = "" }) => (
  <div className={`bg-white rounded-2xl shadow-sm border border-slate-100 p-4 md:p-6 ${className}`}>
    {title && (
      <div className="mb-4 md:mb-6">
        <h3 className="text-lg md:text-xl font-black text-slate-800 tracking-tight">{title}</h3>
        {subtitle && <p className="text-[10px] md:text-xs text-slate-400 font-medium mt-1">{subtitle}</p>}
      </div>
    )}
    {children}
  </div>
);

const StatBox: React.FC<{ label: string; value: string; icon: React.ReactNode; color: string; className?: string }> = ({ label, value, icon, color, className = "" }) => (
  <div className={`flex items-center p-3 md:p-5 bg-white rounded-2xl border border-slate-100 shadow-sm transition-all ${className}`}>
    <div className={`p-2.5 md:p-3.5 rounded-xl ${color} mr-3 md:mr-4 shadow-inner`}>
      {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<any>, { size: 18 }) : icon}
    </div>
    <div className="min-w-0">
      <p className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5 truncate">{label}</p>
      <p className="text-sm md:text-2xl font-black text-slate-900 leading-none truncate">{value}</p>
    </div>
  </div>
);

const ShortcutTag: React.FC<{ keys: string; className?: string }> = ({ keys, className = "" }) => (
  <span className={`hidden md:inline-flex items-center px-1.5 py-0.5 rounded border border-slate-200 bg-slate-50 text-[9px] font-mono text-slate-400 font-bold ml-1 uppercase shadow-sm ${className}`}>
    {keys}
  </span>
);

const ConfirmationModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}> = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-t-3xl md:rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden animate-in slide-in-from-bottom md:zoom-in-95 duration-200">
        <div className="p-8 text-center">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-5">
            <AlertTriangle className="text-red-500 w-8 h-8" />
          </div>
          <h3 className="text-xl font-black text-slate-900 mb-2">{title}</h3>
          <p className="text-slate-500 text-sm leading-relaxed">{message}</p>
        </div>
        <div className="flex border-t border-slate-100 p-6 gap-3 bg-slate-50/50">
          <button 
            onClick={onClose}
            className="flex-1 px-4 py-4 rounded-2xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-white transition-all"
          >
            取消
          </button>
          <button 
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="flex-1 px-4 py-4 rounded-2xl bg-red-600 text-white font-bold text-sm hover:bg-red-700 shadow-lg shadow-red-100 transition-all"
          >
            确认作废
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Main App ---

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'entry' | 'reconcile' | 'reports' | 'settings'>('dashboard');
  
  // Environment State
  const [isWechat, setIsWechat] = useState(false);

  // Data State
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [employees, setEmployees] = useState<Employee[]>(DEFAULT_EMPLOYEES);
  const [services, setServices] = useState<ServiceConfig[]>(DEFAULT_SERVICES);

  // Form State
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(DEFAULT_EMPLOYEES[0].id);
  const [selectedServiceId, setSelectedServiceId] = useState(DEFAULT_SERVICES[0].id);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.ONLINE);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Entry Filter State
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  // UI State
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [reconcileExpandedDate, setReconcileExpandedDate] = useState<string | null>(new Date().toISOString().split('T')[0]);

  // Reporting State
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Detect WeChat
  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase();
    setIsWechat(/micromessenger/.test(ua));
  }, []);

  // Load Persistence
  useEffect(() => {
    const savedData = localStorage.getItem(STORAGE_KEY);
    const savedSettings = localStorage.getItem(SETTINGS_KEY);
    if (savedData) setTransactions(JSON.parse(savedData));
    if (savedSettings) {
      const { emps, servs } = JSON.parse(savedSettings);
      if (emps) setEmployees(emps);
      if (servs) setServices(servs);
    }
  }, []);

  // Save Persistence
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ emps: employees, servs: services }));
  }, [employees, services]);

  // Actions
  const handleAddTransaction = useCallback(() => {
    const service = services.find(s => s.id === selectedServiceId);
    const employee = employees.find(e => e.id === selectedEmployeeId);
    if (!service || !employee) return;

    const commission = calculateCommission(service, employee);

    const newTx: Transaction = {
      id: crypto.randomUUID(),
      employeeId: selectedEmployeeId,
      date: selectedDate,
      amount: service.amount,
      commission: commission,
      paymentMethod,
      serviceLabel: service.label,
    };

    setTransactions(prev => [newTx, ...prev]);
    // Feedback for mobile
    if ('vibrate' in navigator) navigator.vibrate(50);
  }, [services, employees, selectedServiceId, selectedEmployeeId, selectedDate, paymentMethod]);

  const exportToCSV = () => {
    const data = transactions.filter(tx => tx.date.startsWith(selectedMonth));
    if (data.length === 0) return alert('本月暂无数据');

    const headers = ['日期', '员工', '项目', '金额', '提成', '支付方式'];
    const rows = data.map(tx => [
      tx.date,
      employees.find(e => e.id === tx.employeeId)?.name || '未知',
      tx.serviceLabel,
      tx.amount,
      tx.commission,
      tx.paymentMethod === PaymentMethod.ONLINE ? '线上' : '现金'
    ]);

    const csvContent = "\uFEFF" + [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `业绩报表_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const backupData = () => {
    const allData = {
      transactions,
      employees,
      services,
      version: '3.0',
      timestamp: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `店管家备份_${new Date().toISOString().split('T')[0]}.json`);
    link.click();
  };

  const restoreData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        if (json.transactions) setTransactions(json.transactions);
        if (json.employees) setEmployees(json.employees);
        if (json.services) setServices(json.services);
        alert('数据恢复成功！');
      } catch (err) {
        alert('解析失败，请确保文件格式正确。');
      }
    };
    reader.readAsText(file);
  };

  // Keyboard Shortcuts Hook
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeTab !== 'entry') return;
      if (document.activeElement instanceof HTMLInputElement || document.activeElement instanceof HTMLTextAreaElement) {
        if (e.key !== 'Enter' || !(e.ctrlKey || e.metaKey)) return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleAddTransaction();
        return;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, handleAddTransaction]);

  const deleteTransaction = () => {
    if (deleteTargetId) {
      setTransactions(prev => prev.filter(tx => tx.id !== deleteTargetId));
      setDeleteTargetId(null);
    }
  };

  const updateEmployeeName = (id: string, newName: string) => {
    setEmployees(prev => prev.map(e => e.id === id ? { ...e, name: newName } : e));
  };

  const updateServicePrice = (id: string, newPrice: number) => {
    setServices(prev => prev.map(s => s.id === id ? { ...s, amount: newPrice } : s));
  };

  const updateServiceLabel = (id: string, newLabel: string) => {
    setServices(prev => prev.map(s => s.id === id ? { ...s, label: newLabel } : s));
  };

  const updateServiceCommissionValue = (id: string, value: number) => {
    setServices(prev => prev.map(s => s.id === id ? { ...s, commissionValue: value } : s));
  };

  const addNewService = () => {
    const newService: ServiceConfig = {
      id: crypto.randomUUID(),
      label: `新项目 ${services.length + 1}`,
      amount: 100,
      commissionType: 'percentage',
      commissionValue: 0.2
    };
    setServices(prev => [...prev, newService]);
  };

  const deleteService = (id: string) => {
    if (services.length <= 1) {
      alert('至少需要保留一个服务项目');
      return;
    }
    if (window.confirm('确定要删除这个服务项目吗？')) {
      setServices(prev => prev.filter(s => s.id !== id));
    }
  };

  // --- Calculations ---
  
  const monthlyData = useMemo(() => {
    return transactions.filter(tx => tx.date.startsWith(selectedMonth));
  }, [transactions, selectedMonth]);

  const monthlySummaries: MonthlySummary[] = useMemo(() => {
    return employees.map(emp => {
      const empTxs = monthlyData.filter(tx => tx.employeeId === emp.id);
      return {
        employeeId: emp.id,
        employeeName: emp.name,
        totalOnline: empTxs.filter(tx => tx.paymentMethod === PaymentMethod.ONLINE).reduce((sum, tx) => sum + tx.amount, 0),
        totalCash: empTxs.filter(tx => tx.paymentMethod === PaymentMethod.CASH).reduce((sum, tx) => sum + tx.amount, 0),
        totalAmount: empTxs.reduce((sum, tx) => sum + tx.amount, 0),
        totalCommission: empTxs.reduce((sum, tx) => sum + tx.commission, 0),
      };
    }).sort((a, b) => b.totalAmount - a.totalAmount);
  }, [monthlyData, employees]);

  const totals = useMemo(() => ({
    amount: monthlySummaries.reduce((s, m) => s + m.totalAmount, 0),
    commission: monthlySummaries.reduce((s, m) => s + m.totalCommission, 0),
    online: monthlySummaries.reduce((s, m) => s + m.totalOnline, 0),
    cash: monthlySummaries.reduce((s, m) => s + m.totalCash, 0),
  }), [monthlySummaries]);

  const dailyGroups = useMemo(() => {
    const groups: Record<string, { online: number, cash: number, total: number, emps: Record<string, { online: number, cash: number, total: number }> }> = {};
    transactions.forEach(tx => {
      if (!groups[tx.date]) {
        groups[tx.date] = { online: 0, cash: 0, total: 0, emps: employees.reduce((acc, e) => ({...acc, [e.id]: { online: 0, cash: 0, total: 0 }}), {}) };
      }
      const g = groups[tx.date];
      if (tx.paymentMethod === PaymentMethod.ONLINE) g.online += tx.amount;
      else g.cash += tx.amount;
      g.total += tx.amount;
      if (g.emps[tx.employeeId]) {
        if (tx.paymentMethod === PaymentMethod.ONLINE) g.emps[tx.employeeId].online += tx.amount;
        else g.emps[tx.employeeId].cash += tx.amount;
        g.emps[tx.employeeId].total += tx.amount;
      }
    });
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 31);
  }, [transactions, employees]);

  // --- Render Views ---

  const renderDashboard = () => (
    <div className="space-y-4 md:space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <StatBox label="本月业绩" value={formatCurrency(totals.amount)} icon={<TrendingUp className="text-blue-600" />} color="bg-blue-50" />
        <StatBox label="本月提成" value={formatCurrency(totals.commission)} icon={<Wallet className="text-emerald-600" />} color="bg-emerald-50" />
        <StatBox label="线上收款" value={formatCurrency(totals.online)} icon={<Smartphone className="text-indigo-600" />} color="bg-indigo-50" />
        <StatBox label="现金收款" value={formatCurrency(totals.cash)} icon={<PlusCircle className="text-amber-600" />} color="bg-amber-50" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <Card title="员工业绩对比">
          <div className="h-48 md:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlySummaries}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="employeeName" axisLine={false} tickLine={false} fontSize={10} />
                <YAxis axisLine={false} tickLine={false} fontSize={10} />
                <Tooltip cursor={{fill: '#f8fafc'}} formatter={(val: number) => formatCurrency(val)} />
                <Bar dataKey="totalOnline" name="线上" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={16} />
                <Bar dataKey="totalCash" name="现金" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card title="最新账单流向">
          <div className="space-y-2 md:space-y-3 max-h-48 md:max-h-64 overflow-y-auto custom-scrollbar pr-2">
            {transactions.slice(0, 10).map(tx => (
              <div key={tx.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100/50">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-black">
                    {employees.find(e => e.id === tx.employeeId)?.name.slice(-2)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-black text-slate-800 truncate">{tx.serviceLabel}</p>
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">{tx.date.slice(5)} • {tx.paymentMethod === 'ONLINE' ? '线上' : '现金'}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                    <p className="text-[10px] font-bold text-slate-400">{formatCurrency(tx.amount)}</p>
                    <p className="text-xs font-black text-emerald-600">+{formatCurrency(tx.commission)}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );

  const renderEntry = () => (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="lg:col-span-5 space-y-4 md:space-y-6">
        <Card title="1. 选择员工">
          <div className="grid grid-cols-3 gap-2">
            {employees.map((emp, idx) => (
              <button key={emp.id} onClick={() => setSelectedEmployeeId(emp.id)} className={`relative py-4 px-2 rounded-xl text-xs font-black transition-all ${selectedEmployeeId === emp.id ? 'bg-slate-900 text-white shadow-lg' : 'bg-white border border-slate-100 text-slate-400 hover:border-slate-300'}`}>
                {emp.name}
              </button>
            ))}
          </div>
        </Card>
        <Card title="2. 选择服务与日期">
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
              {services.map((s) => {
                const isSelected = selectedServiceId === s.id;
                return (
                  <button key={s.id} onClick={() => setSelectedServiceId(s.id)} className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${isSelected ? 'border-emerald-500 bg-emerald-50 text-emerald-900' : 'border-slate-50 bg-slate-50 text-slate-500'}`}>
                    <div className="text-left">
                      <p className="font-black text-sm">{s.label}</p>
                      <p className="text-[10px] opacity-60">预估提成: {formatCurrency(calculateCommission(s))}</p>
                    </div>
                    <p className="text-base font-black">{formatCurrency(s.amount)}</p>
                  </button>
                );
              })}
            </div>
            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
              <Calendar size={18} className="text-slate-400" />
              <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="bg-transparent text-sm font-black outline-none flex-1" />
            </div>
          </div>
        </Card>
        <Card title="3. 支付方式">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setPaymentMethod(PaymentMethod.ONLINE)} className={`flex flex-col items-center justify-center p-5 rounded-xl border-2 transition-all ${paymentMethod === PaymentMethod.ONLINE ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-50 text-slate-400'}`}>
                <Smartphone className="mb-2" size={24} /><span className="text-[10px] font-black uppercase tracking-widest">线上收款</span>
              </button>
              <button onClick={() => setPaymentMethod(PaymentMethod.CASH)} className={`flex flex-col items-center justify-center p-5 rounded-xl border-2 transition-all ${paymentMethod === PaymentMethod.CASH ? 'border-amber-600 bg-amber-50 text-amber-700' : 'border-slate-50 text-slate-400'}`}>
                <Wallet className="mb-2" size={24} /><span className="text-[10px] font-black uppercase tracking-widest">现金收款</span>
              </button>
            </div>
            <button onClick={handleAddTransaction} className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-2 active:scale-95 transition-all shadow-xl shadow-slate-200">
              确认入账
            </button>
          </div>
        </Card>
      </div>
      <div className="lg:col-span-7">
        <Card title="今日流水记录" className="h-full flex flex-col">
           <div className="overflow-x-auto flex-1">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-400 font-black uppercase tracking-widest">
                  <tr><th className="px-4 py-4">员工</th><th className="px-4 py-4">项目</th><th className="px-4 py-4 text-right">金额</th><th className="px-4 py-4"></th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transactions.filter(tx => tx.date === selectedDate).map(tx => (
                    <tr key={tx.id}>
                      <td className="px-4 py-4 font-black">{employees.find(e => e.id === tx.employeeId)?.name}</td>
                      <td className="px-4 py-4 font-medium text-slate-500">{tx.serviceLabel}</td>
                      <td className="px-4 py-4 text-right font-black">{formatCurrency(tx.amount)}</td>
                      <td className="px-4 py-4 text-right"><button onClick={() => setDeleteTargetId(tx.id)} className="text-slate-300 hover:text-red-500"><Trash2 size={16} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {transactions.filter(tx => tx.date === selectedDate).length === 0 && (
                <div className="py-20 text-center text-slate-300 font-black text-sm uppercase tracking-widest">今日暂无流水</div>
              )}
           </div>
        </Card>
      </div>
    </div>
  );

  const renderReports = () => (
    <div className="space-y-4 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-4">
            <h2 className="text-xl font-black text-slate-800">工资报表</h2>
            <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="outline-none text-sm font-black text-indigo-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100" />
        </div>
        <button onClick={exportToCSV} className="flex items-center justify-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-xl text-sm font-black shadow-lg shadow-emerald-100 active:scale-95 transition-all">
          <FileSpreadsheet size={18} /> 下载本月 Excel
        </button>
      </div>
      <Card className="px-0 py-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-900 text-white font-black uppercase tracking-widest text-[10px]">
              <tr><th className="px-6 py-4">姓名</th><th className="px-6 py-4">业绩总额</th><th className="px-6 py-4 text-emerald-400">应发提成</th><th className="px-6 py-4 text-right">分类明细</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {monthlySummaries.map((summary) => (
                <tr key={summary.employeeId}>
                  <td className="px-6 py-5 font-black text-slate-800">{summary.employeeName}</td>
                  <td className="px-6 py-5 font-black text-slate-900">{formatCurrency(summary.totalAmount)}</td>
                  <td className="px-6 py-5 font-black text-emerald-600">{formatCurrency(summary.totalCommission)}</td>
                  <td className="px-6 py-5 text-right">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">线: {formatCurrency(summary.totalOnline)} | 现: {formatCurrency(summary.totalCash)}</span>
                  </td>
                </tr>
              ))}
              <tr className="bg-slate-900 text-white font-black">
                <td className="px-6 py-6">月度合计</td>
                <td className="px-6 py-6 text-lg">{formatCurrency(totals.amount)}</td>
                <td className="px-6 py-6 text-emerald-400 text-lg">{formatCurrency(totals.commission)}</td>
                <td className="px-6 py-6 text-right opacity-60 text-xs">
                    线上: {formatCurrency(totals.online)}<br/>
                    现金: {formatCurrency(totals.cash)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#fbfcfd] text-slate-900 pb-20 md:pb-0">
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
      `}</style>

      <ConfirmationModal 
        isOpen={deleteTargetId !== null}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={deleteTransaction}
        title="确认作废？"
        message="删除后该笔业绩及提成将消失，不可恢复。"
      />

      {/* Desktop Navigation */}
      <aside className="hidden md:flex w-72 bg-white border-r border-slate-100 flex-col sticky top-0 h-screen">
        <div className="p-8 flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white font-black text-xl">店</div>
          <h1 className="font-black text-xl tracking-tighter">店管家 PRO</h1>
        </div>
        <nav className="flex-1 px-4 space-y-1">
          {[
            { id: 'dashboard', icon: LayoutDashboard, label: '数据面板' },
            { id: 'entry', icon: PlusCircle, label: '开单记录' },
            { id: 'reconcile', icon: ArrowRightLeft, label: '每日对账' },
            { id: 'reports', icon: BarChart3, label: '工资报表' },
            { id: 'settings', icon: Settings, label: '系统设置' },
          ].map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id as any)} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all ${activeTab === item.id ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50 font-bold'}`}>
              <item.icon size={20} /> <span className="text-sm">{item.label}</span>
            </button>
          ))}
        </nav>
        {isWechat && (
          <div className="p-6 mb-4 mx-4 bg-emerald-50 rounded-2xl border border-emerald-100">
             <div className="flex items-center gap-2 text-emerald-700 font-black text-xs mb-1">
               <MessageCircle size={14} /> 微信模式
             </div>
             <p className="text-[10px] text-emerald-600 font-medium">您可以点击右上角“浮窗”随时记账。</p>
          </div>
        )}
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-slate-100 px-2 py-4 flex items-center justify-around z-50">
        {[
          { id: 'dashboard', icon: LayoutDashboard, label: '面板' },
          { id: 'entry', icon: PlusCircle, label: '开单' },
          { id: 'reconcile', icon: ArrowRightLeft, label: '对账' },
          { id: 'reports', icon: BarChart3, label: '报表' },
          { id: 'settings', icon: Settings, label: '设置' },
        ].map(item => (
          <button key={item.id} onClick={() => setActiveTab(item.id as any)} className={`flex flex-col items-center gap-1 transition-all ${activeTab === item.id ? 'text-slate-900 scale-105' : 'text-slate-300'}`}>
            <item.icon size={22} strokeWidth={activeTab === item.id ? 2.5 : 2} />
            <span className="text-[10px] font-black">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Main Content */}
      <main className="flex-1 p-5 md:p-12">
        <header className="mb-8 flex items-end justify-between">
            <div>
                <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter">
                    {activeTab === 'dashboard' ? '业绩监控' : 
                     activeTab === 'entry' ? '快速开单' : 
                     activeTab === 'reconcile' ? '对账中心' : 
                     activeTab === 'reports' ? '工资结算' : '管理设置'}
                </h2>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-2">{activeTab.toUpperCase()} OVERVIEW</p>
            </div>
            <div className="md:hidden w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white font-black">S</div>
        </header>

        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'entry' && renderEntry()}
        {activeTab === 'reconcile' && (
            <div className="space-y-4 animate-in slide-in-from-right-4 duration-500">
                {dailyGroups.map(([date, data]) => {
                    const isExpanded = reconcileExpandedDate === date;
                    return (
                        <div key={date} className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                            <button onClick={() => setReconcileExpandedDate(isExpanded ? null : date)} className="w-full flex items-center justify-between p-5">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-xs font-black text-slate-400">{date.slice(8, 10)}日</div>
                                    <div className="text-left">
                                        <p className="font-black text-sm">{date}</p>
                                        <p className="text-[10px] text-slate-400 font-bold">当日汇总流水</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="font-black text-base">{formatCurrency(data.total)}</span>
                                    <ChevronDown size={18} className={`transition-transform text-slate-300 ${isExpanded ? 'rotate-180' : ''}`} />
                                </div>
                            </button>
                            {isExpanded && (
                                <div className="px-5 pb-5 animate-in slide-in-from-top-2">
                                    <div className="bg-slate-50 p-4 rounded-xl space-y-3">
                                        {employees.map(emp => {
                                            const empData = data.emps[emp.id] || { online: 0, cash: 0, total: 0 };
                                            if (empData.total === 0) return null;
                                            return (
                                                <div key={emp.id} className="flex justify-between text-xs font-black border-b border-slate-100 pb-2 last:border-0">
                                                    <span className="text-slate-800">{emp.name}</span>
                                                    <div className="flex gap-3">
                                                        <span className="text-indigo-600">线:{formatCurrency(empData.online)}</span>
                                                        <span className="text-amber-600">现:{formatCurrency(empData.cash)}</span>
                                                        <span className="text-slate-900">共:{formatCurrency(empData.total)}</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        )}
        {activeTab === 'reports' && renderReports()}
        {activeTab === 'settings' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in zoom-in-95 duration-500">
                <Card title="基础设置与备份">
                    <div className="space-y-6">
                        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">数据安全存储</h4>
                          <div className="grid grid-cols-2 gap-3">
                            <button onClick={backupData} className="flex items-center justify-center gap-2 bg-white border border-slate-200 py-4 rounded-xl text-xs font-black text-slate-600 shadow-sm hover:shadow-md transition-all">
                               <Download size={16} /> 导出备份
                            </button>
                            <button onClick={() => fileInputRef.current?.click()} className="flex items-center justify-center gap-2 bg-white border border-slate-200 py-4 rounded-xl text-xs font-black text-indigo-600 shadow-sm hover:shadow-md transition-all">
                               <UploadCloud size={16} /> 导入恢复
                            </button>
                            <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={restoreData} />
                          </div>
                        </div>
                        <div className="space-y-3">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">员工名单 (支持修改)</h4>
                            {employees.map(emp => (
                                <input key={emp.id} type="text" value={emp.name} onChange={e => updateEmployeeName(emp.id, e.target.value)} className="w-full bg-slate-50 p-4 rounded-xl outline-none text-sm font-black border border-slate-100" />
                            ))}
                        </div>
                    </div>
                </Card>
                <Card title="服务项目管理">
                    <div className="space-y-3">
                        {services.map(s => (
                            <div key={s.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 group relative">
                                <div className="flex items-center gap-2 mb-3">
                                    <input type="text" value={s.label} onChange={e => updateServiceLabel(s.id, e.target.value)} className="flex-1 bg-transparent font-black text-sm outline-none" />
                                    <button onClick={() => deleteService(s.id)} className="text-slate-200 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={16} /></button>
                                </div>
                                <div className="flex gap-4">
                                    <div className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2">
                                        <p className="text-[8px] font-black text-slate-300 uppercase">单价</p>
                                        <input type="number" value={s.amount} onChange={e => updateServicePrice(s.id, parseFloat(e.target.value) || 0)} className="w-full bg-transparent font-black text-xs outline-none" />
                                    </div>
                                    <div className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2">
                                        <p className="text-[8px] font-black text-slate-300 uppercase">提成 ({s.commissionType === 'percentage' ? '%' : '元'})</p>
                                        <input type="number" value={s.commissionType === 'percentage' ? s.commissionValue * 100 : s.commissionValue} onChange={e => updateServiceCommissionValue(s.id, s.commissionType === 'percentage' ? parseFloat(e.target.value)/100 : parseFloat(e.target.value))} className="w-full bg-transparent font-black text-xs outline-none" />
                                    </div>
                                </div>
                            </div>
                        ))}
                        <button onClick={addNewService} className="w-full py-5 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 font-black text-xs uppercase tracking-widest">+ 添加新业务</button>
                    </div>
                </Card>
            </div>
        )}
      </main>
    </div>
  );
};

export default App;
