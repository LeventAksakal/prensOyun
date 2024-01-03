<template>
    <main>

        <div v-if="showModal" class="overlay">
            <div class="modal">
                <h1>Position your ships</h1>
                <div class="modal-container">

                    <div class="grid">
                        <div v-for="(row, rowIndex) in grid" :key="rowIndex" class="grid-row">
                            <div v-for="(column, colIndex) in row" :key="colIndex" :id="(rowIndex * 10 + colIndex)"
                                class="cell" @mouseenter="handleMouseEnter(rowIndex, colIndex)"
                                @mouseleave="handleMouseLeave(rowIndex, colIndex)" @dragover="dragOver" @drop="dropShip"
                                :style="{ backgroundColor: cellColor[rowIndex][colIndex] }">
                                <div v-if="state.pong.isHost && game.shipIndices.includes(rowIndex * columns + colIndex)"
                                    class="shipSegment"></div>
                                <div v-if="state.pong.isGuest && game.shipIndicesEnemy.includes(rowIndex * columns + colIndex)"
                                    class="shipSegment"></div>
                            </div>
                        </div>
                    </div>
                    <div class="options" :style="{ transform: `rotate(${rotation}deg)` }">
                        <div ref="ships" class="preview ship1" id="0" size="2" draggable="true" v-if="render0"
                            @dragstart="dragStart" @dragend="dragEnd"></div>
                        <div ref="ships" class="preview ship2" id="1" size="3" draggable="true" v-if="render1"
                            @dragstart="dragStart" @dragend="dragEnd"></div>
                        <div ref="ships" class="preview ship3" id="2" size="3" draggable="true" v-if="render2"
                            @dragstart="dragStart" @dragend="dragEnd"></div>
                        <div ref="ships" class="preview ship4" id="3" size="4" draggable="true" v-if="render3"
                            @dragstart="dragStart" @dragend="dragEnd"></div>
                        <div ref="ships" class="preview ship5" id="4" size="5" draggable="true" v-if="render4"
                            @dragstart="dragStart" @dragend="dragEnd"></div>
                    </div>
                </div>

                <button @click="rotateShips">Rotate</button>
                <button @click="confirm">Confirm</button>

            </div>
        </div>
        <div v-if="(state.pong.isHost && !state.battleship.turn) || (state.pong.isGuest && state.battleship.turn)" class="turnOverlay">
            <h1 class="h1">Your Opponent's Turn To Shoot!</h1>
        </div>
        <div v-if="(state.battleship.score==17 || state.battleship.score==17)" class="endOverlay" >
            <h1 v-if="(state.battleship.score==17)" class="h1">Host Wins the Game!!!</h1>
            <h1 v-if="(state.battleship.scoreEnemy==17)" class="h1">Guest Wins the Game!!!</h1>
        </div>
        <div class="grid-container">
            <h1>Player field:</h1>
            <div class="grid">
                <div v-for="(row, rowIndex) in grid" :key="rowIndex" class="grid-row">
                    <div v-for="(column, colIndex) in row" :key="colIndex" :id="(rowIndex * 10 + colIndex)" class="cell"
                        :style="{ backgroundColor: cellColor[rowIndex][colIndex] }">
                        <div v-if="state.pong.isHost && game.shipIndices.includes(rowIndex * columns + colIndex)"
                            class="shipSegment"></div>
                        <div v-if="state.pong.isGuest && game.shipIndicesEnemy.includes(rowIndex * columns + colIndex)"
                            class="shipSegment"></div>

                        <div v-if="state.pong.isHost && game.shipIndices.includes(rowIndex * columns + colIndex) && state.battleship.hitsEnemy.includes(rowIndex * columns + colIndex)"
                            class="redCircle"></div>
                        <div v-if="state.pong.isGuest && game.shipIndicesEnemy.includes(rowIndex * columns + colIndex) && state.battleship.hits.includes(rowIndex * columns + colIndex)"
                            class="redCircle"></div>
                        <div v-if="state.pong.isHost  && !game.shipIndices.includes(rowIndex * columns + colIndex) && state.battleship.hitsEnemy.includes(rowIndex * columns + colIndex)"
                            class="circle"></div>
                        <div v-if="state.pong.isGuest && !game.shipIndicesEnemy.includes(rowIndex * columns + colIndex) && state.battleship.hits.includes(rowIndex * columns + colIndex)"
                            class="circle"></div>
                    </div>
                </div>
            </div>
            <h1>Enemy field:</h1>
            <div class="grid-enemy">
                <div v-for="(rowEnemy, rowIndex) in gridEnemy" :key="rowIndex" class="grid-row-enemy">

                    <div v-for="(column, colIndex) in rowEnemy" :key="colIndex" class="grid-cell-enemy"
                        @click="handleCellClickEnemy(rowIndex, colIndex)" @mouseenter="handleMouseEnter(rowIndex, colIndex)"
                        @mouseleave="handleMouseLeave(rowIndex, colIndex)"
                        :style="{ backgroundColor: cellColorEnemy[rowIndex][colIndex] }">

                        <div v-if="state.pong.isHost && redIndicesEnemy.includes(rowIndex * columns + colIndex) && !state.battleship.shipIndicesEnemy.includes(rowIndex * columns + colIndex)"
                            class="circle"></div>
                            
                        <div v-if="state.pong.isHost && redIndicesEnemy.includes(rowIndex * columns + colIndex) && state.battleship.shipIndicesEnemy.includes(rowIndex * columns + colIndex)"
                            class="redCircle"></div>

                        <div v-if="state.pong.isGuest && redIndicesEnemy.includes(rowIndex * columns + colIndex) && !state.battleship.shipIndices.includes(rowIndex * columns + colIndex)"
                            class="circle"></div>
                        <div v-if="state.pong.isGuest && redIndicesEnemy.includes(rowIndex * columns + colIndex) && state.battleship.shipIndices.includes(rowIndex * columns + colIndex)"
                            class="redCircle"></div>

                    </div>
                </div>
            </div>
        </div>
    </main>
</template>




<script setup>
import { ref, reactive, onMounted, watch, onUnmounted, computed } from 'vue'
import { state, socket } from '../socket.js'
//*********************************************************************************************************************
const roomId = window.location.pathname.split('/')[1]
socket.emit('join-room', roomId)

function endGame() {
    socket.emit('game-end', roomId)
}


const grid = ref([]);
const gridEnemy = ref([]);
const rows = 10;
const columns = 10;
const cellColor = ref([]);
const cellColorEnemy = ref([]);

const redIndices = ref([]);
const redIndicesEnemy = ref([]);

let showModal = ref(true);

let isHorizonal = ref(true);

const rotation = ref(90);
let draggedShip = null;

let render0 = ref(true);
let render1 = ref(true);
let render2 = ref(true);
let render3 = ref(true);
let render4 = ref(true);



const game = reactive({

    hits: reactive([]), 
    hitsEnemy: reactive([]),

    shipIndices: reactive([]),
    shipIndicesEnemy: reactive([])
})


const createGrid = () => {
    for (let i = 0; i < rows; i++) {
        const row = [];
        const colorRow = [];
        for (let j = 0; j < columns; j++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.id = i;
            row.push(cell);
            colorRow.push('');
        }
        grid.value.push(row);
        cellColor.value.push(colorRow);
    }
};

const createGridEnemy = () => {
    for (let i = 0; i < rows; i++) {
        const rowEnemy = [];
        const colorRowEnemy = [];
        for (let j = 0; j < columns; j++) {
            rowEnemy.push('');
            colorRowEnemy.push('');
        }
        gridEnemy.value.push(rowEnemy);
        cellColorEnemy.value.push(colorRowEnemy);
    }
};


const handleCellClick = (rowIndex, colIndex) => {

    console.log(`Clicked on cell (${rowIndex}, ${colIndex}, ${id})`);

    redIndices.value.push(rowIndex * columns + colIndex);
};
const handleCellClickEnemy = (rowIndex, colIndex) => { 
    console.log(`Clicked on cell (${rowIndex}, ${colIndex})`);

    redIndicesEnemy.value.push(rowIndex * columns + colIndex);

    if (state.pong.isHost) {
        if(!game.hits.includes(rowIndex * columns + colIndex)){
            game.hits.push(rowIndex * columns + colIndex)
            socket.emit('hit-update', roomId, game.hits)
            socket.emit('turn-pass', roomId)
            if(state.battleship.shipIndicesEnemy.includes(rowIndex * columns + colIndex)){
                socket.emit('score', roomId)
            }

            
        }
    } if (state.pong.isGuest) {
        if (!game.hitsEnemy.includes(rowIndex * columns + colIndex)) {
            game.hitsEnemy.push(rowIndex * columns + colIndex)
            socket.emit('hit-update-guest', roomId, game.hitsEnemy)
            socket.emit('turn-pass-guest', roomId)
            if(state.battleship.shipIndices.includes(rowIndex * columns + colIndex)){
                socket.emit('score-guest', roomId)
            }
        }
        
    }

};
const handleMouseEnter = (rowIndex, colIndex) => {
    // Change the color when the mouse enters the cell
    cellColorEnemy.value[rowIndex][colIndex] = 'lightblue';
};
const handleMouseLeave = (rowIndex, colIndex) => {
    // Change the color back when the mouse leaves the cell
    cellColorEnemy.value[rowIndex][colIndex] = '';
};

function rotateShips() {
    rotation.value = 90 - (rotation.value / 90) * 90;
    isHorizonal = !isHorizonal;
}

function dragStart(event) {
    draggedShip = event.target;
}

function dragEnd() {
    draggedShip = null;
}

function dragOver(e) {
    e.preventDefault();
}

function dropShip(e) {
    const startId = e.target.id;
    let size = 0;

    if (draggedShip.id == 0) {
        size = 2;

    } else if (draggedShip.id == 1) {
        size = 3;

    } else if (draggedShip.id == 2) {
        size = 3;

    } else if (draggedShip.id == 3) {
        size = 4;

    } else if (draggedShip.id == 4) {
        size = 5;
    }
    const coll = startId % 10;
    const row = (startId - coll) / 10;

    //horizontal
    if (isHorizonal && coll + size < 11) {
        for (let i = 0; i < size; i++) {
            let valueToCheck = parseInt(startId) + i;
            
            if (state.pong.isHost && game.shipIndices.includes(valueToCheck)) {
                
                return;
            } else if (state.pong.isGuest && game.shipIndicesEnemy.includes(valueToCheck)) {
                
                return;
            } else {
                
            }

        }
        for (let i = 0; i < size; i++) {
            let valueToPush = parseInt(startId) + i;
           
            if (state.pong.isHost) {
                game.shipIndices.push(valueToPush);
            } else if (state.pong.isGuest) {
                game.shipIndicesEnemy.push(valueToPush);
            }
        }
        if (draggedShip.id == 0) {
            render0 = false
        } else if (draggedShip.id == 1) {
            render1 = false
        } else if (draggedShip.id == 2) {
            render2 = false
        } else if (draggedShip.id == 3) {
            render3 = false
        } else if (draggedShip.id == 4) {
            render4 = false
        }

    //vertical
    } else if (!isHorizonal && row + size < 11) {
        for (let i = 0; i < size; i++) {
            let valueToCheck = parseInt(startId) + i * 10;
            if (state.pong.isHost && game.shipIndices.includes(valueToCheck)) {
                return;
            } else if (state.pong.isGuest && game.shipIndicesEnemy.includes(valueToCheck)) {
                return;
            } else {
            }
        }
        for (let i = 0; i < size; i++) {
            let valueToPush = parseInt(startId) + i * 10;

            if (state.pong.isHost) {
                game.shipIndices.push(valueToPush);
            } else if (state.pong.isGuest) {
                game.shipIndicesEnemy.push(valueToPush);
            }
        }

        if (draggedShip.id == 0) {
            render0 = false
        } else if (draggedShip.id == 1) {
            render1 = false
        } else if (draggedShip.id == 2) {
            render2 = false
        } else if (draggedShip.id == 3) {
            render3 = false
        } else if (draggedShip.id == 4) {
            render4 = false
        }

    }
}
function confirm() { 
    if(!render0 && !render1 && !render2 && !render3 && !render4){
        showModal.value = false;
        if (state.pong.isHost) {
            socket.emit('ship-update', roomId, game.shipIndices)
        
        } if (state.pong.isGuest) {
            socket.emit('ship-update-guest', roomId, game.shipIndicesEnemy)
            
        }
    }
}

onMounted(() => {
    createGrid();
    createGridEnemy();
});
watch(state.battleship.hitsEnemy, (newHits,oldHits) => {
    game.hitsEnemy = newHits
});
watch(state.battleship.shipIndicesEnemy, (newShipIndicesEnemy,oldHits) => {
    console.log(newShipIndicesEnemy,"OLD")
    console.log(game.shipIndicesEnemy,"OLD TEST")
    game.shipIndicesEnemy = newShipIndicesEnemy
    console.log(newShipIndicesEnemy,"NEW")
    console.log(game.shipIndicesEnemy,"NEW TEST")
});
watch(state.battleship.hits, (newHits,oldHits) => {
    game.hits = newHits
});
watch(state.battleship.shipIndices, (newShipIndices,oldHits) => {
    console.log(newShipIndices,"OLD")
    console.log(game.shipIndicesEnemy,"OLD TEST")
    game.shipIndices = newShipIndices
    console.log(newShipIndices,"NEW")
    console.log(game.shipIndices,"TEST")
});
</script>

<style scoped>
main {
    background-color: rgb(138, 209, 231);
    height: 100vh;
    width: 100vw;
    display: flex;
    align-items: center;
    justify-content: center;
}

div {
    text-align: center;
}

.grid {
    display: flex;
    flex-direction: column;
    padding: 10px;
}

.grid-enemy {
    display: flex;
    flex-direction: column;
    padding: 10px;
}

.grid-row {
    display: flex;
}

.grid-row-enemy {
    display: flex;
}

.cell {
    position: relative;
    width: 40px;
    height: 40px;
    border: 3px solid #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
}

.grid-cell-enemy {
    position: relative;
    width: 40px;
    height: 40px;
    border: 3px solid #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
}

.modal .cell {
    position: relative;
    width: 40px;
    height: 40px;
    border: 3px solid rgb(0, 0, 0);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
}

.grid-container {
    display: flex;
    flex-wrap: wrap;
}

.modal-container {
    display: flex;
    flex-wrap: wrap;
}

.options {
    width: 300px;
    height: 300px;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    flex-direction: row;

}


.ship1 {
    margin: 5px;
    position: relative;
    width: 40px;
    height: 80px;
    border: 3px solid rgb(0, 0, 0);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    background-color: rgb(60, 60, 60);
}

.ship2 {
    margin: 5px;
    position: relative;
    width: 40px;
    height: 120px;
    border: 3px solid rgb(0, 0, 0);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    background-color: rgb(60, 60, 60);
}

.ship3 {
    margin: 5px;
    position: relative;
    width: 40px;
    height: 120px;
    border: 3px solid rgb(0, 0, 0);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    background-color: rgb(60, 60, 60);
}

.ship4 {
    margin: 5px;
    position: relative;
    width: 40px;
    height: 160px;
    border: 3px solid rgb(0, 0, 0);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    background-color: rgb(60, 60, 60);
}

.ship5 {
    margin: 5px;
    position: relative;
    width: 40px;
    height: 200px;
    border: 3px solid rgb(0, 0, 0);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    background-color: rgb(60, 60, 60);
}




.shipSegment {
    position: absolute;
    width: 40px;
    height: 40px;
    background-color: rgb(71, 71, 71);
}

.redShipSegment {
    position: absolute;
    width: 40px;
    height: 40px;
    background-color: red;
}

.circle {
    position: absolute;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background-color: rgb(32, 30, 30);
}

.redCircle {
    position: absolute;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background-color: red;
}



.overlay {
    position: absolute;
    width: 100%;
    height: 100%;
    background-color: rgb(0, 0, 0, 0.77);
    z-index: 10;
    align-items: center;
    display: flex;
    justify-content: center;
}
.turnOverlay {
    position: absolute;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.2);
    z-index: 9;
    align-items: center;
    display: flex;
    justify-content: center;
}
.endOverlay {
    position: absolute;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.30);
    z-index: 11;
    align-items: center;
    display: flex;
    justify-content: center;
}
.h1{
    width: 750px;
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;;
    background-color: chocolate;
    color: white;
    border: 3px solid rgb(0, 0, 0)
}

.modal {
    width: 800px;
    background-color: white;
    border-radius: 10px;
    padding: 30px;
    position: relative;
    display: flex;
    flex-direction: column;
}

.modal button {
    padding: 10px 20px;
    font-size: 20px;
    width: 100%;
    background-color: rgb(108, 2, 2);
    border: none;
    color: white;
    cursor: pointer;
    margin-top: 15px;

}</style>