import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

// Constants
const SENSITIVITY = 0.25;
const FRICTION = 0.12;

const LIGHT_COLOR = 0xffffff;

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
        60,
        window.innerWidth / window.innerHeight,
        1,
        1000
    );

    // camera = new THREE.OrthographicCamera(
    //     window.innerWidth / -10,
    //     window.innerWidth / 10,
    //     window.innerHeight / 10,
    //     window.innerHeight / -10,
    //     1,
    //     1000
    // );

    camera.position.z = 90;

    // Scene setup
    scene = new THREE.Scene();
    // scene.background = new THREE.Color(LIGHT_COLOR);

    // Hemi light
    const hemiLight = new THREE.HemisphereLight(LIGHT_COLOR, LIGHT_COLOR, 1);
    scene.add(hemiLight);

    // Ambient light
    const ambientLight = new THREE.AmbientLight(LIGHT_COLOR, 1);
    scene.add(ambientLight);

    addLight(LIGHT_COLOR, 1, -50, 100, 20);
    addLight(LIGHT_COLOR, 1, 1000, 20, 0);

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

const addLight = (color, intensity, x, y, z) => {
    const directionalLight = new THREE.DirectionalLight(color, intensity);
    directionalLight.position.set(x, y, z);
    scene.add(directionalLight);
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
                child.material.side = THREE.FrontSide;
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

const toRadians = (degrees) => {
    return degrees * (Math.PI / 180);
};

const toDegrees = (radians) => {
    return radians * (180 / Math.PI);
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

    // console.log([
    //     Math.round(toDegrees(object.rotation.x)),
    //     Math.round(toDegrees(object.rotation.y)),
    //     Math.round(toDegrees(object.rotation.z)),
    // ]);
};

export { init, addObjectToScene, animate };
