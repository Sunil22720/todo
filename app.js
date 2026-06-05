
let tasks = JSON.parse(localStorage.getItem('taskflow_tasks')) || [];
let currentFilter = 'all'; // 'all', 'active', 'completed'
let searchQuery = '';
let currentSort = 'createdAt-desc'; // 'createdAt-desc', 'createdAt-asc', 'dueDate-asc', 'priority-desc'

const taskForm = document.getElementById('task-form');
const taskInput = document.getElementById('task-input');
const taskCategory = document.getElementById('task-category');
const taskPriority = document.getElementById('task-priority');
const taskDate = document.getElementById('task-date');
const searchInput = document.getElementById('search-input');
const filterTabs = document.querySelectorAll('.filter-tab');
const sortSelect = document.getElementById('sort-select');
const taskList = document.getElementById('task-list');
const emptyState = document.getElementById('empty-state');
const clearCompletedBtn = document.getElementById('clear-completed-btn');
const themeToggleBtn = document.getElementById('theme-toggle');
const currentDateEl = document.getElementById('current-date');
const completedCountEl = document.getElementById('completed-count');
const totalCountEl = document.getElementById('total-count');
const progressCircle = document.getElementById('progress-circle');
const progressPercentEl = document.getElementById('progress-percent');
const motivationMsgEl = document.getElementById('motivation-msg');
const listSummaryTextEl = document.getElementById('list-summary-text');

document.addEventListener('DOMContentLoaded', () => {
  initDate();
  initTheme();
  setupEventListeners();
  render();
});

// Set Live Date
function initDate() {
  const options = { weekday: 'long', month: 'short', day: 'numeric' };
  currentDateEl.textContent = new Date().toLocaleDateString('en-US', options);
}

// Set & Toggle Theme
function initTheme() {
  const savedTheme = localStorage.getItem('taskflow_theme') || 'light';
  if (savedTheme === 'dark') {
    document.body.classList.add('dark-theme');
  }
}

function toggleTheme() {
  document.body.classList.toggle('dark-theme');
  const theme = document.body.classList.contains('dark-theme') ? 'dark' : 'light';
  localStorage.setItem('taskflow_theme', theme);
}

// Setup Event Listeners
function setupEventListeners() {
  // Theme Toggle
  themeToggleBtn.addEventListener('click', toggleTheme);

  // Form Submission
  taskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    addTask();
  });

  // Search Input
  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value.trim().toLowerCase();
    render();
  });

  // Filter Tabs
  filterTabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      filterTabs.forEach(t => t.classList.remove('active'));
      e.target.classList.add('active');
      currentFilter = e.target.getAttribute('data-filter');
      render();
    });
  });

  // Sort Select
  sortSelect.addEventListener('change', (e) => {
    currentSort = e.target.value;
    render();
  });

  // Clear Completed Tasks
  clearCompletedBtn.addEventListener('click', clearCompleted);
}

// Add Task
function addTask() {
  const title = taskInput.value.trim();
  if (!title) return;

  const newTask = {
    id: Date.now().toString(),
    title: title,
    category: taskCategory.value,
    priority: taskPriority.value,
    dueDate: taskDate.value || null,
    completed: false,
    createdAt: new Date().toISOString()
  };

  tasks.push(newTask);
  saveTasks();

  // Reset Form
  taskInput.value = '';
  taskDate.value = '';
  taskCategory.selectedIndex = 0;
  taskPriority.value = 'Medium';

  render();
}

// Toggle Task Complete Status
function toggleTaskComplete(id) {
  tasks = tasks.map(task => {
    if (task.id === id) {
      return { ...task, completed: !task.completed };
    }
    return task;
  });
  saveTasks();
  render();
}

// Delete Task with Animation
function deleteTask(id) {
  const taskEl = document.querySelector(`[data-id="${id}"]`);
  if (taskEl) {
    taskEl.classList.add('exit-animation');
    // Wait for slide-out/scale animation to finish
    taskEl.addEventListener('transitionend', () => {
      tasks = tasks.filter(task => task.id !== id);
      saveTasks();
      render();
    }, { once: true });
  } else {
    tasks = tasks.filter(task => task.id !== id);
    saveTasks();
    render();
  }
}

// Edit Task Inline
function enableInlineEdit(id, titleEl, infoEl) {
  const task = tasks.find(t => t.id === id);
  if (!task || task.completed) return;

  const originalTitle = task.title;

  // Create Input
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'inline-edit-input';
  input.value = originalTitle;

  // Replace Title with Input
  titleEl.replaceWith(input);
  input.focus();
  input.select();

  // Save Function
  const saveEdit = () => {
    const newTitle = input.value.trim();
    if (newTitle && newTitle !== originalTitle) {
      tasks = tasks.map(t => {
        if (t.id === id) {
          return { ...t, title: newTitle };
        }
        return t;
      });
      saveTasks();
    }
    render();
  };

  // Input Listeners
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      saveEdit();
    } else if (e.key === 'Escape') {
      render(); // Cancels editing by triggering normal render
    }
  });

  input.addEventListener('blur', saveEdit);
}

// Clear Completed
function clearCompleted() {
  // Grab all completed element nodes to animate them out
  const completedTasksEls = document.querySelectorAll('.task-item.completed');
  if (completedTasksEls.length > 0) {
    completedTasksEls.forEach(el => el.classList.add('exit-animation'));
    // Wait for animation transition before deleting
    setTimeout(() => {
      tasks = tasks.filter(task => !task.completed);
      saveTasks();
      render();
    }, 300);
  } else {
    tasks = tasks.filter(task => !task.completed);
    saveTasks();
    render();
  }
}

// LocalStorage Helper
function saveTasks() {
  localStorage.setItem('taskflow_tasks', JSON.stringify(tasks));
}

// Sort Helper Definitions
const priorityWeights = {
  'High': 3,
  'Medium': 2,
  'Low': 1
};

// Render Loop
function render() {
  // 1. Filter Tasks
  let filteredTasks = tasks.filter(task => {
    // Search Query Match
    const matchesSearch = task.title.toLowerCase().includes(searchQuery);

    // Status Filter Match
    let matchesFilter = true;
    if (currentFilter === 'active') {
      matchesFilter = !task.completed;
    } else if (currentFilter === 'completed') {
      matchesFilter = task.completed;
    }

    return matchesSearch && matchesFilter;
  });

  // 2. Sort Tasks
  filteredTasks.sort((a, b) => {
    if (currentSort === 'createdAt-desc') {
      return new Date(b.createdAt) - new Date(a.createdAt);
    }
    if (currentSort === 'createdAt-asc') {
      return new Date(a.createdAt) - new Date(b.createdAt);
    }
    if (currentSort === 'dueDate-asc') {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate) - new Date(b.dueDate);
    }
    if (currentSort === 'priority-desc') {
      return priorityWeights[b.priority] - priorityWeights[a.priority];
    }
    return 0;
  });

  // 3. Update Text Counters & Header Summary
  listSummaryTextEl.textContent = `Showing ${filteredTasks.length} task${filteredTasks.length === 1 ? '' : 's'}`;

  // 4. Populate Task List
  taskList.innerHTML = '';

  if (filteredTasks.length === 0) {
    emptyState.style.display = 'flex';
  } else {
    emptyState.style.display = 'none';

    filteredTasks.forEach(task => {
      const taskItem = document.createElement('li');
      taskItem.className = `task-item ${task.completed ? 'completed' : ''}`;
      taskItem.setAttribute('data-id', task.id);

      // Check due date / overdue status
      let dateBadgeHTML = '';
      if (task.dueDate) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const taskDueDate = new Date(task.dueDate);
        taskDueDate.setHours(0, 0, 0, 0);

        const formattedDate = new Date(task.dueDate).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric'
        });

        const isOverdue = !task.completed && (taskDueDate < today);
        dateBadgeHTML = `
          <span class="due-date ${isOverdue ? 'overdue' : ''}">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/>
            </svg>
            ${formattedDate} ${isOverdue ? '(Overdue)' : ''}
          </span>
        `;
      }

      // Checkbox SVG state markup
      const checkboxCheckedClass = task.completed ? 'checked' : '';

      taskItem.innerHTML = `
        <div class="task-item-left">
          <div class="custom-checkbox ${checkboxCheckedClass}" aria-label="Toggle completed state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
          <div class="task-info">
            <span class="task-title" title="${task.title}">${task.title}</span>
            <div class="task-meta">
              <span class="badge badge-category">${task.category}</span>
              <span class="badge badge-priority ${task.priority.toLowerCase()}">${task.priority}</span>
              ${dateBadgeHTML}
            </div>
          </div>
        </div>
        <div class="task-actions">
          <button class="action-btn edit-btn" aria-label="Edit task">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>
            </svg>
          </button>
          <button class="action-btn delete-btn" aria-label="Delete task">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
            </svg>
          </button>
        </div>
      `;

      // Event Bindings
      const checkbox = taskItem.querySelector('.custom-checkbox');
      const titleSpan = taskItem.querySelector('.task-title');
      const editBtn = taskItem.querySelector('.edit-btn');
      const deleteBtn = taskItem.querySelector('.delete-btn');
      const infoContainer = taskItem.querySelector('.task-info');

      checkbox.addEventListener('click', () => toggleTaskComplete(task.id));

      // Inline edit triggers: click edit button OR double click task text
      editBtn.addEventListener('click', () => enableInlineEdit(task.id, titleSpan, infoContainer));
      titleSpan.addEventListener('dblclick', () => enableInlineEdit(task.id, titleSpan, infoContainer));

      deleteBtn.addEventListener('click', () => deleteTask(task.id));

      // Append to DOM list
      taskList.appendChild(taskItem);
    });
  }

  // 5. Update Progress Statistics Dashboard
  updateDashboardStats();
}

// Calculate and Update Dashboard Stats
function updateDashboardStats() {
  const total = tasks.length;
  const completed = tasks.filter(t => t.completed).length;
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

  // Numeric text counters update
  totalCountEl.textContent = total;
  completedCountEl.textContent = completed;

  // Circle Progress Animation (Stroke Circumference: 201)
  const circumference = 201;
  const offset = circumference - (percent / 100) * circumference;
  progressCircle.style.strokeDashoffset = offset;

  // Numeric percentage text
  progressPercentEl.textContent = `${percent}%`;

  // Motivational Messages based on completion thresholds
  if (total === 0) {
    motivationMsgEl.textContent = 'Add tasks below to start visualising your daily progress! 🚀';
  } else if (percent === 0) {
    motivationMsgEl.textContent = 'Start completing tasks to build momentum! You can do it! 💪';
  } else if (percent < 50) {
    motivationMsgEl.textContent = 'Great start! Every small step counts towards your goal. 👍';
  } else if (percent < 100) {
    motivationMsgEl.textContent = 'You are doing amazing! Over halfway there. Keep pushing! 🔥';
  } else {
    motivationMsgEl.textContent = 'Phenomenal! All tasks completed. Time to celebrate! 🎉';
  }

  // Manage visibility of "Clear Completed" button
  if (completed > 0) {
    clearCompletedBtn.classList.remove('hidden');
  } else {
    clearCompletedBtn.classList.add('hidden');
  }
}
