import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

// Constants
const SENSITIVITY = 0.2;
const FRICTION = 0.12;

let camera, renderer, scene, object;
let isDragging = false;
let previousMousePosition = { x: 0, y: 0 };
let velocity = { x: 0, y: 0 };

const init = (isInteractive) => {
    // Renderer setup
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Camera setup
    camera = new THREE.PerspectiveCamera(
        35,
        window.innerWidth / window.innerHeight,
        1,
        1000
    );
    camera.position.z = 50;

    // Scene setup
    scene = new THREE.Scene();

    // Lighting setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 1); // Soft white light
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(-50, 20, 100).normalize();
    scene.add(directionalLight);

    // Object setup
    object = new THREE.Object3D();
    scene.add(object);

    // Window resize event
    window.addEventListener("resize", onWindowResize);
    onWindowResize();

    if (isInteractive) {
        // Mouse events for rotating the object
        document.addEventListener("mousedown", onDocumentMouseDown, false);
        document.addEventListener("mouseup", onDocumentMouseUp, false);
        document.addEventListener("mousemove", onDocumentMouseMove, false);

        // Touch events for rotating the object
        document.addEventListener("touchstart", onDocumentTouchStart, false);
        document.addEventListener("touchend", onDocumentTouchEnd, false);
        document.addEventListener("touchmove", onDocumentTouchMove, false);
    }
};

const loadModel = (path, scale, rotation) => {
    const gltfLoader = new GLTFLoader();
    gltfLoader.load(path, (gltf) => {
        while (object.children.length > 0) {
            object.remove(object.children[0]);
        }

        let model = gltf.scene;
        model.scale.set(scale, scale, scale);
        model.position.set(0, 0, 0);
        model.rotation.set(
            toRadians(rotation.x),
            toRadians(rotation.y),
            toRadians(rotation.z)
        );

        model.traverse((child) => {
            if (child.isMesh) {
                child.material.side = THREE.FrontSide; // Ensure only front faces are rendered
                child.material.depthTest = true;
                child.material.depthWrite = true;
            }
        });

        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        model.position.sub(center);

        object.add(model);
    });
};

const addObjectToScene = (path, scale, rotation) => {
    loadModel(path, scale, rotation);
    scene.add(object);
};

const onWindowResize = () => {
    const width = window.innerWidth;
    const height = window.innerHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    renderer.setSize(width, height);
};

const onDocumentMouseDown = (event) => {
    isDragging = true;
    previousMousePosition = { x: event.clientX, y: event.clientY };
    velocity = { x: 0, y: 0 };
};

const onDocumentMouseUp = () => {
    isDragging = false;
};

const onDocumentMouseMove = (event) => {
    if (isDragging) {
        const deltaMove = {
            x: event.clientX - previousMousePosition.x,
            y: event.clientY - previousMousePosition.y,
        };

        velocity = { x: deltaMove.x, y: deltaMove.y };

        const deltaRotationQuaternion = new THREE.Quaternion().setFromEuler(
            new THREE.Euler(
                toRadians(deltaMove.y * SENSITIVITY),
                toRadians(deltaMove.x * SENSITIVITY),
                0,
                "XYZ"
            )
        );

        object.quaternion.multiplyQuaternions(
            deltaRotationQuaternion,
            object.quaternion
        );

        previousMousePosition = { x: event.clientX, y: event.clientY };
    }
};

const onDocumentTouchStart = (event) => {
    if (event.touches.length === 1) {
        isDragging = true;
        previousMousePosition = {
            x: event.touches[0].clientX,
            y: event.touches[0].clientY,
        };
        velocity = { x: 0, y: 0 };
    }
};

const onDocumentTouchEnd = () => {
    isDragging = false;
};

const onDocumentTouchMove = (event) => {
    if (isDragging && event.touches.length === 1) {
        const deltaMove = {
            x: event.touches[0].clientX - previousMousePosition.x,
            y: event.touches[0].clientY - previousMousePosition.y,
        };

        velocity = { x: deltaMove.x, y: deltaMove.y };

        const deltaRotationQuaternion = new THREE.Quaternion().setFromEuler(
            new THREE.Euler(
                toRadians(deltaMove.y * SENSITIVITY),
                toRadians(deltaMove.x * SENSITIVITY),
                0,
                "XYZ"
            )
        );

        object.quaternion.multiplyQuaternions(
            deltaRotationQuaternion,
            object.quaternion
        );

        previousMousePosition = {
            x: event.touches[0].clientX,
            y: event.touches[0].clientY,
        };
    }
};

const toRadians = (angle) => {
    return angle * (Math.PI / 180);
};

const animate = () => {
    requestAnimationFrame(animate);

    if (!isDragging) {
        const deltaRotationQuaternion = new THREE.Quaternion().setFromEuler(
            new THREE.Euler(
                toRadians(velocity.y * SENSITIVITY),
                toRadians(velocity.x * SENSITIVITY),
                0,
                "XYZ"
            )
        );

        object.quaternion.multiplyQuaternions(
            deltaRotationQuaternion,
            object.quaternion
        );

        velocity.x *= 1 - FRICTION;
        velocity.y *= 1 - FRICTION;
    }

    renderer.render(scene, camera);
};

export { init, addObjectToScene, animate };
