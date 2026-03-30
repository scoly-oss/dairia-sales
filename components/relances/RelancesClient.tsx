'use client'

import React, { useState } from 'react'
import { Plus, CheckCircle2, Clock, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import {
  formatDate, taskStatusLabel, taskPriorityClass, taskPriorityLabel
} from '@/lib/utils'
import type { Task, Profile } from '@/lib/types'
import TaskModal from './TaskModal'

interface Props {
  initialTasks: Task[]
  prospects: Array<{ id: string; company_name: string }>
  profiles: Array<{ id: string; name: string | null; email: string }>
  currentUser: Profile
}

const today = new Date().toISOString().split('T')[0]

export default function RelancesClient({ initialTasks, prospects, profiles, currentUser }: Props) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [filterStatus, setFilterStatus] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)

  const filtered = tasks.filter((t) => !filterStatus || t.status === filterStatus)

  // Group by: today / overdue / upcoming
  const overdue = filtered.filter(
    (t) => t.due_date && t.due_date < today && t.status !== 'fait' && t.status !== 'annule'
  )
  const todayTasks = filtered.filter((t) => t.due_date === today)
  const upcoming = filtered.filter(
    (t) => (!t.due_date || t.due_date > today) && t.status !== 'fait' && t.status !== 'annule'
  )
  const done = filtered.filter((t) => t.status === 'fait' || t.status === 'annule')

  async function markDone(id: string) {
    const supabase = createClient()
    await supabase.from('tasks').update({ status: 'fait', updated_at: new Date().toISOString() }).eq('id', id)
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status: 'fait' } : t)))
  }

  function handleSaved(task: Task) {
    setTasks((prev) => {
      const idx = prev.findIndex((t) => t.id === task.id)
      if (idx >= 0) { const n = [...prev]; n[idx] = task; return n }
      return [task, ...prev]
    })
    setShowModal(false)
    setEditingTask(null)
  }

  function TaskCard({ task }: { task: Task }) {
    const isOverdue = task.due_date && task.due_date < today && task.status !== 'fait'
    const isToday = task.due_date === today
    const prospect = (task as Task & { prospect?: { company_name: string } }).prospect
    const deal = (task as Task & { deal?: { title: string } }).deal

    return (
      <div
        className="flex items-start gap-3 p-4 rounded-[14px] transition-all cursor-pointer"
        style={{
          backgroundColor: '#ffffff',
          border: `1px solid ${isOverdue ? '#fecaca' : '#e5e5e3'}`,
          boxShadow: '0 1px 4px rgba(30,45,61,0.06)',
        }}
        onClick={() => { setEditingTask(task); setShowModal(true) }}
      >
        <button
          onClick={(e) => { e.stopPropagation(); markDone(task.id) }}
          className="mt-0.5 flex-shrink-0"
          style={{ color: task.status === 'fait' ? '#10b981' : '#d1d5db' }}
        >
          <CheckCircle2 size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p
              className="text-sm font-medium"
              style={{
                color: '#1e2d3d',
                textDecoration: task.status === 'fait' ? 'line-through' : 'none',
              }}
            >
              {task.title}
            </p>
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${taskPriorityClass(task.priority)}`}>
              {taskPriorityLabel(task.priority)}
            </span>
          </div>
          {prospect && (
            <p className="text-xs mt-0.5" style={{ color: '#6b7280' }}>
              {prospect.company_name}{deal ? ` · ${deal.title}` : ''}
            </p>
          )}
          {task.description && (
            <p className="text-xs mt-1" style={{ color: '#6b7280' }}>{task.description}</p>
          )}
        </div>
        <div className="text-right flex-shrink-0">
          {task.due_date && (
            <div
              className="flex items-center gap-1 text-xs"
              style={{ color: isOverdue ? '#ef4444' : isToday ? '#e8842c' : '#6b7280' }}
            >
              {isOverdue ? <AlertCircle size={12} /> : <Clock size={12} />}
              {formatDate(task.due_date)}
            </div>
          )}
          <p className="text-xs mt-1" style={{ color: '#6b7280' }}>
            {taskStatusLabel(task.status)}
          </p>
        </div>
      </div>
    )
  }

  function Section({ title, tasks, color, icon }: {
    title: string; tasks: Task[]; color: string; icon: React.ReactNode
  }) {
    if (tasks.length === 0) return null
    return (
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <div style={{ color }}>{icon}</div>
          <h3 className="text-sm font-semibold" style={{ color: '#1e2d3d' }}>{title}</h3>
          <span
            className="text-xs px-2 py-0.5 rounded-full text-white font-medium"
            style={{ backgroundColor: color }}
          >
            {tasks.length}
          </span>
        </div>
        <div className="space-y-2">
          {tasks.map((t) => <TaskCard key={t.id} task={t} />)}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div
        className="flex items-center gap-3 px-6 py-4 flex-wrap"
        style={{ borderBottom: '1px solid #e5e5e3', backgroundColor: '#ffffff' }}
      >
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="text-sm px-3 py-2 rounded-lg outline-none"
          style={{ border: '1px solid #e5e5e3', color: '#1e2d3d', backgroundColor: '#f8f8f6' }}
        >
          <option value="">Tous les statuts</option>
          <option value="a_faire">À faire</option>
          <option value="en_cours">En cours</option>
          <option value="fait">Fait</option>
          <option value="annule">Annulé</option>
        </select>
        <button
          onClick={() => { setEditingTask(null); setShowModal(true) }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white ml-auto"
          style={{ backgroundColor: '#e8842c' }}
        >
          <Plus size={15} /> Nouvelle tâche
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {overdue.length + todayTasks.length + upcoming.length + done.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-sm" style={{ color: '#6b7280' }}>
              Aucune tâche.{' '}
              <button onClick={() => setShowModal(true)} style={{ color: '#e8842c' }} className="underline">
                Créer la première
              </button>
            </p>
          </div>
        ) : (
          <>
            <Section title="En retard" tasks={overdue} color="#ef4444" icon={<AlertCircle size={16} />} />
            <Section title="Aujourd'hui" tasks={todayTasks} color="#e8842c" icon={<Clock size={16} />} />
            <Section title="À venir" tasks={upcoming} color="#3b82f6" icon={<Clock size={16} />} />
            <Section title="Terminées / Annulées" tasks={done} color="#6b7280" icon={<CheckCircle2 size={16} />} />
          </>
        )}
      </div>

      {showModal && (
        <TaskModal
          task={editingTask}
          prospects={prospects}
          profiles={profiles}
          currentUser={currentUser}
          onSave={handleSaved}
          onClose={() => { setShowModal(false); setEditingTask(null) }}
        />
      )}
    </div>
  )
}
