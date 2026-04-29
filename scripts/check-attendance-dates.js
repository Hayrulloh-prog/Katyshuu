const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAttendance() {
  const now = new Date();
  const startDate = new Date(now);
  startDate.setDate(now.getDate() - 7);
  startDate.setHours(0, 0, 0, 0);
  
  const endDate = new Date(now);
  endDate.setHours(23, 59, 59, 999);
  
  console.log('Checking attendance from', startDate.toISOString(), 'to', endDate.toISOString());
  
  const attendance = await prisma.attendance.findMany({
    where: {
      date: { gte: startDate, lt: endDate }
    },
    select: {
      date: true,
      employeeId: true,
      checkInTime: true,
      checkOutTime: true
    },
    orderBy: { date: 'asc' }
  });
  
  // Группируем по датам
  const groupedByDate = {};
  attendance.forEach(record => {
    const date = record.date.toISOString().split('T')[0];
    if (!groupedByDate[date]) {
      groupedByDate[date] = [];
    }
    groupedByDate[date].push(record);
  });
  
  console.log('\nAttendance by date:');
  Object.keys(groupedByDate).sort().forEach(date => {
    console.log(date + ': ' + groupedByDate[date].length + ' records');
  });
  
  // Показываем последние 7 дней включая пустые
  console.log('\nLast 7 days (including empty):');
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(now.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const count = groupedByDate[dateStr] ? groupedByDate[dateStr].length : 0;
    console.log(dateStr + ': ' + count + ' records');
  }
  
  await prisma.$disconnect();
}

checkAttendance().catch(console.error);
