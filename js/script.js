const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = 1100;
canvas.height = 500;

const gridRows = 5;
const gridCols = 9;
const cellWidth = 87;
const cellHeight = 80;
const gridOffsetX = 270;
const gridOffsetY = 50;

const plants = [];
const zombies = [];
let selectedPlant = null;
let gameOver = false;
setInterval(generateFallingSun, 10000);



const backgroundImage = new Image();
backgroundImage.src = 'media/images/patio.jpg';

const guisanteImage = new Image();
guisanteImage.src = 'media/images/guisante.png';

const girasolImage = new Image();
girasolImage.src = 'media/images/girasol.png';

const zombieImage = new Image();
zombieImage.src = 'media/images/zombie.png';

const nuezImage = new Image();
nuezImage.src = 'media/images/nuez.png';

const cerezaImage = new Image();
cerezaImage.src = 'media/images/cereza.png';

const proyectilImage = new Image();
proyectilImage.src = 'media/images/proyectil.png';

const solImage = new Image();
solImage.src = 'media/images/sol.png';

const palaImage = new Image();
palaImage.src = 'media/images/pala.png';

const sunCollectSound = new Audio('media/audio/sol.mp3');

const selectPlantSound = new Audio("media/audio/semilla.mp3");



const musicTracks = [
    'media/audio/Grasswalk.mp3',
    'media/audio/Watery_Graves.mp3'
    
];

function playSound(src, volume = 1.0) {
    const sound = new Audio(src);
    sound.volume = volume;
    sound.play();
}

let currentTrackIndex = 0;
const audio = new Audio();

audio.addEventListener('ended', () => {
    currentTrackIndex = (currentTrackIndex + 1) % musicTracks.length;
    audio.src = musicTracks[currentTrackIndex];
    audio.play();
});

document.addEventListener("click", () => {
    if (audio.paused) {
        audio.src = musicTracks[currentTrackIndex];
        audio.load();
        audio.play().catch(error => console.log("Reproducción bloqueada:", error));
    }
}, { once: true });

const plantHealth = {
    guisante: 800,
    girasol: 800,
    nuez: 10000
};

const plantCosts = {
    Lansaguisantes: 100,
    Girasol: 50,
    Nuez: 50,
    Cereza: 150
};

let fallingSuns = [];

function generateFallingSun() {
    const x = Math.random() * (canvas.width - 50); // Posición aleatoria en X
    const y = -50; // Empieza fuera de la pantalla
    const speed = 0.5; // Velocidad de caída

    fallingSuns.push({ x, y, speed });
}


class Sol {
    constructor(x, y) {
        this.x = x;
        this.y = y - 30; // Comienza más arriba
        this.targetY = y; // Posición final
        this.width = 40;
        this.height = 40;
        this.speedY = -2; // Movimiento inicial hacia arriba
        this.gravity = 0.1; // Efecto de caída
        this.landed = false; // Para saber si ya cayó
    }

    move() {
        if (!this.landed) {
            this.speedY += this.gravity;
            this.y += this.speedY;

            if (this.y >= this.targetY) {
                this.y = this.targetY;
                this.landed = true;
            }
        }
    }

    draw() {
        ctx.drawImage(solImage, this.x, this.y, this.width, this.height);
    }
}



class Guisante {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 20;
        this.height = 20;
        this.speed = 2;
    }
    move() {
        this.x += this.speed;
    }
    draw() {
        ctx.drawImage(proyectilImage, this.x, this.y, this.width, this.height);
    }
}


class Plant {
    constructor(col, row, image) {
        this.col = col;
        this.row = row;
        this.x = gridOffsetX + col * cellWidth;
        this.y = gridOffsetY + row * cellHeight;
        this.width = 60;
        this.height = 60;
        this.image = image;
        this.health = image === nuezImage ? plantHealth.nuez : plantHealth.guisante;
        this.intervals = []; // Guardar referencias a los intervalos

        if (image === girasolImage) {
            let sunInterval = setInterval(() => this.spawnSun(), 20000);
            this.intervals.push(sunInterval);
        }

        if (image === guisanteImage) {
            let shootInterval = setInterval(() => this.shoot(), 2000);
            this.intervals.push(shootInterval);
        }
    }

    draw() {
        ctx.drawImage(this.image, this.x + (cellWidth - this.width) / 2, this.y + (cellHeight - this.height) / 2, this.width, this.height);
    }

    shoot() {
        if (gameOver || !plants.includes(this)) return; // Evitar disparar si la planta ya no está en el array
        if (zombies.some(zombie => zombie.row === this.row)) {
            guisantes.push(new Guisante(this.x + this.width / 2, this.y + this.height / 3));
            
        }
    }

    spawnSun() {
        if (gameOver || !plants.includes(this)) return; // Evitar generar soles si la planta ya no está en el array
        const sunX = this.x + (cellWidth - 40) / 2;
        const sunY = this.y + (cellHeight - 40) / 2;
        soles.push(new Sol(sunX, sunY));
    }

    remove() {
        // Eliminar la planta del array de plantas
        const index = plants.indexOf(this);
        if (index !== -1) {
            plants.splice(index, 1);
        }

        // Detener cualquier intervalo en ejecución
        this.intervals.forEach(interval => clearInterval(interval));
        this.intervals = [];
    }
}



const guisantes = [];

const hitSounds = [
    'media/audio/hit.mp3',
    'media/audio/hit1.mp3'
];

let lastHitSoundTime = 0; // Variable global para controlar el tiempo entre sonidos

function playRandomHitSound() {
    const now = Date.now();
    
    if (now - lastHitSoundTime > 50) { 
        lastHitSoundTime = now;
        const randomIndex = Math.floor(Math.random() * hitSounds.length);
        playSound(hitSounds[randomIndex]);
    }
}

const zombieSounds = [
    'media/audio/groar.mp3',
    'media/audio/groar1.mp3'
];

// Función para reproducir un sonido aleatorio de zombi
function playRandomZombieSound() {
    const randomIndex = Math.floor(Math.random() * zombieSounds.length);
    playSound(zombieSounds[randomIndex], 0.8); // Volumen ajustado a 80%
}

// Iniciar sonidos aleatorios cada cierto tiempo
setInterval(() => {
    if (zombies.length > 0) { // Solo si hay zombis en pantalla
        playRandomZombieSound();
    }
}, 5000 + Math.random() * 5000); // Intervalo aleatorio entre 5s y 10s

const zombieDamage=100;
let zombieHealthIncrease = 0; // Incremento de vida de los zombis
let zombieSpeedIncrease = 0; // Incremento de velocidad de los zombis

class Zombie {
    constructor(x, row, speed = 0.04) { // Agregar parámetro de velocidad
        this.x = x;
        this.row = row;
        this.y = gridOffsetY + row * cellHeight + (cellHeight - 70) / 2;
        this.width = 90;
        this.height = 90;
        this.speed = speed + zombieSpeedIncrease; // Usar la velocidad pasada al constructor
        this.eating = false;
        this.targetPlant = null;
        this.health = 400 + zombieHealthIncrease; // Incrementar la vida de los zombis

        this.eatingSound = new Audio('media/audio/comiendo.mp3');
        this.eatingSound.loop = true;
        this.eatingSound.volume = 0.5;
        this.reachedEnd = false;
        playRandomZombieSound();
    }

    takeDamage(amount) {
        this.health -= amount;
        console.log(`🩸 Zombi recibió ${amount} de daño. Vida restante: ${this.health}`);
        playRandomHitSound(); // Reproducir sonido aleatorio de impacto
        if (this.health <= 0) {
            this.die();
        }
    }

    die() {
        this.eatingSound.pause();
        this.eatingSound.currentTime = 0;
        this.eating = false;
    
        if (this.targetPlant) {
            this.targetPlant = null;
        }
    
        const index = zombies.indexOf(this);
        if (index !== -1) {
            zombies.splice(index, 1);
            zombiesOnScreen--; // Reducir el contador de zombis en pantalla
            zombiesEliminados++; // Aumentar el contador de eliminaciones
            console.log(`🧟 Zombi eliminado. Total eliminados: ${zombiesEliminados}`);
            
            // Aumentar dificultad progresivamente
if (zombiesEliminados % 10 === 0) { 
    zombieSpeedIncrease += 0.04; // Aumenta un poco la velocidad
    zombieHealthIncrease += 100; // Aumenta la vida de los zombis
    console.log(`🔥 Dificultad aumentada: Vida +${zombieHealthIncrease}, Velocidad +${zombieSpeedIncrease}`);
}

        }
    }
    
    remove() {
        let index = zombies.indexOf(this);
        if (index !== -1) {
            zombies.splice(index, 1);
        }
    }

    move() {
        if (gameOver) return;
    
        if (!this.eating) {
            if (this.reachedEnd) {
                // Movimiento hacia la puerta (posición aproximada en la imagen)
                const doorX = 80; // Ajusta esto a la posición de la puerta en la imagen
                const doorY = 250; // Ajusta esto según la puerta en la imagen
                
                let dx = doorX - this.x;
                let dy = doorY - this.y;
                let distance = Math.sqrt(dx * dx + dy * dy);
    
                if (distance > 1) {
                    this.x += (dx / distance) * this.speed;
                    this.y += (dy / distance) * this.speed;
                } else {
                    gameOver = true; // Solo activamos gameOver cuando realmente llegue a la puerta
                    this.remove();
                    playSound("media/audio/noo.mp3")
                }
            } else {
                this.x -= this.speed; // Movimiento normal hacia la izquierda
                
                // Si el zombi llega al final del césped, activa su movimiento hacia la puerta
                if (this.x <= gridOffsetX - 20) {
                    this.reachedEnd = true;
                }
            }
        }
    }

    draw() {
        ctx.drawImage(zombieImage, this.x, this.y, this.width, this.height);
    }


    checkCollision() {
        if (this.eating) return;

        this.targetPlant = plants.find(plant =>
            plant.row === this.row &&
            Math.abs(this.x - plant.x) <= cellWidth / 2
        );

        if (this.targetPlant) {
            this.eating = true;
            this.eatingSound.play();
        
            let eatingInterval = setInterval(() => {
                if (this.targetPlant && plants.includes(this.targetPlant)) {
                    this.targetPlant.health -= zombieDamage;
                    if (this.targetPlant.health <= 0) {
                        clearInterval(eatingInterval);
                        this.targetPlant.remove();
                        
                        // Verifica si la planta sigue en la lista antes de eliminarla
                        const plantIndex = plants.indexOf(this.targetPlant);
                        if (plantIndex !== -1) {
                            plants.splice(plantIndex, 1);
                        }
        
                        this.eating = false;
                        this.targetPlant = null;
                        this.eatingSound.pause();
                        this.eatingSound.currentTime = 0;
                        playSound('media/audio/gulp.mp3');
                    }
                } else {
                    clearInterval(eatingInterval);
                    this.eating = false;
                    this.eatingSound.pause();
                    this.eatingSound.currentTime = 0;
                }
            }, 500);
        }
        
    }
}



let totalZombiesGenerated = 0; // Cuántos zombis se han generado en total
let maxZombiesAtOnce = 3; // Cantidad de zombis que pueden aparecer al mismo tiempo
let zombiesOnScreen = 0; // Cuántos zombis hay actualmente en pantalla
let zombiesEliminados = 0; // Contador de zombis eliminados

function spawnZombies(amount) {
    if (zombiesOnScreen >= maxZombiesAtOnce) return; // No genera si ya hay muchos

    let zombiesToSpawn = Math.min(amount, maxZombiesAtOnce - zombiesOnScreen);

    for (let i = 0; i < zombiesToSpawn; i++) {
        const row = Math.floor(Math.random() * gridRows);
        zombies.push(new Zombie(canvas.width, row, 0.08));
        zombiesOnScreen++;
        totalZombiesGenerated++;
    }
}





// Monitorea los zombis en pantalla y genera más cuando todos mueren
function checkZombieDeaths() {
    setInterval(() => {
        if (zombiesOnScreen === 0) { // Solo generar si ya no hay zombis en pantalla
            if (totalZombiesGenerated < 10) {
                spawnZombies(1); // Genera solo un zombi inicialmente
            }
        }
    }, 500);
}

function startZombieSpawn() {
    setTimeout(() => {
        if (totalZombiesGenerated === 0) {
            spawnZombies(1); // Solo uno al inicio
        }

        zombieSpawnInterval = setInterval(() => {
            if (zombiesOnScreen < maxZombiesAtOnce) {
                spawnZombies(1);
            }
        }, 8000); // Aumenta el tiempo de aparición

    }, 10000);
}





// Llamar esta función al iniciar el juego
startZombieSpawn();

// Detectar eliminación de zombis
function updateZombies() {
    let zombiesBefore = zombies.length;

    zombies = zombies.filter(zombie => zombie.health > 0); // Eliminar zombis muertos
    zombiesOnScreen = zombies.length;

    let zombiesKilled = zombiesBefore - zombiesOnScreen;
    zombiesEliminados += zombiesKilled;

    // Aumentar la velocidad cada 10 zombis eliminados
    if (zombiesEliminados > 0 && zombiesEliminados % 10 === 0) {
        zombieSpeedIncrease += 0.02; // Incremento de velocidad más gradual
    }
}







const plantOptions = [
    { name: "Lanzaguisantes", cost: 100, image: guisanteImage },
    { name: "Girasol", cost: 50, image: girasolImage },
    { name: "Nuez", cost: 50, image: nuezImage }
];

console.log("Después de definir:", plantOptions); // Debería mostrar los objetos


function drawPlantSelectionMenu() {
    const menuX = 20;
    const menuY = 100;
    const menuWidth = 120;
    const menuHeight = 370;

    ctx.fillStyle = "#693333";
    ctx.fillRect(menuX, menuY, menuWidth, menuHeight);

    plantOptions.forEach((plant, index) => {
        const yPosition = menuY + 10 + index * 90;
        const isSelected = selectedPlant && selectedPlant.name === plant.name;

        ctx.fillStyle = isSelected ? "#D4A017" : "#B5651D"; // Color más brillante si está seleccionada
        ctx.fillRect(menuX + 10, yPosition, 100, 80);

        ctx.drawImage(plant.image, menuX + 15, yPosition + 5, 70, 70);
        ctx.fillStyle = "#fff";
        ctx.font = "20px Arial";
        ctx.fillText(plant.cost, menuX + 75, yPosition + 70);

        // Si está seleccionada, dibujamos un borde amarillo
        if (isSelected) {
            ctx.strokeStyle = "yellow";
            ctx.lineWidth = 4;
            ctx.strokeRect(menuX + 10, yPosition, 100, 80);
        }
    });

    // Botón de la pala
const palaX = menuX + 10;
const palaY = menuY + plantOptions.length * 90 + 10; // Debajo de las plantas

ctx.fillStyle = selectedPlant === "pala" ? "#D4A017" : "#B5651D";
ctx.fillRect(palaX, palaY, 100, 80);
ctx.drawImage(palaImage, palaX + 15, palaY + 5, 70, 70);

// Si la pala está seleccionada, dibujar borde amarillo
if (selectedPlant === "pala") {
    ctx.strokeStyle = "yellow";
    ctx.lineWidth = 4;
    ctx.strokeRect(palaX, palaY, 100, 80);
}

}

function drawGameOverScreen() {
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)"; // Fondo semi-transparente
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#FF0000";
    ctx.font = "50px Arial";
    ctx.textAlign = "center";
    ctx.fillText("¡Te han comido los sesos!", canvas.width / 2, canvas.height / 2);

    ctx.fillStyle = "#FFFFFF";
    ctx.font = "25px Arial";
    ctx.fillText("Presiona F5 para reiniciar", canvas.width / 2, canvas.height / 2 + 50);
}



function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#FFD700";  
    ctx.font = "24px Arial";  
    ctx.fillText(`${sunPoints}`, 50, 40);

    function drawSunCounter() {
        const counterX = 30;  // Posición más alineada a la izquierda
        const counterY = 10;  // Un poco más arriba
    
        // Dibujar el rectángulo de fondo con bordes redondeados
        ctx.fillStyle = "#EEC85A"; 
        ctx.strokeStyle = "#A87926";
        ctx.lineWidth = 4;
    
        ctx.beginPath();
        ctx.moveTo(counterX, counterY);
        ctx.lineTo(counterX + 100, counterY);
        ctx.quadraticCurveTo(counterX + 120, counterY, counterX + 120, counterY + 20);
        ctx.lineTo(counterX + 120, counterY + 40);
        ctx.quadraticCurveTo(counterX + 120, counterY + 60, counterX + 100, counterY + 60);
        ctx.lineTo(counterX, counterY + 60);
        ctx.quadraticCurveTo(counterX - 20, counterY + 60, counterX - 20, counterY + 40);
        ctx.lineTo(counterX - 20, counterY + 20);
        ctx.quadraticCurveTo(counterX - 20, counterY, counterX, counterY);
        ctx.closePath();
    
        ctx.fill();
        ctx.stroke();
    
        // Dibujar el icono del sol
        ctx.drawImage(solImage, counterX + 10, counterY + 15, 30, 30);
    
        // Dibujar el número de soles
        ctx.fillStyle = "black";
        ctx.font = "28px Arial";
        ctx.textAlign = "right";
        ctx.fillText(`${sunPoints}`, counterX + 100, counterY + 42);
    }
    
    drawSunCounter();
    updateFallingSuns();


    drawPlantSelectionMenu();
    
    plants.forEach(plant => plant.draw());
    zombies.forEach(zombie => {
        if (!gameOver) zombie.move();
        zombie.checkCollision();
        zombie.move();
        zombie.draw();
    });
    guisantes.forEach((guisante, index) => {
        guisante.move();
        guisante.draw();
    
        zombies.forEach((zombie) => {
            if (
                zombie.row === Math.floor((guisante.y - gridOffsetY) / cellHeight) &&
                guisante.x >= zombie.x
            ) {
                zombie.takeDamage(100); // Ahora los zombis no mueren de un solo golpe
                guisantes.splice(index, 1); // Eliminar el guisante tras impacto
            }
        });
    });
    
    soles.forEach(sol => {
        sol.move();
        sol.draw();
    });
    
    function updateFallingSuns() {
        for (let i = 0; i < fallingSuns.length; i++) {
            fallingSuns[i].y += fallingSuns[i].speed; // Hacer que caigan
    
            // Dibujar el sol
            ctx.drawImage(solImage, fallingSuns[i].x, fallingSuns[i].y, 50, 50);
            
            // Si llegan al suelo, los eliminamos
            if (fallingSuns[i].y > canvas.height - 100) {
                fallingSuns.splice(i, 1);
                i--;
            }
        }
    }
    
    if (gameOver) {
        drawGameOverScreen();
        return; // Detiene la ejecución del juego
    }

    if (selectedPlant === "pala") {
        ctx.drawImage(palaImage, mouseX - 15, mouseY - 15, 30, 30);
    }
    
    requestAnimationFrame(gameLoop);
}
const soles = [];
let sunPoints = 50;


gameLoop();

document.addEventListener("click", (event) => { 
    const rect = canvas.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;
    const menuX = 20;
    const menuY = 100;

    const palaX = 20 + 10;
    const palaY = 100 + plantOptions.length * 90 + 10;
    if (mouseX >= palaX && mouseX <= palaX + 100 && mouseY >= palaY && mouseY <= palaY + 80) {
        selectedPlant = "pala";
        return;
    }

    // Si se hace clic en una planta con la pala seleccionada, eliminarla
    if (selectedPlant === "pala") {
        const col = Math.floor((mouseX - gridOffsetX) / cellWidth);
        const row = Math.floor((mouseY - gridOffsetY) / cellHeight);
        
        const plantIndex = plants.findIndex(p => p.col === col && p.row === row);
        if (plantIndex !== -1) {
            plants[plantIndex].remove();
            playSound("media/audio/plantar.mp3"); 
        }
        
        // Desseleccionar la pala después de usarla
        selectedPlant = null;
        return;
    }


    plantOptions.forEach((plant, index) => {
        const yPosition = menuY + 10 + index * 90;
        if (
            clickX >= menuX + 10 && clickX <= menuX + 110 &&
            clickY >= yPosition && clickY <= yPosition + 80
        ) {
            selectedPlant = selectedPlant && selectedPlant.name === plant.name ? null : { ...plant };
            selectPlantSound.play();
            console.log("Nueva planta seleccionada:", selectedPlant);
            return;
        }
    });
    

    for (let i = 0; i < fallingSuns.length; i++) {
        let sun = fallingSuns[i];
        if (clickX > sun.x && clickX < sun.x + 50 && clickY > sun.y && clickY < sun.y + 50) {
            sunPoints += 50; // Sumar puntos
            sunCollectSound.play(); // Reproducir sonido
            fallingSuns.splice(i, 1); // Eliminar sol
            i--;
            return; // Salir para evitar recoger múltiples
        }
    }


    soles.forEach((sol, index) => {
        if (
            event.clientX >= sol.x &&
            event.clientX <= sol.x + sol.width &&
            event.clientY >= sol.y &&
            event.clientY <= sol.y + sol.height
        ) {
            soles.splice(index, 1);
            playSound('media/audio/sol.mp3');
        }
    });

    // Verificar si el clic fue sobre un sol y recogerlo
    for (let i = 0; i < soles.length; i++) {
    const sol = soles[i];
    if (
        clickX >= sol.x &&
        clickX <= sol.x + sol.width &&
        clickY >= sol.y &&
        clickY <= sol.y + sol.height
    ) {
        playSound('media/audio/sol.mp3');
        sunPoints += 50;
        soles.splice(i, 1); // Eliminar el sol recolectado
        return; // Salir del evento para evitar conflictos con la selección de plantas
    }
    }


    if (selectedPlant) {
        const col = Math.floor((clickX - gridOffsetX) / cellWidth);
        const row = Math.floor((clickY - gridOffsetY) / cellHeight);
        if (col >= 0 && col < gridCols && row >= 0 && row < gridRows) {
            if (!plants.some(p => p.col === col && p.row === row)) {
                if (sunPoints >= selectedPlant.cost) {
                    plants.push(new Plant(col, row, selectedPlant.image));
                    sunPoints -= selectedPlant.cost;
                    playSound('media/audio/plantar.mp3');
                    selectedPlant = null;  // Deseleccionar después de plantar
                    
                } else {
                    playSound('media/audio/error.mp3');
                    console.log("No tienes suficientes soles para esta planta");
                }
            }
        }
    }
    });

    setInterval(() => {
    const row = Math.floor(Math.random() * gridRows);
    zombies.push(new Zombie(canvas.width, row));
}, 7000);

let mouseX = 0, mouseY = 0;
canvas.addEventListener("mousemove", (event) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = event.clientX - rect.left;
    mouseY = event.clientY - rect.top;
});



document.addEventListener("DOMContentLoaded", function () {
    // Verifica que estamos en juego.html antes de ejecutar el temporizador
    if (window.location.pathname.includes("juego.html")) {
        let startTime = Date.now(); // Guarda el tiempo de inicio
        let timerInterval;
        let maxSurvivalTime = localStorage.getItem("maxTime") || 0; // Recupera el récord máximo

        document.getElementById("maxTime").textContent = maxSurvivalTime; // Muestra el récord guardado

        function startTimer() {
            console.log("Iniciando temporizador...");
            
            // Obtener el tiempo máximo almacenado
            let maxTime = localStorage.getItem("maxTime") || 0;
            document.getElementById("maxTime").textContent = maxTime; // Mostrarlo al inicio
        
            timerInterval = setInterval(() => {
                let elapsedTime = Math.floor((Date.now() - startTime) / 1000);
                console.log("Tiempo sobrevivido:", elapsedTime);
        
                let timeSurvivedElement = document.getElementById("timeSurvived");
                let maxTimeElement = document.getElementById("maxTime");
        
                if (timeSurvivedElement) {
                    timeSurvivedElement.textContent = elapsedTime;
                }
        
                // Verificar si el tiempo actual supera el tiempo máximo guardado
                if (elapsedTime > maxTime) {
                    maxTime = elapsedTime;
                    localStorage.setItem("maxTime", maxTime); // Guardar nuevo máximo
                    if (maxTimeElement) {
                        maxTimeElement.textContent = maxTime;
                    }
                }
            }, 1000);
        }
        

        function stopTimer() {
            clearInterval(timerInterval);
            let finalTime = Math.floor((Date.now() - startTime) / 1000);
            
            // Comparar con el récord máximo y actualizar si es un nuevo récord
            if (finalTime > maxSurvivalTime) {
                maxSurvivalTime = finalTime;
                localStorage.setItem("maxTime", maxSurvivalTime); // Guarda el nuevo récord
                document.getElementById("maxTime").textContent = maxSurvivalTime;
            }
        }

        // Iniciar el contador automáticamente cuando se cargue juego.html
        startTimer();

        // Llamar a esta función cuando el jugador pierda
        window.onGameOver = function () {
            stopTimer();
            alert("¡Has perdido! Tiempo sobrevivido: " + document.getElementById("timeSurvived").textContent + " segundos.");
        };
    }
});

