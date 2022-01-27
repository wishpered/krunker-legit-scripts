var pressedKeys = {};
var player;
var gameInstance;
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
    window.log("Hooking " + name);
    if (window.oldFuncs[name] == undefined) {
        window.oldFuncs[name] = prototype[funcName]
    }
    if (prototype[funcName] != window.oldFuncs[name]) {
        window.log("Hook " + name + " already exists ! rehooking...");
        prototype[funcName] = window.oldFuncs[name]
    }
    //hook
    hook(prototype, window.oldFuncs[name], () => {
        window.log("Unhooking " + name);
        prototype[funcName] = window.oldFuncs[name]
    });
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
    var d5 = (entity.y + 0.5 - entity.crouchVal * 3) - (localPlayer.y + localPlayer.jumpBobY);
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

function world2Screen(ctx, position) {
    let pos = position.clone();
    let scaledWidth = windowWidth / 1;
    let scaledHeight = windowHeight / 1;
    pos.project(camera);
    pos.x = (pos.x + 1) / 2;
    pos.y = (-pos.y + 1) / 2;
    pos.x *= scaledWidth;
    pos.y *= scaledHeight;
    return pos;

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
var playerList;
var context = this;
var frustum;
var camera;
var windowWidth = 0;
var windowHeight = 0;

function aimbotmomento() {
    var players = gameInstance.players.list;
    var bestDistance = 99999;
    let nearest = null;
    playerList = players;
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
    if (nearest == null || localPlayer.aimDir != 0) return;
    var rotToNearest = normalRotationToKrunker(getRotationsToEntity(nearest));
    //['canSee'](window['spectating'] && Iïìíîíì['spect']['target'] ? Iïìíîíì['spect']['target'] : Iíïîîiî, Iíîïîïí['x'], Iíîïîïí['y'], Iíîïîïí['z'])

    gameInstance.controls.pchObjc.rotation.x = rotToNearest.pitch
    gameInstance.controls.object.rotation.y = rotToNearest.yaw

    gameInstance.controls.pchObjc.rotation.x -= (localPlayer.recoilForce * 10) + 0.05
}

function onUpdate() {
    if (player == null || localPlayer != player) {
        player = localPlayer;
        oneTimeHooks();
    }
    aimbotmomento()
}

function onRender2D(ctx) {
    if (gameInstance == null || gameInstance.players == null) return

    gameInstance.players.list.forEach(player => {
        if (player.objInstances == null) return;
        if (player.isYou) return

        var pos = player.objInstances.position.clone();


        pos.y += 6;
        var playerPosOnScreen = world2Screen(ctx, pos)
        ctx.beginPath();
        ctx.moveTo(windowWidth / 2, windowHeight);
        ctx.lineTo(playerPosOnScreen.x, playerPosOnScreen.y);
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = "#eb5656"
        if (frustum.containsPoint(player.objInstances.position)) {
            ctx.strokeStyle = "#0ef212"
        }
        ctx.stroke();
    })

}

function oneTimeHooks() {
    //camera
    makeHook("project", Object.getPrototypeOf(localPlayer.objInstances.position), "project", (prototype, old, unhook) => {
        prototype.project = function (...args) {
            var ret = old.call(this, args[0])
            camera = args[0]
            unhook()
            return ret;
        }
    })
    //frustum
    makeHook("frustum", gameInstance.THREE.Frustum.prototype, "intersectsObject", (prototype, old, unhook) => {
        prototype.intersectsObject = function (...args) {
            var ret = old.call(this, args[0])
            frustum = this
            return ret;
        }
    })
}


function run() {
    // fillText(text: string, x: number, y: number, maxWidth?: number): void;
    makeHook("clearRect", CanvasRenderingContext2D.prototype, "clearRect", (prototype, old) => {
        prototype.clearRect = function (...args) {
            var ret = old.call(this, args[0], args[1], args[2], args[3])
            try {
                windowWidth = args[2]
                windowHeight = args[3]

                onRender2D(this)

            } catch (e) {
                window.log(e)
            }
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
                        onUpdate()
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
