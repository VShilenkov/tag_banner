const categories = window.categories || [];
const TAG_WIDTH_PERCENT = 0.96;
const TAG_HEIGHT_PERCENT = 0.36;

const ui = {
    categoryPath: document.getElementById('category-path'),
    yearInput: document.getElementById('yearInput'),
    weekInput: document.getElementById('weekInput'),
    numInput: document.getElementById('numInput'),
    inputMode: document.getElementById('input-mode'),
    prodWrapper: document.getElementById('prod-wrapper'),
    prodMode: document.getElementById('prod-mode'),
    generateButton: document.getElementById('generate-tag-button')
};

const state = {
    wakeLock: null,
    selectedPath: []
};

function getCurrentWeekData() {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);

    const target = new Date(now.valueOf());
    const dayNr = (now.getDay() + 6) % 7;
    target.setDate(target.getDate() - dayNr + 3);

    const firstThursday = target.valueOf();
    target.setMonth(0, 1);

    if (target.getDay() !== 4) {
        target.setMonth(0, 1 + ((4 - target.getDay() + 7) % 7));
    }

    const week = 1 + Math.round((firstThursday - target) / 604800000);

    return {
        year,
        week: String(week).padStart(2, '0')
    };
}

function getNormalizedNumber(value, fallback) {
    const parsed = Number.parseInt(String(value ?? '').trim(), 10);

    if (!Number.isInteger(parsed) || parsed < 1 || parsed > 99) {
        return fallback;
    }

    return parsed;
}

function getTwoDigitField(value, fallback) {
    const trimmed = String(value ?? '').trim();

    if (!trimmed) {
        return fallback;
    }

    const parsed = Number.parseInt(trimmed, 10);

    if (!Number.isInteger(parsed)) {
        return fallback;
    }

    return String(parsed).padStart(2, '0');
}

function createLevelGroup(level, options, placeholderText) {
    const group = document.createElement('div');
    group.className = 'field-group';

    const label = document.createElement('label');
    label.textContent = level === 0 ? 'Category' : `Category ${level + 1}`;

    const select = document.createElement('select');
    const placeholderOption = document.createElement('option');
    placeholderOption.value = '';
    placeholderOption.textContent = placeholderText;
    select.appendChild(placeholderOption);

    options.forEach((node) => {
        const option = document.createElement('option');
        option.value = node.id;
        option.textContent = node.name;
        select.appendChild(option);
    });

    const selectedNode = state.selectedPath[level];
    select.value = selectedNode ? selectedNode.id : '';

    select.addEventListener('change', () => {
        const chosenId = select.value;
        state.selectedPath = state.selectedPath.slice(0, level);

        if (chosenId) {
            const chosenNode = options.find((node) => node.id === chosenId);
            state.selectedPath[level] = chosenNode;
        }

        renderCategoryPath();
    });

    group.appendChild(label);
    group.appendChild(select);
    return group;
}

function renderCategoryPath() {
    ui.categoryPath.innerHTML = '';

    const rootGroup = createLevelGroup(0, categories, 'Select primary category');
    ui.categoryPath.appendChild(rootGroup);

    let currentNode = state.selectedPath[0] || null;
    let level = 1;

    while (currentNode && currentNode.children && currentNode.children.length) {
        const nextGroup = createLevelGroup(level, currentNode.children, `Select level ${level + 1}`);
        ui.categoryPath.appendChild(nextGroup);

        if (!state.selectedPath[level]) {
            break;
        }

        currentNode = state.selectedPath[level];
        level += 1;
    }

    updateGenerateButtonState();
}

function updateGenerateButtonState() {
    const lastNode = state.selectedPath[state.selectedPath.length - 1];
    const canGenerate = Boolean(lastNode && lastNode.code);

    ui.generateButton.disabled = !canGenerate;
    ui.generateButton.title = canGenerate ? 'Generate tag' : 'Select the final category leaf first';
}

function stepNumber(amount) {
    const currentNumber = getNormalizedNumber(ui.numInput.value, 1);
    ui.numInput.value = String(Math.min(99, Math.max(1, currentNumber + amount)));
}

function initForm() {
    const dateData = getCurrentWeekData();
    ui.yearInput.value = dateData.year;
    ui.weekInput.value = dateData.week;

    state.selectedPath = [];
    renderCategoryPath();
}

function updateScreenLayout() {
    const screen = document.querySelector('.display-screen');

    if (ui.prodWrapper.style.display === 'none' || !screen) {
        return;
    }

    const screenStyle = window.getComputedStyle(screen);
    const availableWidth = Math.max(
        screen.clientWidth - parseFloat(screenStyle.paddingLeft) - parseFloat(screenStyle.paddingRight),
        1
    );
    const availableHeight = Math.max(
        screen.clientHeight - parseFloat(screenStyle.paddingTop) - parseFloat(screenStyle.paddingBottom),
        1
    );
    const textWidth = Math.max(ui.prodMode.offsetWidth, 1);
    const textHeight = Math.max(ui.prodMode.offsetHeight, 1);
    const widthPercent = Math.min(Math.max(TAG_WIDTH_PERCENT, 0), 1);
    const heightPercent = Math.min(Math.max(TAG_HEIGHT_PERCENT, 0), 1);

    screen.style.setProperty(
        '--tag-scale-x',
        String((availableWidth * widthPercent) / textWidth)
    );
    screen.style.setProperty(
        '--tag-scale-y',
        String((availableHeight * heightPercent) / textHeight)
    );

}

async function requestWakeLock() {
    if (!('wakeLock' in navigator)) {
        return;
    }

    try {
        state.wakeLock = await navigator.wakeLock.request('screen');
        state.wakeLock.addEventListener('release', () => {
            state.wakeLock = null;
        });
    } catch (error) {
        console.warn('Screen wake lock could not be enabled:', error);
    }
}

async function releaseWakeLock() {
    if (!state.wakeLock) {
        return;
    }

    try {
        await state.wakeLock.release();
    } catch (error) {
        console.warn('Screen wake lock could not be released:', error);
    } finally {
        state.wakeLock = null;
    }
}

function requestFullscreen() {
    const element = document.documentElement;
    const request = element.requestFullscreen || element.webkitRequestFullscreen;

    if (request) {
        const result = request.call(element);
        if (result && typeof result.catch === 'function') {
            result.catch((error) => console.warn('Fullscreen could not be enabled:', error));
        }
    }
}

function exitFullscreen() {
    if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
        return;
    }

    if (document.webkitFullscreenElement && document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
    }
}

function showProdMode() {
    ui.inputMode.style.display = 'none';
    ui.prodWrapper.style.display = 'flex';
    updateScreenLayout();

    if (document.fonts && document.fonts.status !== 'loaded') {
        document.fonts.ready.then(updateScreenLayout);
    }
}

function hideProdMode({ advanceNumber = false } = {}) {
    if (advanceNumber) {
        const currentNum = getNormalizedNumber(ui.numInput.value, 1);
        const nextNum = currentNum + 1;
        ui.numInput.value = String(nextNum);
        ui.numInput.setAttribute('value', String(nextNum));
    }

    ui.prodWrapper.style.display = 'none';
    ui.inputMode.style.display = 'flex';
    releaseWakeLock();
    exitFullscreen();
}

function generateTag() {
    const lastNode = state.selectedPath[state.selectedPath.length - 1];

    if (!lastNode || !lastNode.code) {
        window.alert('Please select the final category leaf first.');
        return;
    }

    const dateData = getCurrentWeekData();
    const yy = getTwoDigitField(ui.yearInput.value, dateData.year);
    const ww = getTwoDigitField(ui.weekInput.value, dateData.week);
    const xx = String(getNormalizedNumber(ui.numInput.value, 1)).padStart(2, '0');
    const fullID = `${lastNode.code}${yy}${ww}${xx}`;

    ui.prodMode.textContent = fullID;
    showProdMode();
    requestWakeLock();
    requestFullscreen();
}

function exitProdMode() {
    hideProdMode({ advanceNumber: true });
}

document.addEventListener('fullscreenchange', () => {
    if (document.fullscreenElement || document.webkitFullscreenElement) {
        return;
    }

    ui.prodWrapper.style.display = 'none';
    ui.inputMode.style.display = 'flex';
    releaseWakeLock();
});

document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && ui.prodWrapper.style.display === 'flex') {
        requestWakeLock();
    }
});

document.getElementById('num-decrement').addEventListener('click', () => stepNumber(-1));
document.getElementById('num-increment').addEventListener('click', () => stepNumber(1));

window.addEventListener('resize', updateScreenLayout);
if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', updateScreenLayout);
}

initForm();
