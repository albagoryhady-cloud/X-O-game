const firebaseConfig = {
    apiKey: "AIzaSyCSnUy1efc_LTvNKb77aDo5D8hPaTsnLYE",
    authDomain: "xo-online-bb0e2.firebaseapp.com",
    databaseURL: "https://xo-online-bb0e2-default-rtdb.firebaseio.com",
    projectId: "xo-online-bb0e2",
    storageBucket: "xo-online-bb0e2.firebasestorage.app",
    messagingSenderId: "21077143842",
    appId: "1:21077143842:web:75d0b89b2c3d7f2b64357b"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.database();

const setupScreen = document.getElementById('setup-screen');
const gameScreen = document.getElementById('game-screen');
const p1Input = document.getElementById('p1-input');
const p2Input = document.getElementById('p2-input');
const roomInput = document.getElementById('room-input');
const roomDisplay = document.getElementById('room-display');
const currentRoomCode = document.getElementById('current-room-code');
const localOptions = document.getElementById('local-options');
const onlineOptions = document.getElementById('online-options');

const symXBtn = document.getElementById('sym-x-btn');
const symOBtn = document.getElementById('sym-o-btn');
const roomPublicBtn = document.getElementById('room-public-btn');
const roomPrivateBtn = document.getElementById('room-private-btn');
const publicRoomsList = document.getElementById('public-rooms-list');

const aiLevelGroup = document.getElementById('ai-level-group');
const mainAiStats = document.getElementById('main-ai-stats');
const lvlEasyBtn = document.getElementById('lvl-easy-btn');
const lvlMediumBtn = document.getElementById('lvl-medium-btn');
const lvlHardBtn = document.getElementById('lvl-hard-btn');

const nameP1Display = document.getElementById('name-p1');
const nameP2Display = document.getElementById('name-p2');
const scoreP1Display = document.getElementById('score-p1');
const scoreP2Display = document.getElementById('score-p2');
const scoreTiesDisplay = document.getElementById('score-ties');
const boxP1 = document.getElementById('box-p1');
const boxP2 = document.getElementById('box-p2');

const statusText = document.getElementById('status');
const cells = document.querySelectorAll('.cell');
const winningLine = document.getElementById('winningLine');

const btnSwapRequest = document.getElementById('btn-swap-request');
const swapBanner = document.getElementById('swap-banner');
const btnShareRoom = document.getElementById('btn-share-room');
const timerBox = document.getElementById('timer-box');
const timerCountDisplay = document.getElementById('timer-count');

const chatContainer = document.getElementById('chat-container');
const chatMessages = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-input');

let gameMode = 'pvp';
let aiLevel = 'medium';
let userSymbol = 'X';
let playerRole = 'p1';
let mySymbol = 'X';
let aiSymbol = 'O';
let isPublicRoom = true;
let currentRoomId = null;
let boardState = ['', '', '', '', '', '', '', '', ''];
let currentPlayer = 'X';
let isGameActive = false;

let p1Name = 'اللاعب 1';
let p2Name = 'اللاعب 2';
let scores = { p1: 0, p2: 0, ties: 0 };

let turnTimerInterval = null;
let autoRestartTimer = null;
let timeLeft = 15;

let currentAiStreak = 0;
let aiStats = {
    easy: { name: 'لا يوجد', count: 0 },
    medium: { name: 'لا يوجد', count: 0 },
    hard: { name: 'لا يوجد', count: 0 }
};

const winConditions = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
];

const lineCoords = [
    { x1: '5%',  y1: '16.6%', x2: '95%', y2: '16.6%' },
    { x1: '5%',  y1: '50%',   x2: '95%', y2: '50%' },
    { x1: '5%',  y1: '83.3%', x2: '95%', y2: '83.3%' },
    { x1: '16.6%', y1: '5%',  x2: '16.6%', y2: '95%' },
    { x1: '50%',   y1: '5%',  x2: '50%',   y2: '95%' },
    { x1: '83.3%', y1: '5%',  x2: '83.3%', y2: '95%' },
    { x1: '5%',  y1: '5%',   x2: '95%', y2: '95%' },
    { x1: '95%', y1: '5%',   x2: '5%',  y2: '95%' }
];

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playSound(type) {
    try {
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);

        if (type === 'click') {
            osc.frequency.setValueAtTime(400, audioCtx.currentTime);
            gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.08);
        } else if (type === 'win') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(523.25, audioCtx.currentTime);
            osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.1);
            osc.frequency.setValueAtTime(783.99, audioCtx.currentTime + 0.2);
            gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.4);
        } else if (type === 'kick') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(200, audioCtx.currentTime);
            osc.frequency.setValueAtTime(100, audioCtx.currentTime + 0.15);
            gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.3);
        }
    } catch(e) {}
}

function triggerConfetti() {
    if (typeof confetti === 'function') {
        confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 }
        });
    }
}

loadAiStats();
listenToPublicRooms();
checkUrlForRoomJoin();

function loadAiStats() {
    const saved = localStorage.getItem('xo_ai_stats_v2');
    if (saved) {
        try {
            aiStats = JSON.parse(saved);
        } catch(e) {}
    }
    updateAiStatsUI();
}

function updateAiStatsUI() {
    const elEasyName = document.getElementById('stat-easy-name');
    const elEasyCount = document.getElementById('stat-easy-count');
    const elMedName = document.getElementById('stat-med-name');
    const elMedCount = document.getElementById('stat-med-count');
    const elHardName = document.getElementById('stat-hard-name');
    const elHardCount = document.getElementById('stat-hard-count');

    if (elEasyName) elEasyName.textContent = aiStats.easy.name || 'لا يوجد';
    if (elEasyCount) elEasyCount.textContent = `${aiStats.easy.count || 0} انتصارات`;

    if (elMedName) elMedName.textContent = aiStats.medium.name || 'لا يوجد';
    if (elMedCount) elMedCount.textContent = `${aiStats.medium.count || 0} انتصارات`;

    if (elHardName) elHardName.textContent = aiStats.hard.name || 'لا يوجد';
    if (elHardCount) elHardCount.textContent = `${aiStats.hard.count || 0} انتصارات`;
}

function saveAiStatForCurrentLevel(playerName, streak) {
    if (streak > (aiStats[aiLevel].count || 0)) {
        aiStats[aiLevel] = { name: playerName, count: streak };
        localStorage.setItem('xo_ai_stats_v2', JSON.stringify(aiStats));
        updateAiStatsUI();
    }
}

function setAiLevel(lvl) {
    aiLevel = lvl;
    if (lvlEasyBtn) lvlEasyBtn.classList.toggle('active', lvl === 'easy');
    if (lvlMediumBtn) lvlMediumBtn.classList.toggle('active', lvl === 'medium');
    if (lvlHardBtn) lvlHardBtn.classList.toggle('active', lvl === 'hard');
}

function checkUrlForRoomJoin() {
    const urlParams = new URLSearchParams(window.location.search);
    const roomCode = urlParams.get('room');
    if (roomCode) {
        selectMode('online');
        if (roomInput) roomInput.value = roomCode;
        setTimeout(() => joinOnlineRoom(roomCode), 500);
    }
}

function selectSymbol(sym) {
    userSymbol = sym;
    aiSymbol = sym === 'X' ? 'O' : 'X';
    if (sym === 'X') {
        if (symXBtn) symXBtn.className = 'toggle-btn active-x';
        if (symOBtn) symOBtn.className = 'toggle-btn';
    } else {
        if (symXBtn) symXBtn.className = 'toggle-btn';
        if (symOBtn) symOBtn.className = 'toggle-btn active-o';
    }
}

function setRoomVisibility(isPublic) {
    isPublicRoom = isPublic;
    if (roomPublicBtn) roomPublicBtn.classList.toggle('active', isPublic);
    if (roomPrivateBtn) roomPrivateBtn.classList.toggle('active', !isPublic);
}

function selectMode(mode) {
    gameMode = mode;
    const btnPvp = document.getElementById('btn-pvp');
    const btnAi = document.getElementById('btn-ai');
    const btnOnline = document.getElementById('btn-online');

    if (btnPvp) btnPvp.classList.toggle('active', mode === 'pvp');
    if (btnAi) btnAi.classList.toggle('active', mode === 'ai');
    if (btnOnline) btnOnline.classList.toggle('active', mode === 'online');

    if (mode === 'online') {
        if (onlineOptions) onlineOptions.classList.remove('hidden');
        if (localOptions) localOptions.classList.add('hidden');
        if (aiLevelGroup) aiLevelGroup.classList.add('hidden');
        if (mainAiStats) mainAiStats.classList.add('hidden');
    } else {
        if (onlineOptions) onlineOptions.classList.add('hidden');
        if (localOptions) localOptions.classList.remove('hidden');
        if (mode === 'ai') {
            if (p2Input) { p2Input.value = 'Zenith'; p2Input.disabled = true; }
            if (aiLevelGroup) aiLevelGroup.classList.remove('hidden');
            if (mainAiStats) mainAiStats.classList.remove('hidden');
        } else {
            if (p2Input) { p2Input.value = 'اللاعب 2'; p2Input.disabled = false; }
            if (aiLevelGroup) aiLevelGroup.classList.add('hidden');
            if (mainAiStats) mainAiStats.classList.add('hidden');
        }
    }
}

function listenToPublicRooms() {
    db.ref('rooms').on('value', snapshot => {
        const roomsData = snapshot.val();
        if (!publicRoomsList) return;
        publicRoomsList.innerHTML = '';
        if (!roomsData) {
            publicRoomsList.innerHTML = '<div style="text-align: center; color: #888; font-size: 0.8rem;">لا توجد غرف عامة حالياً</div>';
            return;
        }

        let publicCount = 0;
        for (let roomId in roomsData) {
            const room = roomsData[roomId];
            const isFull = room.p2Name && room.p2Name !== 'في الانتظار...';
            
            if (room.isPublic && !isFull) {
                publicCount++;
                const roomEl = document.createElement('div');
                roomEl.className = 'room-item';
                roomEl.innerHTML = `
                    <div>
                        <strong>غرفة #${roomId}</strong>
                        <span style="font-size: 0.75rem; color: #aaa;">(${room.p1Name})</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span class="room-badge badge-open">1/2</span>
                        <button class="btn-join-sm" onclick="joinOnlineRoom('${roomId}')">انضمام</button>
                    </div>
                `;
                publicRoomsList.appendChild(roomEl);
            }
        }

        if (publicCount === 0) {
            publicRoomsList.innerHTML = '<div style="text-align: center; color: #888; font-size: 0.8rem;">لا توجد غرف عامة متاحة حالياً</div>';
        }
    });
}

function clearChatUI() {
    if (chatMessages) chatMessages.innerHTML = '';
    if (chatInput) chatInput.value = '';
}

function createOnlineRoom() {
    p1Name = p1Input ? (p1Input.value.trim() || 'الهوست') : 'الهوست';
    playerRole = 'p1';
    mySymbol = userSymbol;
    const guestSymbol = userSymbol === 'X' ? 'O' : 'X';

    currentRoomId = Math.floor(1000 + Math.random() * 9000).toString();
    clearChatUI();

    const roomRef = db.ref('rooms/' + currentRoomId);
    roomRef.onDisconnect().remove();

    roomRef.set({
        p1Name: p1Name,
        p2Name: 'في الانتظار...',
        p1Symbol: mySymbol,
        p2Symbol: guestSymbol,
        isPublic: isPublicRoom,
        boardState: ['', '', '', '', '', '', '', '', ''],
        currentPlayer: 'X',
        isGameActive: false,
        winner: null,
        scores: { p1: 0, p2: 0, ties: 0 },
        swapRequest: null
    });

    setupOnlineGameUI();
    listenToRoomUpdates();
}

function joinOnlineRoomByInput() {
    const code = roomInput ? roomInput.value.trim() : '';
    if (!code) { alert('أدخل رمز الغرفة!'); return; }
    joinOnlineRoom(code);
}

function joinOnlineRoom(code) {
    const roomRef = db.ref('rooms/' + code);
    roomRef.once('value', snapshot => {
        if (!snapshot.exists()) {
            alert('الغرفة غير موجودة أو تم إغلاقها!');
            return;
        }
        const data = snapshot.val();
        if (data.p2Name && data.p2Name !== 'في الانتظار...') {
            alert('الغرفة ممتلئة بالكامل!');
            return;
        }

        playerRole = 'p2';
        mySymbol = data.p2Symbol;
        p2Name = p1Input ? (p1Input.value.trim() || 'الضيف') : 'الضيف';
        currentRoomId = code;
        clearChatUI();

        db.ref('rooms/' + code + '/p2Name').onDisconnect().set('في الانتظار...');
        db.ref('rooms/' + code + '/isGameActive').onDisconnect().set(false);

        roomRef.update({
            p2Name: p2Name,
            isGameActive: true
        });

        setupOnlineGameUI();
        listenToRoomUpdates();
    });
}

function setupOnlineGameUI() {
    if (currentRoomCode) currentRoomCode.textContent = currentRoomId;
    if (roomDisplay) roomDisplay.classList.remove('hidden');
    if (btnShareRoom) btnShareRoom.classList.remove('hidden');
    if (btnSwapRequest) btnSwapRequest.classList.remove('hidden');
    if (timerBox) timerBox.classList.remove('hidden');
    if (chatContainer) chatContainer.classList.remove('hidden');
    
    if (setupScreen) setupScreen.classList.add('hidden');
    if (gameScreen) gameScreen.classList.remove('hidden');
}

function shareRoomLink() {
    const shareUrl = `${window.location.origin}${window.location.pathname}?room=${currentRoomId}`;
    if (navigator.share) {
        navigator.share({
            title: 'لعبة X-O أونلاين',
            text: `تعال العب معايا X-O في الغرفة #${currentRoomId}`,
            url: shareUrl
        });
    } else {
        navigator.clipboard.writeText(shareUrl);
        alert('تم نسخ رابط الغرفة بنجاح! أرسله لصديقك 🔗');
    }
}

function sendChatMessage() {
    const text = chatInput ? chatInput.value.trim() : '';
    if (!text || !currentRoomId) return;

    db.ref('rooms/' + currentRoomId + '/messages').push({
        sender: playerRole,
        name: (playerRole === 'p1' ? p1Name : p2Name),
        text: text,
        time: Date.now()
    });

    if (chatInput) chatInput.value = '';
}

function sendChatEmoji(emoji) {
    if (!currentRoomId) return;
    db.ref('rooms/' + currentRoomId + '/messages').push({
        sender: playerRole,
        name: (playerRole === 'p1' ? p1Name : p2Name),
        text: emoji,
        time: Date.now()
    });
}

function requestSymbolSwap() {
    if (!currentRoomId || !isGameActive) return;
    db.ref('rooms/' + currentRoomId + '/swapRequest').set({
        requestedBy: playerRole,
        status: 'pending'
    });
    alert('تم إرسال طلب تبديل الرموز إلى المنافس... ⏳');
}

function respondSwap(accept) {
    if (!currentRoomId) return;
    if (accept) {
        db.ref('rooms/' + currentRoomId).once('value', snapshot => {
            const data = snapshot.val();
            if (!data) return;
            
            db.ref('rooms/' + currentRoomId).update({
                p1Symbol: data.p2Symbol,
                p2Symbol: data.p1Symbol,
                swapRequest: { status: 'accepted' }
            });
        });
    } else {
        db.ref('rooms/' + currentRoomId + '/swapRequest').update({
            status: 'rejected'
        });
    }
    if (swapBanner) swapBanner.classList.add('hidden');
}

function listenToRoomUpdates() {
    db.ref('rooms/' + currentRoomId).on('value', snapshot => {
        const data = snapshot.val();
        
        if (!data) {
            alert('تم إغلاق الغرفة أو غادر الهوست المباراة! 🚪');
            stopTurnTimer();
            backToMenu();
            return;
        }

        if (playerRole === 'p2' && data.p2Name === 'في الانتظار...') {
            playerRole = 'p1';
            mySymbol = data.p1Symbol;
            alert('👑 أصبحت الآن الهوست الجديد للغرفة بعد مغادرة اللاعب الأول!');
        }

        p1Name = data.p1Name || 'الهوست';
        p2Name = data.p2Name || 'في الانتظار...';
        boardState = data.boardState || ['', '', '', '', '', '', '', '', ''];
        currentPlayer = data.currentPlayer;
        isGameActive = data.isGameActive;
        scores = data.scores || { p1: 0, p2: 0, ties: 0 };

        mySymbol = playerRole === 'p1' ? data.p1Symbol : data.p2Symbol;

        if (nameP1Display) nameP1Display.textContent = `${p1Name} (${data.p1Symbol})`;
        if (nameP2Display) nameP2Display.textContent = p2Name !== 'في الانتظار...' ? `${p2Name} (${data.p2Symbol})` : p2Name;
        updateScoreUI();

        if (data.messages && chatMessages) {
            chatMessages.innerHTML = '';
            const msgsArray = Object.values(data.messages).slice(-6);
            msgsArray.forEach(m => {
                const msgDiv = document.createElement('div');
                msgDiv.className = 'chat-msg' + (m.sender === playerRole ? ' me' : '');
                msgDiv.textContent = `${m.name}: ${m.text}`;
                chatMessages.appendChild(msgDiv);
            });
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }

        if (data.swapRequest) {
            if (data.swapRequest.status === 'pending') {
                if (data.swapRequest.requestedBy !== playerRole && swapBanner) {
                    swapBanner.classList.remove('hidden');
                }
            } else if (data.swapRequest.status === 'rejected') {
                if (data.swapRequest.requestedBy === playerRole) {
                    alert('تم رفض طلب تبديل الرموز من المنافس ❌');
                    db.ref('rooms/' + currentRoomId + '/swapRequest').remove();
                }
                if (swapBanner) swapBanner.classList.add('hidden');
            } else if (data.swapRequest.status === 'accepted') {
                if (data.swapRequest.requestedBy === playerRole) {
                    alert('تم قبول طلب تبديل الرموز بنجاح 🟢');
                    db.ref('rooms/' + currentRoomId + '/swapRequest').remove();
                }
                if (swapBanner) swapBanner.classList.add('hidden');
            }
        } else {
            if (swapBanner) swapBanner.classList.add('hidden');
        }

        cells.forEach((cell, idx) => {
            cell.textContent = boardState[idx];
            cell.className = 'cell ' + boardState[idx].toLowerCase();
        });

        if (data.winner) {
            stopTurnTimer();
            if (data.winner === 'tie') {
                if (statusText) statusText.textContent = '🤝 تعادل! بداية جولة جديدة خلال 3 ثوانٍ...';
            } else {
                const winnerSymbol = data.winner;
                const winnerName = (winnerSymbol === data.p1Symbol) ? p1Name : p2Name;
                if (statusText) statusText.textContent = `🎉 الفائز هو ${winnerName}! جولة جديدة خلال 3 ثوانٍ...`;

                if (winnerSymbol === mySymbol) {
                    playSound('win');
                    triggerConfetti();
                }
            }
            if (data.winIndex !== undefined && data.winIndex !== null) {
                drawWinningLine(data.winIndex);
            }

            if (playerRole === 'p1' && !autoRestartTimer) {
                autoRestartTimer = setTimeout(() => {
                    autoRestartTimer = null;
                    restartGame();
                }, 3000);
            }
        } else {
            if (autoRestartTimer) {
                clearTimeout(autoRestartTimer);
                autoRestartTimer = null;
            }
            if (winningLine) winningLine.style.opacity = '0';
            if (!isGameActive && gameMode === 'online') {
                stopTurnTimer();
                if (statusText) statusText.textContent = 'في انتظار انضمام اللاعب الثاني... ⏳';
            } else {
                updateTurnUI();
                startTurnTimer();
            }
        }
    });
}

function startTurnTimer() {
    stopTurnTimer();
    timeLeft = 15;
    if (timerCountDisplay) timerCountDisplay.textContent = timeLeft;

    turnTimerInterval = setInterval(() => {
        timeLeft--;
        if (timerCountDisplay) timerCountDisplay.textContent = timeLeft;

        if (timeLeft <= 0) {
            stopTurnTimer();
            handleTimeout();
        }
    }, 1000);
}

function stopTurnTimer() {
    if (turnTimerInterval) {
        clearInterval(turnTimerInterval);
        turnTimerInterval = null;
    }
}

function handleTimeout() {
    if (!isGameActive || gameMode !== 'online') return;

    if (currentPlayer === mySymbol) {
        playSound('kick');
        alert('تم طردك بسبب الخمول وعدم اللعب في الوقت المحدد! ⏱️');

        if (playerRole === 'p1') {
            db.ref('rooms/' + currentRoomId).once('value', snapshot => {
                const data = snapshot.val();
                if (data && data.p2Name && data.p2Name !== 'في الانتظار...') {
                    db.ref('rooms/' + currentRoomId).update({
                        p1Name: data.p2Name,
                        p1Symbol: data.p2Symbol,
                        p2Name: 'في الانتظار...',
                        p2Symbol: data.p1Symbol,
                        isGameActive: false,
                        currentPlayer: 'X',
                        boardState: ['', '', '', '', '', '', '', '', ''],
                        swapRequest: null
                    });
                } else {
                    db.ref('rooms/' + currentRoomId).remove();
                }
                backToMenu();
            });
        } else {
            db.ref('rooms/' + currentRoomId).update({
                p2Name: 'في الانتظار...',
                isGameActive: false,
                boardState: ['', '', '', '', '', '', '', '', ''],
                swapRequest: null
            });
            backToMenu();
        }
    }
}

function startGame() {
    p1Name = p1Input ? (p1Input.value.trim() || 'اللاعب 1') : 'اللاعب 1';
    mySymbol = userSymbol;
    aiSymbol = userSymbol === 'X' ? 'O' : 'X';
    p2Name = p2Input ? (p2Input.value.trim() || (gameMode === 'ai' ? 'Zenith' : 'اللاعب 2')) : 'اللاعب 2';

    if (nameP1Display) nameP1Display.textContent = `${p1Name} (${mySymbol})`;
    if (nameP2Display) nameP2Display.textContent = `${p2Name} (${aiSymbol})`;

    scores = { p1: 0, p2: 0, ties: 0 };
    currentAiStreak = 0;
    updateScoreUI();

    if (roomDisplay) roomDisplay.classList.add('hidden');
    if (btnShareRoom) btnShareRoom.classList.add('hidden');
    if (btnSwapRequest) btnSwapRequest.classList.add('hidden');
    if (timerBox) timerBox.classList.add('hidden');
    if (chatContainer) chatContainer.classList.add('hidden');

    if (setupScreen) setupScreen.classList.add('hidden');
    if (gameScreen) gameScreen.classList.remove('hidden');

    restartGame();
}

function backToMenu() {
    stopTurnTimer();
    if (autoRestartTimer) {
        clearTimeout(autoRestartTimer);
        autoRestartTimer = null;
    }
    if (currentRoomId && gameMode === 'online') {
        const roomRef = db.ref('rooms/' + currentRoomId);
        roomRef.off();

        if (playerRole === 'p1') {
            roomRef.once('value', snapshot => {
                const data = snapshot.val();
                if (data && data.p2Name && data.p2Name !== 'في الانتظار...') {
                    roomRef.update({
                        p1Name: data.p2Name,
                        p1Symbol: data.p2Symbol,
                        p2Name: 'في الانتظار...',
                        p2Symbol: data.p1Symbol,
                        isGameActive: false,
                        boardState: ['', '', '', '', '', '', '', '', ''],
                        swapRequest: null
                    });
                } else {
                    roomRef.remove();
                }
            });
        } else {
            roomRef.update({
                p2Name: 'في الانتظار...',
                isGameActive: false
            });
        }
        currentRoomId = null;
    }
    if (gameScreen) gameScreen.classList.add('hidden');
    if (setupScreen) setupScreen.classList.remove('hidden');
}

cells.forEach(cell => cell.addEventListener('click', handleCellClick));

function handleCellClick(e) {
    const index = e.target.getAttribute('data-index');

    if (boardState[index] !== '' || !isGameActive) return;

    playSound('click');

    if (gameMode === 'online') {
        if (currentPlayer !== mySymbol) return;
        
        boardState[index] = mySymbol;
        checkOnlineResult(index);
    } else {
        makeMove(index, currentPlayer);

        if (isGameActive && gameMode === 'ai' && currentPlayer === aiSymbol) {
            isGameActive = false;
            setTimeout(makeAiMove, 350);
        }
    }
}

function makeMove(index, player) {
    boardState[index] = player;
    const cell = cells[index];
    cell.textContent = player;
    cell.classList.add(player.toLowerCase());

    checkResult();
}

function checkOnlineResult(lastIndex) {
    let roundWon = false;
    let winIndex = -1;

    for (let i = 0; i < winConditions.length; i++) {
        const [a, b, c] = winConditions[i];
        if (boardState[a] && boardState[a] === boardState[b] && boardState[a] === boardState[c]) {
            roundWon = true;
            winIndex = i;
            break;
        }
    }

    let nextPlayer = currentPlayer === 'X' ? 'O' : 'X';
    let updates = {
        boardState: boardState,
        currentPlayer: nextPlayer
    };

    if (roundWon) {
        updates.winner = currentPlayer;
        updates.winIndex = winIndex;
        updates.isGameActive = false;
        
        if (playerRole === 'p1') {
            if (currentPlayer === mySymbol) scores.p1++; else scores.p2++;
        } else {
            if (currentPlayer === mySymbol) scores.p2++; else scores.p1++;
        }
        
        updates.scores = scores;
    } else if (!boardState.includes('')) {
        scores.ties++;
        updates.winner = 'tie';
        updates.isGameActive = false;
        updates.scores = scores;
    }

    db.ref('rooms/' + currentRoomId).update(updates);
}

function makeAiMove() {
    let move = -1;
    if (aiLevel === 'easy') {
        move = getRandomAiMove();
    } else if (aiLevel === 'medium') {
        move = Math.random() > 0.5 ? getBestAiMove() : getRandomAiMove();
    } else {
        move = getBestAiMove();
    }

    isGameActive = true;
    makeMove(move, aiSymbol);
}

function getRandomAiMove() {
    const available = [];
    for (let i = 0; i < 9; i++) {
        if (boardState[i] === '') available.push(i);
    }
    return available[Math.floor(Math.random() * available.length)];
}

function getBestAiMove() {
    let bestScore = -Infinity;
    let move = -1;
    for (let i = 0; i < 9; i++) {
        if (boardState[i] === '') {
            boardState[i] = aiSymbol;
            let score = minimax(boardState, 0, false);
            boardState[i] = '';
            if (score > bestScore) {
                bestScore = score;
                move = i;
            }
        }
    }
    return move;
}

function minimax(board, depth, isMaximizing) {
    let result = evaluateBoard(board);
    if (result === aiSymbol) return 10 - depth;
    if (result === userSymbol) return depth - 10;
    if (result === 'tie') return 0;

    if (isMaximizing) {
        let bestScore = -Infinity;
        for (let i = 0; i < 9; i++) {
            if (board[i] === '') {
                board[i] = aiSymbol;
                let score = minimax(board, depth + 1, false);
                board[i] = '';
                bestScore = Math.max(score, bestScore);
            }
        }
        return bestScore;
    } else {
        let bestScore = Infinity;
        for (let i = 0; i < 9; i++) {
            if (board[i] === '') {
                board[i] = userSymbol;
                let score = minimax(board, depth + 1, true);
                board[i] = '';
                bestScore = Math.min(score, bestScore);
            }
        }
        return bestScore;
    }
}

function evaluateBoard(board) {
    for (let i = 0; i < winConditions.length; i++) {
        const [a, b, c] = winConditions[i];
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            return board[a];
        }
    }
    if (!board.includes('')) return 'tie';
    return null;
}

function checkResult() {
    let roundWon = false;
    let winIndex = -1;

    for (let i = 0; i < winConditions.length; i++) {
        const [a, b, c] = winConditions[i];
        if (boardState[a] && boardState[a] === boardState[b] && boardState[a] === boardState[c]) {
            roundWon = true;
            winIndex = i;
            break;
        }
    }

    if (roundWon) {
        const winnerName = currentPlayer === userSymbol ? p1Name : p2Name;
        if (statusText) statusText.textContent = `🎉 الفائز هو ${winnerName}! جولة جديدة خلال 3 ثوانٍ...`;
        drawWinningLine(winIndex);

        if (currentPlayer === userSymbol) {
            playSound('win');
            triggerConfetti();
            scores.p1++;
            if (gameMode === 'ai') {
                currentAiStreak++;
                saveAiStatForCurrentLevel(p1Name, currentAiStreak);
            }
        } else {
            scores.p2++;
            if (gameMode === 'ai') currentAiStreak = 0;
        }

        updateScoreUI();
        isGameActive = false;

        setTimeout(restartGame, 3000);
        return;
    }

    if (!boardState.includes('')) {
        if (statusText) statusText.textContent = '🤝 تعادل! جولة جديدة خلال 3 ثوانٍ...';
        scores.ties++;
        if (gameMode === 'ai') currentAiStreak = 0;
        updateScoreUI();
        isGameActive = false;

        setTimeout(restartGame, 3000);
        return;
    }

    currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
    updateTurnUI();
}

function updateTurnUI() {
    if (gameMode === 'online') {
        if (statusText) statusText.textContent = (currentPlayer === mySymbol) ? 'دورك الآن 🎯' : 'دور المنافس ⏳';
        if (currentPlayer === mySymbol) {
            if (boxP1) boxP1.classList.toggle('active', playerRole === 'p1');
            if (boxP2) boxP2.classList.toggle('active', playerRole === 'p2');
        } else {
            if (boxP1) boxP1.classList.toggle('active', playerRole === 'p2');
            if (boxP2) boxP2.classList.toggle('active', playerRole === 'p1');
        }
    } else {
        if (currentPlayer === userSymbol) {
            if (statusText) statusText.textContent = `دور: ${p1Name}`;
            if (boxP1) boxP1.classList.add('active');
            if (boxP2) boxP2.classList.remove('active');
        } else {
            if (statusText) statusText.textContent = `دور: ${p2Name}`;
            if (boxP2) boxP2.classList.add('active');
            if (boxP1) boxP1.classList.remove('active');
        }
    }
}

function updateScoreUI() {
    if (scoreP1Display) scoreP1Display.textContent = scores.p1;
    if (scoreP2Display) scoreP2Display.textContent = scores.p2;
    if (scoreTiesDisplay) scoreTiesDisplay.textContent = scores.ties;
}

function drawWinningLine(index) {
    if (!winningLine) return;
    const coords = lineCoords[index];
    winningLine.setAttribute('x1', coords.x1);
    winningLine.setAttribute('y1', coords.y1);
    winningLine.setAttribute('x2', coords.x2);
    winningLine.setAttribute('y2', coords.y2);
    winningLine.style.opacity = '1';
}

function restartGame() {
    if (gameMode === 'online') {
        if (currentRoomId) {
            db.ref('rooms/' + currentRoomId).update({
                boardState: ['', '', '', '', '', '', '', '', ''],
                currentPlayer: 'X',
                isGameActive: true,
                winner: null,
                winIndex: null,
                swapRequest: null
            });
        }
    } else {
        boardState = ['', '', '', '', '', '', '', '', ''];
        currentPlayer = 'X';
        isGameActive = true;
        if (winningLine) winningLine.style.opacity = '0';

        cells.forEach(cell => {
            cell.textContent = '';
            cell.classList.remove('x', 'o');
        });

        updateTurnUI();

        if (gameMode === 'ai' && aiSymbol === 'X') {
            isGameActive = false;
            setTimeout(makeAiMove, 350);
        }
    }
}
