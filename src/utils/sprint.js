import { today } from './helpers'

const KEY_START = 'crm_sprint_start_date'
const sprintKey = (date) => `crm_sprint_${date}`

export const getSprintStartDate = () => localStorage.getItem(KEY_START)

const setSprintStartDate = (date) => localStorage.setItem(KEY_START, date)

export const getWeekNumber = () => {
  const startDate = getSprintStartDate()
  if (!startDate) return 1
  const diffDays = Math.floor((Date.now() - new Date(startDate).getTime()) / 86400000)
  return Math.floor(diffDays / 7) + 1
}

export const getDefaultCel = () => {
  const week = getWeekNumber()
  if (week <= 2) return 15
  if (week <= 4) return 25
  return 50
}

export const getTodaySprint = () => {
  const data = localStorage.getItem(sprintKey(today()))
  return data ? JSON.parse(data) : null
}

export const saveSprint = (sprint) => {
  localStorage.setItem(sprintKey(sprint.date), JSON.stringify(sprint))
}

export const startSprint = (cel) => {
  const dzis = today()
  if (!getSprintStartDate()) setSprintStartDate(dzis)
  const sprint = { date: dzis, cel, wykonano: 0, ukonczony: false }
  saveSprint(sprint)
  return sprint
}

export const incrementSprintStorage = () => {
  const sprint = getTodaySprint()
  if (!sprint) return null
  const updated = {
    ...sprint,
    wykonano: sprint.wykonano + 1,
    ukonczony: sprint.wykonano + 1 >= sprint.cel
  }
  saveSprint(updated)
  return updated
}

export const resetTodaySprint = () => {
  localStorage.removeItem(sprintKey(today()))
}

export const getLast7Sprints = () => {
  const result = []
  for (let i = 1; i <= 7; i++) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().split('T')[0]
    const data = localStorage.getItem(sprintKey(dateStr))
    if (data) result.push(JSON.parse(data))
  }
  return result
}
