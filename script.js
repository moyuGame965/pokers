// 游戏状态
const gameState = {
    playerMoney: 1000,
    playerLevel: "新手",
    playerExp: 0,
    currentBet: 0,
    pot: 0,
    gameStage: 'idle', // idle, preflop, flop, turn, river, showdown
    playerCards: [],
    communityCards: [],
    opponents: [],
    currentPlayer: 0,
    smallBlind: 10,  // 提高盲注，增加游戏紧张感
    bigBlind: 20,    // 提高盲注，增加游戏紧张感
    minRaise: 20,    // 提高最小加注，使游戏更有策略性
    roundBets: {},
    winStreak: 0,    // 记录连胜次数
    loseStreak: 0,   // 记录连败次数
    handsPlayed: 0,   // 记录已玩局数
    showTooltips: true, // 是否显示操作提示
    currentAction: null, // 当前推荐操作
    gameStats: {     // 游戏统计数据
        totalWins: 0,
        totalLosses: 0,
        highestWin: 0,
        maxMoney: 1000,
        totalHands: 0,
        bankruptcies: 0,
        lastSaved: null
    }
};

// 成就系统
const achievements = [
    { id: 'first_win', name: '首次获胜', description: '赢得你的第一局游戏', unlocked: false, icon: '🏆' },
    { id: 'high_roller', name: '豪客', description: '单局赢得超过500筹码', unlocked: false, icon: '💰' },
    { id: 'comeback_kid', name: '东山再起', description: '从少于起始筹码的一半到翻倍', unlocked: false, icon: '🔄' },
    { id: 'bluffer', name: '诈唬大师', description: '成功诈唬对手5次', unlocked: false, icon: '🎭' },
    { id: 'royal_flush', name: '皇家同花顺', description: '获得皇家同花顺', unlocked: false, icon: '👑' },
    { id: 'millionaire', name: '百万富翁', description: '拥有超过10000筹码', unlocked: false, icon: '💎' },
    { id: 'survivor', name: '幸存者', description: '连续赢得5局游戏', unlocked: false, icon: '🛡️' }
];

// 随机事件
const randomEvents = [
    { 
        id: 'lucky_card', 
        name: '幸运牌', 
        description: '你发现了一张幸运扑克牌！获得100筹码。', 
        effect: () => { updatePlayerMoney(100); }
    },
    { 
        id: 'card_shark', 
        name: '扑克高手', 
        description: '一位扑克高手向你挑战，你从他那里学到了一些技巧。下一轮你将获得额外信息。', 
        effect: () => { gameState.extraInfo = true; }
    },
    { 
        id: 'casino_night', 
        name: '赌场之夜', 
        description: '赌场举办特别活动！本局底池加倍。', 
        effect: () => { gameState.pot *= 2; updateUI(); }
    },
    { 
        id: 'drunk_opponent', 
        name: '醉酒的对手', 
        description: '一名对手喝醉了，他的所有决定变得随机且激进。', 
        effect: () => { makeOpponentDrunk(Math.floor(Math.random() * gameState.opponents.length)); }
    },
    { 
        id: 'betting_limit', 
        name: '下注限制', 
        description: '赌场临时实施下注限制，本局最大加注为50。', 
        effect: () => { gameState.maxBet = 50; }
    },
    { 
        id: 'thief', 
        name: '扒手', 
        description: '一个扒手偷走了你的一些筹码！损失50筹码。', 
        effect: () => { updatePlayerMoney(-50); }
    },
    { 
        id: 'generous_player', 
        name: '慷慨的玩家', 
        description: '一位慷慨的玩家给了你一些小费。获得30筹码。', 
        effect: () => { updatePlayerMoney(30); }
    }
];

// 经验和等级系统
const levels = [
    { name: "新手", expRequired: 0 },
    { name: "初学者", expRequired: 100 },
    { name: "业余爱好者", expRequired: 300 },
    { name: "熟练玩家", expRequired: 600 },
    { name: "专业玩家", expRequired: 1000 },
    { name: "扑克大师", expRequired: 1500 },
    { name: "传奇玩家", expRequired: 2500 }
];

// 扑克牌相关
const suits = ['♥', '♦', '♠', '♣'];
const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
const suitClasses = {
    '♥': 'heart',
    '♦': 'diamond',
    '♠': 'spade',
    '♣': 'club'
};

// 对手性格特征和风格
const opponentTraits = {
    '保守型': {
        foldThreshold: 0.4,    // 低于此强度时倾向弃牌
        callThreshold: 0.7,    // 低于此强度时倾向跟注
        raiseThreshold: 0.85,  // 高于此强度时倾向加注
        bluffChance: 0.1,      // 诈唬概率
        adaptability: 0.2,     // 适应性，越高越会根据局势调整策略
        raiseSizeFactor: 0.8   // 加注金额因子，越高则加注越多
    },
    '激进型': {
        foldThreshold: 0.25,   // 更低的弃牌阈值
        callThreshold: 0.5,    // 更低的跟注阈值
        raiseThreshold: 0.65,  // 更低的加注阈值
        bluffChance: 0.35,     // 更高的诈唬概率
        adaptability: 0.4,     // 较高的适应性
        raiseSizeFactor: 1.5   // 更高的加注金额
    },
    '均衡型': {
        foldThreshold: 0.35,   // 中等弃牌阈值
        callThreshold: 0.6,    // 中等跟注阈值
        raiseThreshold: 0.75,  // 中等加注阈值
        bluffChance: 0.2,      // 中等诈唬概率
        adaptability: 0.5,     // 高适应性
        raiseSizeFactor: 1.2   // 中等加注金额
    },
    '紧凶型': {
        foldThreshold: 0.45,   // 高弃牌阈值
        callThreshold: 0.7,    // 高跟注阈值
        raiseThreshold: 0.8,   // 高加注阈值
        bluffChance: 0.25,     // 偶尔诈唬
        adaptability: 0.3,     // 中等适应性
        raiseSizeFactor: 2.0   // 很高的加注金额
    },
    '松弱型': {
        foldThreshold: 0.2,    // 很低的弃牌阈值
        callThreshold: 0.4,    // 很低的跟注阈值
        raiseThreshold: 0.7,   // 中等加注阈值
        bluffChance: 0.4,      // 高诈唬概率
        adaptability: 0.2,     // 低适应性
        raiseSizeFactor: 0.7   // 低加注金额
    }
};

// DOM 元素
const playerMoneyEl = document.getElementById('player-money');
const playerLevelEl = document.getElementById('player-level');
const playerCardsEl = document.getElementById('player-cards');
const communityCardsEl = document.getElementById('community-cards-container');
const potAmountEl = document.getElementById('pot-amount');
const opponentsContainerEl = document.getElementById('opponents-container');
const gameMessageEl = document.getElementById('game-message');
const eventsLogEl = document.getElementById('events-log');
const achievementsListEl = document.getElementById('achievements-list');
const startGameBtn = document.getElementById('start-game');
const foldBtn = document.getElementById('fold');
const checkBtn = document.getElementById('check');
const callBtn = document.getElementById('call');
const raiseBtn = document.getElementById('raise');
const raiseAmountInput = document.getElementById('raise-amount');
const raiseValueEl = document.getElementById('raise-value');
const randomEventModal = document.getElementById('random-event-modal');
const randomEventDescription = document.getElementById('random-event-description');
const acceptEventBtn = document.getElementById('accept-event');
const helpButton = document.getElementById('help-button');
const rulesModal = document.getElementById('rules-modal');
const closeRulesBtn = document.getElementById('close-rules');
const actionTooltip = document.getElementById('action-tooltip');
const notificationEl = document.createElement('div');
notificationEl.className = 'notification';
document.body.appendChild(notificationEl);

// 初始化
function init() {
    // 加载保存的游戏数据
    loadGameData();
    
    displayAchievements();
    updateUI();

    // 事件监听器
    startGameBtn.addEventListener('click', startGame);
    foldBtn.addEventListener('click', playerFold);
    checkBtn.addEventListener('click', playerCheck);
    callBtn.addEventListener('click', playerCall);
    raiseBtn.addEventListener('click', playerRaise);
    acceptEventBtn.addEventListener('click', closeRandomEventModal);
    
    raiseAmountInput.addEventListener('input', () => {
        raiseValueEl.textContent = raiseAmountInput.value;
    });

    // 规则模态框
    helpButton.addEventListener('click', showRulesModal);
    closeRulesBtn.addEventListener('click', hideRulesModal);

    // 按钮提示
    setupActionButtonTooltips();

    // 记录游戏开始事件
    logEvent('欢迎来到德州扑克游戏！');
    showNotification('欢迎来到德州扑克游戏！', 'info');
    
    // 检查破产状态
    checkBankruptcy();
    
    setTimeout(showRulesModal, 500); // 游戏加载后显示规则
    
    // 设置自动保存
    setInterval(saveGameData, 30000); // 每30秒自动保存一次
}

// 加载游戏数据
function loadGameData() {
    try {
        const savedData = localStorage.getItem('pokerGameData');
        if (savedData) {
            const data = JSON.parse(savedData);
            
            // 恢复主要游戏状态
            gameState.playerMoney = data.playerMoney || 1000;
            gameState.playerLevel = data.playerLevel || "新手";
            gameState.playerExp = data.playerExp || 0;
            gameState.winStreak = data.winStreak || 0;
            gameState.loseStreak = data.loseStreak || 0;
            gameState.handsPlayed = data.handsPlayed || 0;
            
            // 恢复游戏统计数据
            if (data.gameStats) {
                gameState.gameStats = data.gameStats;
            }
            
            // 恢复成就
            if (data.achievements) {
                data.achievements.forEach(achievementId => {
                    const achievement = achievements.find(a => a.id === achievementId);
                    if (achievement) {
                        achievement.unlocked = true;
                    }
                });
            }
            
            logEvent('游戏数据已加载');
            showNotification('游戏数据已恢复', 'info');
        }
    } catch (e) {
        console.error('加载游戏数据失败', e);
        logEvent('加载游戏数据失败');
    }
}

// 保存游戏数据
function saveGameData() {
    try {
        // 获取已解锁的成就ID
        const unlockedAchievements = achievements
            .filter(a => a.unlocked)
            .map(a => a.id);
        
        // 更新最后保存时间
        gameState.gameStats.lastSaved = new Date().toISOString();
        
        // 创建要保存的数据对象
        const dataToSave = {
            playerMoney: gameState.playerMoney,
            playerLevel: gameState.playerLevel,
            playerExp: gameState.playerExp,
            winStreak: gameState.winStreak,
            loseStreak: gameState.loseStreak,
            handsPlayed: gameState.handsPlayed,
            gameStats: gameState.gameStats,
            achievements: unlockedAchievements
        };
        
        localStorage.setItem('pokerGameData', JSON.stringify(dataToSave));
        console.log('游戏数据已保存');
    } catch (e) {
        console.error('保存游戏数据失败', e);
    }
}

// 检查破产状态
function checkBankruptcy() {
    if (gameState.playerMoney <= 0) {
        gameState.gameStats.bankruptcies++;
        showNotification('你已破产！游戏将重新开始', 'error');
        logEvent('破产！游戏重新开始');
        
        // 显示破产消息
        const bankruptcyModal = document.createElement('div');
        bankruptcyModal.className = 'modal';
        bankruptcyModal.style.display = 'flex';
        bankruptcyModal.innerHTML = `
            <div class="modal-content">
                <h2>破产</h2>
                <p>你的资金已耗尽，无法继续游戏。</p>
                <p>这是你第 ${gameState.gameStats.bankruptcies} 次破产。</p>
                <p>游戏将重新开始，但你的成就和经验将保留。</p>
                <button id="restart-game">重新开始</button>
            </div>
        `;
        document.body.appendChild(bankruptcyModal);
        
        document.getElementById('restart-game').addEventListener('click', () => {
            // 恢复初始资金，保留等级和成就
            gameState.playerMoney = 1000;
            document.body.removeChild(bankruptcyModal);
            saveGameData();
            updateUI();
        });
    }
}

// 显示通知消息
function showNotification(message, type = 'info') {
    notificationEl.textContent = message;
    notificationEl.className = `notification ${type}`;
    notificationEl.style.display = 'block';
    notificationEl.style.opacity = '1';
    
    // 淡出效果
    setTimeout(() => {
        notificationEl.style.opacity = '0';
        setTimeout(() => {
            notificationEl.style.display = 'none';
        }, 500);
    }, 3000);
}

// 显示规则模态框
function showRulesModal() {
    rulesModal.style.display = 'flex';
}

// 隐藏规则模态框
function hideRulesModal() {
    rulesModal.style.display = 'none';
}

// 设置操作按钮的工具提示
function setupActionButtonTooltips() {
    const actionButtons = [foldBtn, checkBtn, callBtn, raiseBtn];
    
    actionButtons.forEach(button => {
        button.addEventListener('mouseenter', (e) => {
            // 如果按钮被禁用，不显示动态提示
            if (button.disabled) return;
            
            const rect = button.getBoundingClientRect();
            let tooltipText = '';
            
            // 根据不同按钮设置不同提示内容
            switch(button.id) {
                case 'fold':
                    tooltipText = getActionTooltip('fold');
                    break;
                case 'check':
                    tooltipText = getActionTooltip('check');
                    break;
                case 'call':
                    const callAmount = getCurrentMaxBet() - (gameState.roundBets['player'] || 0);
                    tooltipText = getActionTooltip('call', callAmount);
                    break;
                case 'raise':
                    tooltipText = getActionTooltip('raise');
                    break;
            }
            
            showActionTooltip(tooltipText, rect.left + rect.width/2, rect.bottom + 10);
        });
        
        button.addEventListener('mouseleave', () => {
            hideActionTooltip();
        });
    });
}

// 获取操作提示文本
function getActionTooltip(action, amount = 0) {
    const handStrength = calculateHandStrength(gameState.playerCards, gameState.communityCards);
    const potOdds = amount > 0 ? amount / (gameState.pot + amount) : 0;
    
    switch(action) {
        case 'fold':
            if (handStrength < 0.3) {
                return '你的手牌较弱，弃牌可能是明智的选择';
            } else if (handStrength < 0.5) {
                return '手牌一般，视情况考虑弃牌或继续';
            } else {
                return '手牌较强，不建议弃牌';
            }
        
        case 'check':
            if (handStrength < 0.4) {
                return '手牌较弱，看牌是安全的选择';
            } else if (handStrength < 0.6) {
                return '手牌一般，看牌等待更多信息';
            } else {
                return '手牌强度好，可以考虑加注而不是看牌';
            }
            
        case 'call':
            if (potOdds > 0.5 && handStrength < 0.4) {
                return `跟注需要${amount}筹码，底池赔率不好，谨慎跟注`;
            } else if (handStrength > 0.6) {
                return `手牌强度好，跟注${amount}筹码是合理的`;
            } else {
                return `跟注${amount}筹码，底池赔率适中`;
            }
            
        case 'raise':
            if (handStrength < 0.5) {
                return '手牌强度不足，加注有风险';
            } else if (handStrength < 0.7) {
                return '手牌一般，适量加注试探对手';
            } else {
                return '手牌强度好，可以积极加注';
            }
    }
    
    return '';
}

// 显示动态操作提示
function showActionTooltip(text, x, y) {
    if (!gameState.showTooltips || !text) return;
    
    actionTooltip.textContent = text;
    actionTooltip.style.left = `${x}px`;
    actionTooltip.style.top = `${y}px`;
    actionTooltip.style.opacity = '1';
}

// 隐藏动态操作提示
function hideActionTooltip() {
    actionTooltip.style.opacity = '0';
}

// 推荐最佳操作
function suggestBestAction() {
    if (!gameState.showTooltips) return;
    
    // 移除之前的高亮
    [foldBtn, checkBtn, callBtn, raiseBtn].forEach(btn => {
        btn.classList.remove('action-highlight');
    });
    
    const handStrength = calculateHandStrength(gameState.playerCards, gameState.communityCards);
    const currentMaxBet = getCurrentMaxBet();
    const playerCurrentBet = gameState.roundBets['player'] || 0;
    const callAmount = currentMaxBet - playerCurrentBet;
    
    // 确定建议操作
    let suggestedAction = null;
    
    if (callAmount === 0) {
        // 没人下注时
        if (handStrength < 0.4) {
            suggestedAction = 'check';
        } else {
            suggestedAction = 'raise';
        }
    } else {
        // 有人下注时
        if (handStrength < 0.3) {
            suggestedAction = 'fold';
        } else if (handStrength < 0.6) {
            suggestedAction = 'call';
        } else {
            suggestedAction = 'raise';
        }
    }
    
    // 高亮推荐操作按钮
    switch(suggestedAction) {
        case 'fold':
            if (!foldBtn.disabled) foldBtn.classList.add('action-highlight');
            break;
        case 'check':
            if (!checkBtn.disabled) checkBtn.classList.add('action-highlight');
            break;
        case 'call':
            if (!callBtn.disabled) callBtn.classList.add('action-highlight');
            break;
        case 'raise':
            if (!raiseBtn.disabled) raiseBtn.classList.add('action-highlight');
            break;
    }
    
    gameState.currentAction = suggestedAction;
}

// 开始新游戏
function startGame() {
    resetGameState();
    createDeck();
    dealCards();
    setupOpponents();
    startRound();
    
    // 更新游戏统计
    gameState.gameStats.totalHands++;
    
    // 随机触发事件 (20%几率)
    if (Math.random() < 0.2) {
        triggerRandomEvent();
    }
    
    saveGameData();
}

// 重置游戏状态
function resetGameState() {
    gameState.gameStage = 'preflop';
    gameState.playerCards = [];
    gameState.communityCards = [];
    gameState.pot = 0;
    gameState.currentBet = gameState.bigBlind;
    gameState.currentPlayer = 0;
    gameState.roundBets = {};
    gameState.maxBet = Infinity;
    gameState.extraInfo = false;
    
    // 清除上一局对手的行动指示器和状态
    document.querySelectorAll('.action-indicator, .hand-info').forEach(el => el.remove());
    
    // 重置对手卡牌显示
    document.querySelectorAll('.opponent-card').forEach(card => {
        card.className = 'opponent-card';
        card.innerHTML = '';
    });
    
    // 根据玩家经验动态调整游戏难度
    adjustGameDifficulty();
    
    // 更新UI
    updateUI();
    setActionButtonsState(false);
    startGameBtn.disabled = true;
}

// 动态调整游戏难度
function adjustGameDifficulty() {
    // 根据玩家等级和胜率调整盲注和AI行为
    const playerLevel = levels.findIndex(level => level.name === gameState.playerLevel);
    
    // 计算胜率
    const totalHands = gameState.handsPlayed || 1;
    const winRate = gameState.winStreak / totalHands;
    
    // 调整盲注（随着等级提高）
    const baseSmallBlind = 10;
    const baseBigBlind = 20;
    const levelMultiplier = 1 + (playerLevel * 0.1);
    
    gameState.smallBlind = Math.max(Math.floor(baseSmallBlind * levelMultiplier), 5);
    gameState.bigBlind = Math.max(Math.floor(baseBigBlind * levelMultiplier), 10);
    gameState.minRaise = Math.max(Math.floor(gameState.bigBlind), 10);
    
    // 如果玩家连胜，增加对手初始资金
    if (gameState.winStreak >= 3) {
        gameState.opponentStartingMoney = 1000 + (gameState.winStreak * 100);
    } else {
        gameState.opponentStartingMoney = 1000;
    }
}

// 创建一副新牌
function createDeck() {
    gameState.deck = [];
    for (let suit of suits) {
        for (let value of values) {
            gameState.deck.push({ suit, value });
        }
    }
    shuffleDeck();
}

// 洗牌
function shuffleDeck() {
    for (let i = gameState.deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [gameState.deck[i], gameState.deck[j]] = [gameState.deck[j], gameState.deck[i]];
    }
}

// 发牌
function dealCards() {
    // 发给玩家两张牌
    gameState.playerCards = [drawCard(), drawCard()];
    
    // 清空并展示玩家的牌
    displayPlayerCards();
}

// 抽一张牌
function drawCard() {
    return gameState.deck.pop();
}

// 显示玩家的牌
function displayPlayerCards() {
    playerCardsEl.innerHTML = '';
    gameState.playerCards.forEach(card => {
        const cardEl = document.createElement('div');
        cardEl.className = `card ${suitClasses[card.suit]}`;
        cardEl.setAttribute('data-value', card.value);
        cardEl.setAttribute('data-suit', card.suit);
        playerCardsEl.appendChild(cardEl);
    });
}

// 设置对手
function setupOpponents() {
    gameState.opponents = [];
    opponentsContainerEl.innerHTML = '';
    
    // 创建对手时加入更多类型
    const opponentNames = ['张三', '李四', '王五'];
    
    // 根据玩家等级和游戏进程动态选择对手类型
    let opponentTypes;
    
    if (gameState.playerLevel === "新手" || gameState.playerLevel === "初学者") {
        // 对新手友好的对手组合
        opponentTypes = ['松弱型', '均衡型', '保守型'];
    } else if (gameState.winStreak >= 3) {
        // 如果玩家连胜，提供更具挑战性的对手
        opponentTypes = ['激进型', '紧凶型', '均衡型'];
    } else {
        // 混合对手类型
        opponentTypes = ['保守型', '激进型', '均衡型'];
    }
    
    // 随机洗牌对手类型，增加多样性
    shuffleArray(opponentTypes);
    
    for (let i = 0; i < 3; i++) {
        const opponent = {
            id: i,
            name: opponentNames[i],
            type: opponentTypes[i],
            money: gameState.opponentStartingMoney || 1000,
            cards: [drawCard(), drawCard()],
            currentBet: 0,
            hasFolded: false,
            isDrunk: false,
            // 对手个性化特征
            traits: opponentTraits[opponentTypes[i]],
            // 记录游戏数据，用于AI学习
            gameStats: {
                handsWon: 0,
                handsPlayed: 0,
                bluffSuccess: 0,
                bluffAttempts: 0
            },
            // 是否处于诈唬状态
            isBluffing: false
        };
        
        gameState.opponents.push(opponent);
        
        // 创建对手UI，增加更多游戏进度信息
        const opponentEl = document.createElement('div');
        opponentEl.className = 'opponent';
        opponentEl.id = `opponent-${i}`;
        
        // 计算胜率和诈唬频率（如果有历史数据）
        const winRate = opponent.gameStats.handsPlayed > 0 
            ? Math.round((opponent.gameStats.handsWon / opponent.gameStats.handsPlayed) * 100) 
            : 0;
        
        const bluffRate = opponent.gameStats.bluffAttempts > 0 
            ? Math.round((opponent.gameStats.bluffSuccess / opponent.gameStats.bluffAttempts) * 100) 
            : 0;
        
        // 创建风格指示器
        const styleIndicators = createStyleIndicators(opponent.traits);
        
        opponentEl.innerHTML = `
            <div class="opponent-name">${opponent.name} (${opponent.type})</div>
            <div class="opponent-money">${opponent.money}</div>
            <div class="opponent-cards">
                <div class="opponent-card"></div>
                <div class="opponent-card"></div>
            </div>
            <div class="opponent-bet">下注: 0</div>
            <div class="opponent-stats">
                <div class="opponent-stat-item">
                    <div class="stat-label">胜率</div>
                    <div class="stat-value">${winRate}%</div>
                </div>
                <div class="opponent-style-indicators">
                    ${styleIndicators}
                </div>
                <div class="opponent-status-icons">
                    ${opponent.isDrunk ? '<span class="status-icon drunk" title="醉酒状态">🍺</span>' : ''}
                </div>
            </div>
        `;
        
        opponentsContainerEl.appendChild(opponentEl);
    }
}

// 创建对手风格指示器
function createStyleIndicators(traits) {
    // 计算各方面特征的百分比值（相对于理论最大值）
    const aggressiveness = Math.min(100, Math.round((1 - traits.foldThreshold) * 100));
    const tightness = Math.min(100, Math.round(traits.callThreshold * 100));
    const bluffing = Math.min(100, Math.round(traits.bluffChance * 100 * 3)); // 乘以3是为了放大显示
    
    // 创建指示器HTML
    return `
        <div class="style-indicator" title="激进度: ${aggressiveness}%">
            <div class="indicator-label">激进</div>
            <div class="indicator-bar">
                <div class="indicator-fill" style="width: ${aggressiveness}%"></div>
            </div>
        </div>
        <div class="style-indicator" title="紧密度: ${tightness}%">
            <div class="indicator-label">紧密</div>
            <div class="indicator-bar">
                <div class="indicator-fill" style="width: ${tightness}%"></div>
            </div>
        </div>
        <div class="style-indicator" title="诈唬倾向: ${bluffing}%">
            <div class="indicator-label">诈唬</div>
            <div class="indicator-bar">
                <div class="indicator-fill" style="width: ${bluffing}%"></div>
            </div>
        </div>
    `;
}

// 辅助函数：洗牌数组
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// 开始一轮游戏
function startRound() {
    // 收取盲注
    collectBlinds();
    
    // 更新游戏信息
    gameMessageEl.textContent = '游戏开始！小盲注：' + gameState.smallBlind + '，大盲注：' + gameState.bigBlind;
    
    // 玩家行动
    setActionButtonsState(true);
    
    // 更新加注范围
    updateRaiseInput();
}

// 收取盲注
function collectBlinds() {
    // 小盲注 (第一个对手)
    placeBet(gameState.opponents[0], gameState.smallBlind);
    
    // 大盲注 (第二个对手)
    placeBet(gameState.opponents[1], gameState.bigBlind);
    
    updateUI();
}

// 下注
function placeBet(player, amount) {
    // 如果是玩家
    if (player === 'player') {
        if (amount > gameState.playerMoney) {
            amount = gameState.playerMoney;
            showNotification('你的筹码不足，改为全押！', 'warning');
        }
        
        gameState.playerMoney -= amount;
        gameState.pot += amount;
        gameState.currentBet = amount;
        
        // 更新回合下注记录
        if (!gameState.roundBets['player']) {
            gameState.roundBets['player'] = 0;
        }
        gameState.roundBets['player'] += amount;
    } 
    // 如果是电脑对手
    else {
        if (amount > player.money) {
            amount = player.money;
            logEvent(`${player.name} 全押！`);
            showNotification(`${player.name} 全押！`, 'warning');
        }
        
        player.money -= amount;
        player.currentBet = amount;
        gameState.pot += amount;
        
        // 更新对手下注UI
        const opponentEl = document.getElementById(`opponent-${player.id}`);
        if (opponentEl) {
            opponentEl.querySelector('.opponent-money').textContent = player.money;
            opponentEl.querySelector('.opponent-bet').textContent = `下注: ${amount}`;
        }
        
        // 更新回合下注记录
        if (!gameState.roundBets[`opponent-${player.id}`]) {
            gameState.roundBets[`opponent-${player.id}`] = 0;
        }
        gameState.roundBets[`opponent-${player.id}`] += amount;
    }
    
    updateUI();
    
    // 检查破产
    if (player === 'player' && gameState.playerMoney <= 0) {
        showNotification('你已经全押了！', 'warning');
    }
}

// 玩家弃牌
function playerFold() {
    logEvent('你选择了弃牌');
    showNotification('你选择了弃牌', 'info');
    
    gameState.gameStats.totalLosses++;
    endHand('对手赢了！你弃牌了。');
    addExp(10); // 即使输了也获得一些经验
    
    // 更新连败记录
    gameState.loseStreak++;
    gameState.winStreak = 0;
    
    saveGameData();
    checkBankruptcy();
}

// 玩家看牌
function playerCheck() {
    logEvent('你选择了看牌');
    showNotification('你选择了看牌', 'info');
    playerActionCompleted();
}

// 玩家跟注
function playerCall() {
    const callAmount = getCurrentMaxBet() - (gameState.roundBets['player'] || 0);
    
    if (callAmount > 0) {
        logEvent(`你跟注了 ${callAmount} 筹码`);
        showNotification(`你跟注了 ${callAmount} 筹码`, 'info');
        placeBet('player', callAmount);
    } else {
        logEvent('你选择了看牌');
        showNotification('你选择了看牌', 'info');
    }
    
    playerActionCompleted();
}

// 玩家加注
function playerRaise() {
    const raiseAmount = parseInt(raiseAmountInput.value);
    const currentMaxBet = getCurrentMaxBet();
    const totalBet = currentMaxBet + raiseAmount;
    const playerCurrentBet = gameState.roundBets['player'] || 0;
    const amountToAdd = totalBet - playerCurrentBet;
    
    if (amountToAdd > 0) {
        logEvent(`你加注了 ${raiseAmount} 筹码`);
        showNotification(`你加注了 ${raiseAmount} 筹码`, 'info');
        placeBet('player', amountToAdd);
    }
    
    playerActionCompleted();
}

// 玩家行动完成后的处理
function playerActionCompleted() {
    setActionButtonsState(false);
    
    // 对手行动
    setTimeout(opponentsActions, 1000);
}

// 对手行动
function opponentsActions() {
    let allActed = true;
    
    for (let i = 0; i < gameState.opponents.length; i++) {
        const opponent = gameState.opponents[i];
        
        if (opponent.hasFolded) continue;
        
        // 更新对手游戏统计
        opponent.gameStats.handsPlayed = Math.max(1, opponent.gameStats.handsPlayed);
        
        const decision = opponent.isDrunk ? getRandomAction() : getOpponentDecision(opponent);
        
        switch (decision.action) {
            case 'fold':
                opponent.hasFolded = true;
                logEvent(`${opponent.name} 选择了弃牌`);
                showNotification(`${opponent.name} 选择了弃牌`, 'info');
                // 高亮显示弃牌状态
                updateOpponentUI(opponent, '已弃牌');
                break;
                
            case 'check':
                logEvent(`${opponent.name} 选择了看牌`);
                updateOpponentUI(opponent, '看牌');
                break;
                
            case 'call':
                const callAmount = getCurrentMaxBet() - (gameState.roundBets[`opponent-${opponent.id}`] || 0);
                if (callAmount > 0) {
                    placeBet(opponent, callAmount);
                    logEvent(`${opponent.name} 跟注了 ${callAmount} 筹码`);
                    updateOpponentUI(opponent, `跟注 ${callAmount}`);
                } else {
                    logEvent(`${opponent.name} 看牌`);
                    updateOpponentUI(opponent, '看牌');
                }
                break;
                
            case 'raise':
                const raiseAmount = decision.amount || getOptimalRaiseAmount(opponent);
                const currentMaxBet = getCurrentMaxBet();
                const totalBet = currentMaxBet + raiseAmount;
                const opponentCurrentBet = gameState.roundBets[`opponent-${opponent.id}`] || 0;
                const amountToAdd = totalBet - opponentCurrentBet;
                
                if (amountToAdd > 0) {
                    placeBet(opponent, amountToAdd);
                    
                    // 记录是否在诈唬
                    if (decision.isBluff) {
                        opponent.isBluffing = true;
                        opponent.gameStats.bluffAttempts++;
                        logEvent(`${opponent.name} 加注了 ${raiseAmount} 筹码${gameState.extraInfo ? " (诈唬中)" : ""}`);
                        if (raiseAmount > gameState.pot * 0.5) {
                            showNotification(`${opponent.name} 大幅加注！`, 'warning');
                        }
                        updateOpponentUI(opponent, `加注 ${raiseAmount}`, true);
                    } else {
                        logEvent(`${opponent.name} 加注了 ${raiseAmount} 筹码`);
                        updateOpponentUI(opponent, `加注 ${raiseAmount}`);
                    }
                    
                    allActed = false; // 如果有人加注，其他人需要再次行动
                }
                break;
        }
    }
    
    if (allActed) {
        advanceGameStage();
    } else {
        // 玩家需要再次行动
        setActionButtonsState(true);
        updateRaiseInput();
    }
}

// 更新对手UI
function updateOpponentUI(opponent, actionText, isBluffing = false) {
    const opponentEl = document.getElementById(`opponent-${opponent.id}`);
    if (!opponentEl) return;
    
    // 更新下注金额
    opponentEl.querySelector('.opponent-bet').textContent = `下注: ${gameState.roundBets[`opponent-${opponent.id}`] || 0}`;
    
    // 更新金钱
    opponentEl.querySelector('.opponent-money').textContent = opponent.money;
    
    // 根据行动类型确定CSS类
    let actionClass = '';
    if (actionText.includes('弃牌')) {
        actionClass = 'fold-action';
    } else if (actionText.includes('看牌')) {
        actionClass = 'check-action';
    } else if (actionText.includes('跟注')) {
        actionClass = 'call-action';
    } else if (actionText.includes('加注')) {
        actionClass = 'raise-action';
    } else if (actionText.includes('获胜')) {
        actionClass = 'win-action';
    }
    
    // 添加诈唬状态
    const statusClass = isBluffing ? 'bluffing-action' : '';
    
    // 创建或更新行动指示器
    let actionIndicator = opponentEl.querySelector('.action-indicator');
    if (!actionIndicator) {
        actionIndicator = document.createElement('div');
        actionIndicator.className = `action-indicator ${actionClass} ${statusClass}`;
        opponentEl.appendChild(actionIndicator);
    } else {
        actionIndicator.className = `action-indicator ${actionClass} ${statusClass}`;
    }
    actionIndicator.textContent = actionText;
    
    // 闪烁指示器
    flashElement(actionIndicator);
    
    // 更新游戏统计
    const winRate = opponent.gameStats.handsPlayed > 0 
        ? Math.round((opponent.gameStats.handsWon / opponent.gameStats.handsPlayed) * 100) 
        : 0;
    
    opponentEl.querySelector('.stat-value').textContent = `${winRate}%`;
    
    // 更新诈唬状态
    updateOpponentStatuses(opponent);
}

// 更新对手状态指示器
function updateOpponentStatuses(opponent) {
    const opponentEl = document.getElementById(`opponent-${opponent.id}`);
    if (!opponentEl) return;
    
    const statusIcons = opponentEl.querySelector('.opponent-status-icons');
    statusIcons.innerHTML = '';
    
    // 醉酒状态
    if (opponent.isDrunk) {
        const drunkIcon = document.createElement('span');
        drunkIcon.className = 'status-icon drunk';
        drunkIcon.title = '醉酒状态：行为不可预测';
        drunkIcon.textContent = '🍺';
        statusIcons.appendChild(drunkIcon);
    }
    
    // 诈唬状态
    if (opponent.isBluffing && gameState.extraInfo) {
        const bluffIcon = document.createElement('span');
        bluffIcon.className = 'status-icon bluffing';
        bluffIcon.title = '可能在诈唬';
        bluffIcon.textContent = '🎭';
        statusIcons.appendChild(bluffIcon);
    }
    
    // 胜率特别高
    if (opponent.gameStats.handsWon > 5 && (opponent.gameStats.handsWon / Math.max(1, opponent.gameStats.handsPlayed)) > 0.7) {
        const hotStreakIcon = document.createElement('span');
        hotStreakIcon.className = 'status-icon hot-streak';
        hotStreakIcon.title = '赢牌热潮';
        hotStreakIcon.textContent = '🔥';
        statusIcons.appendChild(hotStreakIcon);
    }
}

// 闪烁元素
function flashElement(element) {
    element.style.animation = 'none';
    setTimeout(() => {
        element.style.animation = 'flash 1s';
    }, 10);
}

// 获取对手决策
function getOpponentDecision(opponent) {
    const currentMaxBet = getCurrentMaxBet();
    const opponentCurrentBet = gameState.roundBets[`opponent-${opponent.id}`] || 0;
    const callAmount = currentMaxBet - opponentCurrentBet;
    const potOdds = callAmount / (gameState.pot + callAmount);
    
    // 计算实际手牌强度
    const handStrength = calculateHandStrength(opponent.cards, gameState.communityCards);
    
    // 获取对手特征
    const traits = opponent.traits;
    
    // 计算对手的有效手牌强度（考虑位置、底池等因素）
    let effectiveHandStrength = handStrength;
    
    // 考虑游戏阶段
    if (gameState.gameStage === 'preflop') {
        effectiveHandStrength = adjustPreFlopStrength(opponent.cards);
    }
    
    // 考虑底池赔率
    if (potOdds > 0 && potOdds < 0.3) {
        // 底池赔率好，提高有效强度
        effectiveHandStrength += 0.1;
    }
    
    // 考虑局势（如对手数量）
    const activeOpponents = gameState.opponents.filter(op => !op.hasFolded).length;
    if (activeOpponents === 1) {
        // 只剩一个对手，提高强度
        effectiveHandStrength += 0.1;
    }
    
    // 考虑对手适应性
    const adaptationFactor = traits.adaptability * (gameState.handsPlayed / 10);
    effectiveHandStrength += adaptationFactor * (Math.random() - 0.5) * 0.2;
    
    // 决定是否诈唬
    const isBluffing = Math.random() < traits.bluffChance;
    
    // 如果诈唬，根据不同游戏阶段调整概率
    if (isBluffing) {
        if (gameState.gameStage === 'river') {
            // 河牌阶段，提高手牌强度（诈唬）
            effectiveHandStrength = 0.9;
        } else if (gameState.gameStage === 'turn') {
            // 转牌阶段，中等提高
            effectiveHandStrength = 0.75;
        } else {
            // 其他阶段，小幅提高
            effectiveHandStrength += 0.3;
        }
    }
    
    // 决策逻辑
    if (effectiveHandStrength < traits.foldThreshold) {
        // 手牌太弱，倾向于弃牌
        if (callAmount === 0) {
            return { action: 'check' };
        }
        
        // 考虑底池赔率
        if (callAmount / (gameState.pot + callAmount) < 0.2 && Math.random() < 0.5) {
            return { action: 'call' };
        }
        
        return { action: 'fold' };
    } else if (effectiveHandStrength < traits.callThreshold) {
        // 手牌一般，倾向于跟注但不加注
        if (callAmount === 0) {
            // 没人下注，可能偶尔诈唬
            if (isBluffing && Math.random() < 0.3) {
                const raiseSize = getOptimalRaiseAmount(opponent);
                return { action: 'raise', amount: raiseSize, isBluff: true };
            }
            return { action: 'check' };
        }
        return { action: 'call' };
    } else if (effectiveHandStrength < traits.raiseThreshold) {
        // 手牌较强，根据情况跟注或加注
        if (Math.random() < 0.7) {
            return { action: 'call' };
        } else {
            const raiseSize = getOptimalRaiseAmount(opponent);
            return { action: 'raise', amount: raiseSize, isBluff: false };
        }
    } else {
        // 手牌很强，大概率加注
        if (Math.random() < 0.8) {
            const raiseSize = getOptimalRaiseAmount(opponent);
            return { action: 'raise', amount: raiseSize, isBluff: false };
        } else {
            // 偶尔慢玩，只跟注
            return { action: 'call' };
        }
    }
}

// 计算前缀牌阶段的手牌强度
function adjustPreFlopStrength(cards) {
    // 提取牌值和花色
    const values = cards.map(card => card.value);
    const suits = cards.map(card => card.suit);
    
    // 转换牌值为数字
    const valueMap = {
        '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
        'J': 11, 'Q': 12, 'K': 13, 'A': 14
    };
    
    const numValues = values.map(v => valueMap[v]);
    
    // 检查是否为口袋对子
    const isPair = numValues[0] === numValues[1];
    
    // 检查是否为同花
    const isSuited = suits[0] === suits[1];
    
    // 检查是否为连牌
    const isConnected = Math.abs(numValues[0] - numValues[1]) <= 3;
    
    // 计算基础强度
    let strength = 0;
    
    // 对子的强度
    if (isPair) {
        // A对到10对的强度从0.9到0.7
        if (numValues[0] >= 10) {
            strength = 0.7 + (numValues[0] - 10) * 0.05;
        } 
        // 小对子的强度从0.5到0.65
        else {
            strength = 0.5 + (numValues[0] - 2) * 0.025;
        }
    }
    // 高牌组合
    else {
        // 计算基础强度
        const higher = Math.max(numValues[0], numValues[1]);
        const lower = Math.min(numValues[0], numValues[1]);
        
        // A高牌组合
        if (higher === 14) {
            // AK
            if (lower === 13) {
                strength = isSuited ? 0.82 : 0.76;
            }
            // AQ
            else if (lower === 12) {
                strength = isSuited ? 0.72 : 0.67;
            }
            // AJ
            else if (lower === 11) {
                strength = isSuited ? 0.65 : 0.59;
            }
            // AT
            else if (lower === 10) {
                strength = isSuited ? 0.62 : 0.55;
            }
            // A9到A2
            else {
                strength = isSuited ? 0.5 - (10 - lower) * 0.02 : 0.45 - (10 - lower) * 0.03;
            }
        }
        // K高牌组合
        else if (higher === 13) {
            // KQ
            if (lower === 12) {
                strength = isSuited ? 0.63 : 0.58;
            }
            // KJ
            else if (lower === 11) {
                strength = isSuited ? 0.60 : 0.54;
            }
            // K10及以下
            else {
                strength = isSuited ? 0.48 - (10 - lower) * 0.02 : 0.42 - (10 - lower) * 0.03;
            }
        }
        // Q高牌组合
        else if (higher === 12) {
            // QJ
            if (lower === 11) {
                strength = isSuited ? 0.56 : 0.50;
            }
            // Q10及以下
            else {
                strength = isSuited ? 0.45 - (10 - lower) * 0.02 : 0.38 - (10 - lower) * 0.03;
            }
        }
        // J高牌及以下
        else {
            // 连牌有额外加成
            if (isConnected) {
                const gap = Math.abs(higher - lower);
                const connectedBonus = (3 - gap) * 0.03;
                strength = isSuited ? 0.42 - (11 - higher) * 0.02 + connectedBonus : 
                                     0.35 - (11 - higher) * 0.02 + connectedBonus;
            } else {
                strength = isSuited ? 0.35 - (11 - higher) * 0.02 : 0.25 - (11 - higher) * 0.02;
            }
        }
    }
    
    // 确保强度在0-1范围内
    return Math.max(0, Math.min(1, strength));
}

// 根据对手特点获取最优加注金额
function getOptimalRaiseAmount(opponent) {
    const currentMaxBet = getCurrentMaxBet();
    const potSize = gameState.pot;
    const traits = opponent.traits;
    let baseRaise;
    
    // 根据游戏阶段调整加注金额
    if (gameState.gameStage === 'preflop') {
        baseRaise = gameState.bigBlind * 3;
    } else if (gameState.gameStage === 'flop') {
        baseRaise = potSize * 0.5;
    } else if (gameState.gameStage === 'turn') {
        baseRaise = potSize * 0.6;
    } else { // river
        baseRaise = potSize * 0.7;
    }
    
    // 应用个性化加注因子
    baseRaise *= traits.raiseSizeFactor;
    
    // 如果在诈唬，更有可能下大注
    if (opponent.isBluffing) {
        baseRaise *= 1.3;
    }
    
    // 确保加注至少是最小加注，且不超过对手资金
    const finalRaise = Math.max(gameState.minRaise, Math.floor(baseRaise));
    return Math.min(finalRaise, opponent.money);
}

// 简化的手牌强度评估
function calculateHandStrength(playerCards, communityCards) {
    // 如果没有公共牌（preflop阶段），使用预计算的起手牌强度
    if (!communityCards || communityCards.length === 0) {
        return adjustPreFlopStrength(playerCards);
    }
    
    // 实际游戏中这里应该是真实的牌型评估算法
    // 我们这里做一个简化的模拟
    
    // 合并玩家手牌和公共牌
    const allCards = [...playerCards, ...communityCards];
    
    // 检查是否有同花或顺子的可能性
    const suits = {};
    const values = {};
    
    allCards.forEach(card => {
        // 统计花色
        if (!suits[card.suit]) {
            suits[card.suit] = 0;
        }
        suits[card.suit]++;
        
        // 统计点数
        if (!values[card.value]) {
            values[card.value] = 0;
        }
        values[card.value]++;
    });
    
    // 计算基础分数 (0-1之间)
    let score = 0;
    
    // 检查对子、三条、四条
    let hasPair = false;
    let hasThreeOfAKind = false;
    let hasFourOfAKind = false;
    let pairCount = 0;
    
    Object.values(values).forEach(count => {
        if (count === 2) {
            hasPair = true;
            pairCount++;
            score += 0.2; // 每对加0.2分
        } else if (count === 3) {
            hasThreeOfAKind = true;
            score += 0.5; // 三条加0.5分
        } else if (count === 4) {
            hasFourOfAKind = true;
            score += 0.8; // 四条加0.8分
        }
    });
    
    // 检查同花的可能性
    const flushPotential = Math.max(...Object.values(suits));
    if (flushPotential >= 5) {
        score += 0.7; // 同花
    } else if (flushPotential === 4 && communityCards.length < 5) {
        score += 0.2; // 在翻牌和转牌阶段有同花可能
    }
    
    // 检查是否有葫芦 (一组三条加一组对子)
    if (hasThreeOfAKind && hasPair) {
        score += 0.7; // 葫芦
    }
    
    // 检查两对
    if (pairCount >= 2) {
        score += 0.3; // 两对额外加0.3分
    }
    
    // 最终分数不应该超过1
    return Math.min(1, score);
}

// 随机行动（用于醉酒对手）
function getRandomAction() {
    const actions = ['fold', 'check', 'call', 'raise'];
    const action = actions[Math.floor(Math.random() * actions.length)];
    const isBluff = Math.random() < 0.5;
    
    return {
        action: action,
        amount: action === 'raise' ? Math.floor(Math.random() * 100) + gameState.minRaise : 0,
        isBluff: isBluff
    };
}

// 获取随机加注金额
function getRandomRaiseAmount(opponent) {
    const minRaise = gameState.minRaise;
    const maxRaise = Math.min(opponent.money, gameState.maxBet || 100);
    return Math.floor(Math.random() * (maxRaise - minRaise + 1)) + minRaise;
}

// 获取当前最大下注金额
function getCurrentMaxBet() {
    let maxBet = 0;
    
    // 检查所有玩家的下注
    for (const key in gameState.roundBets) {
        if (gameState.roundBets[key] > maxBet) {
            maxBet = gameState.roundBets[key];
        }
    }
    
    return maxBet;
}

// 进入下一阶段
function advanceGameStage() {
    switch (gameState.gameStage) {
        case 'preflop':
            gameState.gameStage = 'flop';
            dealCommunityCards(3); // 发3张公共牌
            showNotification('翻牌阶段', 'info');
            break;
            
        case 'flop':
            gameState.gameStage = 'turn';
            dealCommunityCards(1); // 发1张公共牌
            showNotification('转牌阶段', 'info');
            break;
            
        case 'turn':
            gameState.gameStage = 'river';
            dealCommunityCards(1); // 发1张公共牌
            showNotification('河牌阶段', 'info');
            break;
            
        case 'river':
            gameState.gameStage = 'showdown';
            showNotification('摊牌', 'info');
            showdown();
            return;
    }
    
    // 重置回合下注
    gameState.roundBets = {};
    
    // 允许玩家行动
    setActionButtonsState(true);
    updateRaiseInput();
    
    // 更新游戏信息
    gameMessageEl.textContent = `现在是${getGameStageName(gameState.gameStage)}阶段，请做出你的选择`;
    
    // 为玩家提供行动建议
    setTimeout(suggestBestAction, 1000);
}

// 发公共牌
function dealCommunityCards(count) {
    for (let i = 0; i < count; i++) {
        gameState.communityCards.push(drawCard());
    }
    
    displayCommunityCards();
}

// 显示公共牌
function displayCommunityCards() {
    communityCardsEl.innerHTML = '';
    
    gameState.communityCards.forEach(card => {
        const cardEl = document.createElement('div');
        cardEl.className = `card ${suitClasses[card.suit]}`;
        cardEl.setAttribute('data-value', card.value);
        cardEl.setAttribute('data-suit', card.suit);
        communityCardsEl.appendChild(cardEl);
    });
}

// 结算
function showdown() {
    // 显示所有对手的牌
    gameState.opponents.forEach(opponent => {
        if (!opponent.hasFolded) {
            const opponentEl = document.getElementById(`opponent-${opponent.id}`);
            const cardEls = opponentEl.querySelectorAll('.opponent-card');
            
            opponent.cards.forEach((card, index) => {
                cardEls[index].classList.add('revealed');
                cardEls[index].innerHTML = `${card.value}${card.suit}`;
                // 添加花色类以设置颜色
                if (card.suit === '♥' || card.suit === '♦') {
                    cardEls[index].classList.add('heart');
                } else {
                    cardEls[index].classList.add('spade');
                }
            });
            
            // 更新对手状态为"摊牌"
            updateOpponentUI(opponent, '摊牌');
        }
    });
    
    // 计算所有玩家的牌型强度
    const playerStrength = calculateHandStrength(gameState.playerCards, gameState.communityCards);
    const opponentStrengths = [];
    
    gameState.opponents.forEach(opponent => {
        if (!opponent.hasFolded) {
            const strength = calculateHandStrength(opponent.cards, gameState.communityCards);
            opponentStrengths.push({ opponent, strength });
            
            // 显示手牌强度信息
            const opponentEl = document.getElementById(`opponent-${opponent.id}`);
            let handInfo = document.createElement('div');
            handInfo.className = 'hand-info';
            handInfo.textContent = getHandTypeName(strength);
            opponentEl.appendChild(handInfo);
        }
    });
    
    if (opponentStrengths.length === 0) {
        // 所有对手都弃牌，玩家获胜
        playerWins();
    } else {
        // 找出最强的对手
        opponentStrengths.sort((a, b) => b.strength - a.strength);
        const strongestOpponent = opponentStrengths[0];
        
        // 检查玩家是否获胜
        if (playerStrength > strongestOpponent.strength) {
            playerWins();
        } else {
            opponentWins(strongestOpponent.opponent);
            
            // 检查对手是否在诈唬并成功了
            if (strongestOpponent.opponent.isBluffing) {
                strongestOpponent.opponent.gameStats.bluffSuccess++;
                if (gameState.extraInfo) {
                    logEvent(`${strongestOpponent.opponent.name} 的诈唬成功了！`);
                    showNotification(`${strongestOpponent.opponent.name} 的诈唬成功了！`, 'warning');
                }
            }
        }
    }
    
    // 处理连胜和连败统计
    gameState.handsPlayed++;
}

// 根据手牌强度获取牌型名称
function getHandTypeName(strength) {
    if (strength >= 9) return '皇家同花顺';
    if (strength >= 8) return '同花顺';
    if (strength >= 7) return '四条';
    if (strength >= 6) return '葫芦';
    if (strength >= 5) return '同花';
    if (strength >= 4) return '顺子';
    if (strength >= 3) return '三条';
    if (strength >= 2) return '两对';
    if (strength >= 1) return '一对';
    return '高牌';
}

// 玩家获胜
function playerWins() {
    const winnings = gameState.pot;
    updatePlayerMoney(winnings);
    
    gameState.winStreak++;
    gameState.loseStreak = 0;
    gameState.gameStats.totalWins++;
    
    // 记录最高单局赢钱
    if (winnings > gameState.gameStats.highestWin) {
        gameState.gameStats.highestWin = winnings;
        showNotification(`新记录！你创造了最高单局赢钱记录：${winnings}筹码！`, 'success');
    }
    
    // 记录最高资金额
    if (gameState.playerMoney > gameState.gameStats.maxMoney) {
        gameState.gameStats.maxMoney = gameState.playerMoney;
    }
    
    logEvent(`你赢了！获得 ${winnings} 筹码`);
    showNotification(`你赢了！获得 ${winnings} 筹码`, 'success');
    
    endHand('恭喜你赢了！');
    
    // 根据连胜次数增加经验
    const expGain = 50 + (gameState.winStreak * 5);
    addExp(expGain);
    
    // 检查对手是否在诈唬
    gameState.opponents.forEach(opponent => {
        if (opponent.isBluffing && !opponent.hasFolded) {
            // 对手诈唬失败
            if (gameState.extraInfo) {
                logEvent(`你识破了 ${opponent.name} 的诈唬！`);
                showNotification(`你识破了 ${opponent.name} 的诈唬！`, 'info');
            }
        }
    });
    
    checkAchievements(winnings);
    saveGameData();
}

// 对手获胜
function opponentWins(opponent) {
    opponent.money += gameState.pot;
    opponent.gameStats.handsWon++;
    
    gameState.loseStreak++;
    gameState.winStreak = 0;
    gameState.gameStats.totalLosses++;
    
    // 更新UI
    updateOpponentUI(opponent, '获胜');
    
    // 如果对手在诈唬，更新诈唬成功次数
    if (opponent.isBluffing) {
        opponent.gameStats.bluffSuccess++;
        updateOpponentStatuses(opponent);
    }
    
    logEvent(`${opponent.name} 赢了 ${gameState.pot} 筹码`);
    showNotification(`${opponent.name} 赢了 ${gameState.pot} 筹码`, 'error');
    
    endHand(`${opponent.name} 赢了这局`);
    
    // 根据连败次数减少经验奖励
    const expGain = Math.max(15 - (gameState.loseStreak * 2), 5);
    addExp(expGain);
    
    // 检查破产
    checkBankruptcy();
    saveGameData();
}

// 结束当前局
function endHand(message) {
    gameMessageEl.textContent = message;
    gameState.gameStage = 'idle';
    gameState.pot = 0;
    
    // 重置按钮状态
    setActionButtonsState(false);
    startGameBtn.disabled = false;
    
    updateUI();
}

// 设置动作按钮状态
function setActionButtonsState(enabled) {
    foldBtn.disabled = !enabled;
    checkBtn.disabled = !enabled;
    callBtn.disabled = !enabled;
    raiseBtn.disabled = !enabled;
    raiseAmountInput.disabled = !enabled;
    
    // 检查是否可以看牌（没有人下注时才能看牌）
    const currentMaxBet = getCurrentMaxBet();
    const playerCurrentBet = gameState.roundBets['player'] || 0;
    
    if (currentMaxBet > playerCurrentBet) {
        checkBtn.disabled = true;
    }
    
    // 如果是允许按钮，提供操作建议
    if (enabled) {
        setTimeout(suggestBestAction, 500);
    }
}

// 更新加注输入范围
function updateRaiseInput() {
    const minRaise = gameState.minRaise;
    const maxRaise = Math.min(gameState.playerMoney, gameState.maxBet || 500);
    
    raiseAmountInput.min = minRaise;
    raiseAmountInput.max = maxRaise;
    raiseAmountInput.value = minRaise;
    raiseValueEl.textContent = minRaise;
}

// 更新玩家金钱
function updatePlayerMoney(amount) {
    gameState.playerMoney += amount;
    
    // 带符号的金额显示
    const amountText = amount > 0 ? `+${amount}` : amount;
    const amountClass = amount > 0 ? 'success' : 'error';
    
    if (amount !== 0) {
        // 创建临时浮动数字效果
        const floatingAmount = document.createElement('div');
        floatingAmount.className = `floating-amount ${amountClass}`;
        floatingAmount.textContent = amountText;
        
        // 定位到玩家金钱显示附近
        const rect = playerMoneyEl.getBoundingClientRect();
        floatingAmount.style.left = `${rect.left + rect.width / 2}px`;
        floatingAmount.style.top = `${rect.top}px`;
        
        document.body.appendChild(floatingAmount);
        
        // 添加动画后移除
        setTimeout(() => {
            floatingAmount.style.opacity = '0';
            floatingAmount.style.transform = 'translateY(-50px)';
            setTimeout(() => {
                document.body.removeChild(floatingAmount);
            }, 1000);
        }, 50);
    }
    
    updateUI();
    
    // 检查成就
    checkMoneyAchievements();
}

// 增加经验
function addExp(amount) {
    const oldLevel = gameState.playerLevel;
    gameState.playerExp += amount;
    
    // 显示获得经验
    logEvent(`获得 ${amount} 经验值`);
    
    // 创建临时浮动经验显示
    const floatingExp = document.createElement('div');
    floatingExp.className = 'floating-exp';
    floatingExp.textContent = `+${amount} EXP`;
    
    // 定位到玩家等级显示附近
    const rect = playerLevelEl.getBoundingClientRect();
    floatingExp.style.left = `${rect.left + rect.width / 2}px`;
    floatingExp.style.top = `${rect.top}px`;
    
    document.body.appendChild(floatingExp);
    
    // 添加动画后移除
    setTimeout(() => {
        floatingExp.style.opacity = '0';
        floatingExp.style.transform = 'translateY(-30px)';
        setTimeout(() => {
            document.body.removeChild(floatingExp);
        }, 1000);
    }, 50);
    
    checkLevelUp(oldLevel);
}

// 检查升级
function checkLevelUp(oldLevel) {
    for (let i = levels.length - 1; i >= 0; i--) {
        if (gameState.playerExp >= levels[i].expRequired) {
            if (levels[i].name !== oldLevel) {
                gameState.playerLevel = levels[i].name;
                logEvent(`恭喜！你升级到了 ${levels[i].name}！`);
                showNotification(`升级！你现在是${levels[i].name}了！`, 'success');
                updateUI();
            }
            break;
        }
    }
}

// 使对手醉酒
function makeOpponentDrunk(index) {
    if (index >= 0 && index < gameState.opponents.length) {
        gameState.opponents[index].isDrunk = true;
        logEvent(`${gameState.opponents[index].name} 喝醉了，行为变得不可预测！`);
    }
}

// 触发随机事件
function triggerRandomEvent() {
    const event = randomEvents[Math.floor(Math.random() * randomEvents.length)];
    
    randomEventDescription.textContent = event.description;
    
    randomEventModal.style.display = 'flex';
    
    gameState.currentRandomEvent = event;
    
    logEvent(`随机事件: ${event.name}`);
    showNotification(`触发随机事件: ${event.name}`, 'warning');
}

// 关闭随机事件模态框
function closeRandomEventModal() {
    randomEventModal.style.display = 'none';
    
    // 执行事件效果
    if (gameState.currentRandomEvent) {
        gameState.currentRandomEvent.effect();
        gameState.currentRandomEvent = null;
    }
}

// 检查成就
function checkAchievements(winnings) {
    // 首次获胜
    if (!achievements.find(a => a.id === 'first_win').unlocked) {
        unlockAchievement('first_win');
    }
    
    // 豪客
    if (winnings >= 500) {
        unlockAchievement('high_roller');
    }
    
    // 东山再起
    if (gameState.playerMoney >= 2000 && gameState.loseStreak >= 3) {
        unlockAchievement('comeback_kid');
    }
    
    // 连胜成就
    if (gameState.winStreak >= 5) {
        unlockAchievement('survivor');
    }
    
    // 其他成就检查逻辑...
}

// 检查金钱相关成就
function checkMoneyAchievements() {
    // 百万富翁
    if (gameState.playerMoney >= 10000) {
        unlockAchievement('millionaire');
    }
}

// 解锁成就
function unlockAchievement(id) {
    const achievement = achievements.find(a => a.id === id);
    
    if (achievement && !achievement.unlocked) {
        achievement.unlocked = true;
        displayAchievements();
        
        logEvent(`🎉 解锁成就: ${achievement.name}`);
        showNotification(`🎉 解锁成就: ${achievement.name}`, 'success');
        
        // 创建成就解锁动画
        const achievementPopup = document.createElement('div');
        achievementPopup.className = 'achievement-popup';
        achievementPopup.innerHTML = `
            <div class="achievement-icon">${achievement.icon}</div>
            <div class="achievement-info">
                <div class="achievement-name">${achievement.name}</div>
                <div class="achievement-description">${achievement.description}</div>
            </div>
        `;
        
        document.body.appendChild(achievementPopup);
        
        // 显示动画
        setTimeout(() => {
            achievementPopup.style.opacity = '1';
            achievementPopup.style.transform = 'translateY(0)';
            
            // 隐藏动画
            setTimeout(() => {
                achievementPopup.style.opacity = '0';
                achievementPopup.style.transform = 'translateY(-20px)';
                setTimeout(() => {
                    document.body.removeChild(achievementPopup);
                }, 500);
            }, 4000);
        }, 100);
        
        saveGameData();
    }
}

// 显示成就列表
function displayAchievements() {
    achievementsListEl.innerHTML = '';
    
    achievements.forEach(achievement => {
        const achievementEl = document.createElement('li');
        achievementEl.className = achievement.unlocked ? 'unlocked' : '';
        achievementEl.innerHTML = `
            <span class="achievement-icon">${achievement.icon}</span>
            <span class="achievement-name">${achievement.name}</span>
            <span class="achievement-description">${achievement.description}</span>
            ${achievement.unlocked ? '<span class="achievement-unlocked">✓</span>' : ''}
        `;
        
        achievementsListEl.appendChild(achievementEl);
    });
}

// 记录事件
function logEvent(message) {
    const now = new Date();
    const timeStr = `${padZero(now.getHours())}:${padZero(now.getMinutes())}:${padZero(now.getSeconds())}`;
    
    const eventEntry = document.createElement('div');
    eventEntry.className = 'event-entry';
    eventEntry.innerHTML = `
        <span class="event-time">[${timeStr}]</span>
        <span class="event-message">${message}</span>
    `;
    
    // 添加到事件日志
    eventsLogEl.appendChild(eventEntry);
    eventsLogEl.scrollTop = eventsLogEl.scrollHeight;
    
    // 使最新事件闪烁
    eventEntry.classList.add('new-event');
    setTimeout(() => {
        eventEntry.classList.remove('new-event');
    }, 2000);
}

// 补零
function padZero(num) {
    return num.toString().padStart(2, '0');
}

// 获取游戏阶段名称
function getGameStageName(stage) {
    const stageNames = {
        'preflop': '翻牌前',
        'flop': '翻牌',
        'turn': '转牌',
        'river': '河牌',
        'showdown': '摊牌'
    };
    
    return stageNames[stage] || stage;
}

// 更新UI
function updateUI() {
    playerMoneyEl.textContent = gameState.playerMoney;
    playerLevelEl.textContent = gameState.playerLevel;
    potAmountEl.textContent = gameState.pot;
}

// 初始化游戏
window.addEventListener('DOMContentLoaded', init); 