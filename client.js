var pressedKeys = {};
var player;
var gameInstance;
var hooks = [];
var oldclearRect;
if (!window.oldFuncs) {
    window.oldFuncs = {}
}
window.addEventListener("keyup", function (e) {
    pressedKeys[e.code] = false;
})
window.addEventListener("keydown", function (e) {
    pressedKeys[e.code] = true;
});

function makeHook(name, prototype, funcName, hook) {
    if (window.oldFuncs[name] == undefined) {
        window.log("Hooking "+name);
        window.oldFuncs[name] = prototype[funcName]
    }
    if (prototype[funcName] != window.oldFuncs[name]) {
        window.log("Hook "+name+" already exists ! rehooking...");
        hooks[name] = prototype[funcName] = window.oldFuncs[name]
    }
    //hook
    hook(prototype, window.oldFuncs[name]);
}

function getDistance(x1, y1, z1, x2, y2, z2) {
    var d0 = x1 - x2;
    var d1 = y1 - y2;
    var d2 = z1 - z2;
    return Math.sqrt(d0 * d0 + d1 * d1 + d2 * d2);
}

function scale(valueIn, baseMin, baseMax, limitMin, limitMax) {
    return ((limitMax - limitMin) * (valueIn - baseMin) / (baseMax - baseMin)) + limitMin;
}

function getRotationsToEntity(entity) {
    var d4 = (entity.x) - localPlayer.x;
    var d5 = (entity.y - entity.crouchVal * 3) - (localPlayer.y - 1);
    var d6 = entity.z - localPlayer.z;
    var d7 = Math.sqrt(d4 * d4 + d6 * d6);
    var f = (Math.atan2(d6, d4) * 180.0 / Math.PI) - 90.0;
    var f2 = (-(Math.atan2(d5, d7) * 180.0 / Math.PI));
    return {
        yaw: f,
        pitch: f2
    };
}

function krunkerRotationToNormal(rotations) {
    return {
        yaw: scale(Math.abs(rotations.yaw), 0, 6.28, 0, 360),
        pitch: scale(rotations.pitch, -1.5707963267948966, 1.5707963267948966, 90, -90)
    }
}


function normalRotationToKrunker(rotations) {
    return {
        yaw: scale(rotations.yaw, 180, -180, 0, 6.28),
        pitch: scale(rotations.pitch + 1, 90, -90, -1.5707963267948966, 1.5707963267948966)
    }
}

function getDirection(player) {
    return krunkerRotationToNormal({
        yaw: player.xDire
    }).yaw / 180.0 * Math.PI;
}

function getSpeed(player) {
    return Math.sqrt(player.velocity.x * player.velocity.x + player.velocity.z * player.velocity.z)
}

function setSpeed(player, moveSpeed) {
    var direction = getDirection(player)
    player.velocity.x = -Math.sin(direction) * -moveSpeed;
    player.velocity.z = Math.cos(direction) * -moveSpeed;
}
/**
 * @type {CanvasRenderingContext2D}
 */
var ctx;

function aimbotmomento() {
    window.log()
    var players = gameInstance.players.list;
    var bestDistance = 99999;
    let nearest = null;
    players.forEach((player, index) => {
        if (!player.isYou) {
            player.cnBSeen = true;
        }
        if (player.isYou || player.health == 0 || gameInstance.canSee(player, localPlayer.x, localPlayer.y, localPlayer.z) || (localPlayer._team != null && localPlayer._team == player._team)) return;
        var dist = getDistance(localPlayer.x, localPlayer.y, localPlayer.z, player.x, player.y, player.z)
        if (dist < bestDistance) {
            nearest = player;
            bestDistance = dist;
        }
    })
    if (nearest == null /*|| localPlayer.aimDir != 0*/) return;
    var rotToNearest = normalRotationToKrunker(getRotationsToEntity(nearest));
    //['canSee'](window['spectating'] && Iïìíîíì['spect']['target'] ? Iïìíîíì['spect']['target'] : Iíïîîiî, Iíîïîïí['x'], Iíîïîïí['y'], Iíîïîïí['z'])

    gameInstance.controls.pchObjc.rotation.x = rotToNearest.pitch - 0.02
    gameInstance.controls.object.rotation.y = rotToNearest.yaw

    gameInstance.controls.pchObjc.rotation.x -= (localPlayer.recoilForce * 1)
}

function onUpdate() {
        if (player == null || localPlayer != player) {
            player = localPlayer;
        }
        
        aimbotmomento()
    
}


function run() {
    window.onUpdate = onUpdate;
// fillText(text: string, x: number, y: number, maxWidth?: number): void;
    makeHook("clearRect", CanvasRenderingContext2D.prototype, "clearRect", (prototype, old) => {
        prototype.clearRect = function (...args) {
            var ret =  old.call(this, args[0], args[1], args[2], args[3])
           // window.log(this)

            this.fillStyle = "black"
            this.fillRect(400, 40, 1000,100)
            this.stroke()
            this.font = "30px Segoe UI";
            this.fillStyle = "white"
            this.fillText("Nigger Client", 500, 50);
            this.beginPath();
            return ret;
        }
    })
    makeHook("parseFloat", window, "parseFloat", (prototype, old) => {
        prototype.parseFloat = function (number) {
            if (arguments.callee.caller != null) {
                var callerToString = "" + arguments.callee.caller.caller;
                if (callerToString.includes("['tmp']['updateRate']") && callerToString.includes("['detachedCam']")) {
                    try {
                        ctx = document.querySelector("canvas").getContext("2d");;
                        gameInstance = arguments.callee.caller.arguments[1];
                        localPlayer = gameInstance.tmpPlayer;
                        window.onUpdate();
                    } catch (e) {
                        window.log(e)
                    }
    
                }
            }
    
            return old.call(this, number);
        }
    })
    window.log("End init")
}
run();