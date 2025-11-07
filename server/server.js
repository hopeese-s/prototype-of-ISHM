const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files
app.use(express.static(path.join(__dirname, '../frontend')));
app.use('/control', express.static(path.join(__dirname, '../backend')));

// In-memory sensor data
let sensorData = {
    pm25: 12,
    co2: 450,
    voc: 20,
    humidity: 55,
    temp: 28,
    rooms: {
        livingRoom: { pm25: 12, co2: 450, voc: 20, humidity: 55, temp: 28 },
        bedroom: { pm25: 10, co2: 400, voc: 15, humidity: 52, temp: 26 },
        kitchen: { pm25: 18, co2: 600, voc: 35, humidity: 60, temp: 29 }
    },
    currentRoom: 'all',
    devices: {
        intakeFan: { active: false, speed: 0 },
        hepaFilter: { active: false },
        airPurifier: { active: false },
        windowServo: { active: false }
    },
    rules: {
        pm25: true,
        co2: true,
        voc: true,
        humidity: true
    }
};

// API Routes

// Get sensor data
app.get('/api/sensors', (req, res) => {
    res.json(sensorData);
});

// Update sensor data
app.post('/api/update', (req, res) => {
    const updates = req.body;
    
    // Update sensor values
    if (updates.pm25 !== undefined) {
        if (updates.currentRoom === 'all') {
            sensorData.pm25 = updates.pm25;
            // Update all rooms
            Object.keys(sensorData.rooms).forEach(room => {
                sensorData.rooms[room].pm25 = updates.pm25;
            });
        } else {
            sensorData.rooms[updates.currentRoom].pm25 = updates.pm25;
            updateAverages();
        }
    }
    
    if (updates.co2 !== undefined) {
        if (updates.currentRoom === 'all') {
            sensorData.co2 = updates.co2;
            Object.keys(sensorData.rooms).forEach(room => {
                sensorData.rooms[room].co2 = updates.co2;
            });
        } else {
            sensorData.rooms[updates.currentRoom].co2 = updates.co2;
            updateAverages();
        }
    }
    
    if (updates.voc !== undefined) {
        if (updates.currentRoom === 'all') {
            sensorData.voc = updates.voc;
            Object.keys(sensorData.rooms).forEach(room => {
                sensorData.rooms[room].voc = updates.voc;
            });
        } else {
            sensorData.rooms[updates.currentRoom].voc = updates.voc;
            updateAverages();
        }
    }
    
    if (updates.humidity !== undefined) {
        if (updates.currentRoom === 'all') {
            sensorData.humidity = updates.humidity;
            Object.keys(sensorData.rooms).forEach(room => {
                sensorData.rooms[room].humidity = updates.humidity;
            });
        } else {
            sensorData.rooms[updates.currentRoom].humidity = updates.humidity;
            updateAverages();
        }
    }
    
    if (updates.temp !== undefined) {
        if (updates.currentRoom === 'all') {
            sensorData.temp = updates.temp;
            Object.keys(sensorData.rooms).forEach(room => {
                sensorData.rooms[room].temp = updates.temp;
            });
        } else {
            sensorData.rooms[updates.currentRoom].temp = updates.temp;
            updateAverages();
        }
    }
    
    // Update devices
    if (updates.devices) {
        Object.keys(updates.devices).forEach(deviceId => {
            sensorData.devices[deviceId] = {
                ...sensorData.devices[deviceId],
                ...updates.devices[deviceId]
            };
        });
    }
    
    // Update rules
    if (updates.rules) {
        Object.keys(updates.rules).forEach(ruleId => {
            sensorData.rules[ruleId] = updates.rules[ruleId];
        });
    }
    
    // Update current room
    if (updates.currentRoom) {
        sensorData.currentRoom = updates.currentRoom;
    }
    
    // Apply automation rules
    applyAutomation();
    
    res.json(sensorData);
});

// Health check
app.get('/api/status', (req, res) => {
    res.json({ status: 'online', timestamp: new Date().toISOString() });
});

// Serve frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Serve backend control
app.get('/control', (req, res) => {
    res.sendFile(path.join(__dirname, '../backend/control.html'));
});

// Helper function to update averages
function updateAverages() {
    const rooms = Object.values(sensorData.rooms);
    const count = rooms.length;
    
    sensorData.pm25 = rooms.reduce((sum, room) => sum + room.pm25, 0) / count;
    sensorData.co2 = rooms.reduce((sum, room) => sum + room.co2, 0) / count;
    sensorData.voc = rooms.reduce((sum, room) => sum + room.voc, 0) / count;
    sensorData.humidity = rooms.reduce((sum, room) => sum + room.humidity, 0) / count;
    sensorData.temp = rooms.reduce((sum, room) => sum + room.temp, 0) / count;
}

// Apply automation rules - ONLY AUTO-ON, NO FORCED OFF
function applyAutomation() {
    const avgData = {
        pm25: sensorData.pm25,
        co2: sensorData.co2,
        voc: sensorData.voc,
        humidity: sensorData.humidity
    };
    
    // PM2.5 Rule: > 25 → Air Purifier ON (ไม่บังคับปิด)
    if (sensorData.rules.pm25) {
        if (avgData.pm25 > 25) {
            sensorData.devices.airPurifier.active = true;
        }
    }
    
    // CO₂ Rule: > 1000 → Window + Fan ON (ไม่บังคับปิด)
    if (sensorData.rules.co2) {
        if (avgData.co2 > 1000) {
            sensorData.devices.windowServo.active = true;
            sensorData.devices.intakeFan.active = true;
            sensorData.devices.intakeFan.speed = 75;
        }
    }
    
    // VOC Rule: > 100 → HEPA Filter ON (ไม่บังคับปิด)
    if (sensorData.rules.voc) {
        if (avgData.voc > 100) {
            sensorData.devices.hepaFilter.active = true;
        }
    }
    
    // Humidity rule is informational only
}

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Smart Home Air Quality Server running on port ${PORT}`);
    console.log(`📊 Frontend: http://localhost:${PORT}/`);
    console.log(`🎛️  Control Panel: http://localhost:${PORT}/control`);
});

