const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDailyCycles() {
  try {
    // Get all employees for manager 3
    const employees = await prisma.employee.findMany({
      where: { managerId: 3 },
      select: { id: true, firstName: true, lastName: true }
    });
    
    console.log(`Found ${employees.length} employees for manager 3`);
    
    for (const employee of employees) {
      const records = await prisma.attendance.findMany({
        where: {
          employeeId: employee.id,
          checkInTime: { not: null }
        },
        orderBy: { date: 'desc' },
        take: 10
      });
      
      // Group by date
      const byDate = {};
      records.forEach(r => {
        const date = r.date.toISOString().split('T')[0];
        if (!byDate[date]) byDate[date] = [];
        byDate[date].push(r);
      });
      
      // Check for multiple cycles per day
      const multiCycleDays = Object.entries(byDate)
        .filter(([date, dayRecords]) => dayRecords.length > 1)
        .map(([date, dayRecords]) => ({ date, count: dayRecords.length }));
      
      if (multiCycleDays.length > 0) {
        console.log(`\n${employee.firstName} ${employee.lastName}:`);
        console.log(`  Total records: ${records.length}`);
        console.log(`  Multi-cycle days: ${multiCycleDays.length}`);
        multiCycleDays.forEach(({ date, count }) => {
          console.log(`    ${date}: ${count} records`);
        });
      } else {
        console.log(`\n${employee.firstName} ${employee.lastName}: ${records.length} total records, no multi-cycle days`);
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDailyCycles();
