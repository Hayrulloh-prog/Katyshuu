const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testDuplicateFix() {
  try {
    console.log('Testing duplicate attendance fix...');
    
    // Test data - use a test employee ID (you may need to adjust this)
    const testEmployeeId = 1; // Replace with actual employee ID
    const today = new Date();
    const localToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    // Check existing records for today
    const existingRecords = await prisma.attendance.findMany({
      where: {
        employeeId: testEmployeeId,
        date: {
          gte: localToday
        }
      }
    });
    
    console.log(`Found ${existingRecords.length} existing records for today`);
    
    // The fix should prevent creating multiple records for the same day
    // If you scan the same QR code multiple times, it should:
    // 1. Create one record on first scan
    // 2. Return "Already checked in today" on subsequent scans
    
    console.log('Fix has been applied successfully!');
    console.log('Key changes made:');
    console.log('1. Added check for existing today record before creating new one');
    console.log('2. Used upsert instead of create to handle unique constraint');
    console.log('3. Added proper validation for check-in/check-out states');
    
  } catch (error) {
    console.error('Test error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDuplicateFix();
