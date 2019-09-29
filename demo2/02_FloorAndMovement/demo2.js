var scene, camera, renderer, mesh;
var meshFloor;

var keyboard = {};
var player = {height: 1.8, speed: 0.2, turnSpeed: Math.PI * 0.02 };
var USE_WIREFRAME = false;

function init () {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(90, 1280/720, 0.1, 1000);

  mesh = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshBasicMaterial({color: 0xff4444, wireframe: USE_WIREFRAME})
  );
  mesh.position.y += 1;
  scene.add(mesh);

  meshFloor = new THREE.Mesh(
    new THREE.PlaneGeometry(10, 10, 10, 10),
    new THREE.MeshBasicMaterial({color: 0xffffff, wireframe: USE_WIREFRAME})
  );
  meshFloor.rotation.x -= Math.PI / 2;
  scene.add(meshFloor);

  camera.position.set(0, player.height, -5);
  camera.lookAt(new THREE.Vector3(0, player.height, 0));

  renderer = new THREE.WebGLRenderer();
  renderer.setSize(1280, 720);
  document.body.appendChild(renderer.domElement);

  animate()
  var clientX = 0
  var clienty = 0
  document.body.addEventListener('mouseover', function (event) {
    clientX = event.clientX
    clienty = event.clientY
  })
  document.body.addEventListener('mousemove', function (event) {
    if (event.clientX - clientX > 0) {
      camera.rotation.y += player.turnSpeed;
    } else {
      camera.rotation.y -= player.turnSpeed;
    }
    if (event.clientY - clienty > 0) {
      camera.rotation.x += player.turnSpeed;
    } else {
      camera.rotation.x -= player.turnSpeed;
    }
    clientX = event.clientX;
    clienty = event.clientY;
  })
}

function animate () {
  requestAnimationFrame(animate);

  mesh.rotation.x += 0.01;
  mesh.rotation.y += 0.01;

  if (keyboard[87]) {
    camera.position.x -= Math.sin(camera.rotation.y) * player.speed;
    camera.position.z -= -Math.cos(camera.rotation.y) * player.speed;
  }

  if (keyboard[83]) {
    camera.position.x += Math.sin(camera.rotation.y) * player.speed;
    camera.position.z += -Math.cos(camera.rotation.y) * player.speed;
  }

  if (keyboard[65]) {
    camera.position.x += Math.sin(camera.rotation.y + Math.PI / 2) * player.speed;
    camera.position.z += -Math.cos(camera.rotation.y + Math.PI / 2) * player.speed;
  }

  if (keyboard[68]) {
    camera.position.x += Math.sin(camera.rotation.y - Math.PI / 2) * player.speed;
    camera.position.z += -Math.cos(camera.rotation.y - Math.PI / 2) * player.speed;
  }
  if (keyboard[37]) {
    camera.rotation.y -= player.turnSpeed;
  }
  if (keyboard[39]) {
    camera.rotation.y += player.turnSpeed;
  }

  if (keyboard[32]) {
      camera.position.y += Math.sin(camera.rotation.y + Math.PI / 2) * player.speed
  } else {
    if (camera.position.y > 1.8) {
      camera.position.y -= Math.sin(camera.rotation.y + Math.PI / 2) * player.speed
    }
  }

  renderer.render(scene, camera)
}


function keyDown(event) {
  keyboard[event.keyCode] = true;
}

function keyUp(event) {
  keyboard[event.keyCode] = false;
}

window.addEventListener('keydown', keyDown);
window.addEventListener('keyup', keyUp);

window.onload = init;