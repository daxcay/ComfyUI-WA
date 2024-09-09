class ComfyWA {
    constructor() {
        this.buttons = document.querySelectorAll(".menu .item");
        this.screens = document.querySelectorAll(".screen div");
        this.qrCodeContainer = document.querySelector('.qrcode');
        this.qrCodeContainerLoader = document.querySelector('.qrloading');
        this.imgElement = this.createElement('img', { display: "none" });
        this.textElement = this.createElement('span', { display: "none" });
        this.videoElement = this.createElement('video', { display: "none" });

        this.qrCodeContainer.append(this.imgElement, this.textElement, this.videoElement);
        this.qrCodeContainer.style.display = "none";

        this.connection = { watch: 0, loadTime: 0 };
        this.init();

        this.handleFiles = this.handleFiles.bind(this);
        this.deleteModel = this.deleteModel.bind(this);
        this.submitJsonToServer = this.submitJsonToServer.bind(this);

        const dropZone = document.getElementById('drop-zone');

        dropZone.addEventListener('dragover', (event) => {
            event.preventDefault();
            event.stopPropagation();
            dropZone.classList.add('hover');
        });

        dropZone.addEventListener('dragleave', (event) => {
            event.preventDefault();
            event.stopPropagation();
            dropZone.classList.remove('hover');
        });

        dropZone.addEventListener('drop', (event) => {
            event.preventDefault();
            event.stopPropagation();
            dropZone.classList.remove('hover');

            const files = event.dataTransfer.files;
            this.handleFiles(files);
        });
    }

    createElement(tag, styles = {}) {
        const element = document.createElement(tag);
        Object.assign(element.style, styles);
        return element;
    }

    async handleFiles(files) {
        files = Array.from(files);
        console.log(files)
        for (const file of files) {
            if (file.type === 'application/json') {
                const reader = new FileReader();
                reader.onload = async (e) => {
                    try {
                        const json = JSON.parse(e.target.result);
                        // console.log('JSON file content:', json);
                        const cleanedName = file.name.split('.')[0].replace(/[^a-zA-Z0-9.]/g, '').replace(/\s+/g, '_').substr(0,16);
                        await this.submitJsonToServer(json, cleanedName+".json");
                        this.fetchModels()
                    } catch (err) {
                        console.error('Invalid JSON file:', err);
                    }
                };
                reader.readAsText(file);
            } else {
                alert('Please drop a JSON file.');
            }
        }
    }

    formatDateToDDMMYYYY(isoDateString) {
        const date = new Date(isoDateString);

        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();

        return `${day}-${month}-${year}`;
    }

    async fetchModels() {
        try {
            const response = await fetch('/models');
            if (!response.ok) throw new Error('Failed to fetch models');
            const models = await response.json();
            const tableBody = document.querySelector('#models-table tbody');
            tableBody.innerHTML = '';
            models.forEach(model => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${model.name}</td>
                    <td>${this.formatDateToDDMMYYYY(model.dateCreated)}</td>
                    <td>
                        <button class="delete-btn" data-name="${model.name}">Delete</button>
                    </td>
                `;
                tableBody.appendChild(row);
            });
            this.addDeleteEventListeners();
        } catch (error) {
            console.error('Error fetching models:', error);
        }
    }

    addDeleteEventListeners() {
        const deleteButtons = document.querySelectorAll('.delete-btn');
        deleteButtons.forEach(button => {
            button.addEventListener('click', () => {
                const name = button.getAttribute('data-name');
                this.deleteModel(name);
            });
        });
    }

    async deleteModel(name) {
        try {
            const response = await fetch(`/model/${name}`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error('Failed to delete model');
            this.fetchModels();
        } catch (error) {
            console.error('Error deleting model:', error);
            alert('Failed to delete model');
        }
    }

    async submitJsonToServer(jsonData, name) {
        try {
            const response = await fetch('/model', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ data:jsonData, name })
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const result = await response.json();
            console.log('Server response:', result);
        } catch (error) {
            console.error('Error submitting JSON to server:', error);
        }
    }

    init() {
        this.buttons.forEach(button => {
            button.addEventListener("click", () => this.activateScreen(button.id));
        });
        this.activateScreen("connection");
    }

    async updateQrCode() {
        try {
            const response = await fetch('/qr');
            if (response.ok) {
                const blob = await response.blob();
                this.imgElement.src = URL.createObjectURL(blob);
                this.imgElement.style.display = "block";
            } else {
                throw new Error("QR code image not found");
            }
        } catch (error) {
            this.imgElement.style.display = "none";
        }
    }

    async watchAction(id) {
        if (id !== 'connection') return;

        const status = await fetch("ready").then(res => res.json());

        if (!status.ready) {
            this.showQrCode();

            if (this.connection.watch > 0) {
                this.connection.loadTime--;
                setTimeout(() => this.watchAction(id), 1000);
            }

        } else {
            this.showVideo();
        }
    }

    async showQrCode() {
        if (this.connection.loadTime < 0) {
            this.qrCodeContainerLoader.style.display = "none";
            this.qrCodeContainer.style.display = "flex";

            this.imgElement.style.display = "block";
            this.textElement.textContent = "Scan From WhatsApp";
            this.textElement.style.display = "block";

            this.videoElement.style.display = "none";

            this.updateQrCode();
        }
    }

    async showVideo() {
        this.qrCodeContainerLoader.style.display = "none";
        this.qrCodeContainer.style.display = "flex";

        this.textElement.style.display = "none";
        this.imgElement.style.display = "none";

        this.textElement.textContent = "WhatsApp is Connected!";
        this.textElement.style.display = "block";

        this.videoElement.src = "./linked.mp4";
        this.videoElement.autoplay = true;
        this.videoElement.muted = true;
        this.videoElement.style.display = "block";
    }

    async screenFunctions(id) {
        this.videoElement.src = "";
        this.connection.watch = 0;
        this.textElement.style.display = "none"

        if (id === 'connection') {
            const ping = await fetch("ping").then(res => res.json());

            if (ping) {
                this.connection.watch = 1;
                this.connection.loadTime = 10;
                this.watchAction(id);
            }
        } else if (id == 'models') {
            this.fetchModels()
        }
    }

    activateScreen(id) {
        this.buttons.forEach(button => button.classList.remove("active"));
        this.screens.forEach(screen => {
            if (screen.dataset.screen == 1) {
                screen.classList.remove("active");
                setTimeout(() => {
                    if (screen.dataset.id !== id) {
                        screen.style.display = "none";
                    } else {
                        const activeButton = document.getElementById(id);
                        activeButton.classList.add("active");
                        const activeScreen = document.querySelector(`.screen div[data-id="${id}"]`);
                        activeScreen.style.display = "flex";
                        setTimeout(() => activeScreen.classList.add("active"), 20);
                    }
                }, 10);
            }
        });
        this.screenFunctions(id);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    new ComfyWA();
});
