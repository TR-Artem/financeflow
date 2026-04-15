let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
let chart = null;                    // Глобальная переменная для графика

const MAX_TRANSACTIONS = 500;        // Защита от переполнения памяти

const balanceEl = document.getElementById('balance');
const incomeEl = document.getElementById('total-income');
const expenseEl = document.getElementById('total-expense');
const listEl = document.getElementById('transaction-list');
const form = document.getElementById('transaction-form');

function saveTransactions() {
    // Ограничиваем количество записей
    if (transactions.length > MAX_TRANSACTIONS) {
        transactions = transactions.slice(-MAX_TRANSACTIONS);
    }
    localStorage.setItem('transactions', JSON.stringify(transactions));
}

function updateUI() {
    let balance = 0, income = 0, expense = 0;
    const categorySums = {};

    transactions.forEach(t => {
        const amount = parseFloat(t.amount);
        if (t.type === 'income') {
            income += amount;
        } else {
            expense += amount;
            categorySums[t.category] = (categorySums[t.category] || 0) + amount;
        }
        balance += t.type === 'income' ? amount : -amount;
    });

    balanceEl.textContent = balance.toFixed(2) + ' ₽';
    incomeEl.textContent = income.toFixed(2) + ' ₽';
    expenseEl.textContent = expense.toFixed(2) + ' ₽';

    // Список операций — только последние 15
    listEl.innerHTML = '';
    const recent = transactions.slice(-15).reverse();
    recent.forEach(t => {
        const li = document.createElement('li');
        li.innerHTML = `
            <div>
                <strong>${t.description}</strong><br>
                <small>${t.category} • ${t.date}</small>
            </div>
            <span class="${t.type === 'income' ? 'positive' : 'negative'}">
                ${t.type === 'income' ? '+' : '-'}${parseFloat(t.amount).toFixed(2)} ₽
            </span>
        `;
        listEl.appendChild(li);
    });

    // === ИСПРАВЛЕНИЕ MEMORY LEAK ===
    // Уничтожаем старый график перед созданием нового
    if (chart) {
        chart.destroy();
        chart = null;
    }

    const ctx = document.getElementById('expenseChart').getContext('2d');
    chart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(categorySums),
            datasets: [{
                data: Object.values(categorySums),
                backgroundColor: ['#ff3366', '#ffaa33', '#33ccff', '#00ffaa', '#aa66ff', '#ff66cc']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom' }
            }
        }
    });
}

form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const newTransaction = {
        id: Date.now(),
        description: document.getElementById('description').value.trim(),
        amount: parseFloat(document.getElementById('amount').value),
        type: document.getElementById('type').value,
        category: document.getElementById('category').value,
        date: new Date().toLocaleDateString('ru-RU')
    };

    if (!newTransaction.description || isNaN(newTransaction.amount)) {
        alert("Заполните описание и корректную сумму!");
        return;
    }

    transactions.push(newTransaction);
    saveTransactions();
    
    form.reset();
    updateUI();
});

function clearAllData() {
    if (confirm("Вы уверены, что хотите удалить ВСЕ операции? Это нельзя отменить.")) {
        transactions = [];
        localStorage.removeItem('transactions');
        if (chart) {
            chart.destroy();
            chart = null;
        }
        updateUI();
    }
}

// Инициализация при загрузке страницы
updateUI();