// API Configuration
const API_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:3000/api' 
    : 'https://smartaircare.onrender.com/api';

// Global state
let currentRoom = 'all';
let sensorData = null;
let editingField = null;

// Initialize control panel
document.addEventListener('DOMContentLoaded', () => {
    initializeControlPanel();
});

function initializeControlPanel() {
    // Setup room selector
    setupRoomSelector();
    
    // Setup input handlers
    setupInputHandlers();
    
    // Load initial data
    loadSensorData();
    
    // Auto-refresh every 5 seconds
    setInterval(loadSensorData, 5000);
}

// Setup input handlers to prevent overwrite while editing
function setupInputHandlers() {
    const inputIds = ['input-pm25', 'input-co2', 'input-voc', 'input-humidity', 'input-temp'];
    inputIds.forEach(id => {
        const element = document.getElementById(id);
        element.addEventListener('focus', () => {
            editingField = id;
        });
        element.addEventListener('blur', () => {
            editingField = null;
        });
    });
}

// Setup room selector
function setupRoomSelector() {
    const roomRadios = document.querySelectorAll('input[name="room"]');
    roomRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            currentRoom = e.target.value;
            switchRoom(currentRoom);
        });
    });
}

// Switch to different room
function switchRoom(room) {
    currentRoom = room;
    
    // Update title
    const roomNames = {
        'all': 'ALL ROOMS',
        'livingRoom': 'LIVING ROOM',
        'bedroom': 'BEDROOM',
        'kitchen': 'KITCHEN'
    };
    document.getElementById('currentRoomTitle').textContent = roomNames[room];
    
    // Load room data
    loadSensorData();
    
    showNotification(`Switched to ${roomNames[room]}`);
}

// Load sensor data from API
async function loadSensorData() {
    try {
        const response = await fetch(`${API_URL}/sensors`);
        if (!response.ok) throw new Error('Failed to fetch data');
        
        sensorData = await response.json();
        updateInputFields();
        updateDeviceToggles();
        updateRuleToggles();
        updateStatusDisplay();
        
    } catch (error) {
        console.error('Error loading data:', error);
        showNotification('Error loading data', 'error');
    }
}

// Update input fields with current data (SKIP if field is being edited)
function updateInputFields() {
    if (!sensorData) return;
    
    let data;
    if (currentRoom === 'all') {
        data = {
            pm25: sensorData.pm25,
            co2: sensorData.co2,
            voc: sensorData.voc,
            humidity: sensorData.humidity,
            temp: sensorData.temp
        };
    } else {
        data = sensorData.rooms[currentRoom];
    }
    
    if (editingField !== 'input-pm25') {
        document.getElementById('input-pm25').value = Math.round(data.pm25);
    }
    
    if (editingField !== 'input-co2') {
        document.getElementById('input-co2').value = Math.round(data.co2);
    }
    
    if (editingField !== 'input-voc') {
        document.getElementById('input-voc').value = Math.round(data.voc);
    }
    
    if (editingField !== 'input-humidity') {
        document.getElementById('input-humidity').value = Math.round(data.humidity);
    }
    
    if (editingField !== 'input-temp') {
        document.getElementById('input-temp').value = data.temp.toFixed(1);
    }
}

// Update device toggles
function updateDeviceToggles() {
    if (!sensorData) return;
    
    document.getElementById('device-intakeFan').checked = sensorData.devices.intakeFan.active;
    document.getElementById('device-hepaFilter').checked = sensorData.devices.hepaFilter.active;
    document.getElementById('device-airPurifier').checked = sensorData.devices.airPurifier.active;
    document.getElementById('device-windowServo').checked = sensorData.devices.windowServo.active;
    
    const fanSpeed = sensorData.devices.intakeFan.speed || 0;
    document.getElementById('fanSpeed').value = fanSpeed;
    document.getElementById('fanSpeedLabel').textContent = `${fanSpeed}%`;
    
    // Enable/disable fan speed slider
    document.getElementById('fanSpeed').disabled = !sensorData.devices.intakeFan.active;
}

// Update rule toggles
function updateRuleToggles() {
    if (!sensorData) return;
    
    document.getElementById('rule-pm25').checked = sensorData.rules.pm25;
    document.getElementById('rule-co2').checked = sensorData.rules.co2;
    document.getElementById('rule-voc').checked = sensorData.rules.voc;
    document.getElementById('rule-humidity').checked = sensorData.rules.humidity;
}

// Update status display
function updateStatusDisplay() {
    if (!sensorData) return;
    
    const status = `
╔════════════════════════════════════════╗
║         SYSTEM STATUS REPORT           ║
╚════════════════════════════════════════╝

[SENSOR READINGS - ${currentRoom.toUpperCase()}]
  PM2.5:      ${sensorData.pm25.toFixed(1)} µg/m³
  CO₂:        ${sensorData.co2.toFixed(0)} ppm
  VOC:        ${sensorData.voc.toFixed(0)} ppb
  Humidity:   ${sensorData.humidity.toFixed(1)} %
  Temperature: ${sensorData.temp.toFixed(1)} °C

[DEVICE STATUS]
  Intake Fan:    ${sensorData.devices.intakeFan.active ? 'ON' : 'OFF'} (Speed: ${sensorData.devices.intakeFan.speed}%)
  HEPA Filter:   ${sensorData.devices.hepaFilter.active ? 'ON' : 'OFF'}
  Air Purifier:  ${sensorData.devices.airPurifier.active ? 'ON' : 'OFF'}
  Window Servo:  ${sensorData.devices.windowServo.active ? 'OPEN' : 'CLOSED'}

[AUTOMATION RULES]
  PM2.5 Rule:    ${sensorData.rules.pm25 ? 'ENABLED' : 'DISABLED'}
  CO₂ Rule:      ${sensorData.rules.co2 ? 'ENABLED' : 'DISABLED'}
  VOC Rule:      ${sensorData.rules.voc ? 'ENABLED' : 'DISABLED'}
  Humidity Rule: ${sensorData.rules.humidity ? 'ENABLED' : 'DISABLED'}

[ROOM DATA]
  Living Room:  PM2.5=${sensorData.rooms.livingRoom.pm25.toFixed(1)} CO₂=${sensorData.rooms.livingRoom.co2.toFixed(0)}
  Bedroom:      PM2.5=${sensorData.rooms.bedroom.pm25.toFixed(1)} CO₂=${sensorData.rooms.bedroom.co2.toFixed(0)}
  Kitchen:      PM2.5=${sensorData.rooms.kitchen.pm25.toFixed(1)} CO₂=${sensorData.rooms.kitchen.co2.toFixed(0)}

Last Updated: ${new Date().toLocaleString()}
    `.trim();
    
    document.getElementById('statusDisplay').textContent = status;
}

// Update single sensor value
async function updateValue(sensor) {
    const inputId = `input-${sensor}`;
    const value = parseFloat(document.getElementById(inputId).value);
    
    if (isNaN(value)) {
        showNotification('Invalid value', 'error');
        return;
    }
    
    const updateData = { currentRoom };
    updateData[sensor] = value;
    
    try {
        const response = await fetch(`${API_URL}/update`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updateData)
        });
        
        if (!response.ok) throw new Error('Update failed');
        
        sensorData = await response.json();
        
        // Apply automation rules
        checkAutomation();
        
        updateInputFields();
        updateDeviceToggles();
        updateStatusDisplay();
        
        showNotification(`${sensor.toUpperCase()} updated successfully`);
        
        // Clear focus after successful update
        editingField = null;
        
    } catch (error) {
        console.error('Error updating value:', error);
        showNotification('Update failed', 'error');
    }
}

// Toggle device on/off
async function toggleDevice(deviceId) {
    const checkbox = document.getElementById(`device-${deviceId}`);
    const active = checkbox.checked;
    
    const updateData = {
        devices: {
            [deviceId]: { active }
        }
    };
    
    // If turning off intake fan, reset speed
    if (deviceId === 'intakeFan' && !active) {
        updateData.devices.intakeFan.speed = 0;
    }
    
    try {
        await sendToAPI(updateData);
        showNotification(`${deviceId} ${active ? 'activated' : 'deactivated'}`);
        
        // Enable/disable fan speed slider
        if (deviceId === 'intakeFan') {
            document.getElementById('fanSpeed').disabled = !active;
            if (!active) {
                document.getElementById('fanSpeed').value = 0;
                document.getElementById('fanSpeedLabel').textContent = '0%';
            }
        }
        
    } catch (error) {
        console.error('Error toggling device:', error);
        checkbox.checked = !active; // Revert
        showNotification('Toggle failed', 'error');
    }
}

// Update fan speed
async function updateFanSpeed() {
    const speed = parseInt(document.getElementById('fanSpeed').value);
    document.getElementById('fanSpeedLabel').textContent = `${speed}%`;
    
    const updateData = {
        devices: {
            intakeFan: {
                active: speed > 0,
                speed: speed
            }
        }
    };
    
    try {
        await sendToAPI(updateData);
        
        // Update checkbox
        document.getElementById('device-intakeFan').checked = speed > 0;
        
    } catch (error) {
        console.error('Error updating fan speed:', error);
    }
}

// Toggle automation rule
async function toggleRule(ruleId) {
    const checkbox = document.getElementById(`rule-${ruleId}`);
    const enabled = checkbox.checked;
    
    const updateData = {
        rules: {
            [ruleId]: enabled
        }
    };
    
    try {
        await sendToAPI(updateData);
        showNotification(`${ruleId.toUpperCase()} rule ${enabled ? 'enabled' : 'disabled'}`);
        
    } catch (error) {
        console.error('Error toggling rule:', error);
        checkbox.checked = !enabled; // Revert
        showNotification('Toggle failed', 'error');
    }
}

// Apply preset scenario
async function setScenario(type) {
    let updateData = {};
    
    switch (type) {
        case 'good':
            updateData = {
                pm25: 8,
                co2: 400,
                voc: 15,
                humidity: 50,
                temp: 25,
                currentRoom: 'all',
                devices: {
                    intakeFan: { active: false, speed: 0 },
                    hepaFilter: { active: false },
                    airPurifier: { active: false },
                    windowServo: { active: false }
                }
            };
            break;
            
        case 'moderate':
            updateData = {
                pm25: 35,
                co2: 850,
                voc: 80,
                humidity: 65,
                temp: 30,
                currentRoom: 'all',
                devices: {
                    intakeFan: { active: false, speed: 0 },
                    hepaFilter: { active: false },
                    airPurifier: { active: true },
                    windowServo: { active: false }
                }
            };
            break;
            
        case 'poor':
            updateData = {
                pm25: 75,
                co2: 1500,
                voc: 200,
                humidity: 75,
                temp: 33,
                currentRoom: 'all',
                devices: {
                    intakeFan: { active: true, speed: 75 },
                    hepaFilter: { active: true },
                    airPurifier: { active: true },
                    windowServo: { active: true }
                }
            };
            break;
            
        case 'reset':
            updateData = {
                pm25: 8,
                co2: 400,
                voc: 15,
                humidity: 50,
                temp: 25,
                currentRoom: 'all',
                devices: {
                    intakeFan: { active: false, speed: 0 },
                    hepaFilter: { active: false },
                    airPurifier: { active: false },
                    windowServo: { active: false }
                }
            };
            break;
    }
    
    try {
        const response = await fetch(`${API_URL}/update`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updateData)
        });
        
        if (!response.ok) throw new Error('Scenario update failed');
        
        sensorData = await response.json();
        updateInputFields();
        updateDeviceToggles();
        updateStatusDisplay();
        
        showNotification(`Scenario "${type.toUpperCase()}" applied successfully`);
        
        // Clear focus
        editingField = null;
        
    } catch (error) {
        console.error('Error setting scenario:', error);
        showNotification('Scenario failed', 'error');
    }
}

// Check and apply automation rules
function checkAutomation() {
    if (!sensorData) return;
    
    const updates = {};
    let avgData = {
        pm25: sensorData.pm25,
        co2: sensorData.co2,
        voc: sensorData.voc,
        humidity: sensorData.humidity
    };
    
    // PM2.5 Rule: > 25 → Air Purifier ON
    if (sensorData.rules.pm25) {
        if (avgData.pm25 > 25) {
            updates.airPurifier = { active: true };
        }
    }
    
    // CO2 Rule: > 1000 → Window + Fan ON (75%)
    if (sensorData.rules.co2) {
        if (avgData.co2 > 1000) {
            updates.windowServo = { active: true };
            updates.intakeFan = { active: true, speed: 75 };
        }
    }
    
    // VOC Rule: > 100 → HEPA Filter ON
    if (sensorData.rules.voc) {
        if (avgData.voc > 100) {
            updates.hepaFilter = { active: true };
        }
    }
    
    // Apply updates if any
    if (Object.keys(updates).length > 0) {
        sendToAPI({ devices: updates });
    }
}

// Send update to API
async function sendToAPI(updateData) {
    try {
        const response = await fetch(`${API_URL}/update`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updateData)
        });
        
        if (!response.ok) throw new Error('API update failed');
        
        sensorData = await response.json();
        updateInputFields();
        updateDeviceToggles();
        updateRuleToggles();
        updateStatusDisplay();
        
        return sensorData;
        
    } catch (error) {
        console.error('Error sending to API:', error);
        throw error;
    }
}

// Show notification toast
function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.style.background = type === 'error' ? 'var(--accent-red)' : 'var(--accent-green)';
    notification.classList.add('show');
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 2000);
}
