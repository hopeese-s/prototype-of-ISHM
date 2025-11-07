{\rtf1\ansi\ansicpg1252\cocoartf2709
\cocoatextscaling0\cocoaplatform0{\fonttbl\f0\fswiss\fcharset0 Helvetica;}
{\colortbl;\red255\green255\blue255;}
{\*\expandedcolortbl;;}
\paperw11900\paperh16840\margl1440\margr1440\vieww11520\viewh8400\viewkind0
\pard\tx720\tx1440\tx2160\tx2880\tx3600\tx4320\tx5040\tx5760\tx6480\tx7200\tx7920\tx8640\pardirnatural\partightenfactor0

\f0\fs24 \cf0 // API Configuration\
const API_URL = window.location.hostname === 'localhost' \
    ? 'http://localhost:3000/api' \
    : 'https://your-app-name.onrender.com/api';\
\
// Global state\
let currentRoom = 'all';\
let sensorData = null;\
let logEntries = [];\
const MAX_LOG_ENTRIES = 50;\
\
// Initialize application\
document.addEventListener('DOMContentLoaded', () => \{\
    initializeApp();\
\});\
\
function initializeApp() \{\
    // Start time update\
    updateTime();\
    setInterval(updateTime, 1000);\
    \
    // Setup room selector\
    setupRoomSelector();\
    \
    // Start data fetching\
    fetchSensorData();\
    setInterval(fetchSensorData, 2000);\
    \
    // Add initial log\
    addLog('System initialized', 'success');\
\}\
\
// Update current time display\
function updateTime() \{\
    const now = new Date();\
    const options = \{ \
        month: 'short', \
        day: 'numeric', \
        year: 'numeric',\
        hour: '2-digit',\
        minute: '2-digit',\
        second: '2-digit',\
        hour12: true\
    \};\
    const dateTimeStr = now.toLocaleString('en-US', options).replace(',', ' |');\
    document.getElementById('datetime').textContent = dateTimeStr;\
\}\
\
// Setup room selector buttons\
function setupRoomSelector() \{\
    const roomButtons = document.querySelectorAll('.room-btn');\
    roomButtons.forEach(btn => \{\
        btn.addEventListener('click', () => \{\
            // Update active state\
            roomButtons.forEach(b => b.classList.remove('active'));\
            btn.classList.add('active');\
            \
            // Update current room\
            currentRoom = btn.dataset.room;\
            \
            // Update display\
            if (sensorData) \{\
                updateDisplay(sensorData);\
            \}\
            \
            addLog(`Switched to $\{getRoomDisplayName(currentRoom)\}`, 'info');\
        \});\
    \});\
\}\
\
// Get room display name\
function getRoomDisplayName(room) \{\
    const names = \{\
        'all': 'ALL ROOMS',\
        'livingRoom': 'LIVING ROOM',\
        'bedroom': 'BEDROOM',\
        'kitchen': 'KITCHEN'\
    \};\
    return names[room] || room.toUpperCase();\
\}\
\
// Fetch sensor data from API\
async function fetchSensorData() \{\
    try \{\
        const response = await fetch(`$\{API_URL\}/sensors`);\
        if (!response.ok) throw new Error('Failed to fetch data');\
        \
        const data = await response.json();\
        \
        // Check if data changed\
        const dataChanged = JSON.stringify(data) !== JSON.stringify(sensorData);\
        \
        sensorData = data;\
        updateDisplay(data);\
        \
        if (dataChanged) \{\
            checkAutomation(data);\
        \}\
        \
        // Update system status\
        document.querySelector('.status-text').textContent = 'SYSTEM ONLINE';\
        document.querySelector('.status-dot').style.background = 'var(--accent-green)';\
        \
    \} catch (error) \{\
        console.error('Error fetching data:', error);\
        document.querySelector('.status-text').textContent = 'SYSTEM OFFLINE';\
        document.querySelector('.status-dot').style.background = 'var(--accent-red)';\
        addLog('Connection error', 'error');\
    \}\
\}\
\
// Update display with sensor data\
function updateDisplay(data) \{\
    // Get room-specific data\
    let displayData;\
    if (currentRoom === 'all') \{\
        displayData = \{\
            pm25: data.pm25,\
            co2: data.co2,\
            voc: data.voc,\
            humidity: data.humidity,\
            temp: data.temp\
        \};\
    \} else \{\
        displayData = data.rooms[currentRoom];\
    \}\
    \
    // Update sensor values\
    document.getElementById('pm25Value').textContent = Math.round(displayData.pm25);\
    document.getElementById('co2Value').textContent = Math.round(displayData.co2);\
    document.getElementById('vocValue').textContent = Math.round(displayData.voc);\
    document.getElementById('humidityValue').textContent = Math.round(displayData.humidity);\
    document.getElementById('tempValue').textContent = Math.round(displayData.temp);\
    \
    // Calculate AQI\
    const aqi = calculateAQI(displayData);\
    document.getElementById('aqiScore').textContent = aqi;\
    \
    // Update air quality status\
    updateAirQualityStatus(displayData, aqi);\
    \
    // Update room label\
    document.getElementById('roomLabel').textContent = getRoomDisplayName(currentRoom);\
    \
    // Update device status\
    updateDeviceStatus(data.devices);\
\}\
\
// Calculate AQI score (0-100)\
function calculateAQI(data) \{\
    // PM2.5 score (0-100 range, lower is better)\
    let pm25Score = 100;\
    if (data.pm25 > 75) pm25Score = 0;\
    else if (data.pm25 > 50) pm25Score = 25;\
    else if (data.pm25 > 25) pm25Score = 50;\
    else if (data.pm25 > 12) pm25Score = 75;\
    \
    // CO2 score\
    let co2Score = 100;\
    if (data.co2 > 2000) co2Score = 0;\
    else if (data.co2 > 1500) co2Score = 25;\
    else if (data.co2 > 1000) co2Score = 50;\
    else if (data.co2 > 800) co2Score = 75;\
    \
    // VOC score\
    let vocScore = 100;\
    if (data.voc > 300) vocScore = 0;\
    else if (data.voc > 200) vocScore = 25;\
    else if (data.voc > 100) vocScore = 50;\
    else if (data.voc > 50) vocScore = 75;\
    \
    // Humidity score (ideal 40-60%)\
    let humidityScore = 100;\
    if (data.humidity > 80 || data.humidity < 30) humidityScore = 25;\
    else if (data.humidity > 70 || data.humidity < 35) humidityScore = 50;\
    else if (data.humidity > 65 || data.humidity < 40) humidityScore = 75;\
    \
    // Temperature score (ideal 20-26\'b0C)\
    let tempScore = 100;\
    if (data.temp > 35 || data.temp < 15) tempScore = 25;\
    else if (data.temp > 32 || data.temp < 18) tempScore = 50;\
    else if (data.temp > 28 || data.temp < 20) tempScore = 75;\
    \
    // Weighted average (PM2.5 and CO2 are most important)\
    const aqi = Math.round(\
        (pm25Score * 0.35) + \
        (co2Score * 0.35) + \
        (vocScore * 0.15) + \
        (humidityScore * 0.08) + \
        (tempScore * 0.07)\
    );\
    \
    return Math.max(0, Math.min(100, aqi));\
\}\
\
// Update air quality status badge\
function updateAirQualityStatus(data, aqi) \{\
    const badge = document.getElementById('statusBadge');\
    \
    // Remove all status classes\
    badge.classList.remove('excellent', 'moderate', 'poor');\
    \
    if (aqi >= 80) \{\
        badge.textContent = 'EXCELLENT';\
        badge.classList.add('excellent');\
    \} else if (aqi >= 50) \{\
        badge.textContent = 'MODERATE';\
        badge.classList.add('moderate');\
    \} else \{\
        badge.textContent = 'POOR';\
        badge.classList.add('poor');\
    \}\
\}\
\
// Update device status cards\
function updateDeviceStatus(devices) \{\
    // Intake Fan\
    const fanCard = document.getElementById('device-intakeFan');\
    const fanSpeed = document.getElementById('fanSpeed');\
    if (devices.intakeFan.active) \{\
        fanCard.classList.add('active');\
        fanSpeed.textContent = `$\{devices.intakeFan.speed\}%`;\
    \} else \{\
        fanCard.classList.remove('active');\
        fanSpeed.textContent = '0%';\
    \}\
    \
    // HEPA Filter\
    const hepaCard = document.getElementById('device-hepaFilter');\
    const hepaStatus = document.getElementById('hepaStatus');\
    if (devices.hepaFilter.active) \{\
        hepaCard.classList.add('active');\
        hepaStatus.textContent = 'ON';\
    \} else \{\
        hepaCard.classList.remove('active');\
        hepaStatus.textContent = 'OFF';\
    \}\
    \
    // Air Purifier\
    const purifierCard = document.getElementById('device-airPurifier');\
    const purifierStatus = document.getElementById('purifierStatus');\
    if (devices.airPurifier.active) \{\
        purifierCard.classList.add('active');\
        purifierStatus.textContent = 'ON';\
    \} else \{\
        purifierCard.classList.remove('active');\
        purifierStatus.textContent = 'OFF';\
    \}\
    \
    // Window Servo\
    const windowCard = document.getElementById('device-windowServo');\
    const windowStatus = document.getElementById('windowStatus');\
    if (devices.windowServo.active) \{\
        windowCard.classList.add('active');\
        windowStatus.textContent = 'OPEN';\
    \} else \{\
        windowCard.classList.remove('active');\
        windowStatus.textContent = 'CLOSED';\
    \}\
\}\
\
// Check automation rules\
function checkAutomation(data) \{\
    const avgData = \{\
        pm25: data.pm25,\
        co2: data.co2,\
        voc: data.voc,\
        humidity: data.humidity\
    \};\
    \
    // PM2.5 rule\
    if (data.rules.pm25) \{\
        if (avgData.pm25 > 25 && !data.devices.airPurifier.active) \{\
            addLog(`PM2.5 level high ($\{avgData.pm25\}\'b5g/m\'b3) - Air Purifier activated`, 'warning');\
        \} else if (avgData.pm25 <= 12 && data.devices.airPurifier.active) \{\
            addLog(`PM2.5 level normalized ($\{avgData.pm25\}\'b5g/m\'b3) - Air Purifier deactivated`, 'success');\
        \}\
    \}\
    \
    // CO2 rule\
    if (data.rules.co2) \{\
        if (avgData.co2 > 1000 && !data.devices.windowServo.active) \{\
            addLog(`CO\uc0\u8322  level high ($\{avgData.co2\}ppm) - Window opened, Fan started`, 'warning');\
        \} else if (avgData.co2 <= 800 && data.devices.windowServo.active) \{\
            addLog(`CO\uc0\u8322  level normalized ($\{avgData.co2\}ppm) - Window closed, Fan stopped`, 'success');\
        \}\
    \}\
    \
    // VOC rule\
    if (data.rules.voc) \{\
        if (avgData.voc > 100 && !data.devices.hepaFilter.active) \{\
            addLog(`VOC level high ($\{avgData.voc\}ppb) - HEPA Filter activated`, 'warning');\
        \} else if (avgData.voc <= 50 && data.devices.hepaFilter.active) \{\
            addLog(`VOC level normalized ($\{avgData.voc\}ppb) - HEPA Filter deactivated`, 'success');\
        \}\
    \}\
    \
    // Humidity rule\
    if (data.rules.humidity && avgData.humidity > 65) \{\
        addLog(`Humidity high ($\{avgData.humidity\}%) - Consider dehumidify mode`, 'info');\
    \}\
\}\
\
// Add log entry to terminal\
function addLog(message, type = 'info') \{\
    const timestamp = new Date().toLocaleTimeString('en-US', \{ hour12: false \});\
    const prefix = \{\
        'info': '[INFO]',\
        'success': '[OK]',\
        'warning': '[WARN]',\
        'error': '[ERR]'\
    \}[type];\
    \
    const logEntry = document.createElement('div');\
    logEntry.className = `log-entry $\{type\}`;\
    logEntry.textContent = `$\{timestamp\} $\{prefix\} $\{message\}`;\
    \
    const terminal = document.getElementById('systemLog');\
    terminal.appendChild(logEntry);\
    \
    // Keep only last 50 entries\
    logEntries.push(logEntry);\
    if (logEntries.length > MAX_LOG_ENTRIES) \{\
        const oldEntry = logEntries.shift();\
        if (oldEntry && oldEntry.parentNode) \{\
            oldEntry.remove();\
        \}\
    \}\
    \
    // Auto-scroll to bottom\
    terminal.scrollTop = terminal.scrollHeight;\
\}\
}
