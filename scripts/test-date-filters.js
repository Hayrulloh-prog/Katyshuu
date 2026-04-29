// Тестовая проверка логики расчета дат
function testDateFilters() {
    const now = new Date();
    console.log('Текущая дата и время:', now.toLocaleString('ru-RU'));
    
    const filters = ['today', 'week', 'month', 'threemonths'];
    
    filters.forEach(filter => {
        let startDate, endDate;
        
        switch (filter) {
            case 'today':
                startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
                break;
            case 'week':
                // Последние 7 дней
                startDate = new Date(now);
                startDate.setDate(now.getDate() - 7);
                startDate.setHours(0, 0, 0, 0);
                endDate = new Date(now);
                endDate.setHours(23, 59, 59, 999);
                break;
            case 'month':
                // Последние 30 дней
                startDate = new Date(now);
                startDate.setDate(now.getDate() - 30);
                startDate.setHours(0, 0, 0, 0);
                endDate = new Date(now);
                endDate.setHours(23, 59, 59, 999);
                break;
            case 'threemonths':
                // Последние 60 дней (два месяца)
                startDate = new Date(now);
                startDate.setDate(now.getDate() - 60);
                startDate.setHours(0, 0, 0, 0);
                endDate = new Date(now);
                endDate.setHours(23, 59, 59, 999);
                break;
        }
        
        console.log(`\nФильтр: ${filter}`);
        console.log('Начало периода:', startDate.toLocaleString('ru-RU'));
        console.log('Конец периода:', endDate.toLocaleString('ru-RU'));
        console.log('Разница в днях:', Math.round((endDate - startDate) / (1000 * 60 * 60 * 24)));
    }
}

testDateFilters();
