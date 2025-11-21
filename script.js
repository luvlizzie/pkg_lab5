// Основные переменные
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const modeSelect = document.getElementById('mode');
const clipBtn = document.getElementById('clipBtn');
const clearBtn = document.getElementById('clearBtn');
const fileInput = document.getElementById('fileInput');
const updateWindowBtn = document.getElementById('updateWindowBtn');
const statusDiv = document.getElementById('status');
const polygonControls = document.getElementById('polygonControls');
const polygonTypeSelect = document.getElementById('polygonType');
const finishPolygonBtn = document.getElementById('finishPolygonBtn');
const drawLineBtn = document.getElementById('drawLineBtn');
const drawPolygonBtn = document.getElementById('drawPolygonBtn');
const drawingControls = document.getElementById('drawingControls');
const drawingStatus = document.getElementById('drawingStatus');
const liangBarskyInfo = document.getElementById('liangBarskyInfo');
const sutherlandHodgmanInfo = document.getElementById('sutherlandHodgmanInfo');

// Координаты отсекающего окна
let xmin = 100, ymin = 100, xmax = 400, ymax = 300;

// Массивы для хранения данных
let lines = [];
let polygons = [];
let clipWindow = { xmin, ymin, xmax, ymax };

// Переменные для рисования
let currentPolygon = [];
let isDrawingPolygon = false;
let isDrawingLine = false;
let tempLineStart = null;
let tempLinePoints = [];

// Инициализация
function init() {
    updateWindowCoordinates();
    drawScene();
    
    // Обработчики событий
    clipBtn.addEventListener('click', clip);
    clearBtn.addEventListener('click', clearCanvas);
    fileInput.addEventListener('change', handleFileUpload);
    updateWindowBtn.addEventListener('click', updateWindow);
    modeSelect.addEventListener('change', handleModeChange);
    polygonTypeSelect.addEventListener('change', handlePolygonTypeChange);
    finishPolygonBtn.addEventListener('click', finishPolygon);
    drawLineBtn.addEventListener('click', startDrawingLine);
    drawPolygonBtn.addEventListener('click', startDrawingPolygon);
    
    // Обработка кликов по canvas
    canvas.addEventListener('click', handleCanvasClick);
    canvas.addEventListener('mousemove', handleCanvasMouseMove);
    
    handleModeChange();
    updateAlgorithmInfo();
}

// Обновление информации об алгоритмах
function updateAlgorithmInfo() {
    if (modeSelect.value === 'lines') {
        liangBarskyInfo.style.display = 'block';
        sutherlandHodgmanInfo.style.display = 'none';
    } else {
        liangBarskyInfo.style.display = 'none';
        sutherlandHodgmanInfo.style.display = 'block';
    }
}

// Обработчик изменения режима
function handleModeChange() {
    updateAlgorithmInfo();
    
    if (modeSelect.value === 'polygon') {
        polygonControls.style.display = 'block';
        drawPolygonBtn.style.display = 'inline-block';
        drawLineBtn.style.display = 'none';
        statusDiv.textContent = 'Выберите тип многоугольника или начните рисование';
        cancelDrawing();
    } else {
        polygonControls.style.display = 'none';
        drawPolygonBtn.style.display = 'none';
        drawLineBtn.style.display = 'inline-block';
        finishPolygonBtn.style.display = 'none';
        isDrawingPolygon = false;
        currentPolygon = [];
        statusDiv.textContent = 'Режим отсечения отрезков';
        cancelDrawing();
    }
    drawScene();
}

// Обработчик изменения типа многоугольника
function handlePolygonTypeChange() {
    finishPolygonBtn.style.display = polygonTypeSelect.value === 'custom' ? 'inline-block' : 'none';
    cancelDrawing();
    drawScene();
}

// Начало рисования отрезка
function startDrawingLine() {
    if (isDrawingLine) {
        cancelDrawing();
        return;
    }
    
    isDrawingLine = true;
    isDrawingPolygon = false;
    currentPolygon = [];
    tempLineStart = null;
    tempLinePoints = [];
    drawLineBtn.classList.add('active');
    drawLineBtn.textContent = 'Отменить рисование';
    drawingStatus.textContent = 'Кликните на canvas для начала отрезка';
    statusDiv.textContent = 'Режим рисования отрезка: выберите начальную точку';
}

// Начало рисования многоугольника
function startDrawingPolygon() {
    if (isDrawingPolygon) {
        cancelDrawing();
        return;
    }
    
    polygonTypeSelect.value = 'custom';
    isDrawingPolygon = true;
    isDrawingLine = false;
    currentPolygon = [];
    tempLineStart = null;
    drawPolygonBtn.classList.add('active');
    drawPolygonBtn.textContent = 'Отменить рисование';
    finishPolygonBtn.style.display = 'inline-block';
    drawingStatus.textContent = 'Кликайте для добавления точек многоугольника';
    statusDiv.textContent = 'Режим рисования многоугольника: добавляйте точки кликом';
}

// Отмена рисования
function cancelDrawing() {
    isDrawingLine = false;
    isDrawingPolygon = false;
    tempLineStart = null;
    tempLinePoints = [];
    drawLineBtn.classList.remove('active');
    drawLineBtn.textContent = 'Нарисовать отрезок';
    drawPolygonBtn.classList.remove('active');
    drawPolygonBtn.textContent = 'Нарисовать многоугольник';
    drawingStatus.textContent = '';
}

// Обновление координат окна из полей ввода
function updateWindowCoordinates() {
    xmin = parseInt(document.getElementById('xmin').value);
    ymin = parseInt(document.getElementById('ymin').value);
    xmax = parseInt(document.getElementById('xmax').value);
    ymax = parseInt(document.getElementById('ymax').value);
    clipWindow = { xmin, ymin, xmax, ymax };
}

// Обновление окна отсечения
function updateWindow() {
    updateWindowCoordinates();
    drawScene();
    statusDiv.textContent = 'Окно отсечения обновлено.';
}

// Обработка движения мыши по canvas
function handleCanvasMouseMove(event) {
    if (!isDrawingLine && !isDrawingPolygon) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    if (isDrawingLine && tempLineStart) {
        // Обновляем временную линию
        tempLinePoints = [tempLineStart, {x, y}];
        drawScene();
        drawTempLine();
    }
}

// Обработка клика по canvas
function handleCanvasClick(event) {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    if (isDrawingLine) {
        handleLineDrawing(x, y);
    } else if (isDrawingPolygon) {
        handlePolygonDrawing(x, y);
    } else if (modeSelect.value === 'lines') {
        // Добавление случайного отрезка
        addRandomLine();
    } else {
        // Автоматическое создание многоугольника
        handleAutoPolygonClick(x, y);
    }
    
    drawScene();
}

// Обработка рисования отрезка
function handleLineDrawing(x, y) {
    if (!tempLineStart) {
        // Первый клик - начало отрезка
        tempLineStart = {x, y};
        drawingStatus.textContent = 'Выберите конечную точку отрезка';
        statusDiv.textContent = `Начальная точка: (${x.toFixed(0)}, ${y.toFixed(0)})`;
    } else {
        // Второй клик - завершение отрезка
        lines.push({
            x1: tempLineStart.x,
            y1: tempLineStart.y,
            x2: x,
            y2: y
        });
        drawingStatus.textContent = `Отрезок добавлен: (${tempLineStart.x.toFixed(0)}, ${tempLineStart.y.toFixed(0)}) - (${x.toFixed(0)}, ${y.toFixed(0)})`;
        statusDiv.textContent = `Добавлен отрезок. Всего отрезков: ${lines.length}`;
        cancelDrawing();
    }
}

// Обработка рисования многоугольника
function handlePolygonDrawing(x, y) {
    currentPolygon.push({x, y});
    drawingStatus.textContent = `Точка ${currentPolygon.length}: (${x.toFixed(0)}, ${y.toFixed(0)})`;
    statusDiv.textContent = `Добавлена точка ${currentPolygon.length}. Кликайте для добавления точек или нажмите "Завершить многоугольник"`;
}

// Добавление случайного отрезка
function addRandomLine() {
    const x1 = Math.random() * canvas.width;
    const y1 = Math.random() * canvas.height;
    const x2 = Math.random() * canvas.width;
    const y2 = Math.random() * canvas.height;
    
    lines.push({ x1, y1, x2, y2 });
    statusDiv.textContent = `Добавлен случайный отрезок: (${x1.toFixed(0)}, ${y1.toFixed(0)}) - (${x2.toFixed(0)}, ${y2.toFixed(0)})`;
}

// Обработка автоматического создания многоугольника
function handleAutoPolygonClick(x, y) {
    const type = polygonTypeSelect.value;
    if (type !== 'custom') {
        createRegularPolygon(x, y, type);
    }
}

// Создание правильного многоугольника
function createRegularPolygon(centerX, centerY, type) {
    let sides, radius;
    
    switch (type) {
        case 'triangle':
            sides = 3;
            radius = 80;
            break;
        case 'rectangle':
            sides = 4;
            radius = 70;
            break;
        case 'pentagon':
            sides = 5;
            radius = 80;
            break;
        case 'hexagon':
            sides = 6;
            radius = 80;
            break;
        default:
            return;
    }
    
    const newPolygon = [];
    
    for (let i = 0; i < sides; i++) {
        const angle = (i * 2 * Math.PI) / sides - Math.PI / 2;
        const px = centerX + radius * Math.cos(angle);
        const py = centerY + radius * Math.sin(angle);
        newPolygon.push({ x: px, y: py });
    }
    
    polygons.push(newPolygon);
    statusDiv.textContent = `Создан ${getPolygonName(type)} с центром (${centerX.toFixed(0)}, ${centerY.toFixed(0)})`;
}

// Завершение рисования произвольного многоугольника
function finishPolygon() {
    if (currentPolygon.length >= 3) {
        polygons.push([...currentPolygon]);
        statusDiv.textContent = `Многоугольник завершен. Добавлено ${currentPolygon.length} точек`;
        cancelDrawing();
        finishPolygonBtn.style.display = 'none';
        drawScene();
    } else {
        statusDiv.textContent = 'Для создания многоугольника нужно как минимум 3 точки';
    }
}

// Получение названия многоугольника
function getPolygonName(type) {
    const names = {
        'triangle': 'треугольник',
        'rectangle': 'прямоугольник',
        'pentagon': 'пятиугольник',
        'hexagon': 'шестиугольник'
    };
    return names[type] || 'многоугольник';
}

// Отрисовка всей сцены
function drawScene() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawCoordinateSystem();
    drawClipWindow();
    
    if (modeSelect.value === 'lines') {
        drawLines(lines, 'blue', false);
    } else {
        drawPolygons(polygons, 'blue', false);
    }
    
    // Рисуем текущий многоугольник в процессе создания
    if (isDrawingPolygon && currentPolygon.length > 0) {
        drawCurrentPolygon();
    }
}

// Рисование временной линии
function drawTempLine() {
    if (tempLinePoints.length === 2) {
        ctx.strokeStyle = 'orange';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 3]);
        ctx.beginPath();
        ctx.moveTo(tempLinePoints[0].x, tempLinePoints[0].y);
        ctx.lineTo(tempLinePoints[1].x, tempLinePoints[1].y);
        ctx.stroke();
        ctx.setLineDash([]);
    }
}

// Рисование текущего многоугольника в процессе создания
function drawCurrentPolygon() {
    ctx.strokeStyle = 'orange';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 3]);
    
    // Рисуем линии между точками
    if (currentPolygon.length > 1) {
        ctx.beginPath();
        ctx.moveTo(currentPolygon[0].x, currentPolygon[0].y);
        for (let i = 1; i < currentPolygon.length; i++) {
            ctx.lineTo(currentPolygon[i].x, currentPolygon[i].y);
        }
        ctx.stroke();
    }
    
    // Рисуем точки
    ctx.fillStyle = 'orange';
    for (const point of currentPolygon) {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 4, 0, 2 * Math.PI);
        ctx.fill();
    }
    
    ctx.setLineDash([]);
}

// Рисование системы координат
function drawCoordinateSystem() {
    ctx.strokeStyle = '#ccc';
    ctx.lineWidth = 1;
    
    // Вертикальные линии
    for (let x = 0; x <= canvas.width; x += 50) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
        
        if (x > 0) {
            ctx.fillStyle = '#666';
            ctx.font = '10px Arial';
            ctx.fillText(x.toString(), x - 10, 15);
        }
    }
    
    // Горизонтальные линии
    for (let y = 0; y <= canvas.height; y += 50) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
        
        if (y > 0) {
            ctx.fillStyle = '#666';
            ctx.font = '10px Arial';
            ctx.fillText(y.toString(), 5, y - 5);
        }
    }
}

// Рисование отсекающего окна
function drawClipWindow() {
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 2;
    ctx.setLineDash([]);
    ctx.strokeRect(clipWindow.xmin, clipWindow.ymin, 
                  clipWindow.xmax - clipWindow.xmin, 
                  clipWindow.ymax - clipWindow.ymin);
    
    ctx.fillStyle = 'red';
    ctx.font = '12px Arial';
    ctx.fillText('Окно отсечения', clipWindow.xmin, clipWindow.ymin - 10);
}

// Рисование отрезков
function drawLines(linesArray, color, isClipped) {
    ctx.strokeStyle = color;
    ctx.lineWidth = isClipped ? 3 : 2;
    ctx.setLineDash(isClipped ? [] : [5, 5]);
    
    for (const line of linesArray) {
        ctx.beginPath();
        ctx.moveTo(line.x1, line.y1);
        ctx.lineTo(line.x2, line.y2);
        ctx.stroke();
    }
    ctx.setLineDash([]);
}

// Рисование многоугольников
function drawPolygons(polygonsArray, color, isClipped) {
    ctx.strokeStyle = color;
    ctx.lineWidth = isClipped ? 3 : 2;
    ctx.setLineDash(isClipped ? [] : [5, 5]);
    
    for (const polygon of polygonsArray) {
        if (polygon.length < 2) continue;
        
        ctx.beginPath();
        ctx.moveTo(polygon[0].x, polygon[0].y);
        
        for (let i = 1; i < polygon.length; i++) {
            ctx.lineTo(polygon[i].x, polygon[i].y);
        }
        
        if (polygon.length > 2) {
            ctx.lineTo(polygon[0].x, polygon[0].y);
        }
        
        ctx.stroke();
    }
    ctx.setLineDash([]);
}

// АЛГОРИТМ ЛИАНГА-БАРСКИ ДЛЯ ОТРЕЗКОВ
function liangBarskyClip(line) {
    const {x1, y1, x2, y2} = line;
    let t0 = 0, t1 = 1;
    const dx = x2 - x1;
    const dy = y2 - y1;
    
    const p = [-dx, dx, -dy, dy];
    const q = [x1 - xmin, xmax - x1, y1 - ymin, ymax - y1];
    
    for (let i = 0; i < 4; i++) {
        if (p[i] === 0) {
            if (q[i] < 0) return null;
        } else {
            const t = q[i] / p[i];
            if (p[i] < 0) {
                if (t > t1) return null;
                if (t > t0) t0 = t;
            } else {
                if (t < t0) return null;
                if (t < t1) t1 = t;
            }
        }
    }
    
    if (t0 < t1) {
        return {
            x1: x1 + t0 * dx,
            y1: y1 + t0 * dy,
            x2: x1 + t1 * dx,
            y2: y1 + t1 * dy
        };
    }
    
    return null;
}

// АЛГОРИТМ ОТСЕЧЕНИЯ ВЫПУКЛОГО МНОГОУГОЛЬНИКА (Сазерленда-Ходжмана)
function sutherlandHodgmanClip(polygon) {
    if (!polygon || polygon.length < 3) return polygon;
    
    let outputList = polygon;
    
    outputList = clipAgainstEdge(outputList, 1); // Левая граница
    outputList = clipAgainstEdge(outputList, 2); // Правая граница
    outputList = clipAgainstEdge(outputList, 3); // Нижняя граница
    outputList = clipAgainstEdge(outputList, 4); // Верхняя граница
    
    return outputList;
}

// Отсечение относительно одной границы
function clipAgainstEdge(inputList, edgeType) {
    if (inputList.length === 0) return [];
    
    const outputList = [];
    const n = inputList.length;
    
    for (let i = 0; i < n; i++) {
        const current = inputList[i];
        const next = inputList[(i + 1) % n];
        
        const currentInside = isInside(current, edgeType);
        const nextInside = isInside(next, edgeType);
        
        if (currentInside && nextInside) {
            outputList.push(next);
        } else if (currentInside && !nextInside) {
            const intersection = computeIntersection(current, next, edgeType);
            outputList.push(intersection);
        } else if (!currentInside && nextInside) {
            const intersection = computeIntersection(current, next, edgeType);
            outputList.push(intersection);
            outputList.push(next);
        }
    }
    
    return outputList;
}

// Проверка нахождения точки внутри относительно границы
function isInside(point, edgeType) {
    switch (edgeType) {
        case 1: return point.x >= xmin;
        case 2: return point.x <= xmax;
        case 3: return point.y >= ymin;
        case 4: return point.y <= ymax;
        default: return false;
    }
}

// Вычисление точки пересечения отрезка с границей
function computeIntersection(p1, p2, edgeType) {
    let x, y;
    
    switch (edgeType) {
        case 1: // Левая граница (x = xmin)
            x = xmin;
            y = p1.y + (p2.y - p1.y) * (xmin - p1.x) / (p2.x - p1.x);
            break;
        case 2: // Правая граница (x = xmax)
            x = xmax;
            y = p1.y + (p2.y - p1.y) * (xmax - p1.x) / (p2.x - p1.x);
            break;
        case 3: // Нижняя граница (y = ymin)
            y = ymin;
            x = p1.x + (p2.x - p1.x) * (ymin - p1.y) / (p2.y - p1.y);
            break;
        case 4: // Верхняя граница (y = ymax)
            y = ymax;
            x = p1.x + (p2.x - p1.x) * (ymax - p1.y) / (p2.y - p1.y);
            break;
        default:
            return p1;
    }
    
    return { x, y };
}

// Основная функция отсечения
function clip() {
    updateWindowCoordinates();
    
    if (modeSelect.value === 'lines') {
        const clippedLines = [];
        
        for (const line of lines) {
            const clippedLine = liangBarskyClip(line);
            if (clippedLine) {
                clippedLines.push(clippedLine);
            }
        }
        
        drawScene();
        drawLines(clippedLines, 'green', true);
        
        statusDiv.textContent = `Отсечение завершено. Видимых отрезков: ${clippedLines.length} из ${lines.length}`;
        
    } else {
        const clippedPolygons = [];
        
        for (const polygon of polygons) {
            const clippedPolygon = sutherlandHodgmanClip(polygon);
            if (clippedPolygon && clippedPolygon.length >= 3) {
                clippedPolygons.push(clippedPolygon);
            }
        }
        
        drawScene();
        drawPolygons(clippedPolygons, 'green', true);
        
        statusDiv.textContent = `Отсечение завершено. Видимых многоугольников: ${clippedPolygons.length} из ${polygons.length}`;
    }
}

// Очистка canvas
function clearCanvas() {
    lines = [];
    polygons = [];
    currentPolygon = [];
    isDrawingPolygon = false;
    isDrawingLine = false;
    tempLineStart = null;
    tempLinePoints = [];
    cancelDrawing();
    drawScene();
    statusDiv.textContent = 'Canvas очищен.';
}

// Загрузка данных из файла
function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        parseInputData(e.target.result);
    };
    reader.readAsText(file);
}

// Парсинг входных данных
function parseInputData(data) {
    const linesData = data.split('\n').filter(line => line.trim() !== '');
    const n = parseInt(linesData[0]);
    
    lines = [];
    polygons = [];
    currentPolygon = [];
    isDrawingPolygon = false;
    isDrawingLine = false;
    cancelDrawing();
    
    // Проверяем формат - отрезки или многоугольник
    if (linesData[1].split(' ').length === 4) {
        // Формат отрезков
        for (let i = 1; i <= n; i++) {
            const coords = linesData[i].split(' ').map(Number);
            if (coords.length >= 4) {
                lines.push({
                    x1: coords[0],
                    y1: coords[1],
                    x2: coords[2],
                    y2: coords[3]
                });
            }
        }
    } else {
        // Формат многоугольника
        const polygonPoints = [];
        for (let i = 1; i <= n; i++) {
            const coords = linesData[i].split(' ').map(Number);
            if (coords.length >= 2) {
                polygonPoints.push({ x: coords[0], y: coords[1] });
            }
        }
        if (polygonPoints.length >= 3) {
            polygons.push(polygonPoints);
        }
    }
    
    // Чтение координат окна (последняя строка)
    const windowCoords = linesData[linesData.length - 1].split(' ').map(Number);
    if (windowCoords.length >= 4) {
        xmin = windowCoords[0];
        ymin = windowCoords[1];
        xmax = windowCoords[2];
        ymax = windowCoords[3];
        
        document.getElementById('xmin').value = xmin;
        document.getElementById('ymin').value = ymin;
        document.getElementById('xmax').value = xmax;
        document.getElementById('ymax').value = ymax;
        
        clipWindow = { xmin, ymin, xmax, ymax };
    }
    
    drawScene();
    statusDiv.textContent = `Загружено ${n} объектов из файла.`;
}

// Запуск приложения
init();