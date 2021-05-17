import { v4 as uuidv4 } from 'uuid'

const datesAreOnSameDay = (first, second) =>
  first.getFullYear() === second.getFullYear() &&
  first.getMonth() === second.getMonth() &&
  first.getDate() === second.getDate()

export default {
  group (messages) {
    const currentGrouping = messages
    const newGrouping = []
    let lastMessageFrom = false
    let lastMessageAt = false
    let tempGroup = []
    let lastDay = null
    currentGrouping.forEach((message, i) => {
      if (!lastDay) {
        lastDay = message.at
      }
      const split = () => {
        newGrouping.push(tempGroup)
        tempGroup = [message]
        lastMessageFrom = message.sender
      }
      const messageDate = new Date(message.at)
      const lastDate = new Date(lastDay)
      if (!datesAreOnSameDay(messageDate, lastDate)) {
        lastDay = message.at
        split()
        newGrouping.push([
          {
            type: 'day-break',
            date: message.at,
            id: uuidv4()
          }
        ])
      } else if (lastMessageAt && message.at - lastMessageAt > 120000) {
        split()
      } else if (!lastMessageFrom || lastMessageFrom === message.sender) {
        lastMessageFrom = message.sender
        tempGroup.push(message)
      } else {
        split()
      }
      if (i === currentGrouping.length - 1) {
        newGrouping.push(tempGroup)
      }
      lastMessageAt = message.at
    })
    return newGrouping
  }
}
