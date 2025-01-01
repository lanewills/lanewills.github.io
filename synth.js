document.addEventListener("touchstart", function() {
    let width = window.innerWidth;
    let height = window.innerHeight;
    
    const audioContext = new window.AudioContext();
    
    const oscillators = [];
    const gainNodes = [];

    // One gain node for each quadrant
    for (let i = 0; i < 4; i++) {
        const gainNode = audioContext.createGain();
        gainNode.gain.value = 0;
        gainNode.connect(audioContext.destination);
        gainNodes[i] = gainNode;
    }

    // Three oscillators for each quadrant
    for(let i = 0; i < 12; i++) {
        const oscillator = audioContext.createOscillator();
        if (i == 0 || i == 1 || i == 2) {
            oscillator.type = "sawtooth";
            oscillator.connect(gainNodes[0]);
        } else if (i == 3 || i == 4 || i == 5) {
            oscillator.type = "square";
            oscillator.connect(gainNodes[1]);
        } else if (i == 6 || i == 7 || i == 8) {
            oscillator.type = "triangle";
            oscillator.connect(gainNodes[2]);
        } else {
            oscillator.type = "sine";
            oscillator.connect(gainNodes[3]);
        }
        oscillator.start(0);
        oscillators[i] = oscillator;
    }

    var coordinates = document.getElementById("coordinates");
    var verticalBar = document.getElementById("verticalBar");
    var horizontalBar = document.getElementById("horizontalBar");
    
    coordinates.style.color = "#000000";
    verticalBar.style.backgroundColor = "#000000";
    horizontalBar.style.backgroundColor = "#000000";

    document.ontouchmove = updateSynth;
    window.onresize = updateWH;
    window.ontouchend = disableSynth

    function disableSynth(e) {
        for (let i = 0; i < 4; i++) {
            gainNodes[i].gain.value = 0;
        }
        coordinates.style.color = "transparent";
        verticalBar.style.backgroundColor = "#FFFFFF";
        horizontalBar.style.backgroundColor = "#FFFFFF";
        
    }


    function updateSynth(e) {
        // Get cursor coordinates
        var x = e.touches[0].clientX;
        var y = e.touches[0].clientY;

        
        coordinates.textContent = `(${x}, ${y})`;
        coordinates.style.left = (x + 15) + "px";
        coordinates.style.top = (y + 15) + "px";
        
        verticalBar.style.left = x + "px";
        horizontalBar.style.top = y + "px";

        if (x <= width/2 && y <= height/2) {
            gainNodes[0].gain.value = 0.02;
            gainNodes[1].gain.value = 0;
            gainNodes[2].gain.value = 0;
            gainNodes[3].gain.value = 0.02;
            oscillators[0].frequency.value = (x/2);
            oscillators[1].frequency.value = (x/2) * (5/4);
            oscillators[2].frequency.value = (x/2) * (3/2);
            oscillators[9].frequency.value = (y/2);
            oscillators[10].frequency.value = (y/2) * (5/4);
            oscillators[11].frequency.value = (y/2) * (3/2);
        } else if (x >= width/2 && y <= height/2) {
            gainNodes[0].gain.value = 0.02;
            gainNodes[1].gain.value = 0.02;
            gainNodes[2].gain.value = 0;
            gainNodes[3].gain.value = 0;
            oscillators[0].frequency.value = (x/2);
            oscillators[1].frequency.value = (x/2) * (5/4);
            oscillators[2].frequency.value = (x/2) * (3/2);
            oscillators[3].frequency.value = (y/2);
            oscillators[4].frequency.value = (y/2) * (5/4);
            oscillators[5].frequency.value = (y/2) * (3/2);
        } else if (x <= width/2 && y >= height/2) {
            gainNodes[0].gain.value = 0;
            gainNodes[1].gain.value = 0.02;
            gainNodes[2].gain.value = 0.02;
            gainNodes[3].gain.value = 0;
            oscillators[3].frequency.value = (x/2);
            oscillators[4].frequency.value = (x/2) * (5/4);
            oscillators[5].frequency.value = (x/2) * (3/2);
            oscillators[6].frequency.value = (y/2);
            oscillators[7].frequency.value = (y/2) * (5/4);
            oscillators[8].frequency.value = (y/2) * (3/2);
        } else {
            gainNodes[0].gain.value = 0;
            gainNodes[1].gain.value = 0;
            gainNodes[2].gain.value = 0.02;
            gainNodes[3].gain.value = 0.02;
            oscillators[6].frequency.value = (x/2);
            oscillators[7].frequency.value = (x/2) * (5/4);
            oscillators[8].frequency.value = (x/2) * (3/2);
            oscillators[9].frequency.value = (y/2);
            oscillators[10].frequency.value = (y/2) * (5/4);
            oscillators[11].frequency.value = (y/2) * (3/2);
        }
    }

    function updateWH(e) {
        width = window.innerWidth;
        height = window.innerHeight;
    }
});


window.addEventListener("click", init);
let isSynthInit = false;

function init() {
    if (isSynthInit) {
        return;
    }
    let isOn = true;
    let width = window.innerWidth;
    let height = window.innerHeight;
    const audioContext = new window.AudioContext();
    const oscillators = [];
    const gainNodes = [];

    // One gain node for each quadrant
    for (let i = 0; i < 4; i++) {
        const gainNode = audioContext.createGain();
        gainNode.gain.value = 0;
        gainNode.connect(audioContext.destination);
        gainNodes[i] = gainNode;
    }

    // Three oscillators for each quadrant
    for(let i = 0; i < 12; i++) {
        const oscillator = audioContext.createOscillator();
        if (i == 0 || i == 1 || i == 2) {
            oscillator.type = "sawtooth";
            oscillator.connect(gainNodes[0]);
        } else if (i == 3 || i == 4 || i == 5) {
            oscillator.type = "square";
            oscillator.connect(gainNodes[1]);
        } else if (i == 6 || i == 7 || i == 8) {
            oscillator.type = "triangle";
            oscillator.connect(gainNodes[2]);
        } else {
            oscillator.type = "sine";
            oscillator.connect(gainNodes[3]);
        }
        oscillator.start(0);
        oscillators[i] = oscillator;
    }

    var coordinates = document.getElementById("coordinates");
    var verticalBar = document.getElementById("verticalBar");
    var horizontalBar = document.getElementById("horizontalBar");
    
    coordinates.style.color = "#000000";
    verticalBar.style.backgroundColor = "#000000";
    horizontalBar.style.backgroundColor = "#000000";

    document.onmousemove = updatePage;
    window.onresize = updateWH;
    window.onclick = toggleSynth;

    function toggleSynth(e) {
        for (let i = 0; i < 4; i++) {
            gainNodes[i].gain.value = 0;
        }
        if (isOn) {
            document.onmousemove = null;
            coordinates.style.color = "transparent";
            verticalBar.style.backgroundColor = "#FFFFFF";
            horizontalBar.style.backgroundColor = "#FFFFFF";
            isOn = false;
        } else {
            document.onmousemove = updatePage;
            coordinates.style.color = "#000000";
            verticalBar.style.backgroundColor = "#000000";
            horizontalBar.style.backgroundColor = "#000000";
            isOn = true;
        }
    }


    function updatePage(e) {
        // Get cursor coordinates
        var x = e.clientX;
        var y = e.clientY;

        
        coordinates.textContent = `(${x}, ${y})`;
        coordinates.style.left = (x + 15) + "px";
        coordinates.style.top = (y + 15) + "px";
        
        verticalBar.style.left = x + "px";
        horizontalBar.style.top = y + "px";

        if (x <= width/2 && y <= height/2) {
            gainNodes[0].gain.value = 0.02;
            gainNodes[1].gain.value = 0;
            gainNodes[2].gain.value = 0;
            gainNodes[3].gain.value = 0.02;
            oscillators[0].frequency.value = (x/2);
            oscillators[1].frequency.value = (x/2) * (5/4);
            oscillators[2].frequency.value = (x/2) * (3/2);
            oscillators[9].frequency.value = (y/2);
            oscillators[10].frequency.value = (y/2) * (5/4);
            oscillators[11].frequency.value = (y/2) * (3/2);
        } else if (x >= width/2 && y <= height/2) {
            gainNodes[0].gain.value = 0.02;
            gainNodes[1].gain.value = 0.02;
            gainNodes[2].gain.value = 0;
            gainNodes[3].gain.value = 0;
            oscillators[0].frequency.value = (x/2);
            oscillators[1].frequency.value = (x/2) * (5/4);
            oscillators[2].frequency.value = (x/2) * (3/2);
            oscillators[3].frequency.value = (y/2);
            oscillators[4].frequency.value = (y/2) * (5/4);
            oscillators[5].frequency.value = (y/2) * (3/2);
        } else if (x <= width/2 && y >= height/2) {
            gainNodes[0].gain.value = 0;
            gainNodes[1].gain.value = 0.02;
            gainNodes[2].gain.value = 0.02;
            gainNodes[3].gain.value = 0;
            oscillators[3].frequency.value = (x/2);
            oscillators[4].frequency.value = (x/2) * (5/4);
            oscillators[5].frequency.value = (x/2) * (3/2);
            oscillators[6].frequency.value = (y/2);
            oscillators[7].frequency.value = (y/2) * (5/4);
            oscillators[8].frequency.value = (y/2) * (3/2);
        } else {
            gainNodes[0].gain.value = 0;
            gainNodes[1].gain.value = 0;
            gainNodes[2].gain.value = 0.02;
            gainNodes[3].gain.value = 0.02;
            oscillators[6].frequency.value = (x/2);
            oscillators[7].frequency.value = (x/2) * (5/4);
            oscillators[8].frequency.value = (x/2) * (3/2);
            oscillators[9].frequency.value = (y/2);
            oscillators[10].frequency.value = (y/2) * (5/4);
            oscillators[11].frequency.value = (y/2) * (3/2);
        }
    }

    function updateWH(e) {
        width = window.innerWidth;
        height = window.innerHeight;
    }

    isSynthInit = true;
}





