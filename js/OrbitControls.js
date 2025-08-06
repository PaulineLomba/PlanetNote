function OrbitControls(object, domElement) {
  const scope = this;

  this.object = object;
  this.domElement = domElement;
  this.enabled = true;
  this.target = new THREE.Vector3();

  const rotateStart = new THREE.Vector2();
  const rotateEnd = new THREE.Vector2();
  const rotateDelta = new THREE.Vector2();

  const spherical = new THREE.Spherical();
  const sphericalDelta = new THREE.Spherical();

  this.update = function () {
    const offset = new THREE.Vector3();
    offset.copy(scope.object.position).sub(scope.target);
    spherical.setFromVector3(offset);

    spherical.theta += sphericalDelta.theta;
    spherical.phi += sphericalDelta.phi;

    spherical.makeSafe();
    offset.setFromSpherical(spherical);
    scope.object.position.copy(scope.target).add(offset);
    scope.object.lookAt(scope.target);
    sphericalDelta.set(0, 0, 0);
  };

  function onMouseMove(event) {
    if (!scope.enabled) return;
    rotateEnd.set(event.clientX, event.clientY);
    rotateDelta.subVectors(rotateEnd, rotateStart).multiplyScalar(0.005);
    sphericalDelta.theta -= rotateDelta.x;
    sphericalDelta.phi -= rotateDelta.y;
    rotateStart.copy(rotateEnd);
  }

  function onMouseDown(event) {
    if (!scope.enabled) return;
    rotateStart.set(event.clientX, event.clientY);
    domElement.addEventListener('mousemove', onMouseMove, false);
  }

  function onMouseUp() {
    domElement.removeEventListener('mousemove', onMouseMove, false);
  }

  domElement.addEventListener('mousedown', onMouseDown, false);
  domElement.addEventListener('mouseup', onMouseUp, false);
}
