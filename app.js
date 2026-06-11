// 数据存储
let notebooks = JSON.parse(localStorage.getItem('notebooks')) || [];
let diaries = JSON.parse(localStorage.getItem('diaries')) || {};
let currentNotebookId = localStorage.getItem('currentNotebookId') || null;
let currentDiaryId = null;
let selectedNotebookColor = '#ffb6c1'; // 默认粉色
let selectedDiaryColor = '#a8d8ea'; // 日记默认青色
let selectedMood = null;
let selectedScene = null; // 当前选中的场景
let customMoodData = { name: '', icon: '' };
let editingNotebookId = null; // 当前编辑的日记本ID
let deletingNotebookId = null; // 当前删除的日记本ID
let deletingDiaryId = null; // 当前删除的日记ID
let deleteType = ''; // 删除类型：'notebook' 或 'diary'

// 情绪日历相关
let currentCalendarDate = new Date(); // 当前查看的日历月份
let selectedCalendarNotebook = 'all'; // 当前选中的日记本，'all'表示所有

// 纯音乐曲目列表（使用Web Audio API生成，无需网络）
const musicTracks = {
    piano: {
        name: '月光奏鸣曲',
        description: '温柔的钢琴旋律'
    },
    guitar: {
        name: '温柔吉他',
        description: '轻柔的吉他演奏'
    },
    flute: {
        name: '竹林笛声',
        description: '悠扬的笛子音色'
    }
};

// Web Audio API相关变量
let audioContext = null;
let musicInterval = null;
let gainNode = null;
let isPlaying = false;
let currentMusicType = null;

// 初始化
document.addEventListener('DOMContentLoaded', function() {
    // 生成随机治愈壁纸
    generateStartWallpaper();
    
    // 开始按钮事件
    document.getElementById('startBtn').addEventListener('click', function() {
        enterMainApp();
    });
});

// 生成开始界面的随机治愈壁纸
function generateStartWallpaper() {
    const wallpaperElement = document.getElementById('startWallpaper');
    
    // 定义治愈系场景关键词
    const healingScenes = [
        'pastel,soft colors,cute,kawaii,illustration',
        'sky,clouds,pink,blue,dreamy',
        'flowers,garden,spring,pastel,peaceful',
        'cat,kitten,cute,cozy,warm',
        'stars,night sky,moon,dreamy,magical',
        'ocean,beach,sunset,pastel,calm',
        'forest,trees,nature,green,serene',
        'rainbow,colorful,pastel,happy,bright'
    ];
    
    // 随机选择一个场景
    const randomScene = healingScenes[Math.floor(Math.random() * healingScenes.length)];
    const randomSeed = Math.floor(Math.random() * 10000);
    
    // 使用Unsplash Source API获取治愈系图片
    const wallpaperUrl = `https://source.unsplash.com/1920x1080/?${randomScene}&sig=${randomSeed}`;
    
    console.log('生成开始界面壁纸:', wallpaperUrl);
    
    // 设置壁纸背景
    wallpaperElement.style.backgroundImage = `url('${wallpaperUrl}')`;
    
    // 添加加载失败处理
    const img = new Image();
    img.onload = function() {
        console.log('壁纸加载成功');
    };
    img.onerror = function() {
        console.log('壁纸加载失败，使用备用渐变背景');
        // 如果图片加载失败，使用渐变背景作为备选
        const fallbackGradients = [
            'linear-gradient(135deg, #ffd1dc 0%, #a8d8ea 50%, #ffb6c1 100%)',
            'linear-gradient(135deg, #ffe4e1 0%, #e6e6fa 50%, #f0e68c 100%)',
            'linear-gradient(135deg, #e0ffff 0%, #ffb6c1 50%, #dda0dd 100%)',
            'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)'
        ];
        const randomGradient = fallbackGradients[Math.floor(Math.random() * fallbackGradients.length)];
        wallpaperElement.style.backgroundImage = randomGradient;
    };
    img.src = wallpaperUrl;
}

// 进入主应用
function enterMainApp() {
    const startScreen = document.getElementById('startScreen');
    const transitionScreen = document.getElementById('transitionScreen');
    const mainContainer = document.getElementById('mainContainer');
    
    // 开始界面淡出
    startScreen.style.opacity = '0';
    startScreen.style.transition = 'opacity 0.5s ease';
    
    setTimeout(() => {
        // 隐藏开始界面，显示过渡画面
        startScreen.classList.add('hidden');
        transitionScreen.classList.remove('hidden');
        
        // 延迟一下让过渡画面显示出来
        setTimeout(() => {
            transitionScreen.classList.add('active');
        }, 50);
        
        // 在过渡画面显示期间初始化主应用
        setTimeout(() => {
            // 初始化主应用
            renderNotebooks();
            
            // 验证 currentNotebookId 是否有效
            if (currentNotebookId) {
                const notebookExists = notebooks.find(n => n.id === currentNotebookId);
                if (!notebookExists) {
                    currentNotebookId = null;
                    localStorage.removeItem('currentNotebookId');
                }
            }
            
            renderDiaries();
            setupEventListeners();
            
            // 确保按钮状态正确
            updateNewDiaryButtonState();
            
            // 初始化日记本名称显示
            updateCurrentNotebookName();
            
            // 过渡画面淡出
            transitionScreen.classList.remove('active');
            
            setTimeout(() => {
                // 隐藏过渡画面，显示主应用
                transitionScreen.classList.add('hidden');
                mainContainer.classList.remove('hidden');
                
                // 主应用淡入动画
                mainContainer.style.opacity = '0';
                mainContainer.style.transition = 'opacity 0.5s ease';
                setTimeout(() => {
                    mainContainer.style.opacity = '1';
                }, 50);
            }, 500);
        }, 1500); // 过渡画面显示1.5秒
    }, 500);
}

// 更新新建日记按钮状态
function updateNewDiaryButtonState() {
    const newDiaryBtn = document.getElementById('newDiaryBtn');
    if (newDiaryBtn) {
        if (currentNotebookId) {
            newDiaryBtn.disabled = false;
            newDiaryBtn.title = '点击创建新日记';
        } else {
            newDiaryBtn.disabled = true;
            newDiaryBtn.title = '请先选择一个日记本';
        }
    }
}

// 设置事件监听器
function setupEventListeners() {
    // 白噪音按钮切换
    document.getElementById('noiseToggleBtn').addEventListener('click', toggleNoisePanel);
    document.getElementById('closeNoisePanel').addEventListener('click', closeNoisePanel);
    
    // 情绪日历按钮切换
    document.getElementById('calendarToggleBtn').addEventListener('click', toggleCalendarModal);
    document.getElementById('closeCalendarModal').addEventListener('click', closeCalendarModal);
    
    // 收藏按钮事件
    document.getElementById('favoriteToggleBtn').addEventListener('click', toggleFavoriteModal);
    document.getElementById('closeFavoriteModal').addEventListener('click', closeFavoriteModal);
    document.getElementById('prevMonth').addEventListener('click', () => changeMonth(-1));
    document.getElementById('nextMonth').addEventListener('click', () => changeMonth(1));
    
    // 日记本选择器变化
    document.getElementById('calendarNotebookSelect').addEventListener('change', function() {
        selectedCalendarNotebook = this.value;
        renderCalendar();
    });
    
    // 日记列表收起/展开
    document.getElementById('toggleDiariesBtn').addEventListener('click', function() {
        const diariesList = document.getElementById('diariesList');
        const isCollapsed = diariesList.classList.toggle('collapsed');
        this.textContent = isCollapsed ? '▲' : '▼';
        this.classList.toggle('rotated', isCollapsed);
    });
    
    // 日记本列表收起/展开
    document.getElementById('toggleNotebooksBtn').addEventListener('click', function() {
        const notebooksList = document.getElementById('notebooksList');
        const isCollapsed = notebooksList.classList.toggle('collapsed');
        this.textContent = isCollapsed ? '▲' : '▼';
        this.classList.toggle('rotated', isCollapsed);
    });
    
    // 日期日记模态框关闭
    document.getElementById('closeDayDiaryModal').addEventListener('click', () => {
        document.getElementById('dayDiaryModal').classList.add('hidden');
    });
    
    // 新建日记本
    document.getElementById('newNotebookBtn').addEventListener('click', openNotebookModal);
    document.getElementById('closeNotebookModal').addEventListener('click', closeNotebookModal);
    document.getElementById('cancelNotebook').addEventListener('click', closeNotebookModal);
    document.getElementById('saveNotebook').addEventListener('click', createNotebook);
    
    // 日记本颜色选择
    document.querySelectorAll('#notebookModal .color-option').forEach(option => {
        option.addEventListener('click', function() {
            document.querySelectorAll('#notebookModal .color-option').forEach(o => o.classList.remove('selected'));
            this.classList.add('selected');
            selectedNotebookColor = this.dataset.color;
        });
    });
    
    // 编辑日记本
    document.getElementById('closeEditNotebookModal').addEventListener('click', closeEditNotebookModal);
    document.getElementById('cancelEditNotebook').addEventListener('click', closeEditNotebookModal);
    document.getElementById('saveEditNotebook').addEventListener('click', saveEditNotebook);
    
    // 删除确认
    document.getElementById('closeDeleteModal').addEventListener('click', closeDeleteModal);
    document.getElementById('cancelDelete').addEventListener('click', closeDeleteModal);
    document.getElementById('confirmDelete').addEventListener('click', confirmDeleteNotebook);
    
    // 新建日记
// 新建日记
    document.getElementById('newDiaryBtn').addEventListener('click', function() {
        console.log('点击新建日记按钮');
        console.log('currentNotebookId:', currentNotebookId);
        console.log('按钮禁用状态:', this.disabled);
        if (!currentNotebookId) {
            alert('请先选择一个日记本！');
            return;
        }
        openEditor();
    });
    
    // 关闭模态框
    document.getElementById('closeModal').addEventListener('click', closeEditor);
    document.getElementById('cancelEdit').addEventListener('click', closeEditor);
    
    // 保存日记
    document.getElementById('saveDiary').addEventListener('click', saveDiary);
    
    // AI共情回复按钮
    document.getElementById('aiReplyBtn').addEventListener('click', getAiReply);
    
    // 关闭AI回复模态框
    document.getElementById('closeAiReplyModal').addEventListener('click', closeAiReplyModal);
    document.getElementById('closeAiReplyBtn').addEventListener('click', closeAiReplyModal);
    
    // 复制AI回复
    document.getElementById('copyAiReply').addEventListener('click', copyAiReply);
    
    // 日记颜色选择
    document.querySelectorAll('.diary-color-options .color-option').forEach(option => {
        option.addEventListener('click', function() {
            document.querySelectorAll('.diary-color-options .color-option').forEach(o => o.classList.remove('selected'));
            this.classList.add('selected');
            selectedDiaryColor = this.dataset.color;
        });
    });
    
    // 心情选择
    document.querySelectorAll('.mood-option').forEach(option => {
        option.addEventListener('click', function() {
            handleMoodSelection(this);
        });
    });
    
    // 场景选择
    document.querySelectorAll('.scene-option').forEach(option => {
        option.addEventListener('click', function() {
            document.querySelectorAll('.scene-option').forEach(o => o.classList.remove('selected'));
            this.classList.add('selected');
            selectedScene = this.dataset.scene;
            
            // 如果已经选择了心情，生成文案
            if (selectedMood) {
                generateCopywriting(selectedMood, selectedScene);
            }
        });
    });
    
    // 白噪音控制
    document.getElementById('playNoise').addEventListener('click', function() {
        if (isPlaying) {
            pauseWhiteNoise();
        } else {
            playWhiteNoise();
        }
    });
    document.getElementById('stopNoise').addEventListener('click', stopWhiteNoise);
    
    // 音乐类型切换
    const musicTypeInputs = document.querySelectorAll('input[name="noiseType"]');
    musicTypeInputs.forEach(input => {
        input.addEventListener('change', function() {
            // 如果正在播放，停止当前音乐并播放新类型的音乐
            if (isPlaying) {
                stopWhiteNoise();
                setTimeout(() => {
                    playWhiteNoise();
                }, 100);
            }
        });
    });
}

// 渲染日记本列表
function renderNotebooks() {
    const container = document.getElementById('notebooksList');
    
    if (notebooks.length === 0) {
        container.innerHTML = '<p class="empty-tip">还没有日记本，创建一个吧~</p>';
        return;
    }
    
    container.innerHTML = notebooks.map(notebook => {
        const baseColor = notebook.color || '#ffb6c1';
        return `
        <div class="notebook-item ${currentNotebookId === notebook.id ? 'active' : ''}" 
             onclick="selectNotebook('${notebook.id}')"
             style="background: linear-gradient(135deg, ${baseColor}33 0%, ${baseColor}66 100%);">
            <div class="notebook-name">${escapeHtml(notebook.name)}</div>
            <div class="notebook-date">创建于: ${formatDate(notebook.createdAt)}</div>
            <div class="notebook-actions" onclick="event.stopPropagation()">
                <button onclick="editNotebook('${notebook.id}')" title="编辑">✏️</button>
                <button onclick="deleteNotebook('${notebook.id}')" title="删除">🗑️</button>
            </div>
        </div>
        `;
    }).join('');
}

// 选择日记本
function selectNotebook(id) {
    console.log('选择日记本:', id);
    currentNotebookId = id;
    localStorage.setItem('currentNotebookId', id);
    renderNotebooks();
    renderDiaries();
    updateNewDiaryButtonState();
    updateCurrentNotebookName();
}

// 更新当前日记本名称显示
function updateCurrentNotebookName() {
    const nameElement = document.getElementById('currentNotebookName');
    if (currentNotebookId) {
        const notebook = notebooks.find(n => n.id === currentNotebookId);
        if (notebook) {
            nameElement.textContent = `📖 ${notebook.name}`;
            nameElement.style.display = 'inline-block';
        } else {
            nameElement.style.display = 'none';
        }
    } else {
        nameElement.style.display = 'none';
    }
}

// 打开日记本模态框
function openNotebookModal() {
    const modal = document.getElementById('notebookModal');
    document.getElementById('notebookName').value = '';
    
    // 重置颜色选择
    document.querySelectorAll('#notebookModal .color-option').forEach(o => o.classList.remove('selected'));
    document.querySelector('#notebookModal .color-option[data-color="#ffb6c1"]').classList.add('selected');
    selectedNotebookColor = '#ffb6c1';
    
    modal.classList.remove('hidden');
}

// 关闭日记本模态框
function closeNotebookModal() {
    document.getElementById('notebookModal').classList.add('hidden');
}

// 创建日记本
function createNotebook() {
    const name = document.getElementById('notebookName').value.trim();
    if (!name) {
        alert('请输入日记本名称');
        return;
    }
    
    const notebook = {
        id: generateId(),
        name: name,
        color: selectedNotebookColor,
        createdAt: new Date().toISOString()
    };
    
    notebooks.push(notebook);
    diaries[notebook.id] = [];
    saveData();
    closeNotebookModal();
    renderNotebooks();
}

// 编辑日记本
function editNotebook(id) {
    const notebook = notebooks.find(n => n.id === id);
    if (!notebook) return;
    
    editingNotebookId = id;
    document.getElementById('editNotebookName').value = notebook.name;
    document.getElementById('editNotebookModal').classList.remove('hidden');
}

// 关闭编辑日记本模态框
function closeEditNotebookModal() {
    document.getElementById('editNotebookModal').classList.add('hidden');
    editingNotebookId = null;
}

// 保存编辑的日记本
function saveEditNotebook() {
    const newName = document.getElementById('editNotebookName').value.trim();
    if (!newName) {
        alert('请输入日记本名称');
        return;
    }
    
    const notebook = notebooks.find(n => n.id === editingNotebookId);
    if (notebook) {
        notebook.name = newName;
        saveData();
        renderNotebooks();
    }
    
    closeEditNotebookModal();
}

// 删除日记本
function deleteNotebook(id) {
    deletingNotebookId = id;
    deletingDiaryId = null;
    deleteType = 'notebook';
    
    const notebook = notebooks.find(n => n.id === id);
    if (!notebook) return;
    
    const diaryCount = diaries[id] ? diaries[id].length : 0;
    let message = `确定要删除日记本「${notebook.name}」吗？`;
    if (diaryCount > 0) {
        message += `<br>其中的 <strong>${diaryCount}</strong> 篇日记也会被删除。`;
    }
    
    document.getElementById('deleteMessage').innerHTML = message;
    document.getElementById('deleteConfirmModal').classList.remove('hidden');
}

// 关闭删除确认模态框
function closeDeleteModal() {
    document.getElementById('deleteConfirmModal').classList.add('hidden');
    deletingNotebookId = null;
}

// 确认删除日记本
function confirmDeleteNotebook() {
    if (deleteType === 'notebook' && deletingNotebookId) {
        notebooks = notebooks.filter(n => n.id !== deletingNotebookId);
        delete diaries[deletingNotebookId];
        
        if (currentNotebookId === deletingNotebookId) {
            currentNotebookId = null;
            localStorage.removeItem('currentNotebookId');
        }
        
        saveData();
        renderNotebooks();
        renderDiaries();
        updateNewDiaryButtonState();
        updateCurrentNotebookName(); // 更新日记本名称显示
    } else if (deleteType === 'diary' && deletingDiaryId) {
        diaries[currentNotebookId] = diaries[currentNotebookId].filter(d => d.id !== deletingDiaryId);
        saveData();
        renderDiaries();
    }
    
    closeDeleteModal();
}

// 渲染日记列表
function renderDiaries() {
    const container = document.getElementById('diariesList');
    
    if (!currentNotebookId) {
        container.innerHTML = '<p class="empty-tip">请先选择一个日记本</p>';
        return;
    }
    
    const notebookDiaries = diaries[currentNotebookId] || [];
    
    if (notebookDiaries.length === 0) {
        container.innerHTML = '<p class="empty-tip">这个日记本还没有日记，写一篇吧~</p>';
        return;
    }
    
    // 按日期从早到晚排序
    const sortedDiaries = [...notebookDiaries].sort((a, b) => {
        const dateA = a.date ? new Date(a.date) : new Date(a.updatedAt);
        const dateB = b.date ? new Date(b.date) : new Date(b.updatedAt);
        return dateA - dateB;
    });
    
    container.innerHTML = sortedDiaries.map(diary => {
        const moodDisplay = diary.mood ? 
            (diary.mood.type === 'custom' ? 
                `${diary.mood.customIcon || '✨'} ${diary.mood.customName || '自定义'}` :
                `${diary.mood.icon} ${diary.mood.label}`) : '';
        
        const baseColor = diary.color || '#a8d8ea';
        // 使用更淡的颜色（添加透明度）
        const lightColor = baseColor + '33'; // 20% 透明度
        const mediumColor = baseColor + '55'; // 33% 透明度
        
        return `
        <div class="diary-item ${diary.favorited ? 'favorited' : ''}" 
             style="background: linear-gradient(135deg, ${lightColor} 0%, ${mediumColor} 100%);">
            <div class="diary-title">${escapeHtml(diary.title || '无标题')}</div>
            ${moodDisplay ? `<div class="diary-mood">${moodDisplay}</div>` : ''}
            <div class="diary-preview">${escapeHtml(diary.content || '无内容')}</div>
            <div class="diary-date">${diary.date ? formatDateOnly(new Date(diary.date)) : formatDate(diary.updatedAt)}</div>
            <div class="diary-actions">
                <button onclick="toggleFavorite('${diary.id}')" title="${diary.favorited ? '取消收藏' : '收藏'}">
                    ${diary.favorited ? '💖' : '🤍'}
                </button>
                <button onclick="editDiary('${diary.id}')" title="编辑">✏️</button>
                <button onclick="deleteDiary('${diary.id}')" title="删除">🗑️</button>
            </div>
        </div>
        `;
    }).join('');
}

// 处理心情选择
function handleMoodSelection(element) {
    const mood = element.dataset.mood;
    
    // 移除其他选中状态
    document.querySelectorAll('.mood-option').forEach(opt => opt.classList.remove('selected'));
    
    // 如果是自定义心情
    if (mood === 'custom') {
        element.classList.add('selected');
        document.getElementById('customMoodInput').classList.remove('hidden');
        selectedMood = 'custom';
    } else {
        element.classList.add('selected');
        document.getElementById('customMoodInput').classList.add('hidden');
        selectedMood = {
            type: mood,
            icon: element.dataset.icon,
            label: element.querySelector('.mood-label').textContent
        };
    }
    
    // 如果已经选择了场景，生成文案
    const sceneElement = document.querySelector('.scene-option.selected');
    if (sceneElement && selectedMood !== 'custom') {
        generateCopywriting(selectedMood, sceneElement.dataset.scene);
    }
}

// 打开编辑器
function openEditor(diaryId = null) {
    console.log('打开编辑器, diaryId:', diaryId);
    console.log('currentNotebookId:', currentNotebookId);
    
    if (!currentNotebookId) {
        console.error('没有选中的日记本！');
        alert('请先选择一个日记本！');
        return;
    }
    
    currentDiaryId = diaryId;
    const modal = document.getElementById('editorModal');
    const titleInput = document.getElementById('diaryTitle');
    const contentInput = document.getElementById('diaryContent');
    const dateInput = document.getElementById('diaryDate');
    const modalTitle = document.getElementById('modalTitle');
    
    // 重置心情选择
    document.querySelectorAll('.mood-option').forEach(opt => opt.classList.remove('selected'));
    document.getElementById('customMoodInput').classList.add('hidden');
    selectedMood = null;
    customMoodData = { name: '', icon: '' };
    
    // 重置场景选择
    document.querySelectorAll('.scene-option').forEach(opt => opt.classList.remove('selected'));
    selectedScene = null;
    
    // 隐藏文案区域
    document.getElementById('moodCopywriting').classList.add('hidden');
    
    // 重置颜色选择
    document.querySelectorAll('.diary-color-options .color-option').forEach(o => o.classList.remove('selected'));
    const defaultDiaryColor = document.querySelector('.diary-color-options .color-option[data-color="#a8d8ea"]');
    if (defaultDiaryColor) {
        defaultDiaryColor.classList.add('selected');
    }
    selectedDiaryColor = '#a8d8ea';
    
    if (diaryId) {
        const diary = diaries[currentNotebookId].find(d => d.id === diaryId);
        if (diary) {
            modalTitle.textContent = '编辑日记';
            titleInput.value = diary.title;
            contentInput.value = diary.content;
            dateInput.value = diary.date || formatDateOnly(new Date());
            
            // 恢复颜色选择
            if (diary.color) {
                const colorOption = document.querySelector(`.diary-color-options .color-option[data-color="${diary.color}"]`);
                if (colorOption) {
                    document.querySelectorAll('.diary-color-options .color-option').forEach(o => o.classList.remove('selected'));
                    colorOption.classList.add('selected');
                    selectedDiaryColor = diary.color;
                }
            }
            
            // 恢复心情选择
            if (diary.mood) {
                if (diary.mood.type === 'custom') {
                    const customOption = document.querySelector('.mood-option[data-mood="custom"]');
                    customOption.classList.add('selected');
                    document.getElementById('customMoodInput').classList.remove('hidden');
                    document.getElementById('customMoodName').value = diary.mood.customName || '';
                    document.getElementById('customMoodIcon').value = diary.mood.customIcon || '';
                    selectedMood = 'custom';
                    customMoodData = {
                        name: diary.mood.customName || '',
                        icon: diary.mood.customIcon || ''
                    };
                } else {
                    const moodOption = document.querySelector(`.mood-option[data-mood="${diary.mood.type}"]`);
                    if (moodOption) {
                        moodOption.classList.add('selected');
                        selectedMood = diary.mood;
                    }
                }
            }
        }
    } else {
        modalTitle.textContent = '新建日记';
        titleInput.value = '';
        contentInput.value = '';
        dateInput.value = formatDateOnly(new Date());
    }
    
    modal.classList.remove('hidden');
}

// 关闭编辑器
function closeEditor() {
    document.getElementById('editorModal').classList.add('hidden');
    currentDiaryId = null;
}

// 保存日记
function saveDiary() {
    const title = document.getElementById('diaryTitle').value.trim();
    const content = document.getElementById('diaryContent').value.trim();
    const date = document.getElementById('diaryDate').value;
    
    if (!title && !content) {
        alert('请至少输入标题或内容');
        return;
    }
    
    // 处理自定义心情
    let moodData = selectedMood;
    if (selectedMood === 'custom') {
        const customName = document.getElementById('customMoodName').value.trim();
        const customIcon = document.getElementById('customMoodIcon').value.trim();
        if (customName) {
            moodData = {
                type: 'custom',
                customName: customName,
                customIcon: customIcon || '✨'
            };
        } else {
            moodData = null;
        }
    }
    
    if (currentDiaryId) {
        // 编辑现有日记
        const diary = diaries[currentNotebookId].find(d => d.id === currentDiaryId);
        if (diary) {
            diary.title = title;
            diary.content = content;
            diary.date = date;
            diary.color = selectedDiaryColor;
            diary.mood = moodData;
            diary.updatedAt = new Date().toISOString();
        }
    } else {
        // 新建日记
        const newDiary = {
            id: generateId(),
            title: title,
            content: content,
            date: date,
            color: selectedDiaryColor,
            mood: moodData,
            favorited: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        if (!diaries[currentNotebookId]) {
            diaries[currentNotebookId] = [];
        }
        diaries[currentNotebookId].push(newDiary);
    }
    
    saveData();
    closeEditor();
    renderDiaries();
}

// 编辑日记
function editDiary(id) {
    openEditor(id);
}

// 删除日记
function deleteDiary(id) {
    deletingDiaryId = id;
    deletingNotebookId = null;
    deleteType = 'diary';
    
    const diary = diaries[currentNotebookId].find(d => d.id === id);
    if (!diary) return;
    
    const message = `确定要删除日记「${escapeHtml(diary.title || '无标题')}」吗？`;
    document.getElementById('deleteMessage').innerHTML = message;
    document.getElementById('deleteConfirmModal').classList.remove('hidden');
}

// 切换收藏状态
function toggleFavorite(id) {
    const diary = diaries[currentNotebookId].find(d => d.id === id);
    if (diary) {
        diary.favorited = !diary.favorited;
        saveData();
        renderDiaries();
    }
}

// 切换白噪音面板
function toggleNoisePanel() {
    const panel = document.getElementById('noisePanel');
    panel.classList.toggle('hidden');
}

// 关闭白噪音面板
function closeNoisePanel() {
    document.getElementById('noisePanel').classList.add('hidden');
}

// 播放纯音乐
function playWhiteNoise() {
    if (isPlaying) return;
    
    const musicType = document.querySelector('input[name="noiseType"]:checked').value;
    currentMusicType = musicType;
    
    // 创建AudioContext
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    
    // 创建增益节点（音量控制）
    gainNode = audioContext.createGain();
    gainNode.gain.value = 0.15;
    gainNode.connect(audioContext.destination);
    
    // 根据类型设置不同的音阶和节奏
    let scale, tempo, waveType;
    switch(musicType) {
        case 'piano':
            // 钢琴曲 - C大调音阶，较慢节奏，正弦波
            scale = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25];
            tempo = 800;
            waveType = 'sine';
            break;
        case 'guitar':
            // 吉他曲 - G大调音阶，中等节奏，三角波
            scale = [196.00, 220.00, 246.94, 261.63, 293.66, 329.63, 369.99, 392.00];
            tempo = 600;
            waveType = 'triangle';
            break;
        case 'flute':
            // 笛子曲（晨曦鸟鸣）- 温柔舒缓的清晨旋律，类似钢琴曲风格
            scale = [329.63, 349.23, 392.00, 440.00, 493.88, 523.25, 587.33]; // E大调中音区，温暖柔和
            tempo = 600; // 中等节奏，比钢琴曲稍快
            waveType = 'sine';
            break;
    }
    
    // 播放音符的函数
    function playNote() {
        // 随机选择一个音符
        const frequency = scale[Math.floor(Math.random() * scale.length)];
        
        // 创建振荡器
        const oscillator = audioContext.createOscillator();
        const noteGain = audioContext.createGain();
        
        // 设置音色
        oscillator.type = waveType;
        oscillator.frequency.value = frequency;
        
        // 设置音量包络（淡入淡出）
        noteGain.gain.setValueAtTime(0, audioContext.currentTime);
        
        // 根据音乐类型设置不同的音效
        if (musicType === 'flute') {
            // 晨曦鸟鸣：温柔舒缓，类似钢琴曲的风格
            noteGain.gain.linearRampToValueAtTime(0.25, audioContext.currentTime + 0.05); // 柔和起音
            noteGain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1.5); // 长衰减
            
            // 不使用颤音，保持纯净的音色
        } else {
            // 普通音乐：柔和的起音和较长的衰减
            noteGain.gain.linearRampToValueAtTime(0.25, audioContext.currentTime + 0.05);
            noteGain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1.5);
        }
        
        // 连接节点
        oscillator.connect(noteGain);
        noteGain.connect(gainNode);
        
        // 播放音符
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 1.5);
    }
    
    // 立即播放第一个音符
    playNote();
    
    // 设置定时器持续播放
    musicInterval = setInterval(playNote, tempo);
    
    isPlaying = true;
    document.getElementById('playNoise').textContent = '⏸ 暂停';
    console.log(`正在播放: ${musicTracks[musicType].name} - ${musicTracks[musicType].description}`);
}

// 暂停纯音乐
function pauseWhiteNoise() {
    if (!isPlaying) return;
    
    // 清除定时器
    if (musicInterval) {
        clearInterval(musicInterval);
        musicInterval = null;
    }
    
    isPlaying = false;
    document.getElementById('playNoise').textContent = '▶ 播放';
    console.log('音乐已暂停');
}

// 停止纯音乐
function stopWhiteNoise() {
    if (!isPlaying) return;
    
    // 清除定时器
    if (musicInterval) {
        clearInterval(musicInterval);
        musicInterval = null;
    }
    
    // 断开增益节点
    if (gainNode) {
        gainNode.disconnect();
        gainNode = null;
    }
    
    isPlaying = false;
    document.getElementById('playNoise').textContent = '▶ 播放';
    console.log('音乐已停止');
}

// 切换情绪日历模态框
function toggleCalendarModal() {
    const modal = document.getElementById('calendarModal');
    if (modal.classList.contains('hidden')) {
        updateNotebookSelector(); // 更新日记本选项
        renderCalendar();
        modal.classList.remove('hidden');
    } else {
        modal.classList.add('hidden');
    }
}

// 更新日记本选择器选项
function updateNotebookSelector() {
    const select = document.getElementById('calendarNotebookSelect');
    const currentValue = select.value;
    
    // 清空选项（保留“所有日记本”）
    select.innerHTML = '<option value="all">所有日记本</option>';
    
    // 添加所有日记本选项
    notebooks.forEach(notebook => {
        const option = document.createElement('option');
        option.value = notebook.id;
        option.textContent = notebook.name;
        select.appendChild(option);
    });
    
    // 恢复之前选择的值（如果该日记本还存在）
    if (currentValue && (currentValue === 'all' || notebooks.find(n => n.id === currentValue))) {
        select.value = currentValue;
        selectedCalendarNotebook = currentValue;
    }
}

// 关闭情绪日历模态框
function closeCalendarModal() {
    document.getElementById('calendarModal').classList.add('hidden');
}

// 切换收藏模态框
function toggleFavoriteModal() {
    const modal = document.getElementById('favoriteModal');
    if (modal.classList.contains('hidden')) {
        renderFavoriteDiaries();
        modal.classList.remove('hidden');
    } else {
        modal.classList.add('hidden');
    }
}

// 关闭收藏模态框
function closeFavoriteModal() {
    document.getElementById('favoriteModal').classList.add('hidden');
}

// 渲染收藏日记列表
function renderFavoriteDiaries() {
    const container = document.getElementById('favoriteDiaryList');
    
    // 收集所有收藏的日记
    let favoriteDiaries = [];
    for (const notebookId in diaries) {
        const notebookDiaries = diaries[notebookId] || [];
        const favorited = notebookDiaries.filter(d => d.favorited);
        favorited.forEach(diary => {
            // 找到对应的日记本名称
            const notebook = notebooks.find(n => n.id === notebookId);
            favoriteDiaries.push({
                ...diary,
                notebookId: notebookId,
                notebookName: notebook ? notebook.name : '未知日记本'
            });
        });
    }
    
    // 按更新时间排序（最新的在前）
    favoriteDiaries.sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));
    
    if (favoriteDiaries.length === 0) {
        container.innerHTML = '<p class="empty-tip">还没有收藏的日记哦~</p>';
        return;
    }
    
    container.innerHTML = favoriteDiaries.map(diary => `
        <div class="favorite-diary-item" data-notebook-id="${diary.notebookId}" data-diary-id="${diary.id}">
            <div class="favorite-diary-header">
                <span class="favorite-diary-date">${escapeHtml(diary.date || formatDateOnly(new Date(diary.createdAt)))}</span>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <span class="favorite-diary-mood">${diary.mood ? diary.mood.icon : '🐱'}</span>
                    <button class="favorite-remove-btn" onclick="event.stopPropagation(); removeFavorite('${diary.notebookId}', '${diary.id}')" title="取消收藏">⭐</button>
                </div>
            </div>
            <div class="favorite-diary-title">${escapeHtml(diary.title || '无标题')}</div>
            ${diary.content ? `<div class="favorite-diary-preview">${escapeHtml(diary.content)}</div>` : ''}
        </div>
    `).join('');
    
    // 添加点击事件，跳转到对应日记
    container.querySelectorAll('.favorite-diary-item').forEach(item => {
        item.addEventListener('click', function() {
            const notebookId = this.dataset.notebookId;
            const diaryId = this.dataset.diaryId;
            closeFavoriteModal();
            selectNotebook(notebookId);
            setTimeout(() => {
                editDiary(diaryId);
            }, 100);
        });
    });
}

// 取消收藏
function removeFavorite(notebookId, diaryId) {
    const diary = diaries[notebookId].find(d => d.id === diaryId);
    if (diary) {
        diary.favorited = false;
        saveData();
        renderFavoriteDiaries();
        // 如果当前正在查看该日记本的日记列表，也要更新
        if (currentNotebookId === notebookId) {
            renderDiaries();
        }
    }
}

// 切换月份
function changeMonth(delta) {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() + delta);
    renderCalendar();
}

// 渲染日历
function renderCalendar() {
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();
    
    // 更新月份标题
    document.getElementById('currentMonth').textContent = `${year}年${month + 1}月`;
    
    // 获取当月第一天和最后一天
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay(); // 0 = Sunday
    
    // 清空日历
    const calendarDays = document.getElementById('calendarDays');
    calendarDays.innerHTML = '';
    
    // 添加空白格子（第一天之前的）
    for (let i = 0; i < startDayOfWeek; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'calendar-day empty';
        calendarDays.appendChild(emptyDay);
    }
    
    // 添加日期格子
    const today = new Date();
    const moodData = collectMoodData(year, month);
    
    for (let day = 1; day <= daysInMonth; day++) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        dayElement.textContent = day;
        
        // 标记今天
        if (year === today.getFullYear() && month === today.getMonth() && day === today.getDate()) {
            dayElement.classList.add('today');
        }
        
        // 添加情绪标记
        const dateKey = `${year}-${month + 1}-${day}`;
        if (moodData[dateKey]) {
            dayElement.classList.add('has-mood');
            const moodIndicator = document.createElement('div');
            moodIndicator.className = 'mood-indicator';
            moodIndicator.textContent = moodData[dateKey].icon;
            dayElement.appendChild(moodIndicator);
            
            // 添加title提示
            dayElement.title = `${moodData[dateKey].label} (${moodData[dateKey].count}篇日记)`;
        }
        
        // 添加点击事件
        dayElement.addEventListener('click', () => {
            if (!dayElement.classList.contains('empty')) {
                showDayDiaries(year, month + 1, day);
            }
        });
        
        calendarDays.appendChild(dayElement);
    }
}

// 收集情绪数据
function collectMoodData(year, month) {
    const moodData = {};
    
    // 确定要遍历的日记本
    const notebookIds = selectedCalendarNotebook === 'all' 
        ? Object.keys(diaries) 
        : [selectedCalendarNotebook];
    
    // 遍历指定日记本
    notebookIds.forEach(notebookId => {
        const notebookDiaries = diaries[notebookId] || [];
        
        notebookDiaries.forEach(diary => {
            if (!diary.mood) return;
            
            // 解析日记日期
            const diaryDate = new Date(diary.date);
            if (diaryDate.getFullYear() === year && diaryDate.getMonth() === month) {
                const dateKey = `${year}-${diaryDate.getMonth() + 1}-${diaryDate.getDate()}`;
                
                if (!moodData[dateKey]) {
                    moodData[dateKey] = {
                        icon: diary.mood.icon,
                        label: diary.mood.label,
                        count: 0
                    };
                }
                
                moodData[dateKey].count++;
                // 如果有多篇日记，使用最后一篇的情绪
                moodData[dateKey].icon = diary.mood.icon;
                moodData[dateKey].label = diary.mood.label;
            }
        });
    });
    
    return moodData;
}

// 显示某日的所有日记
function showDayDiaries(year, month, day) {
    const targetDate = `${year}-${month}-${day}`;
    const allDiariesForDay = [];
    
    // 确定要查询的日记本
    const notebookIds = selectedCalendarNotebook === 'all' 
        ? Object.keys(diaries) 
        : [selectedCalendarNotebook];
    
    // 收集指定日记本中该日期的日记
    notebookIds.forEach(notebookId => {
        const notebookDiaries = diaries[notebookId] || [];
        
        notebookDiaries.forEach(diary => {
            const diaryDate = new Date(diary.date);
            const diaryDateStr = `${diaryDate.getFullYear()}-${diaryDate.getMonth() + 1}-${diaryDate.getDate()}`;
            
            if (diaryDateStr === targetDate) {
                allDiariesForDay.push({
                    ...diary,
                    notebookId: notebookId
                });
            }
        });
    });
    
    // 显示模态框
    const modal = document.getElementById('dayDiaryModal');
    const titleElement = document.getElementById('dayDiaryTitle');
    const listElement = document.getElementById('dayDiaryList');
    
    titleElement.textContent = `${year}年${month}月${day}日 的日记`;
    
    if (allDiariesForDay.length === 0) {
        listElement.innerHTML = '<div class="day-diary-empty">这一天还没有日记记录</div>';
    } else {
        // 按时间排序
        allDiariesForDay.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        
        listElement.innerHTML = allDiariesForDay.map(diary => {
            const moodDisplay = diary.mood ? 
                (diary.mood.type === 'custom' ? 
                    `${diary.mood.customIcon || '✨'} ${diary.mood.customName || '自定义'}` :
                    `${diary.mood.icon} ${diary.mood.label}`) : '';
            
            const bgColor = diary.color || '#a8d8ea';
            const notebook = notebooks.find(n => n.id === diary.notebookId);
            const notebookName = notebook ? notebook.name : '未知日记本';
            
            return `
            <div class="day-diary-item" style="border-left-color: ${bgColor};">
                <div class="day-diary-header">
                    <div class="day-diary-title">${escapeHtml(diary.title || '无标题')}</div>
                    ${moodDisplay ? `<div class="day-diary-mood">${moodDisplay}</div>` : ''}
                </div>
                <div class="day-diary-content">${escapeHtml(diary.content || '无内容')}</div>
                <div class="day-diary-meta">
                    📖 ${escapeHtml(notebookName)} · ${formatDate(diary.updatedAt)}
                </div>
            </div>
            `;
        }).join('');
    }
    
    modal.classList.remove('hidden');
}

// 保存到本地存储
function saveData() {
    localStorage.setItem('notebooks', JSON.stringify(notebooks));
    localStorage.setItem('diaries', JSON.stringify(diaries));
}

// 生成唯一ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// 调整颜色亮度
function adjustColor(color, amount) {
    const num = parseInt(color.replace('#', ''), 16);
    const r = Math.max(0, Math.min(255, (num >> 16) + amount));
    const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amount));
    const b = Math.max(0, Math.min(255, (num & 0x0000FF) + amount));
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

// 格式化日期（完整）
function formatDate(isoString) {
    const date = new Date(isoString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}`;
}

// 格式化日期（仅日期）
function formatDateOnly(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
}

// HTML转义，防止XSS攻击
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 获取AI共情回复
async function getAiReply() {
    const title = document.getElementById('diaryTitle').value.trim();
    const content = document.getElementById('diaryContent').value.trim();
    
    if (!content && !title) {
        alert('请先写一些内容再获取AI回复哦~');
        return;
    }
    
    // 显示模态框
    const modal = document.getElementById('aiReplyModal');
    const loadingElement = document.getElementById('aiReplyLoading');
    const contentElement = document.getElementById('aiReplyContent');
    
    modal.classList.remove('hidden');
    loadingElement.classList.remove('hidden');
    contentElement.innerHTML = '';
    
    try {
        // 构建提示词
        const prompt = `我写了一篇日记：
标题：${title || '无标题'}
内容：${content || '无内容'}

请根据我的日记内容，给我一句温暖的共情或鼓励的话。要求：
1. 语气温暖、治愈、有同理心
2. 简短精炼，一句话即可
3. 可以带一个相关的emoji表情
4. 用中文回复`;
        
        // 调用Lingma API（模拟实现）
        // 注意：这里需要使用实际的API密钥和端点
        const reply = await callLingmaAPI(prompt);
        
        // 延迟0.1秒后显示回复
        setTimeout(() => {
            // 先隐藏加载动画
            loadingElement.classList.add('hidden');
            // 再显示回复内容
            contentElement.innerHTML = `<div class="ai-reply-text">${escapeHtml(reply)}</div>`;
            console.log('AI回复已显示');
        }, 100);
        
    } catch (error) {
        console.error('获取AI回复失败:', error);
        setTimeout(() => {
            loadingElement.classList.add('hidden');
            contentElement.innerHTML = '<div class="ai-reply-text">抱歉，暂时无法获取回复，请稍后再试~ 🐱</div>';
        }, 100);
    }
}

// 调用Lingma API（需要根据实际API文档调整）
async function callLingmaAPI(prompt) {
    // 这里是一个示例实现，实际使用时需要替换为真实的API配置
    // 由于Lingma API的具体接入方式可能不同，这里提供一个通用框架
    
    // 方案1：如果有直接的API端点
    /*
    const response = await fetch('YOUR_LINGMA_API_ENDPOINT', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer YOUR_API_KEY'
        },
        body: JSON.stringify({
            prompt: prompt,
            max_tokens: 100,
            temperature: 0.8
        })
    });
    
    const data = await response.json();
    return data.choices[0].text || data.response || '喵~';
    */
    
    // 方案2：使用预设的共情回复模板（离线备用方案）
    return generateEmpatheticResponse(prompt);
}

// 生成共情回复（离线备用方案）
function generateEmpatheticResponse(prompt) {
    // 提取关键词
    const lowerPrompt = prompt.toLowerCase();
    
    // 根据心情和内容生成不同的回复
    const empatheticResponses = [
        "每一天都值得被温柔对待，你已经在努力了~ 💖",
        "无论发生什么，都要记得好好爱自己哦~ 🌟",
        "你的感受很重要，我在这里陪着你~ 🐱",
        "生活有时会有些难，但你比想象中更坚强~ ✨",
        "感谢你把心情记录下来，这本身就是一种勇气~ 📝",
        "每一个当下都是独一无二的，珍惜此刻的自己~ 🌸",
        "你已经做得很好了，给自己一点鼓励和掌声~ 👏",
        "不管今天怎样，明天都会有新的希望和美好~ 🌈",
        "你的情绪值得被看见和理解，抱抱你~ 🤗",
        "记住，你并不孤单，我们都在你身边~ 💕"
    ];
    
    // 根据关键词选择更合适的回复
    if (lowerPrompt.includes('难过') || lowerPrompt.includes('伤心') || lowerPrompt.includes('😿')) {
        return "难过的时候，允许自己哭泣，但也别忘了给自己一个温暖的拥抱~ 😿💖";
    } else if (lowerPrompt.includes('开心') || lowerPrompt.includes('喜悦') || lowerPrompt.includes('😺')) {
        return "看到你开心，我也跟着快乐起来了！继续保持这份好心情吧~ 😺✨";
    } else if (lowerPrompt.includes('焦虑') || lowerPrompt.includes('紧张') || lowerPrompt.includes('🙀')) {
        return "深呼吸，慢慢来，一切都会好起来的。你已经很棒了~ 🙀🌿";
    } else if (lowerPrompt.includes('愤怒') || lowerPrompt.includes('烦躁') || lowerPrompt.includes('😾')) {
        return "生气是正常的，但别让情绪控制你。找个方式释放一下吧~ 😾🎈";
    } else if (lowerPrompt.includes('迷茫') || lowerPrompt.includes('困惑') || lowerPrompt.includes('🐈')) {
        return "迷茫时停下来思考也是一种成长。相信自己的选择~ 🐈💫";
    }
    
    // 随机返回一条回复
    return empatheticResponses[Math.floor(Math.random() * empatheticResponses.length)];
}

// 关闭AI回复模态框
function closeAiReplyModal() {
    document.getElementById('aiReplyModal').classList.add('hidden');
}

// 复制AI回复
function copyAiReply() {
    const contentElement = document.querySelector('.ai-reply-text');
    if (contentElement) {
        const text = contentElement.textContent;
        navigator.clipboard.writeText(text).then(() => {
            alert('已复制到剪贴板！');
        }).catch(err => {
            console.error('复制失败:', err);
        });
    }
}

// 生成心情文案
// 存储上次生成的文案，用于避免重复
let lastGeneratedCopywritings = [];

function generateCopywriting(mood, scene) {
    const copywritingSection = document.getElementById('moodCopywriting');
    const listElement = document.getElementById('copywritingList');
    
    // 显示文案区域
    copywritingSection.classList.remove('hidden');
    
    // 获取所有文案
    const allCopywritings = getCopywritingByMoodAndScene(mood, scene);
    
    let selectedCopywritings;
    
    // 如果文案数量大于3，确保每次选择完全不同的3条
    if (allCopywritings.length > 3) {
        // 尝试多次随机选择，直到找到与上次完全不同的组合
        let attempts = 0;
        const maxAttempts = 10; // 最多尝试10次
        
        do {
            // 随机打乱文案数组
            const shuffled = [...allCopywritings].sort(() => Math.random() - 0.5);
            selectedCopywritings = shuffled.slice(0, 3);
            attempts++;
            
            // 检查是否与上次完全相同（只要有一条不同就算不同）
            const isDifferent = !selectedCopywritings.every((text, index) => 
                lastGeneratedCopywritings[index] === text
            );
            
            if (isDifferent || attempts >= maxAttempts) {
                break;
            }
        } while (true);
    } else {
        // 如果文案总数不超过3条，就随机打乱顺序
        const shuffled = [...allCopywritings].sort(() => Math.random() - 0.5);
        selectedCopywritings = shuffled;
    }
    
    // 保存本次生成的文案
    lastGeneratedCopywritings = [...selectedCopywritings];
    
    // 渲染文案列表
    listElement.innerHTML = selectedCopywritings.map(text => 
        `<div class="copywriting-item" onclick="selectCopywriting(this)">${escapeHtml(text)}</div>`
    ).join('');
}

// 根据心情和场景获取文案
function getCopywritingByMoodAndScene(mood, scene) {
    // 文案库 - 每个场景下针对不同心情的文案
    const copywritingDB = {
        fresh: { // 清新
            happy: [
                "阳光穿过树叶的缝隙，洒在心上，温暖而明亮",
                "微风拂过脸颊，带着青草的香气，心情也跟着轻盈起来",
                "清晨的露珠在阳光下闪烁，像极了此刻闪闪发光的你"
            ],
            joy: [
                "花开的声音很轻，但快乐可以传得很远很远",
                "风吹过风铃，叮当作响，像是心底最清澈的回声",
                "云朵在天上慢慢走，我在地上轻轻笑"
            ],
            excited: [
                "蝴蝶振翅的瞬间，整个世界都跟着舞动起来",
                "阳光正好，微风不燥，一切都刚刚好的美妙",
                "像春天的第一缕风，带着无限可能扑面而来"
            ],
            satisfied: [
                "一杯清茶，一本好书，时光在此刻变得柔软",
                "午后的阳光慵懒地趴在窗台，我也跟着安静下来",
                "简单的幸福，就是风吹过发梢时的那份惬意"
            ],
            sad: [
                "雨后的天空会有彩虹，难过之后会有新的开始",
                "眼泪是心的雨水，浇灌出明天更坚强的花朵",
                "允许自己难过一会儿，然后继续温柔地生活"
            ],
            calm: [
                "湖面平静如镜，倒映着蓝天白云，也倒映着内心的宁静",
                "坐在草地上看云卷云舒，时间好像也放慢了脚步",
                "风吹过竹林，沙沙作响，是最自然的安眠曲"
            ],
            relaxed: [
                "躺在草地上看星星，什么都不想，就这样静静地发呆",
                "阳光透过窗帘的缝隙，在地板上画出温暖的图案",
                "泡一杯花茶，看花瓣在水中缓缓绽放，心也跟着舒展"
            ],
            angry: [
                "深呼吸，让清新的空气带走心中的烦躁和不安",
                "去户外走走，让大自然的风吹散所有的不快",
                "生气的时候，看看蓝天白云，世界其实很美好"
            ],
            irritated: [
                "整理一下房间，也整理一下心情，一切都会好起来",
                "听一首轻音乐，让旋律抚平心中的皱褶",
                "给自己泡杯薄荷茶，清凉的感觉会让心静下来"
            ],
            anxious: [
                "焦虑就像天上的云，终会散去，留下晴朗的天空",
                "一步一步来，不用急，路就在脚下延伸",
                "深呼吸，感受当下的每一刻，安心地活着"
            ],
            nervous: [
                "紧张是正常的，像考试前的那只蝴蝶，飞过去就好了",
                "相信自己，你已经准备了很久，一定可以的",
                "闭上眼睛，想象自己站在阳光下，温暖而自信"
            ],
            confused: [
                "迷茫的时候，就停下来看看周围的风景，答案会在路上",
                "人生就像迷雾中的森林，走着走着就清晰了",
                "不必急于找到方向，有时候迷路也是一种风景"
            ]
        },
        sunset: { // 落日
            happy: [
                "夕阳把天空染成橘红色，连心情也跟着温暖起来",
                "黄昏的光线温柔地包裹着我，像是被世界拥抱",
                "落日余晖中，所有的烦恼都被染成了金色"
            ],
            joy: [
                "晚霞在天边燃烧，我的心也跟着热烈起来",
                "看着太阳慢慢落下，心里升起一种莫名的喜悦",
                "黄昏时分，连影子都被拉得长长的，像是在跳舞"
            ],
            excited: [
                "夕阳西下，天边燃起一片火红，像极了此刻激动的心",
                "暮色四合，华灯初上，这一刻美得让人心动",
                "落日熔金，暮云合璧，世间美景不过如此"
            ],
            satisfied: [
                "坐在阳台上看日落，手里捧着热茶，岁月静好",
                "夕阳的余晖洒在身上，暖洋洋的，很满足",
                "一天的疲惫在落日的温柔中慢慢消散"
            ],
            sad: [
                "太阳落山了，但它明天还会升起，希望也是",
                "黄昏总是带着一丝忧伤，但也孕育着新的黎明",
                "落日很美，虽然短暂，却足够温暖整个夜晚"
            ],
            calm: [
                "夕阳西下，倦鸟归林，一切都回归平静",
                "看着天边的晚霞慢慢褪去，心也渐渐安宁",
                "黄昏的街道很安静，只有风吹过树叶的声音"
            ],
            relaxed: [
                "靠在窗边看日落，什么都不做，就这样静静地",
                "夕阳的余温还在，晚风轻轻吹过，很舒服",
                "黄昏时分，泡一杯咖啡，享受这份悠闲"
            ],
            angry: [
                "看着夕阳慢慢沉没，心中的怒火也随之平息",
                "落日的光辉如此温柔，何必为小事生气呢",
                "黄昏的风很凉，吹散了心中的烦躁和不安"
            ],
            irritated: [
                "夕阳下的城市很安静，让我也跟着安静下来",
                "暮色渐浓，所有的烦恼都被夜色掩盖",
                "看着天边的最后一抹红光，心也慢慢平静"
            ],
            anxious: [
                "太阳总会落山，但明天依旧会升起，别担心",
                "黄昏再美也要结束，但夜晚有星星陪伴",
                "落日教会我们，结束也是另一种开始"
            ],
            nervous: [
                "夕阳的温柔让人安心，紧张的情绪慢慢缓解",
                "黄昏的光线很柔和，照在身上暖暖的",
                "看着落日，深呼吸，一切都会好起来的"
            ],
            confused: [
                "黄昏时分，光线朦胧，但路依然在脚下",
                "落日虽然短暂，却照亮了整个天空，你也一样",
                "迷茫时就看看夕阳，它会告诉你明天还有希望"
            ]
        },
        rainy: { // 雨夜
            happy: [
                "雨滴敲打着窗户，像是在演奏一首快乐的乐曲",
                "雨夜的灯光很温暖，照亮了回家的路",
                "听着雨声入睡，梦里都是甜甜的味道"
            ],
            joy: [
                "雨滴落在伞面上，发出清脆的声音，像在唱歌",
                "雨夜的空气很清新，深吸一口，满心欢喜",
                "窗外的雨淅淅沥沥，屋内的我开开心心"
            ],
            excited: [
                "暴雨来临前的闷热，让心跳也跟着加速",
                "雨点密集地敲打地面，像是大自然的鼓点",
                "雷雨交加的夜晚，内心却异常兴奋和期待"
            ],
            satisfied: [
                "雨天窝在家里，裹着毯子看书，很惬意",
                "听着雨声喝热可可，温暖从手心传到心里",
                "雨夜的宁静，让人感受到生活的简单美好"
            ],
            sad: [
                "雨滴像是天空的眼泪，落在地上碎成一片",
                "雨夜的孤独感格外强烈，但也让人清醒",
                "下雨天适合想念，也适合放下"
            ],
            calm: [
                "雨声是最好的白噪音，让心慢慢沉静下来",
                "窗外大雨滂沱，屋内安静祥和，很安心",
                "听着雨滴的声音，思绪也跟着飘远"
            ],
            relaxed: [
                "雨天最适合发呆，看雨滴在玻璃上滑落",
                "窝在沙发里听雨声，什么都不用想",
                "雨夜的慵懒，让人忘记时间的流逝"
            ],
            angry: [
                "让雨水冲刷掉心中的愤怒，留下一片清净",
                "雷声轰鸣，像是在宣泄，发泄完就好了",
                "雨夜的凉爽，能让躁动的心冷静下来"
            ],
            irritated: [
                "雨声连绵不绝，却也意外地让人平静",
                "看着窗外的雨幕，烦躁的心情慢慢沉淀",
                "雨夜适合独处，让内心的波澜慢慢平息"
            ],
            anxious: [
                "雨总会停的，就像焦虑终会过去",
                "听着雨声，告诉自己一切都会好起来",
                "雨夜的黑暗只是暂时的，黎明终会到来"
            ],
            nervous: [
                "雨滴的节奏让人安心，紧张感慢慢消散",
                "躲在屋里听雨声，有一种被保护的安全感",
                "雨夜的温暖灯光，驱散了心中的不安"
            ],
            confused: [
                "雨雾朦胧，看不清前方，但可以慢慢走",
                "雨水洗刷过的世界会更清晰，耐心等等",
                "迷茫时听听雨声，答案会在雨中浮现"
            ]
        },
        starry: { // 星空
            happy: [
                "星星在夜空中闪烁，像是在对我眨眼睛微笑",
                "仰望星空，心中满是温暖和喜悦",
                "每一颗星星都是一个美好的愿望，正在实现"
            ],
            joy: [
                "银河横跨天际，美得让人忍不住想要欢呼",
                "数着天上的星星，快乐也在心中一颗颗亮起",
                "星光璀璨，照亮了夜空，也照亮了心情"
            ],
            excited: [
                "流星划过的瞬间，心跳也跟着加速跳动",
                "星空如此壮丽，让人忍不住想要大声呼喊",
                "仰望浩瀚宇宙，内心充满了无限的憧憬"
            ],
            satisfied: [
                "躺在草地上看星星，感受着宇宙的宁静与广阔",
                "星光洒在身上，温柔而安详，很满足",
                "夜晚的星空，是对一天最好的奖励"
            ],
            sad: [
                "星星离得很远，但光芒却能穿越光年温暖人心",
                "即使在最黑暗的夜里，也有星星为你亮着",
                "难过时看看星空，你会发现自己的渺小与坚强"
            ],
            calm: [
                "星空静谧而深邃，让浮躁的心慢慢沉淀",
                "仰望满天繁星，内心获得前所未有的平静",
                "星星不说话，却用最温柔的光芒陪伴着你"
            ],
            relaxed: [
                "躺在屋顶看星星，任由思绪在星海中漫游",
                "星光下的夜晚很安静，适合放空自己",
                "数星星是一件很治愈的事，不知不觉就放松了"
            ],
            angry: [
                "星空如此辽阔，个人的愤怒显得那么渺小",
                "抬头看看星星，让它们的光芒抚平心中的怒火",
                "宇宙那么大，何必为小事耿耿于怀"
            ],
            irritated: [
                "星光温柔地洒下，烦躁的心慢慢安静",
                "仰望星空，让浩瀚宇宙带走所有的不快",
                "星星一直在，不管你的心情如何起伏"
            ],
            anxious: [
                "星星永远在那里，不管你看不看得到",
                "焦虑的时候，看看星空，感受永恒的力量",
                "即使乌云遮住星星，它们依然在发光"
            ],
            nervous: [
                "星光很温柔，像是在轻声安慰紧张的你",
                "仰望星空，深呼吸，让宇宙的能量给你力量",
                "星星闪烁着，像是在说：别怕，我在"
            ],
            confused: [
                "迷路时看看北极星，它会指引你方向",
                "星空虽然复杂，但每颗星都有自己的轨道",
                "迷茫时仰望星空，你会找到内心的答案"
            ]
        },
        gentle: { // 温柔静物
            happy: [
                "阳光洒在白色的桌布上，温暖而美好",
                "花瓶里的花开了，心情也跟着绽放",
                "一杯咖啡的香气，让整个下午都变得甜蜜"
            ],
            joy: [
                "书架上的书整齐排列，像是在静静等待被翻阅",
                "窗台上的多肉胖乎乎的，可爱得让人开心",
                "阳光透过纱帘，在地板上投下斑驳的光影"
            ],
            excited: [
                "新买的杯子很漂亮，用它喝水都觉得幸福",
                "整理房间时发现一本旧日记，回忆涌上心头",
                "桌上的鲜花开得正好，生机勃勃的样子真美"
            ],
            satisfied: [
                "柔软的抱枕靠在沙发上，舒适得让人不想起来",
                "香薰蜡烛散发着淡淡的香气，很安心",
                "午后的阳光和一本好书，就是最好的时光"
            ],
            sad: [
                "枯萎的花提醒我，离别也是生命的一部分",
                "旧照片泛黄的边角，藏着回不去的时光",
                "空荡的房间很安静，适合好好想想心事"
            ],
            calm: [
                "白色的陶瓷杯冒着热气，氤氲出一片宁静",
                "翻开的书页静止在某一页，时光仿佛凝固",
                "桌上的绿植安静生长，不急不缓，很好"
            ],
            relaxed: [
                "柔软的毛毯裹在身上，温暖而舒适",
                "泡一壶花茶，看茶叶在水中舒展，很放松",
                "阳光洒在木地板上，温暖得让人想打盹"
            ],
            angry: [
                "整理一下桌面，也整理一下纷乱的心情",
                "插一束花，让美丽的事物平息心中的怒火",
                "点燃一支香薰，让香气带走所有的烦躁"
            ],
            irritated: [
                "擦拭桌子上的灰尘，也擦拭心中的烦闷",
                "摆弄一下小摆件，专注让心慢慢静下来",
                "给植物浇浇水，看着它们生机勃勃的样子"
            ],
            anxious: [
                "抱着柔软的玩偶，感受那份踏实的温暖",
                "煮一壶热水，看着蒸汽缓缓上升，很治愈",
                "整理抽屉的过程，也是整理内心的过程"
            ],
            nervous: [
                "摸摸柔软的毛绒玩具，紧张感慢慢消散",
                "喝一杯温热的牛奶，让身体和心都放松",
                "看着烛火轻轻摇曳，呼吸也跟着平缓"
            ],
            confused: [
                "翻开一本书，也许答案就藏在某段文字里",
                "观察植物的生长，明白事物都有自己的节奏",
                "整理杂乱的桌面，思路也会慢慢清晰起来"
            ]
        }
    };
    
    // 获取对应的心情类型
    const moodType = typeof mood === 'object' ? mood.type : mood;
    
    // 返回对应的文案，如果没有则返回默认文案
    const sceneCopywritings = copywritingDB[scene] || copywritingDB.fresh;
    const moodCopywritings = sceneCopywritings[moodType] || [
        "生活总有小确幸，用心感受就能发现",
        "每一个当下都值得珍惜，包括此刻的你",
        "温柔对待自己，你值得所有的美好"
    ];
    
    return moodCopywritings;
}

// 选择文案（点击后复制到剪贴板）
function selectCopywriting(element) {
    const text = element.textContent;
    navigator.clipboard.writeText(text).then(() => {
        // 视觉反馈
        element.style.background = '#ffd1dc';
        element.style.borderColor = '#ffb6c1';
        setTimeout(() => {
            element.style.background = '';
            element.style.borderColor = '';
        }, 500);
    }).catch(err => {
        console.error('复制失败:', err);
    });
}
