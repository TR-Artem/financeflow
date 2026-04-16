let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
let chart = null;

const MAX_TRANSACTIONS = 500;

const balanceEl = document.getElementById('balance');
const incomeEl = document.getElementById('total-income');
const expenseEl = document.getElementById('total-expense');
const listEl = document.getElementById('transaction-list');
const form = document.getElementById('transaction-form');

function saveTransactions() {
    if (transactions.length > MAX_TRANSACTIONS) {
        transactions = transactions.slice(-MAX_TRANSACTIONS);
    }
    localStorage.setItem('transactions', JSON.stringify(transactions));
}

function getCategorySums() {
    const sums = {};
    transactions.forEach(t => {
        if (t.type === 'expense') {
            const amount = parseFloat(t.amount) || 0;
            sums[t.category] = (sums[t.category] || 0) + amount;
        }
    });

    const sorted = Object.entries(sums).sort((a, b) => b[1] - a[1]);
    if (sorted.length > 8) {
        const other = sorted.slice(8).reduce((acc, [, val]) => acc + val, 0);
        const limited = sorted.slice(0, 8);
        limited.push(['Другое', other]);
        return Object.fromEntries(limited);
    }
    return sums;
}

function deleteTransaction(id) {
    if (confirm("Удалить эту операцию?")) {
        transactions = transactions.filter(t => t.id !== id);
        saveTransactions();
        updateUI();
    }
}

function exportToCSV() {
    if (transactions.length === 0) {
        alert("Нет данных для экспорта");
        return;
    }

    let csvContent = "Дата,Тип,Категория,Описание,Сумма\n";
    transactions.forEach(t => {
        csvContent += `${t.date},${t.type === 'income' ? 'Доход' : 'Расход'},${t.category},"${t.description}",${t.amount}\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `financeflow_export_${new Date().toISOString().slice(0,10)}.csv`;
    link.click();
}

function updateUI() {
    let balance = 0, income = 0, expense = 0;

    transactions.forEach(t => {
        const amount = parseFloat(t.amount) || 0;
        if (t.type === 'income') income += amount;
        else expense += amount;
        balance += t.type === 'income' ? amount : -amount;
    });

    balanceEl.textContent = balance.toFixed(2) + ' ₽';
    incomeEl.textContent = income.toFixed(2) + ' ₽';
    expenseEl.textContent = expense.toFixed(2) + ' ₽';

    listEl.innerHTML = '';

    if (transactions.length === 0) {
        listEl.innerHTML = '<li style="padding: 2rem; text-align: center; color: #888;">Пока нет операций. Добавьте первую!</li>';
        if (chart) chart.destroy();
        return;
    }

    const recent = transactions.slice(-15).reverse();
    recent.forEach(t => {
        const li = document.createElement('li');
        li.innerHTML = `
            <div>
                <strong>${t.description}</strong><br>
                <small>${t.category} • ${t.date}</small>
            </div>
            <div style="display: flex; align-items: center; gap: 12px;">
                <span class="${t.type === 'income' ? 'positive' : 'negative'}">
                    ${t.type === 'income' ? '+' : '-'}${parseFloat(t.amount).toFixed(2)} ₽
                </span>
                <button onclick="deleteTransaction(${t.id})" style="background: none; border: none; color: #ff3366; font-size: 1.2rem; cursor: pointer; padding: 4px 8px;">🗑️</button>
            </div>
        `;
        listEl.appendChild(li);
    });

    if (chart) chart.destroy();
    const categorySums = getCategorySums();

    const ctx = document.getElementById('expenseChart').getContext('2d');
    chart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(categorySums),
            datasets: [{
                data: Object.values(categorySums),
                backgroundColor: ['#ff3366', '#ffaa33', '#33ccff', '#00ffaa', '#aa66ff', '#ff66cc', '#66ff99', '#ffcc66']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '65%',
            plugins: {
                legend: { position: 'top', labels: { padding: 15, font: { size: 13 } } }
            }
        }
    });
}

// Форма
form.addEventListener('submit', (e) => {
    e.preventDefault();

    const description = document.getElementById('description').value.trim();
    const amount = parseFloat(document.getElementById('amount').value);
    const type = document.getElementById('type').value;
    const category = document.getElementById('category').value;

    if (!description || isNaN(amount) || amount <= 0) {
        alert("Пожалуйста, введите описание и сумму больше 0");
        return;
    }

    const newTransaction = {
        id: Date.now(),
        description: description,
        amount: amount,
        type: type,
        category: category,
        date: new Date().toLocaleDateString('ru-RU')
    };

    transactions.push(newTransaction);
    saveTransactions();
    form.reset();
    updateUI();
});

// Глобальные функции для кнопок
window.deleteTransaction = deleteTransaction;
window.exportToCSV = exportToCSV;

updateUI();