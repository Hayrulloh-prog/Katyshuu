const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

prisma.manager.findFirst({ 
  select: { 
    firstName: true, 
    lastName: true, 
    registrationLatitude: true, 
    registrationLongitude: true 
  } 
})
.then(m => {
  if (m) {
    console.log('Manager:', m.firstName, m.lastName);
    console.log('Registration coordinates:', m.registrationLatitude, m.registrationLongitude);
    console.log('Use these coordinates for testing in zone');
    
    // Test coordinates (100m away)
    const testLat = m.registrationLatitude + 0.001; // ~111m north
    const testLon = m.registrationLongitude + 0.001; // ~111m east
    console.log('Test coordinates (100m away):', testLat, testLon);
  } else {
    console.log('No manager found with registration coordinates');
  }
})
.catch(console.error)
.finally(() => prisma.$disconnect());
