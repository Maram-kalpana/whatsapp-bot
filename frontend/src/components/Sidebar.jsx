import { ChevronDown, ChevronsLeft, ChevronsRight, UserCog } from 'lucide-react'
import { NavLink, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import BrandLogo from './BrandLogo'
import ModuleSwitcher from './ModuleSwitcher'
import { quickLinks, moreLinks, accountLinks } from '../data/navigation'
import { useAuth } from '../hooks/useAuth'

function SidebarUser({ collapsed }) {
  const { user } = useAuth()
  const initials = (user?.name || 'U').split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()
  if (collapsed) return <div className="border-t border-white/10 p-3"><div className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-white/10 text-xs font-bold text-white">{initials}</div></div>
  return <div className="border-t border-white/10 p-3"><div className="flex items-center gap-3 rounded-xl bg-white/10 px-3 py-2"><div className="grid h-9 w-9 place-items-center rounded-full bg-white/15 text-xs font-bold text-white">{initials}</div><div className="min-w-0"><p className="truncate text-sm font-semibold text-white">{user?.name || 'Account'}</p><p className="truncate text-xs text-slate-300">{user?.email || ''}</p></div></div></div>
}

function MenuGroup({ item, collapsed, onNavigate }) {
  const location = useLocation()
  const hasActiveChild = item.children?.some(c => location.pathname === c.path || location.pathname.startsWith(`${c.path}/`))
  const [open, setOpen] = useState(Boolean(hasActiveChild))
  const Icon = item.icon
  useEffect(()=>{ if(hasActiveChild) setOpen(true) },[hasActiveChild])

  if (item.path) {
    return <NavLink onClick={onNavigate} to={item.path} className={({isActive}) => `flex h-11 items-center gap-3 rounded-xl px-3 text-[15px] transition ${isActive ? 'bg-white/15 font-semibold text-white' : 'text-slate-300 hover:bg-white/10 hover:text-white'} ${collapsed ? 'justify-center px-0' : ''}`}>
      {Icon && <Icon size={20}/>} {!collapsed && <span>{item.label}</span>}
    </NavLink>
  }

  return <div>
    <button onClick={() => setOpen(v => !v)} className={`flex h-11 w-full items-center gap-3 rounded-xl px-3 text-[15px] transition hover:bg-white/10 ${hasActiveChild ? 'font-semibold text-white' : 'text-slate-300'} ${collapsed ? 'justify-center px-0' : ''}`}>
      {Icon && <Icon size={20}/>} {!collapsed && <><span className="flex-1 text-left">{item.label}</span><ChevronDown size={16} className={`transition ${open ? 'rotate-180' : ''}`}/></>}
    </button>
    {open && !collapsed && <div className="ml-[26px] border-l border-white/15 pl-4">
      {item.children.map(child => <NavLink onClick={onNavigate} key={child.path} to={child.path} className={({isActive}) => `my-0.5 block rounded-lg px-3 py-2.5 text-[14px] transition ${isActive ? 'bg-white/15 font-semibold text-white' : 'text-slate-300 hover:bg-white/10 hover:text-white'}`}>{child.label}</NavLink>)}
    </div>}
  </div>
}

export default function Sidebar({ collapsed, setCollapsed, mobileOpen, setMobileOpen }) {
  const location = useLocation()
  const [moreOpen, setMoreOpen] = useState(moreLinks.some(i=>i.path===location.pathname || i.children?.some(c=>location.pathname.startsWith(c.path))))
  const [accountOpen, setAccountOpen] = useState(location.pathname.startsWith('/account/'))
  const closeMobile=()=>setMobileOpen(false)
  useEffect(()=>{ if(location.pathname.startsWith('/account/')) setAccountOpen(true) },[location.pathname])

  return <>
    {mobileOpen && <button aria-label="close sidebar overlay" onClick={closeMobile} className="fixed inset-0 z-40 bg-slate-950/30 md:hidden" />}
    <aside className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-[#152a45] bg-[#1e3a5f] transition-all duration-300 ${collapsed ? 'w-[84px]' : 'w-[292px]'} ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
      <div className={`flex h-20 items-center border-b border-white/10 px-4 ${collapsed ? 'justify-center' : 'justify-between'}`}><BrandLogo compact={collapsed} light={!collapsed}/>{!collapsed&&<button onClick={()=>setCollapsed(true)} className="grid h-9 w-9 place-items-center rounded-lg text-slate-300 hover:bg-white/10"><ChevronsLeft size={22}/></button>}{collapsed&&<button onClick={()=>setCollapsed(false)} className="absolute -right-4 top-6 grid h-8 w-8 place-items-center rounded-full border border-[#152a45] bg-[#1e3a5f] text-slate-200 shadow"><ChevronsRight size={17}/></button>}</div>
      <div className="pt-3"><ModuleSwitcher collapsed={collapsed}/></div>

      <nav className="soft-scrollbar mt-3 flex-1 overflow-y-auto px-3 pb-5">
        {!collapsed&&<p className="px-2 pb-1 pt-1 text-xs text-slate-400">Quick Links</p>}
        <div className="space-y-1">{quickLinks.map(item=><div key={item.label} className={item.dividerBefore&&!collapsed?'mt-3 border-t border-white/10 pt-3':''}><MenuGroup item={item} collapsed={collapsed} onNavigate={closeMobile}/></div>)}</div>

        <button onClick={()=>setMoreOpen(v=>!v)} className={`mt-1 flex h-11 w-full items-center rounded-xl px-3 text-[15px] text-slate-300 transition hover:bg-white/10 ${collapsed?'justify-center px-0':''}`}>{!collapsed?<><span className="flex-1 text-left">More</span><ChevronDown size={16} className={`transition ${moreOpen?'rotate-180':''}`}/></>:<span className="text-lg">•••</span>}</button>
        {moreOpen&&<div className="space-y-1">{moreLinks.map(item=><MenuGroup key={item.label} item={item} collapsed={collapsed} onNavigate={closeMobile}/>)}</div>}

        <div className={!collapsed?'mt-2 border-t border-white/10 pt-2':'mt-2'}>
          <button onClick={()=>setAccountOpen(v=>!v)} className={`flex h-11 w-full items-center gap-3 rounded-xl px-3 text-[15px] transition hover:bg-white/10 ${location.pathname.startsWith('/account/')?'font-semibold text-white':'text-slate-300'} ${collapsed?'justify-center px-0':''}`}><UserCog size={20}/>{!collapsed&&<><span className="flex-1 text-left">Account</span><ChevronDown size={16} className={`transition ${accountOpen?'rotate-180':''}`}/></>}</button>
          {accountOpen&&!collapsed&&<div className="ml-[26px] border-l border-white/15 pl-4">{accountLinks.map(item=><NavLink onClick={closeMobile} key={item.path} to={item.path} className={({isActive})=>`my-0.5 block rounded-lg px-3 py-2.5 text-[14px] transition ${isActive?'bg-white/15 font-semibold text-white':'text-slate-300 hover:bg-white/10 hover:text-white'}`}>{item.label}</NavLink>)}</div>}
        </div>
      </nav>

      <SidebarUser collapsed={collapsed} />
    </aside>
  </>
}
