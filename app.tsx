import React, { useState, useEffect, useMemo } from 'react';
import { LayoutDashboard, PlusCircle, BarChart3, Settings, Wallet, Smartphone, Trash2, Calendar, TrendingUp, ChevronDown } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DEFAULT_EMPLOYEES, DEFAULT_SERVICES, STORAGE_KEY, SETTINGS_KEY } from './constants';
import { Transaction, PaymentMethod, MonthlySummary } from './types';

const formatCurrency = (num: number) => `¥${num.toFixed(2)}`;

const App = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [employees, setEmployees] = useState(DEFAULT_EMPLOYEES);
  const [services, setServices] = useState(DEFAULT_SERVICES);

  const [selEmp, setSelEmp] = useState(DEFAULT_EMPLOYEES[0].id);
  const [selServ, setSelServ] = useState(DEFAULT_SERVICES[0].id);
  const [payMethod, setPayMethod] = useState(PaymentMethod.ONLINE);
  const [selDate, setSelDate] = useState(new Date().toISOString().split('T')[0]);
  const [selMonth, setSelMonth] = useState(new Date().toISOString().slice(0, 7));

  useEffect(() => {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) setTransactions(JSON.parse(data));
    const sets = localStorage.getItem(SETTINGS_KEY);
    if (sets) {
      const { emps, servs } = JSON.parse(sets);
      if (emps) setEmployees(emps);
      if (servs) setServices(servs);
    }
  }, []);

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions)); }, [transactions]);
  useEffect(() => { localStorage.setItem(SETTINGS_KEY, JSON.stringify({ emps: employees, servs: services })); }, [employees, services]);

  const addTx = () => {
    const s = services.find(x => x.id === selServ);
    if (!s) return;
    const comm = s.commissionType === 'percentage' ? s.amount * s.commissionValue : s.commissionValue;
    const tx: Transaction = {
      id: Math.random().toString(36),
      employeeId: selEmp,
      date: selDate,
      amount: s.amount,
      commission: comm,
      paymentMethod: payMethod,
      serviceLabel: s.label
    };
    setTransactions([tx, ...transactions]);
  };

  const monthlySummaries: MonthlySummary[] = useMemo(() => {
    return employees.map(e => {
      const txs = transactions.filter(t => t.employeeId === e.id && t.date.startsWith(selMonth));
      return {
        employeeId: e.id,
        employeeName: e.name,
        totalOnline: txs.filter(t => t.paymentMethod === PaymentMethod.ONLINE).reduce((a, b) => a + b.amount, 0),
        totalCash: txs.filter(t => t.paymentMethod === PaymentMethod.CASH).reduce((a, b) => a + b.amount, 0),
        totalAmount: txs.reduce((a, b) => a + b.amount, 0),
        totalCommission: txs.reduce((a, b) => a + b.commission, 0),
      };
    });
  }, [transactions, employees, selMonth]);

  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      {/* 侧边栏 */}
      <aside className="w-full md:w-64 bg-slate-900 text-white p-6 space-y-4">
        <h1 className="text-2xl font-black mb-8">店管家 PRO</h1>
        <button onClick={() => setActiveTab('dashboard')} className={`w-full text-left p-3 rounded-lg flex items-center gap-3 ${activeTab === 'dashboard' ? 'bg-blue-600' : ''}`}><LayoutDashboard size={20}/>数据面板</button>
        <button onClick={() => setActiveTab('entry')} className={`w-full text-left p-3 rounded-lg flex items-center gap-3 ${activeTab === 'entry' ? 'bg-blue-600' : ''}`}><PlusCircle size={20}/>快速开单</button>
        <button onClick={() => setActiveTab('reports')} className={`w-full text-left p-3 rounded-lg flex items-center gap-3 ${activeTab === 'reports' ? 'bg-blue-600' : ''}`}><BarChart3 size={20}/>工资报表</button>
        <button onClick={() => setActiveTab('settings')} className={`w-full text-left p-3 rounded-lg flex items-center gap-3 ${activeTab === 'settings' ? 'bg-blue-600' : ''}`}><Settings size={20}/>设置</button>
      </aside>

      {/* 主内容 */}
      <main className="flex-1 p-6 bg-slate-50">
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-xl shadow-sm border">
                <p className="text-xs text-slate-400 font-bold">本月总额</p>
                <p className="text-2xl font-black">{formatCurrency(monthlySummaries.reduce((a,b)=>a+b.totalAmount,0))}</p>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm border">
                <p className="text-xs text-slate-400 font-bold">总提成</p>
                <p className="text-2xl font-black text-green-600">{formatCurrency(monthlySummaries.reduce((a,b)=>a+b.totalCommission,0))}</p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border h-80">
              <h3 className="font-bold mb-4">业绩对比</h3>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlySummaries}>
                  <XAxis dataKey="employeeName" fontSize={12}/>
                  <YAxis fontSize={12}/>
                  <Tooltip />
                  <Bar dataKey="totalAmount" fill="#3b82f6" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeTab === 'entry' && (
          <div className="max-w-2xl mx-auto bg-white p-8 rounded-2xl shadow-sm border space-y-6">
            <h2 className="text-xl font-bold">新增开单记录</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold mb-2">选择员工</label>
                <select value={selEmp} onChange={e=>setSelEmp(e.target.value)} className="w-full p-3 border rounded-lg bg-slate-50">
                  {employees.map(e=><option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold mb-2">日期</label>
                <input type="date" value={selDate} onChange={e=>setSelDate(e.target.value)} className="w-full p-3 border rounded-lg bg-slate-50"/>
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold mb-2">选择项目</label>
              <div className="grid grid-cols-2 gap-2">
                {services.map(s=>(
                  <button key={s.id} onClick={()=>setSelServ(s.id)} className={`p-4 border rounded-xl text-left ${selServ === s.id ? 'border-blue-600 bg-blue-50' : ''}`}>
                    <p className="font-bold">{s.label}</p>
                    <p className="text-sm text-slate-500">{formatCurrency(s.amount)}</p>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold mb-2">支付方式</label>
              <div className="flex gap-2">
                <button onClick={()=>setPayMethod(PaymentMethod.ONLINE)} className={`flex-1 p-3 rounded-lg border flex items-center justify-center gap-2 ${payMethod === PaymentMethod.ONLINE ? 'bg-blue-600 text-white' : ''}`}><Smartphone size={18}/> 线上支付</button>
                <button onClick={()=>setPayMethod(PaymentMethod.CASH)} className={`flex-1 p-3 rounded-lg border flex items-center justify-center gap-2 ${payMethod === PaymentMethod.CASH ? 'bg-orange-600 text-white' : ''}`}><Wallet size={18}/> 现金支付</button>
              </div>
            </div>
            <button onClick={addTx} className="w-full bg-slate-900 text-white p-4 rounded-xl font-bold hover:bg-slate-800 transition-colors">确认入账</button>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 bg-white p-4 rounded-xl border shadow-sm">
              <Calendar size={20}/>
              <input type="month" value={selMonth} onChange={e=>setSelMonth(e.target.value)} className="font-bold outline-none"/>
            </div>
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="p-4">员工</th>
                    <th className="p-4">总额</th>
                    <th className="p-4">提成</th>
                    <th className="p-4">线上/现金</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlySummaries.map(s=>(
                    <tr key={s.employeeId} className="border-b last:border-0">
                      <td className="p-4 font-bold">{s.employeeName}</td>
                      <td className="p-4">{formatCurrency(s.totalAmount)}</td>
                      <td className="p-4 text-green-600 font-bold">{formatCurrency(s.totalCommission)}</td>
                      <td className="p-4 text-slate-400 text-sm">{formatCurrency(s.totalOnline)} / {formatCurrency(s.totalCash)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
           <div className="max-w-md space-y-6">
              <div className="bg-white p-6 rounded-xl border shadow-sm">
                <h3 className="font-bold mb-4">员工名单管理</h3>
                {employees.map(e=>(
                  <input key={e.id} value={e.name} onChange={val=>{
                    setEmployees(employees.map(x=>x.id===e.id?{...x,name:val.target.value}:x));
                  }} className="w-full p-2 border rounded mb-2 font-medium"/>
                ))}
              </div>
           </div>
        )}
      </main>
    </div>
  );
};

export default App;