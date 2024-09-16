const path = require('path');
const express = require('express');
const args = process.argv.slice(2);
const fs = require('fs');
const fsp = require('fs/promises')
const qrcode = require('qrcode');
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');

let CONFIG = {
    PORT: 4000,
    BROWSER_DIRECTORY: path.join(__dirname, 'user'),
    MODELS_DIRECTORY: path.join(__dirname, 'models'),
    TEMP_DIRECTORY: path.join(__dirname, 'temp'),
    OUTPUT_DIRECTORY: path.join(__dirname, 'output'),
    WEB_DIRECTORY: path.join(__dirname, 'website'),
    API_URL: 'http://127.0.0.1:8188',
    CHROME: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    MODE: null,
    ADMIN: null,
    EXPRESS: express(),
    WA: null,
    QRCODE: null,
    READY: false,
    KSAMPLER_SEED_CHANGE: 1,
    MODELS: {},
    PROMPT: {
        MODEL: {},
        NODES: {}
    },
    WATCHER: {}
}

const deleteContentsInsideDirectory = async (dirPath) => {
    try {
        const files = await fsp.readdir(dirPath);
        await Promise.all(files.map(async (file) => {
            const filePath = path.join(dirPath, file);
            const stats = await fsp.stat(filePath);
            if (stats.isDirectory()) {
                await deleteContentsInsideDirectory(filePath);
                await fsp.rmdir(filePath);
            } else {
                await fsp.unlink(filePath);
            }
        }));

        console.log(`Successfully deleted contents inside ${dirPath}`);
    } catch (error) {
        console.error(`Error deleting contents inside ${dirPath}:`, error);
        throw error;
    }
};

function readJsonFile(filePath) {
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        const jsonData = JSON.parse(data);
        return jsonData;
    } catch (err) {
        console.error(`Error reading or parsing file: ${err}`);
        return null;
    }
}

function addDirectories() {

    CONFIG.BROWSER_DIRECTORY = path.join(CONFIG.MAIN_DIRECTORY, 'user')
    CONFIG.MODELS_DIRECTORY = path.join(CONFIG.MAIN_DIRECTORY, 'workflows')
    CONFIG.TEMP_DIRECTORY = path.join(CONFIG.MAIN_DIRECTORY, 'temp')
    CONFIG.OUTPUT_DIRECTORY = path.join(CONFIG.MAIN_DIRECTORY, 'output')

    WA_CONFIG = readJsonFile(path.join(CONFIG.MAIN_DIRECTORY, 'whatsapp.json'))

    CONFIG.MODE = parseInt(WA_CONFIG.mode);
    CONFIG.ADMIN = `${WA_CONFIG.phone_code}${WA_CONFIG.phone}@c.us`

    CONFIG.CHROME = WA_CONFIG.chrome
    CONFIG.API_URL = WA_CONFIG.comfy_url;

}

args.forEach(arg => {
    const [key, value] = arg.split('=');
    if (key === '--mode') {
        CONFIG.MODE = parseInt(value);
    } else if (key === '--admin') {
        CONFIG.ADMIN = `${value}@c.us`;
    } else if (key === '--api') {
        CONFIG.API_URL = value
    } else if (key === '--pd') {
        CONFIG.MAIN_DIRECTORY = value
        addDirectories()
    }
});

function createDirectories(config) {
    for (let key in config) {
        if (key.endsWith('_DIRECTORY')) {
            const dir = config[key];
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
                console.log(`Directory created: ${dir}`);
            } else {
                console.log(`Directory already exists: ${dir}`);
            }
        }
    }
}

function botMediaMessage(to, message, media) {
    CONFIG.WA.sendMessage(to, "🤖\n\n" + message, { media })
}

function botTextMessage(to, message) {
    CONFIG.WA.sendMessage(to, "🤖\n\n" + message)
}

function botTextMessagReply(message_object, message) {
    message_object.reply("🤖\n\n" + message)
}

function isAdmin(user) {
    return CONFIG.ADMIN == user
}

function allCommands() {
    let rules = ''
    rules += 'Write */wfs* to get a numbered list of uploaded workflows.\n\n'
    rules += 'Write */wf id* to select the workflow.\n\n'
    rules += 'Write */wns* to get numbered list of selected workflow nodes.\n\n'
    rules += 'Write */wn id* to get numbered list of inputs available.\n\n'
    rules += 'Write */s node_id input_id value* to set value for input selected.\n\n'
    rules += 'Write */sce* enable auto ksampler seed change.\n\n'
    rules += 'Write */scd* disable auto ksampler seed change.\n\n'
    rules += 'Write */r* to reset all to default settings.\n\n'
    rules += 'Write */q* to queue.\n\n'
    rules += 'Write */i* to interrupt queue.\n\n'
    rules += 'Write */m number* to set bot usage mode. *1*: Single User, *2*: Multi User.\n\n'
    return rules
}

function readModels(folderPath) {
    return fs.readdirSync(folderPath);
}

function formatModelObject(models) {
    return Object.entries(models).map(([key, value]) => `*${key}* | ${value}`).join("\n");
}

function containsIndex(arr, index) {
    return index >= 0 && index < arr.length && arr[index] !== undefined;
}

function containsValue(arr, value) {
    return arr.includes(value);
}

function containsValueAtIndex(arr, index, value) {
    return index >= 0 && index < arr.length && arr[index] === value;
}

function readJSONFile(file) {
    try {
        let file_path = path.join(CONFIG.MODELS_DIRECTORY, file)
        const data = fs.readFileSync(file_path, 'utf8');
        const jsonData = JSON.parse(data);
        return jsonData;
    } catch (err) {
        console.error("Error reading file:", err);
        return null;
    }
}

function extractTitleFromModel(data) {
    const titles = {};
    if (data) {
        for (const key in data) {
            if (data.hasOwnProperty(key)) {
                titles[key] = data[key]._meta.title;
            }
        }
    }
    return titles;
}

function formatOutput(titles) {
    let output = '*ID* | Node Name\n';
    for (const key in titles) {
        if (titles.hasOwnProperty(key)) {
            output += `*${key}* | ${titles[key]}\n`;
        }
    }
    return output;
}

function formatInputsIgnoreArray(number, data) {
    const inputs = data[number].inputs;
    let formattedInputs = `ID | Input Name | Input Value\n`;
    let counter = 0
    for (const inputName in inputs) {
        if (inputs.hasOwnProperty(inputName) && !Array.isArray(inputs[inputName])) {
            formattedInputs += `*${counter++}* | *${inputName}* | *${inputs[inputName]}*\n`;
        }
    }
    return formattedInputs.trim();
}

function containsSettings(number, setting_number, data) {
    if (data[number] && data[number].inputs) {
        const inputs = data[number].inputs;
        let counter = 0
        for (const inputName in inputs) {
            if (inputs.hasOwnProperty(inputName) && !Array.isArray(inputs[inputName])) {
                if (counter == setting_number) {
                    break;
                }
                counter++
            }
        }
        return (counter == setting_number)
    }
}

function getSettingName(number, setting_number, data) {
    if (data[number] && data[number].inputs) {
        const inputs = data[number].inputs;
        let counter = 0
        let name = ""
        for (const inputName in inputs) {
            if (inputs.hasOwnProperty(inputName) && !Array.isArray(inputs[inputName])) {
                if (counter == setting_number) {
                    name = inputName
                    break;
                }
                counter++
            }
        }
        return name
    }
}

function editInputs(jsonObj, title, inputName, value) {
    for (let key in jsonObj) {
        if (jsonObj[key]._meta && jsonObj[key]._meta.title === title) {
            if (jsonObj[key].inputs) {
                jsonObj[key].inputs[inputName] = value;
            } else {
                jsonObj[key].inputs = { [inputName]: value };
            }
            return;
        }
    }
}

function getNodeID(jsonObj, title) {
    let id = -1
    for (let key in jsonObj) {
        if (jsonObj[key]._meta && jsonObj[key]._meta.title === title) {
            id = key
            break
        }
    }
    return id
}

function editJSON(number, inputName, inputValue, data) {
    if (data[number] && data[number].inputs) {
        const existingValue = data[number].inputs[inputName];
        if (existingValue !== undefined) {
            const existingValueType = typeof existingValue;
            let convertedValue;
            if (existingValueType === 'number' && Number.isInteger(existingValue)) {
                convertedValue = parseInt(inputValue);
            } else if (existingValueType === 'number' && !Number.isInteger(existingValue)) {
                convertedValue = parseFloat(inputValue);
            } else if (existingValueType === 'boolean') {
                convertedValue = (inputValue.toLowerCase() === 'true');
            } else {
                convertedValue = inputValue
            }
            data[number].inputs[inputName] = convertedValue;
            return data;
        } else {
            console.log("Invalid input name.");
            return null;
        }
    } else {
        console.log("Invalid number.");
        return null;
    }
}

function extractPhoneNumber(inputString) {
    const parts = inputString.split('@');
    const firstPart = parts[0];
    const phoneNumber = firstPart.slice(-10);
    return phoneNumber;
}

async function sendResultToUser(user, images) {

    if (images.length > 0) {

        images.forEach(async (image) => {
            let file_path = path.join(image.subfolder, image.filename)
            const media = await MessageMedia.fromFilePath(file_path);
            botMediaMessage(user, "Here is your image", media)
        })

    }
}

async function watch(user, data) {
    try {
        if (!CONFIG.WATCHER[user]) {
            CONFIG.WATCHER[user] = {
                count: 0,
            }
        }
        let id = data.prompt_id
        let res = await fetch(`${CONFIG.API_URL}/history/${id}`).then(response => response.json())
        if (res && res[id]) {
            let status = res[id].status
            if (status.completed && status.status_str === "success") {
                let nodeid = getNodeID(CONFIG.PROMPT.NODES[user], "WA_ImageSaver")
                if (nodeid != -1) {
                    let images = res[id].outputs[nodeid].images || []
                    sendResultToUser(user, images)
                }
            }
            else {
                botTextMessage(user, "Workflow failed/interrupted to generate result. Please try again!")
            }
        }
        else {
            setTimeout(watch, 1000, user, data)
        }
    } catch (error) {
        console.log(error)
        botTextMessage(user, "Workflow failed/interrupted to generate result. Please try again!")
    }
}

function setCommand(message) {

    let sliced = message.body.split(" ")
    let command = sliced[0]

    switch (command) {
        case '/c':
            botTextMessagReply(message, allCommands())
            break;
        case '/wfs':
            CONFIG.MODELS[message.from] = readModels(CONFIG.MODELS_DIRECTORY)
            let models = formatModelObject(CONFIG.MODELS[message.from])
            botTextMessagReply(message, "Here are your workflows:\n\n" + "*ID* | Model Name\n\n" + models + "\n\nTo select workfloe write /wf id")
            break;
        case '/wf':
            if (!CONFIG.MODELS[message.from]) {
                CONFIG.MODELS[message.from] = readModels(CONFIG.MODELS_DIRECTORY)
            }
            let index = parseInt(sliced[1])
            if (!containsIndex(CONFIG.MODELS[message.from], index)) {
                botTextMessagReply(message, "Workflows does not exists!")
            }
            else {
                CONFIG.PROMPT.MODEL[message.from] = CONFIG.MODELS[message.from][index]
                if (!CONFIG.PROMPT.NODES[message.from]) {
                    CONFIG.PROMPT.NODES[message.from] = readJSONFile(CONFIG.PROMPT.MODEL[message.from])
                }
                botTextMessagReply(message, `Workflow *${CONFIG.PROMPT.MODEL[message.from]}* selected!`)
            }
            break;
        case '/wns':
            if (!CONFIG.MODELS[message.from]) {
                botTextMessagReply(message, "Workflow not selected!")
            }
            else {
                CONFIG.PROMPT.NODES[message.from] = readJSONFile(CONFIG.PROMPT.MODEL[message.from])
                let nodes = formatOutput(extractTitleFromModel(CONFIG.PROMPT.NODES[message.from]))
                botTextMessagReply(message, "Here are your workflow nodes:\n\n" + nodes + "\n\nTo get the datail of a particular node write /wn id")
            }
            break;
        case '/wn':
            if (!CONFIG.MODELS[message.from]) {
                botTextMessagReply(message, "Workflow not selected!")
            }
            else {
                if (!CONFIG.PROMPT.NODES[message.from]) {
                    CONFIG.PROMPT.NODES[message.from] = readJSONFile(CONFIG.PROMPT.MODEL[message.from])
                }
                let index = sliced[1]

                if (!containsValue(Object.keys(CONFIG.PROMPT.NODES[message.from]), index)) {
                    botTextMessagReply(message, "Node does not exists!")
                }
                else {
                    let nodes = formatInputsIgnoreArray(index, CONFIG.PROMPT.NODES[message.from])
                    botTextMessagReply(message, "Here are your node inputs:\n\n" + nodes + "\n\nTo edit a particular input write /s wns_id wn_id value")
                }
            }
            break;
        case '/sce':
            CONFIG.KSAMPLER_SEED_CHANGE = 1
            botTextMessagReply(message, `KSampler Seed Change: *Enabled*`)
            break;
        case '/scd':
            CONFIG.KSAMPLER_SEED_CHANGE = 0
            botTextMessagReply(message, `KSampler Seed Change: *Disabled*`)
            break;
        case '/s':
            if (!CONFIG.MODELS[message.from]) {
                botTextMessagReply(message, "Workflow not selected!")
            }
            else {
                if (!CONFIG.PROMPT.NODES[message.from]) {
                    CONFIG.PROMPT.NODES[message.from] = readJSONFile(CONFIG.PROMPT.MODEL[message.from])
                }

                let node_number = sliced[1]
                let setting_number = sliced[2]
                let value = sliced[3]

                if (sliced.length > 4) {
                    for (let index = 4; index < sliced.length; index++) {
                        const element = sliced[index];
                        value += " " + element
                    }
                }

                if (!containsValue(Object.keys(CONFIG.PROMPT.NODES[message.from]), node_number)) {
                    botTextMessagReply(message, "Node does not exists.")
                }
                else if (!containsSettings(node_number, setting_number, CONFIG.PROMPT.NODES[message.from])) {
                    botTextMessagReply(message, "Node setting does not exists.")
                }
                else {
                    let setting_name = getSettingName(node_number, setting_number, CONFIG.PROMPT.NODES[message.from])
                    editJSON(node_number, setting_name, value, CONFIG.PROMPT.NODES[message.from])
                    let nodes = formatInputsIgnoreArray(node_number, CONFIG.PROMPT.NODES[message.from])
                    botTextMessagReply(message, "Node setting changed.\n\n" + nodes)
                }
            }
            break;
        case '/r':
            CONFIG.MODELS[message.from] = null
            CONFIG.PROMPT.MODEL[message.from] = null
            CONFIG.PROMPT.NODES[message.from] = null
            botTextMessagReply(message, "Reset Done.\n")
            break;
        case '/q':
            if(CONFIG.KSAMPLER_SEED_CHANGE) {
                editInputs(CONFIG.PROMPT.NODES[message.from], "KSampler", "seed", Date.now())
            }
            editInputs(CONFIG.PROMPT.NODES[message.from], "WA_ImageSaver", "Path", path.join(CONFIG.OUTPUT_DIRECTORY, extractPhoneNumber(message.from)))
            let requestOptions = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ "prompt": CONFIG.PROMPT.NODES[message.from] })
            };
            fetch(CONFIG.API_URL + "/prompt", requestOptions)
                .then(response => response.json())
                .then(data => {
                    botTextMessagReply(message, "Promt Submitted.\n")
                    watch(message.from, data)
                })
                .catch(error => console.error('Error:', error));
            break;
        case '/m':
            if (!isAdmin(message.from)) {
                botTextMessagReply(message, `You are not Admin.`)
                return
            }
            let mode = parseInt(sliced[1])
            if (mode == 1) {
                CONFIG.MODE = 1
                botTextMessagReply(message, `Usage Mode changed to: *${CONFIG.MODE == 1 ? 'Single User' : 'Multi User'}*`)
            }
            else if (mode == 2) {
                CONFIG.MODE = 2
                botTextMessagReply(message, `Usage Mode changed to: *${CONFIG.MODE == 1 ? 'Single User' : 'Multi User'}*`)
            }
            else {
                botTextMessagReply(message, `Invalid Mode.`)
            }
            break;
        case '/i':
            fetch(CONFIG.API_URL + "/interrupt", {
                method: 'POST',
            })
                .then(data => { botTextMessagReply(message, "Promt Interrupted.\n\n") })
                .catch(error => console.error('Error:', error));
            break;
        default:
            if (mode == 2) {
                botTextMessagReply(message, `Invalid command. Message */c*`)
            }
            break;
    }
}

//==================================== WA ======================================================

let options = {
    executablePath: CONFIG.CHROME,
    headless: true
}

if (!CONFIG.CHROME && CONFIG.CHROME.length == 0) {
    delete options.executablePath
}

CONFIG.WA = new Client({ authStrategy: new LocalAuth({ dataPath: CONFIG.BROWSER_DIRECTORY }), puppeteer: options })

CONFIG.WA.on('qr', (qr) => {
    CONFIG.QRCODE = qr
    qrcode.toFile(path.join(CONFIG.TEMP_DIRECTORY, 'qr.png'), qr, {
        color: {
            dark: '#000',
            light: '#fff'
        }
    }, (err) => {
        if (err) throw err;
        console.log('QR code generated successfully!');
    });
});

CONFIG.WA.on('ready', () => {
    CONFIG.READY = true
    if (CONFIG.ADMIN)
        botTextMessage(CONFIG.ADMIN, `ComfyUI Bot is *Online*.\n\nMessage */c* to start.\n\nUsage Mode: *${CONFIG.MODE == 1 ? 'Single User' : 'Multi User'}*`)
});

CONFIG.WA.on('message_create', message => {

    if (message.body.includes('🤖')) {
        return
    }

    if (CONFIG.MODE == 1 && message.id.fromMe == true) {
        setCommand(message)
    } else if (CONFIG.MODE == 1 && message.id.fromMe == false) {
        botTextMessagReply("I can't fulfill your request sorry 😅.")
    } else if (CONFIG.MODE == 2) {
        setCommand(message)
    }

});

// =================================== EXPRESS ========================================

CONFIG.EXPRESS.use(express.static(CONFIG.WEB_DIRECTORY))
CONFIG.EXPRESS.use(express.json());

CONFIG.EXPRESS.get('/ping', (req, res) => {
    return res.json({ TIME: +new Date() })
});

CONFIG.EXPRESS.get('/qr', (req, res) => {
    const qrImagePath = path.join(CONFIG.TEMP_DIRECTORY, 'qr.png');
    if (fs.existsSync(qrImagePath)) {
        return res.sendFile(path.resolve(qrImagePath));
    } else {
        return res.status(404).send("QR code image not found");
    }
});

CONFIG.EXPRESS.get('/ready', (req, res) => {
    return res.json({ ready: CONFIG.READY })
});

CONFIG.EXPRESS.post('/model', async (req, res) => {
    try {
        const data = req.body;
        const filename = data.name
        const filePath = path.join(CONFIG.MODELS_DIRECTORY, filename);
        await fsp.mkdir(CONFIG.MODELS_DIRECTORY, { recursive: true });
        await fsp.writeFile(filePath, JSON.stringify(data.data, null, 2), 'utf8');
        res.status(200).json({ success: true, message: 'Model data saved successfully' });
    } catch (error) {
        console.error('Error saving model data:', error);
        res.status(500).json({ success: false, message: 'Failed to save model data' });
    }
});

CONFIG.EXPRESS.get('/models', async (req, res) => {
    try {
        const files = await fsp.readdir(CONFIG.MODELS_DIRECTORY);
        const models = await Promise.all(files.map(async (file) => {
            const filePath = path.join(CONFIG.MODELS_DIRECTORY, file);
            const stats = await fsp.stat(filePath);
            return {
                name: file.split('.')[0],
                dateCreated: stats.mtime.toISOString()
            };
        }));
        res.status(200).json(models);
    } catch (error) {
        console.error('Error retrieving models:', error);
        res.status(500).json({ success: false, message: 'Failed to retrieve models' });
    }
});

CONFIG.EXPRESS.delete('/model/:name', async (req, res) => {
    try {
        const { name } = req.params;
        const filePath = path.join(CONFIG.MODELS_DIRECTORY, name + '.json');
        await fsp.unlink(filePath);
        res.status(200).json({ success: true, message: 'Model deleted successfully' });
    } catch (error) {
        console.error('Error deleting model:', error);
        res.status(500).json({ success: false, message: 'Failed to delete model' });
    }
});

CONFIG.EXPRESS.get('/', (req, res) => {
    return res.sendFile(path.join(__dirname, 'website', 'index.html'))
})

//==============================================INIT============================

let ON = true

if (ON) {
    createDirectories(CONFIG);
    CONFIG.WA.initialize()

    CONFIG.EXPRESS.listen(CONFIG.PORT, () => {
        console.log(`Server running at http://localhost:${CONFIG.PORT}`);
    });
}
