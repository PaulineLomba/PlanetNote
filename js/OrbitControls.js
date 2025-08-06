/**
 * @author ...
 * Three.js OrbitControls
 */
(function() {

    const THREE = window.THREE;

    if ( ! THREE ) {
        console.error( 'OrbitControls requires Three.js.' );
        return;
    }

    function OrbitControls( object, domElement ) {

        this.object = object;
        this.domElement = domElement !== undefined ? domElement : document;

        this.enabled = true;

        // réglages de rotation
        this.enableRotate = true;
        this.rotateSpeed = 1.0;

        this.enableZoom = true;
        this.zoomSpeed = 1.2;

        this.enablePan = true;
        this.panSpeed = 0.3;

        // interne
        let state = STATE.NONE;
        let EPS = 0.000001;
        let spherical = new THREE.Spherical();
        let sphericalDelta = new THREE.Spherical();

        let scale = 1, panOffset = new THREE.Vector3(), zoomChanged = false;

        this.update = function () {

            const offset = new THREE.Vector3();
            offset.copy( this.object.position ).sub( this.target );

            spherical.setFromVector3( offset );

            spherical.theta += sphericalDelta.theta;
            spherical.phi += sphericalDelta.phi;
            spherical.makeSafe();
            spherical.radius *= scale;

            spherical.radius = Math.max( this.minDistance, Math.min( this.maxDistance, spherical.radius ) );

            offset.setFromSpherical( spherical );
            this.object.position.copy( this.target ).add( offset );

            this.object.lookAt( this.target );

            if ( zoomChanged || panOffset.lengthSq() > EPS ) {
                zoomChanged = false;
                panOffset.set( 0, 0, 0 );
            }
            sphericalDelta.set( 0, 0, 0 );
            scale = 1;

        };

        // __ Target initialisé sur l’objet camera
        this.target = new THREE.Vector3();

        this.minDistance = 0;
        this.maxDistance = Infinity;

        // événements souris et touches
        const scope = this;
        const dom = this.domElement;

        function onMouseDown( event ) {
            if ( scope.enabled === false ) return;
            event.preventDefault();
            if ( event.button === 0 && scope.enableRotate ) {
                state = STATE.ROTATE;
                rotateStart.set( event.clientX, event.clientY );
            } else if ( event.button === 1 && scope.enableZoom ) {
                state = STATE.DOLLY;
                dollyStart.set( event.clientX, event.clientY );
            } else if ( event.button === 2 && scope.enablePan ) {
                state = STATE.PAN;
                panStart.set( event.clientX, event.clientY );
            }
            if ( scope.domElement.setPointerCapture !== undefined ) {
                scope.domElement.setPointerCapture( event.pointerId );
            }
        }

        function onMouseMove( event ) {
            if ( scope.enabled === false ) return;
            event.preventDefault();
            let element = scope.domElement === document ? scope.domElement.body : scope.domElement;

            if ( state === STATE.ROTATE ) {
                rotateEnd.set( event.clientX, event.clientY );
                rotateDelta.subVectors( rotateEnd, rotateStart ).multiplyScalar( scope.rotateSpeed );
                sphericalDelta.theta -= 2 * Math.PI * rotateDelta.x / element.clientWidth;
                sphericalDelta.phi -= 2 * Math.PI * rotateDelta.y / element.clientHeight;
                rotateStart.copy( rotateEnd );
            } else if ( state === STATE.DOLLY ) {
                dollyEnd.set( event.clientX, event.clientY );
                dollyDelta.subVectors(dollyEnd, dollyStart);
                if ( dollyDelta.y > 0 ) scope.dollyIn(); else scope.dollyOut();
                dollyStart.copy( dollyEnd );
            } else if ( state === STATE.PAN ) {
                panEnd.set( event.clientX, event.clientY );
                panDelta.subVectors(panEnd, panStart).multiplyScalar(scope.panSpeed);
                panOffset.add(getPanVector(panDelta.x, panDelta.y));
                scope.target.add(getPanVector(panDelta.x, panDelta.y));
                panStart.copy(panEnd);
            }
        }

        function onMouseUp( event ) {
            state = STATE.NONE;
            if ( scope.domElement.releasePointerCapture !== undefined ) {
                scope.domElement.releasePointerCapture(event.pointerId);
            }
        }

        function onMouseWheel( event ) {
            if ( scope.enabled === false || !scope.enableZoom ) return;
            event.preventDefault();
            if ( event.deltaY < 0 ) scope.dollyOut(); else scope.dollyIn();
        }

        this.dollyIn = function ( dollyScale ) {
            scale /= dollyScale || ( 1 + scope.zoomSpeed );
            zoomChanged = true;
        };

        this.dollyOut = function ( dollyScale ) {
            scale *= dollyScale || ( 1 + scope.zoomSpeed );
            zoomChanged = true;
        };

        function onKeyDown( event ) {
            if ( scope.enabled === false ) return;
            switch ( event.code ) {
                case 'ArrowUp': scope.pan( 0, scope.keyPanSpeed ); break;
                case 'ArrowDown': scope.pan( 0, - scope.keyPanSpeed ); break;
                case 'ArrowLeft': scope.pan( scope.keyPanSpeed, 0 ); break;
                case 'ArrowRight': scope.pan( - scope.keyPanSpeed, 0 ); break;
            }
        }

        this.pan = function ( deltaX, deltaY ) {
            panOffset.add(getPanVector(deltaX, deltaY));
            this.target.add(getPanVector(deltaX, deltaY));
        };

        function getPanVector( deltaX, deltaY ) {
            const v = new THREE.Vector3();
            const offset = new THREE.Vector3();
            offset.copy( this.object.position ).sub( this.target );
            const targetDistance = offset.length();
            targetDistance *= Math.tan(( this.object.fov / 2 ) * Math.PI / 180.0);
            v.set(( 2 * deltaX * targetDistance ) / this.domElement.clientHeight, ( 2 * deltaY * targetDistance ) / this.domElement.clientHeight, 0);
            v.applyQuaternion(this.object.quaternion);
            return v;
        }

        // vecteurs de support
        const rotateStart = new THREE.Vector2();
        const rotateEnd = new THREE.Vector2();
        const rotateDelta = new THREE.Vector2();

        const dollyStart = new THREE.Vector2();
        const dollyEnd = new THREE.Vector2();
        const dollyDelta = new THREE.Vector2();

        const panStart = new THREE.Vector2();
        const panEnd = new THREE.Vector2();
        const panDelta = new THREE.Vector2();

        const STATE = { NONE: -1, ROTATE: 0, DOLLY: 1, PAN: 2 };

        domElement.addEventListener('contextmenu', event => event.preventDefault());
        domElement.addEventListener('mousedown', onMouseDown);
        domElement.addEventListener('mousemove', onMouseMove);
        domElement.addEventListener('mouseup', onMouseUp);
        domElement.addEventListener('wheel', onMouseWheel, { passive: false });
        window.addEventListener('keydown', onKeyDown);

        this.update(); // update initial
    }

    THREE.OrbitControls = OrbitControls;

})();
