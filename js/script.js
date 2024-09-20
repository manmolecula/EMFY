let accessToken = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImp0aSI6IjQ5ZjcyMWM2YzY2ZDA2MmFhYzIwNDZlOTZmMzAwNmI3NWZlNWMzOTFiOGRlMzhhNDgxNGZkMTAyOWRlNzg2YThjNzM0NGZjY2MwM2ZiMzBiIn0.eyJhdWQiOiI2YmM4MTBhMi01YmY2LTQxMjctOTUwNS05MjVjNTc4NTc3ZTMiLCJqdGkiOiI0OWY3MjFjNmM2NmQwNjJhYWMyMDQ2ZTk2ZjMwMDZiNzVmZTVjMzkxYjhkZTM4YTQ4MTRmZDEwMjlkZTc4NmE4YzczNDRmY2NjMDNmYjMwYiIsImlhdCI6MTcyNjgxNjQxMCwibmJmIjoxNzI2ODE2NDEwLCJleHAiOjE3MjY5MDI4MTAsInN1YiI6IjExNTQ2MTM0IiwiZ3JhbnRfdHlwZSI6IiIsImFjY291bnRfaWQiOjMxOTYyMjM4LCJiYXNlX2RvbWFpbiI6ImFtb2NybS5ydSIsInZlcnNpb24iOjIsInNjb3BlcyI6WyJwdXNoX25vdGlmaWNhdGlvbnMiLCJmaWxlcyIsImNybSIsImZpbGVzX2RlbGV0ZSIsIm5vdGlmaWNhdGlvbnMiXSwiaGFzaF91dWlkIjoiMWEzNTc2NmYtMzJmNi00YmI1LWJjOWYtNzA3NzI5MTMyZjIxIiwiYXBpX2RvbWFpbiI6ImFwaS1iLmFtb2NybS5ydSJ9.cJHHXxITCg6lBtqNq76IVyGyAHD4FrV-DRIsw6xxpyy83XtsNnB7uzBg3FfBmURWXNxEEjP2GvHGoq0YPBK274GgnLbuSTriLGoC6H1Tpb6GkE1TL3ydVfpisrBwx7n1TEBimQFKmZR9YFK62qxRprmIU1kwvfPVnZNsgKEdiUln6v0TN3aAk4pKsGAuuRJtZgYRVeDv1LutQsyr43qvGe_gQlD549DABHtrh_PRgOnEm-1_4thRMpIsDPXw4tVU-nRN4hfThTY5laLj5CTC4pDP18LOX6gdqxpjFKXwsT9ZPPYBeZzqEoNwZ141gGzdzCnOC6smZPuMJb9o2P2Jwg'; // Токен доступа amoCRM
const subdomain = 'kuchevanton'; // Ваш поддомен
const dealsTable = document.querySelector('#dealsTable tbody');
let expandedDeal = null;

// Функция для выполнения запросов к API amoCRM
async function fetchDeals(page = 1, limit = 3) {
    const response = await fetch(`https://${subdomain}.amocrm.ru/api/v4/leads?page=${page}&limit=${limit}`, {
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        }
    });
    if (!response.ok) {
        throw new Error('Ошибка при загрузке сделок');
    }
    return await response.json();
}

// Функция для рендеринга сделки
function renderDeal(deal) {
    const tr = document.createElement('tr');
    tr.dataset.name = deal.name; // Сохраняем имя сделки
    tr.dataset.price = deal.price; // Сохраняем бюджет сделки
    tr.dataset.id = deal.id; // Сохраняем ID сделки
    tr.innerHTML = `
        <td>${deal.name}</td>
        <td>${deal.price}</td>
        <td>${deal.id}</td>
    `;
    tr.addEventListener('click', () => fetchDealDetails(deal.id, tr));
    dealsTable.appendChild(tr);
}

// Ограничение запросов не более 3 раз в секунду
let currentPage = 1;
let intervalId = null;

// Функция для получения сделок с лимитом
let errorCount = 0; // Счетчик ошибок

function fetchDealsWithLimit() {
    intervalId = setInterval(async () => {
        try {
            const deals = await fetchDeals(currentPage, 3);
            if (!deals._embedded || deals._embedded.leads.length === 0) {
                console.log('Сделки закончились, остановка интервала');
                clearInterval(intervalId);
                return;
            }
            deals._embedded.leads.forEach(renderDeal);
            currentPage++;
            errorCount = 0; // Сброс счетчика ошибок при успешном запросе
        } catch (error) {
            errorCount++;
            console.error('Ошибка при получении сделок:', error);
            if (errorCount >= 3) {
                console.log('Достигнуто максимальное количество ошибок, остановка интервала');
                clearInterval(intervalId);
            }
        }
    }, 1000);
}


// Функция для получения детальной информации по сделке
async function fetchDealDetails(dealId, tr) {
    // Закрываем открытую карточку, если есть
    if (expandedDeal !== null && expandedDeal !== dealId) {
        const previousRow = document.querySelector(`tr[data-id="${expandedDeal}"]`);
        if (previousRow) {
            previousRow.innerHTML = `
                <td>${previousRow.dataset.name}</td>
                <td>${previousRow.dataset.price}</td>
                <td>${expandedDeal}</td>
            `;
        }
    }

    if (expandedDeal === dealId) {
        expandedDeal = null; // Закрыть текущую сделку
        tr.innerHTML = `
            <td>${tr.dataset.name}</td>
            <td>${tr.dataset.price}</td>
            <td>${dealId}</td>
        `;
        return;
    }
    
    expandedDeal = dealId;

    // Показываем спиннер
    tr.innerHTML = '<td colspan="3">Загрузка...</td>';

    const response = await fetch(`https://${subdomain}.amocrm.ru/api/v4/leads/${dealId}`, {
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        }
    });

    if (!response.ok) {
        throw new Error('Ошибка при загрузке деталей сделки');
    }
    const dealDetails = await response.json();
    renderDealDetails(dealId, dealDetails, tr);
}

// Функция рендеринга деталей сделки
function getNearestTask(dealDetails) {
    if (dealDetails.closest_task_at && dealDetails.closest_task_at > 0) {
        return new Date(dealDetails.closest_task_at * 1000); 
    }
    console.log("Ближайшая задача отсутствует");
    return null;
}

function renderDealDetails(dealId, dealDetails, tr) {
    const nearestTaskDate = getNearestTask(dealDetails);
    let formattedDate = 'Нет задач';
    let circleColor = 'red'; // По умолчанию красный цвет

    if (nearestTaskDate) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const taskDate = new Date(nearestTaskDate);
        taskDate.setHours(0, 0, 0, 0); 

        formattedDate = `${taskDate.getDate().toString().padStart(2, '0')}.${(taskDate.getMonth() + 1).toString().padStart(2, '0')}.${taskDate.getFullYear()}`;

        if (taskDate < today) {
            circleColor = 'red'; // Просроченная задача
        } else if (taskDate.toDateString() === today.toDateString()) {
            circleColor = 'green'; // Задача на сегодня
        } else {
            circleColor = 'yellow';
        }
    }

    // Обновляем строку с деталями сделки
    tr.innerHTML = `
        <td colspan="3">
            Название: ${dealDetails.name}<br>
            ID: ${dealId}<br>
            Дата: ${formattedDate}<br>
            <div style="display: flex; justify-content: left; align-items: center;">
                <span>Статус:</span>
                <svg viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" fill="${circleColor}"></circle>
                </svg>
            </div>
        </td>
    `;
}

// Запуск получения сделок с лимитом
fetchDealsWithLimit();