const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkData() {
  try {
    // Get all attendance records
    const records = await prisma.attendance.findMany({
      where: { checkInTime: { not: null } },
      include: {
        employee: {
          select: { firstName: true, lastName: true }
        }
      },
      orderBy: { date: 'desc' },
      take: 20
    });
    
    console.log('Recent attendance records:');
    records.forEach(r => {
      console.log(`${r.date}: ${r.employee.firstName} ${r.employee.lastName} - In: ${r.checkInTime} Out: ${r.checkOutTime || 'null'}`);
    });
    
    // Group by employee
    const byEmployee = {};
    records.forEach(r => {
      const key = r.employeeId;
      if (!byEmployee[key]) {
        byEmployee[key] = {
          name: `${r.employee.firstName} ${r.employee.lastName}`,
          records: []
        };
      }
      byEmployee[key].records.push(r);
    });
    
    console.log('\nRecords by employee:');
    Object.values(byEmployee).forEach(emp => {
      console.log(`${emp.name}: ${emp.records.length} records`);
    });
    
    // Check for March 24 specifically
    const march24Records = await prisma.attendance.findMany({
      where: {
        date: '2026-03-24',
        checkInTime: { not: null }
      },
      include: {
        employee: {
          select: { firstName: true, lastName: true }
        }
      }
    });
    
    console.log('\nRecords for March 24, 2026:');
    march24Records.forEach(r => {
      console.log(`${r.employee.firstName} ${r.employee.lastName} - In: ${r.checkInTime} Out: ${r.checkOutTime || 'null'}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkData();
